//! Migration: Create `assets` and `item_assets` tables.
//!
//! Assets stores media metadata (local files or remote URLs).
//! ItemAssets is the junction table linking Items to Assets with roles.

use sea_orm_migration::prelude::*;

use super::m20260716_000003_create_items::Items;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // ── assets table ──────────────────────────────────────────────
        manager
            .create_table(
                Table::create()
                    .table(Assets::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Assets::Id)
                            .integer()
                            .not_null()
                            .auto_increment()
                            .primary_key(),
                    )
                    .col(
                        ColumnDef::new(Assets::SourceType)
                            .text()
                            .not_null()
                            .default("LOCAL"),
                    )
                    .col(ColumnDef::new(Assets::SourceUrl).text())
                    .col(
                        ColumnDef::new(Assets::MediaType)
                            .text()
                            .not_null()
                            .default("IMAGE"),
                    )
                    .col(ColumnDef::new(Assets::MimeType).text().not_null())
                    .col(ColumnDef::new(Assets::OriginalFilename).text().not_null())
                    .col(ColumnDef::new(Assets::RelativePath).text())
                    .col(ColumnDef::new(Assets::LocalCachePath).text())
                    .col(ColumnDef::new(Assets::ThumbnailPath).text())
                    .col(ColumnDef::new(Assets::PreviewPath).text())
                    .col(ColumnDef::new(Assets::FileSizeBytes).big_integer())
                    .col(ColumnDef::new(Assets::Width).integer())
                    .col(ColumnDef::new(Assets::Height).integer())
                    .col(ColumnDef::new(Assets::Checksum).text())
                    .col(
                        ColumnDef::new(Assets::State)
                            .text()
                            .not_null()
                            .default("PROCESSING"),
                    )
                    .col(ColumnDef::new(Assets::ErrorMessage).text())
                    .col(ColumnDef::new(Assets::Metadata).text())
                    .col(
                        ColumnDef::new(Assets::CreatedAt)
                            .integer()
                            .not_null()
                            .default(Expr::cust("(strftime('%s', 'now'))")),
                    )
                    .col(
                        ColumnDef::new(Assets::UpdatedAt)
                            .integer()
                            .not_null()
                            .default(Expr::cust("(strftime('%s', 'now'))")),
                    )
                    .to_owned(),
            )
            .await?;

        // Assets indexes
        manager
            .get_connection()
            .execute_unprepared(
                "CREATE INDEX IF NOT EXISTS idx_assets_source_state ON assets(source_type, state)",
            )
            .await?;

        manager
            .get_connection()
            .execute_unprepared(
                "CREATE INDEX IF NOT EXISTS idx_assets_checksum ON assets(checksum)",
            )
            .await?;

        // Auto-update trigger for assets.updated_at
        manager
            .get_connection()
            .execute_unprepared(
                r#"
                CREATE TRIGGER IF NOT EXISTS update_assets_updated_at
                    AFTER UPDATE ON assets
                BEGIN
                    UPDATE assets SET updated_at = strftime('%s', 'now')
                    WHERE id = NEW.id;
                END;
                "#,
            )
            .await?;

        // ── item_assets table ─────────────────────────────────────────
        manager
            .create_table(
                Table::create()
                    .table(ItemAssets::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(ItemAssets::Id)
                            .integer()
                            .not_null()
                            .auto_increment()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(ItemAssets::ItemId).integer().not_null())
                    .col(ColumnDef::new(ItemAssets::AssetId).integer().not_null())
                    .col(ColumnDef::new(ItemAssets::Role).text().not_null())
                    .col(ColumnDef::new(ItemAssets::DisplayOrder).integer())
                    .col(
                        ColumnDef::new(ItemAssets::CreatedAt)
                            .integer()
                            .not_null()
                            .default(Expr::cust("(strftime('%s', 'now'))")),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .from(ItemAssets::Table, ItemAssets::ItemId)
                            .to(Items::Table, Items::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .from(ItemAssets::Table, ItemAssets::AssetId)
                            .to(Assets::Table, Assets::Id)
                            .on_delete(ForeignKeyAction::Restrict),
                    )
                    .to_owned(),
            )
            .await?;

        // ItemAssets indexes
        manager
            .get_connection()
            .execute_unprepared(
                "CREATE INDEX IF NOT EXISTS idx_item_assets_item ON item_assets(item_id)",
            )
            .await?;

        manager
            .get_connection()
            .execute_unprepared(
                "CREATE INDEX IF NOT EXISTS idx_item_assets_item_role ON item_assets(item_id, role)",
            )
            .await?;

        // Unique constraint: prevent duplicate item-asset links
        manager
            .get_connection()
            .execute_unprepared(
                "CREATE UNIQUE INDEX IF NOT EXISTS idx_item_assets_unique ON item_assets(item_id, asset_id)",
            )
            .await?;

        // Reverse lookup: find which items reference an asset (for garbage collection)
        manager
            .get_connection()
            .execute_unprepared(
                "CREATE INDEX IF NOT EXISTS idx_item_assets_asset ON item_assets(asset_id)",
            )
            .await?;

        // Partial unique indexes for Singular Roles (max 1 per item per role)
        let singular_roles = ["COVER", "BACKGROUND", "LOGO", "BANNER"];
        for role in &singular_roles {
            let sql = format!(
                "CREATE UNIQUE INDEX IF NOT EXISTS idx_item_assets_singular_{role_lower} \
                 ON item_assets(item_id) WHERE role = '{role}'",
                role_lower = role.to_lowercase(),
                role = role,
            );
            manager
                .get_connection()
                .execute_unprepared(&sql)
                .await?;
        }

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // Drop triggers
        manager
            .get_connection()
            .execute_unprepared("DROP TRIGGER IF EXISTS update_assets_updated_at")
            .await?;

        // Drop item_assets first (references assets)
        manager
            .drop_table(Table::drop().table(ItemAssets::Table).to_owned())
            .await?;

        // Drop assets
        manager
            .drop_table(Table::drop().table(Assets::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
enum Assets {
    Table,
    Id,
    SourceType,
    SourceUrl,
    MediaType,
    MimeType,
    OriginalFilename,
    RelativePath,
    LocalCachePath,
    ThumbnailPath,
    PreviewPath,
    FileSizeBytes,
    Width,
    Height,
    Checksum,
    State,
    ErrorMessage,
    Metadata,
    CreatedAt,
    UpdatedAt,
}

#[derive(DeriveIden)]
enum ItemAssets {
    Table,
    Id,
    ItemId,
    AssetId,
    Role,
    DisplayOrder,
    CreatedAt,
}
