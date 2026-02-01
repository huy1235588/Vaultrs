//! Metadata service for handling entry metadata operations.
//!
//! This service implements the field data handling strategy:
//! - ID-based keys (metadata uses field ID as key, not field name)
//! - Required field validation
//! - Lazy cleanup of orphan data on write
//! - Field type validation

use sea_orm::{ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, QueryOrder};
use serde_json::{Map, Value};
use std::collections::{HashMap, HashSet};

use crate::core::AppResult;
use crate::entities::field_definition::{self, Entity as FieldDefinition};
use crate::field::{FieldDefinitionDto, FieldType};

/// Service for metadata validation and cleanup operations.
pub struct MetadataService;

/// Result of metadata validation
#[derive(Debug)]
pub struct ValidationResult {
    /// Whether validation passed
    pub is_valid: bool,
    /// List of validation errors
    pub errors: Vec<String>,
    /// List of warnings (non-blocking issues)
    pub warnings: Vec<String>,
}

impl ValidationResult {
    pub fn success() -> Self {
        Self {
            is_valid: true,
            errors: vec![],
            warnings: vec![],
        }
    }

    pub fn with_error(error: String) -> Self {
        Self {
            is_valid: false,
            errors: vec![error],
            warnings: vec![],
        }
    }

    pub fn add_error(&mut self, error: String) {
        self.is_valid = false;
        self.errors.push(error);
    }

    pub fn add_warning(&mut self, warning: String) {
        self.warnings.push(warning);
    }
}

impl MetadataService {
    /// Validates metadata against field definitions for a vault.
    ///
    /// Checks:
    /// - Required fields are present
    /// - Field values match their types
    /// - Field values satisfy options constraints
    pub async fn validate_metadata(
        conn: &DatabaseConnection,
        vault_id: i32,
        metadata_json: Option<&str>,
    ) -> AppResult<ValidationResult> {
        // Get field definitions for the vault
        let field_definitions = Self::get_field_definitions(conn, vault_id).await?;

        // If no metadata provided, check if there are required fields
        let metadata = match metadata_json {
            Some(json) => match serde_json::from_str::<Map<String, Value>>(json) {
                Ok(m) => m,
                Err(e) => {
                    return Ok(ValidationResult::with_error(format!(
                        "Invalid metadata JSON: {}",
                        e
                    )))
                }
            },
            None => Map::new(),
        };

        let mut result = ValidationResult::success();

        // Check required fields
        for field in &field_definitions {
            if field.required {
                let key = field.id.to_string();
                if !metadata.contains_key(&key) || metadata.get(&key) == Some(&Value::Null) {
                    result.add_error(format!("Field '{}' is required", field.name));
                }
            }
        }

        // Validate field values by type
        let field_map: HashMap<i32, &FieldDefinitionDto> =
            field_definitions.iter().map(|f| (f.id, f)).collect();

        for (key, value) in &metadata {
            // Check if key is a valid field ID
            let field_id: i32 = match key.parse() {
                Ok(id) => id,
                Err(_) => {
                    result.add_warning(format!("Invalid metadata key '{}': not a valid field ID", key));
                    continue;
                }
            };

            // Check if field exists
            let field = match field_map.get(&field_id) {
                Some(f) => f,
                None => {
                    result.add_warning(format!(
                        "Orphan data detected: field ID {} no longer exists",
                        field_id
                    ));
                    continue;
                }
            };

            // Skip null values
            if value.is_null() {
                continue;
            }

            // Validate value by field type
            if let Err(e) = Self::validate_field_value(field, value) {
                result.add_error(e);
            }
        }

        Ok(result)
    }

    /// Validates required fields only (for quick validation on create).
    pub async fn validate_required_fields(
        conn: &DatabaseConnection,
        vault_id: i32,
        metadata_json: Option<&str>,
    ) -> AppResult<ValidationResult> {
        let field_definitions = Self::get_field_definitions(conn, vault_id).await?;

        let metadata = match metadata_json {
            Some(json) => serde_json::from_str::<Map<String, Value>>(json).unwrap_or_default(),
            None => Map::new(),
        };

        let mut result = ValidationResult::success();

        for field in field_definitions {
            if field.required {
                let key = field.id.to_string();
                let has_value = metadata.get(&key).map(|v| !v.is_null()).unwrap_or(false);
                if !has_value {
                    result.add_error(format!("Field '{}' is required", field.name));
                }
            }
        }

        Ok(result)
    }

