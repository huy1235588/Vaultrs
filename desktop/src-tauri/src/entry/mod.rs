//! Entry module for item management within vaults.
//!
//! This module is organized following Single Responsibility Principle:
//! - `service.rs` - Core CRUD operations (create, get, list, count, update, delete)
//! - `image_service.rs` - Cover image operations (set, remove, thumbnail)
//! - `search_service.rs` - Full-text search operations
//! - `metadata_service.rs` - Metadata validation and orphan cleanup

mod image_service;
mod metadata_service;
mod model;
mod search_service;
mod service;

pub use image_service::EntryImageService;
pub use metadata_service::MetadataService;
pub use model::*;
pub use search_service::EntrySearchService;
pub use service::EntryService;
