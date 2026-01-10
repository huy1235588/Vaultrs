//! Application error types and result aliases.

use serde::Serialize;

/// Application-wide error type.
#[derive(thiserror::Error, Debug)]
pub enum AppError {
    #[error("Database error: {0}")]
    Database(#[from] sea_orm::DbErr),

    #[error("Vault not found: {0}")]
    VaultNotFound(i32),

    #[error("Entry not found: {0}")]
    EntryNotFound(i32),

    #[error("Field definition not found: {0}")]
    FieldNotFound(i32),

    #[error("Validation error: {0}")]
    Validation(String),

    #[error("Internal error: {0}")]
    Internal(String),
}

/// Serializable error for Tauri IPC.
#[derive(Debug, Serialize)]
pub struct IpcError {
    pub code: String,
    pub message: String,
}

impl From<AppError> for IpcError {
    fn from(err: AppError) -> Self {
        let code = match &err {
            AppError::Database(_) => "DATABASE_ERROR",
            AppError::VaultNotFound(_) => "VAULT_NOT_FOUND",
            AppError::EntryNotFound(_) => "ENTRY_NOT_FOUND",
            AppError::FieldNotFound(_) => "FIELD_NOT_FOUND",
            AppError::Validation(_) => "VALIDATION_ERROR",
            AppError::Internal(_) => "INTERNAL_ERROR",
        };

        IpcError {
            code: code.to_string(),
            message: err.to_string(),
        }
    }
}

// Implement IntoResponse for Tauri commands
impl serde::Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        let ipc_error: IpcError = self.clone().into();
        ipc_error.serialize(serializer)
    }
}

impl Clone for AppError {
    fn clone(&self) -> Self {
        match self {
            AppError::Database(e) => AppError::Internal(e.to_string()),
            AppError::VaultNotFound(id) => AppError::VaultNotFound(*id),
            AppError::EntryNotFound(id) => AppError::EntryNotFound(*id),
            AppError::FieldNotFound(id) => AppError::FieldNotFound(*id),
            AppError::Validation(msg) => AppError::Validation(msg.clone()),
            AppError::Internal(msg) => AppError::Internal(msg.clone()),
        }
    }
}

/// Application result type alias.
pub type AppResult<T> = Result<T, AppError>;
