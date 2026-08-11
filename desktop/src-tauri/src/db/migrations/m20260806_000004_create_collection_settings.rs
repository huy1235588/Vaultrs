//! Migration: Create `collection_settings` table.
//!
//! Stores per-collection configuration in three JSON groups:
//! appearance, media, and behavior. 1-1 relationship with collections.

use sea_orm_migration::prelude::*;

use super::m20260716_000001_create_collections::Collections;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // Create collection_settings table
        manager
            .create_table(
                Table::create()
                    .table(CollectionSettings::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(CollectionSettings::Id)
                            .integer()
                            .not_null()
                            .auto_increment()
                            .primary_key(),
                    )
                    .col(
                        ColumnDef::new(CollectionSettings::CollectionId)
                            .integer()
                            .not_null()
                            .unique_key(),
                    )
                    .col(
                        ColumnDef::new(CollectionSettings::Appearance)
                            .text()
                            .not_null()
                            .default(DEFAULT_APPEARANCE),
                    )
                    .col(
                        ColumnDef::new(CollectionSettings::Media)
                            .text()
                            .not_null()
                            .default(DEFAULT_MEDIA),
                    )
                    .col(
                        ColumnDef::new(CollectionSettings::Behavior)
                            .text()
                            .not_null()
                            .default(DEFAULT_BEHAVIOR),
                    )
                    .col(
                        ColumnDef::new(CollectionSettings::CreatedAt)
                            .integer()
                            .not_null()
                            .default(Expr::cust("(strftime('%s', 'now'))")),
                    )
                    .col(
                        ColumnDef::new(CollectionSettings::UpdatedAt)
                            .integer()
                            .not_null()
                            .default(Expr::cust("(strftime('%s', 'now'))")),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .from(CollectionSettings::Table, CollectionSettings::CollectionId)
                            .to(Collections::Table, Collections::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        // Unique index on collection_id (enforces 1-1 relationship)
        manager
            .create_index(
                Index::create()
                    .name("idx_collection_settings_collection")
                    .table(CollectionSettings::Table)
                    .col(CollectionSettings::CollectionId)
                    .unique()
                    .to_owned(),
            )
            .await?;

        // Auto-update trigger for updated_at
        manager
            .get_connection()
            .execute_unprepared(
                r#"
                CREATE TRIGGER IF NOT EXISTS update_collection_settings_updated_at
                    AFTER UPDATE ON collection_settings
                BEGIN
                    UPDATE collection_settings SET updated_at = strftime('%s', 'now')
                    WHERE id = NEW.id;
                END;
                "#,
            )
            .await?;

        // Auto-create trigger: when a new collection is created, insert default settings
        manager
            .get_connection()
            .execute_unprepared(
                r#"
                CREATE TRIGGER IF NOT EXISTS auto_create_collection_settings
                    AFTER INSERT ON collections
                BEGIN
                    INSERT INTO collection_settings(collection_id)
                    VALUES (NEW.id);
                END;
                "#,
            )
            .await?;

        // Seed settings for existing collections that don't have settings yet
        manager
            .get_connection()
            .execute_unprepared(
                r#"
                INSERT INTO collection_settings(collection_id)
                SELECT id FROM collections
                WHERE id NOT IN (SELECT collection_id FROM collection_settings);
                "#,
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // Drop triggers
        manager
            .get_connection()
            .execute_unprepared(
                r#"
                DROP TRIGGER IF EXISTS update_collection_settings_updated_at;
                DROP TRIGGER IF EXISTS auto_create_collection_settings;
                "#,
            )
            .await?;

        // Drop table
        manager
            .drop_table(Table::drop().table(CollectionSettings::Table).to_owned())
            .await
    }
}

/// Default JSON for appearance settings.
const DEFAULT_APPEARANCE: &str =
    r#"{"default_view_mode":"LIST","card_size":"MEDIUM","show_title_on_card":true}"#;

/// Default JSON for media settings.
const DEFAULT_MEDIA: &str = r#"{"media_enabled":false,"cover_enabled":true,"default_cover_mode":"SYSTEM","default_cover_asset_id":null,"allowed_roles":["COVER","GALLERY","SCREENSHOT","ATTACHMENT"]}"#;

/// Default JSON for behavior settings.
const DEFAULT_BEHAVIOR: &str =
    r#"{"default_sort_field":"created_at","default_sort_order":"DESC"}"#;

#[derive(DeriveIden)]
pub(crate) enum CollectionSettings {
    Table,
    Id,
    CollectionId,
    Appearance,
    Media,
    Behavior,
    CreatedAt,
    UpdatedAt,
}
