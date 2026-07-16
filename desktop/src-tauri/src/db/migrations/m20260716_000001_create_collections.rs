//! Migration: Create `collections` table.

use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // Create collections table
        manager
            .create_table(
                Table::create()
                    .table(Collections::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Collections::Id)
                            .integer()
                            .not_null()
                            .auto_increment()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(Collections::Name).text().not_null())
                    .col(
                        ColumnDef::new(Collections::Slug)
                            .text()
                            .not_null()
                            .unique_key(),
                    )
                    .col(ColumnDef::new(Collections::Icon).text())
                    .col(ColumnDef::new(Collections::Description).text())
                    .col(
                        ColumnDef::new(Collections::CreatedAt)
                            .integer()
                            .not_null()
                            .default(Expr::cust("(strftime('%s', 'now'))")),
                    )
                    .col(
                        ColumnDef::new(Collections::UpdatedAt)
                            .integer()
                            .not_null()
                            .default(Expr::cust("(strftime('%s', 'now'))")),
                    )
                    .to_owned(),
            )
            .await?;

        // Index on slug
        manager
            .create_index(
                Index::create()
                    .name("idx_collections_slug")
                    .table(Collections::Table)
                    .col(Collections::Slug)
                    .to_owned(),
            )
            .await?;

        // Auto-update trigger for updated_at
        manager
            .get_connection()
            .execute_unprepared(
                r#"
                CREATE TRIGGER IF NOT EXISTS update_collections_updated_at
                    AFTER UPDATE ON collections
                BEGIN
                    UPDATE collections SET updated_at = strftime('%s', 'now')
                    WHERE id = NEW.id;
                END;
                "#,
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .get_connection()
            .execute_unprepared("DROP TRIGGER IF EXISTS update_collections_updated_at")
            .await?;

        manager
            .drop_table(Table::drop().table(Collections::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
pub(crate) enum Collections {
    Table,
    Id,
    Name,
    Slug,
    Icon,
    Description,
    CreatedAt,
    UpdatedAt,
}
