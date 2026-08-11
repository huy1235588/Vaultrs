//! Migration registry — all migrations are registered here.

pub use sea_orm_migration::prelude::*;

mod m20260716_000001_create_collections;
mod m20260716_000002_create_attributes;
mod m20260716_000003_create_items;
mod m20260806_000004_create_collection_settings;
mod m20260806_000005_create_assets;

pub struct Migrator;

#[async_trait::async_trait]
impl MigratorTrait for Migrator {
    fn migrations() -> Vec<Box<dyn MigrationTrait>> {
        vec![
            Box::new(m20260716_000001_create_collections::Migration),
            Box::new(m20260716_000002_create_attributes::Migration),
            Box::new(m20260716_000003_create_items::Migration),
            Box::new(m20260806_000004_create_collection_settings::Migration),
            Box::new(m20260806_000005_create_assets::Migration),
        ]
    }
}

