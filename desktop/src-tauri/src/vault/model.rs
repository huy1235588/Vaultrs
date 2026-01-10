//! Vault data transfer objects.

use serde::{Deserialize, Serialize};

/// DTO for creating a new vault.
#[derive(Debug, Deserialize)]
pub struct CreateVaultDto {
    pub name: String,
    pub description: Option<String>,
    pub icon: Option<String>,
    pub color: Option<String>,
}

/// DTO for updating an existing vault.
#[derive(Debug, Deserialize)]
pub struct UpdateVaultDto {
    pub name: Option<String>,
    pub description: Option<String>,
    pub icon: Option<String>,
    pub color: Option<String>,
}

/// Response DTO for vault data.
#[derive(Debug, Serialize, Clone)]
pub struct VaultDto {
    pub id: i32,
    pub name: String,
    pub description: Option<String>,
    pub icon: Option<String>,
    pub color: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

impl From<crate::entities::vault::Model> for VaultDto {
    fn from(model: crate::entities::vault::Model) -> Self {
        VaultDto {
            id: model.id,
            name: model.name,
            description: model.description,
            icon: model.icon,
            color: model.color,
            created_at: model.created_at,
            updated_at: model.updated_at,
        }
    }
}