    /// Cleans up orphan data from metadata.
    ///
    /// This implements the "Lazy Cleanup on Write" strategy:
    /// - Only removes keys that don't correspond to existing field IDs
    /// - Called during entry update operations
    pub async fn cleanup_orphan_data(
        conn: &DatabaseConnection,
        vault_id: i32,
        metadata_json: &str,
    ) -> AppResult<String> {
        // Get valid field IDs for the vault
        let valid_field_ids: HashSet<i32> = Self::get_field_definitions(conn, vault_id)
            .await?
            .into_iter()
            .map(|f| f.id)
            .collect();

        // Parse metadata
        let metadata: Map<String, Value> = match serde_json::from_str(metadata_json) {
            Ok(m) => m,
            Err(_) => return Ok(metadata_json.to_string()), // Return as-is if invalid JSON
        };

        // Filter to keep only valid field IDs
        let cleaned: Map<String, Value> = metadata
            .into_iter()
            .filter(|(key, _)| {
                key.parse::<i32>()
                    .map(|id| valid_field_ids.contains(&id))
                    .unwrap_or(false)
            })
            .collect();

        // Log cleanup if any data was removed
        let original_count = metadata_json.matches(':').count();
        let cleaned_count = cleaned.len();
        if original_count > cleaned_count {
            log::info!(
                "Cleaned up {} orphan field(s) from entry metadata",
                original_count - cleaned_count
            );
        }

        Ok(serde_json::to_string(&cleaned).unwrap_or_default())
    }

    /// Validates a single field value against its type and options.
    fn validate_field_value(field: &FieldDefinitionDto, value: &Value) -> Result<(), String> {
        match field.field_type {
            FieldType::Text => Self::validate_text(field, value),
            FieldType::Number => Self::validate_number(field, value),
            FieldType::Date => Self::validate_date(value),
            FieldType::Url => Self::validate_url(value),
            FieldType::Boolean => Self::validate_boolean(value),
            FieldType::Select => Self::validate_select(field, value),
            FieldType::Relation => Self::validate_relation(field, value),
        }
    }

    fn validate_text(field: &FieldDefinitionDto, value: &Value) -> Result<(), String> {
        let text = value
            .as_str()
            .ok_or_else(|| format!("Field '{}': expected text value", field.name))?;

        if let Some(ref options) = field.options {
            if let Some(max_length) = options.max_length {
                if text.len() > max_length as usize {
                    return Err(format!(
                        "Field '{}': text exceeds maximum length of {}",
                        field.name, max_length
                    ));
                }
            }
        }

        Ok(())
    }

    fn validate_number(field: &FieldDefinitionDto, value: &Value) -> Result<(), String> {
        let num = value
            .as_f64()
            .ok_or_else(|| format!("Field '{}': expected number value", field.name))?;

        if let Some(ref options) = field.options {
            if let Some(min) = options.min {
                if num < min {
                    return Err(format!(
                        "Field '{}': value {} is below minimum {}",
                        field.name, num, min
                    ));
                }
            }
            if let Some(max) = options.max {
                if num > max {
                    return Err(format!(
                        "Field '{}': value {} exceeds maximum {}",
                        field.name, num, max
                    ));
                }
            }
        }

        Ok(())
    }

    fn validate_date(value: &Value) -> Result<(), String> {
        let date_str = value.as_str().ok_or("Date field: expected string value")?;

        // Validate ISO 8601 format (YYYY-MM-DD)
        if chrono::NaiveDate::parse_from_str(date_str, "%Y-%m-%d").is_err() {
            return Err(format!(
                "Invalid date format '{}': expected YYYY-MM-DD",
                date_str
            ));
        }

        Ok(())
    }

    fn validate_url(value: &Value) -> Result<(), String> {
        let url_str = value.as_str().ok_or("URL field: expected string value")?;

        // Basic URL validation
        if !url_str.starts_with("http://") && !url_str.starts_with("https://") {
            return Err(format!(
                "Invalid URL '{}': must start with http:// or https://",
                url_str
            ));
        }

        Ok(())
    }

    fn validate_boolean(value: &Value) -> Result<(), String> {
        if !value.is_boolean() {
            return Err("Boolean field: expected true or false".to_string());
        }
        Ok(())
    }

