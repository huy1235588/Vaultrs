//! Shared utility functions used across services.

use sea_orm::{DatabaseConnection, EntityTrait};

use super::{AppError, AppResult};
use crate::entities::vault::{self, Entity as Vault};

/// Returns the current UTC timestamp formatted as "YYYY-MM-DD HH:MM:SS".
pub fn now_formatted() -> String {
    chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string()
}

/// Finds a vault by ID, returning `AppError::VaultNotFound` if it doesn't exist.
pub async fn find_vault_or_error(
    conn: &DatabaseConnection,
    vault_id: i32,
) -> AppResult<vault::Model> {
    Vault::find_by_id(vault_id)
        .one(conn)
        .await?
        .ok_or(AppError::VaultNotFound(vault_id))
}
