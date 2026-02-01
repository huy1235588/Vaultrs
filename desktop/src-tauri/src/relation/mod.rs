//! Relation field support module.
//!
//! This module provides functionality for cross-vault references,
//! allowing entries in one vault to link to entries in another vault.

mod model;
mod service;

pub use model::*;
pub use service::*;