    fn validate_select(field: &FieldDefinitionDto, value: &Value) -> Result<(), String> {
        let selected = value
            .as_str()
            .ok_or_else(|| format!("Field '{}': expected string value for select", field.name))?;

        if let Some(ref options) = field.options {
            if let Some(ref choices) = options.choices {
                if !choices.contains(&selected.to_string()) {
                    return Err(format!(
                        "Field '{}': '{}' is not a valid choice. Valid choices: {:?}",
                        field.name, selected, choices
                    ));
                }
            }
        }

        Ok(())
    }

    /// Validates a relation field value.
    /// Expects an object with entry_id and vault_id fields.
    fn validate_relation(field: &FieldDefinitionDto, value: &Value) -> Result<(), String> {
        let obj = value.as_object().ok_or_else(|| {
            format!(
                "Field '{}': expected object with entry_id and vault_id",
                field.name
            )
        })?;

        // Check entry_id exists and is a number
        let entry_id = obj
            .get("entry_id")
            .and_then(|v| v.as_i64())
            .ok_or_else(|| format!("Field '{}': missing or invalid entry_id", field.name))?;

        // Check vault_id exists and is a number
        let vault_id = obj
            .get("vault_id")
            .and_then(|v| v.as_i64())
            .ok_or_else(|| format!("Field '{}': missing or invalid vault_id", field.name))?;

        // Validate vault_id matches target_vault_id from options (if configured)
        if let Some(ref options) = field.options {
            if let Some(target_vault_id) = options.target_vault_id {
                if vault_id != target_vault_id as i64 {
                    return Err(format!(
                        "Field '{}': vault_id {} does not match target vault {}",
                        field.name, vault_id, target_vault_id
                    ));
                }
            }
        }

        // Basic sanity checks
        if entry_id <= 0 {
            return Err(format!("Field '{}': entry_id must be positive", field.name));
        }
        if vault_id <= 0 {
            return Err(format!("Field '{}': vault_id must be positive", field.name));
        }

        Ok(())
    }

    /// Gets field definitions for a vault, ordered by position.
    async fn get_field_definitions(
        conn: &DatabaseConnection,
        vault_id: i32,
    ) -> AppResult<Vec<FieldDefinitionDto>> {
        let fields = FieldDefinition::find()
            .filter(field_definition::Column::VaultId.eq(vault_id))
            .order_by_asc(field_definition::Column::Position)
            .all(conn)
            .await?;

        Ok(fields.into_iter().map(FieldDefinitionDto::from).collect())
    }

    /// Parses metadata JSON and returns a map of field_id -> value.
    #[allow(dead_code)]
    pub fn parse_metadata(metadata_json: Option<&str>) -> HashMap<i32, Value> {
        let mut result = HashMap::new();

        if let Some(json) = metadata_json {
            if let Ok(map) = serde_json::from_str::<Map<String, Value>>(json) {
                for (key, value) in map {
                    if let Ok(field_id) = key.parse::<i32>() {
                        result.insert(field_id, value);
                    }
                }
            }
        }

        result
    }

    /// Builds metadata JSON from a map of field_id -> value.
    #[allow(dead_code)]
    pub fn build_metadata_json(values: HashMap<i32, Value>) -> String {
        let map: Map<String, Value> = values
            .into_iter()
            .map(|(k, v)| (k.to_string(), v))
            .collect();

        serde_json::to_string(&map).unwrap_or_default()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_metadata() {
        let json = r#"{"1": "value1", "2": 42, "3": true}"#;
        let result = MetadataService::parse_metadata(Some(json));

        assert_eq!(result.len(), 3);
        assert_eq!(result.get(&1), Some(&Value::String("value1".to_string())));
        assert_eq!(result.get(&2), Some(&Value::Number(42.into())));
        assert_eq!(result.get(&3), Some(&Value::Bool(true)));
    }

    #[test]
    fn test_parse_metadata_invalid_keys() {
        let json = r#"{"invalid": "value", "1": "valid"}"#;
        let result = MetadataService::parse_metadata(Some(json));

        assert_eq!(result.len(), 1);
        assert!(result.contains_key(&1));
    }

    #[test]
    fn test_build_metadata_json() {
        let mut values = HashMap::new();
        values.insert(1, Value::String("test".to_string()));
        values.insert(2, Value::Number(42.into()));

        let json = MetadataService::build_metadata_json(values);

        // Parse back to verify
        let parsed: Map<String, Value> = serde_json::from_str(&json).unwrap();
        assert!(parsed.contains_key("1"));
        assert!(parsed.contains_key("2"));
    }
}
