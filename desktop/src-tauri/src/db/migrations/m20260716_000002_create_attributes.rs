//! Migration: Create `attributes` table.

use sea_orm_migration::prelude::*;

use super::m20260716_000001_create_collections::Collections;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // Create attributes table
        manager
            .create_table(
                Table::create()
                    .table(Attributes::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Attributes::Id)
                            .integer()
                            .not_null()
                            .auto_increment()
                            .primary_key(),
                    )
                    .col(
                        ColumnDef::new(Attributes::CollectionId)
                            .integer()
                            .not_null(),
                    )
                    .col(ColumnDef::new(Attributes::Name).text().not_null())
                    .col(ColumnDef::new(Attributes::Key).text().not_null())
                    .col(ColumnDef::new(Attributes::Type).text().not_null())
                    .col(ColumnDef::new(Attributes::Options).text())
                    .col(
                        ColumnDef::new(Attributes::DisplayOrder)
                            .integer()
                            .default(0),
                    )
                    .col(
                        ColumnDef::new(Attributes::Required)
                            .integer()
                            .default(0),
                    )
                    .col(
                        ColumnDef::new(Attributes::Searchable)
                            .integer()
                            .default(0),
                    )
                    .col(
                        ColumnDef::new(Attributes::CreatedAt)
                            .integer()
                            .not_null()
                            .default(Expr::cust("(strftime('%s', 'now'))")),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .from(Attributes::Table, Attributes::CollectionId)
                            .to(Collections::Table, Collections::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        // Unique constraint on (collection_id, key)
        manager
            .create_index(
                Index::create()
                    .name("idx_attributes_collection_key")
                    .table(Attributes::Table)
                    .col(Attributes::CollectionId)
                    .col(Attributes::Key)
                    .unique()
                    .to_owned(),
            )
            .await?;

        // Index on collection_id for lookups
        manager
            .create_index(
                Index::create()
                    .name("idx_attributes_collection")
                    .table(Attributes::Table)
                    .col(Attributes::CollectionId)
                    .to_owned(),
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(Attributes::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
enum Attributes {
    Table,
    Id,
    CollectionId,
    Name,
    Key,
    Type,
    Options,
    DisplayOrder,
    Required,
    Searchable,
    CreatedAt,
}
