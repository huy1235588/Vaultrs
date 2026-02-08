//! Core module containing shared types, error handling, and utilities.

mod error;
pub mod utils;

pub use error::{AppError, AppResult};
pub use utils::{find_vault_or_error, now_formatted};
