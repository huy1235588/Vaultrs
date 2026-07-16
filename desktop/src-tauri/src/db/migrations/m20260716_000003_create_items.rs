//! Migration: Create `items` table + FTS5 virtual table.

use sea_orm_migration::prelude::*;

use super::m20260716_000001_create_collections::Collections;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // Create items table
        manager
            .create_table(
                Table::create()
                    .table(Items::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Items::Id)
                            .integer()
                            .not_null()
                            .auto_increment()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(Items::CollectionId).integer().not_null())
                    .col(ColumnDef::new(Items::Title).text().not_null())
                    .col(
                        ColumnDef::new(Items::CreatedAt)
                            .integer()
                            .not_null()
                            .default(Expr::cust("(strftime('%s', 'now'))")),
                    )
                    .col(
                        ColumnDef::new(Items::UpdatedAt)
                            .integer()
                            .not_null()
                            .default(Expr::cust("(strftime('%s', 'now'))")),
                    )
                    .col(
                        ColumnDef::new(Items::Properties)
                            .text()
                            .not_null()
                            .default("{}"),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .from(Items::Table, Items::CollectionId)
                            .to(Collections::Table, Collections::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        // Performance indexes
        let indexes = [
            ("idx_items_collection", vec!["collection_id"]),
            ("idx_items_created_at", vec!["created_at"]),
            ("idx_items_updated_at", vec!["updated_at"]),
        ];

        for (name, cols) in &indexes {
            let mut idx = Index::create();
            idx.name(*name).table(Items::Table);
            for col in cols {
                idx.col(Alias::new(*col));
            }
            manager.create_index(idx.to_owned()).await?;
        }

        // Composite index for collection + created_at (common query pattern)
        manager
            .create_index(
                Index::create()
                    .name("idx_items_collection_created")
                    .table(Items::Table)
                    .col(Items::CollectionId)
                    .col(Items::CreatedAt)
                    .to_owned(),
            )
            .await?;

        // Case-insensitive title index
        manager
            .get_connection()
            .execute_unprepared(
                "CREATE INDEX IF NOT EXISTS idx_items_title ON items(title COLLATE NOCASE)",
            )
            .await?;

        // Auto-update trigger for updated_at
        manager
            .get_connection()
            .execute_unprepared(
                r#"
                CREATE TRIGGER IF NOT EXISTS update_items_updated_at
                    AFTER UPDATE ON items
                BEGIN
                    UPDATE items SET updated_at = strftime('%s', 'now')
                    WHERE id = NEW.id;
                END;
                "#,
            )
            .await?;

        // FTS5 virtual table
        manager
            .get_connection()
            .execute_unprepared(
                r#"
                CREATE VIRTUAL TABLE IF NOT EXISTS items_fts USING fts5(
                    title,
                    properties,
                    content='items',
                    content_rowid='id'
                );
                "#,
            )
            .await?;

        // FTS sync triggers
        manager
            .get_connection()
            .execute_unprepared(
                r#"
                CREATE TRIGGER IF NOT EXISTS items_fts_insert AFTER INSERT ON items BEGIN
                    INSERT INTO items_fts(rowid, title, properties)
                    VALUES (NEW.id, NEW.title, NEW.properties);
                END;

                CREATE TRIGGER IF NOT EXISTS items_fts_delete AFTER DELETE ON items BEGIN
                    DELETE FROM items_fts WHERE rowid = OLD.id;
                END;

                CREATE TRIGGER IF NOT EXISTS items_fts_update AFTER UPDATE ON items BEGIN
                    UPDATE items_fts
                    SET title = NEW.title, properties = NEW.properties
                    WHERE rowid = NEW.id;
                END;
                "#,
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // Drop FTS triggers
        manager
            .get_connection()
            .execute_unprepared(
                r#"
                DROP TRIGGER IF EXISTS items_fts_insert;
                DROP TRIGGER IF EXISTS items_fts_delete;
                DROP TRIGGER IF EXISTS items_fts_update;
                "#,
            )
            .await?;

        // Drop FTS table
        manager
            .get_connection()
            .execute_unprepared("DROP TABLE IF EXISTS items_fts")
            .await?;

        // Drop items trigger
        manager
            .get_connection()
            .execute_unprepared("DROP TRIGGER IF EXISTS update_items_updated_at")
            .await?;

        // Drop items table
        manager
            .drop_table(Table::drop().table(Items::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
enum Items {
    Table,
    Id,
    CollectionId,
    Title,
    CreatedAt,
    UpdatedAt,
    Properties,
}
