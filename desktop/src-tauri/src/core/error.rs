//! Custom error types for Vaultrs.

use thiserror::Error;

/// Application-wide error type.
#[derive(Debug, Error)]
pub enum AppError {
    /// Database-related errors.
    #[error("Database error: {0}")]
    Database(#[from] sea_orm::DbErr),

    /// Serialization/deserialization errors.
    #[error("Serialization error: {0}")]
    Serialization(#[from] serde_json::Error),

    /// Generic not-found error.
    #[error("{entity} with {field} = '{value}' not found")]
    NotFound {
        entity: String,
        field: String,
        value: String,
    },

    /// Validation errors.
    #[error("Validation error: {0}")]
    Validation(String),

    /// Internal errors.
    #[error("Internal error: {0}")]
    Internal(String),

    /// File system I/O errors.
    #[error("I/O error: {0}")]
    Io(#[from] std::io::Error),
}

// Allow AppError to be returned from Tauri commands as a serialized string.
impl serde::Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::ser::Serializer,
    {
        serializer.serialize_str(self.to_string().as_ref())
    }
}
