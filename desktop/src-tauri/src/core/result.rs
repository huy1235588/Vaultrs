//! Result type aliases for Vaultrs.

use super::error::AppError;

/// Convenience alias for Results returned throughout the application.
pub type AppResult<T> = Result<T, AppError>;
