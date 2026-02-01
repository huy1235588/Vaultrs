//! Field definition data transfer objects.

use serde::{Deserialize, Serialize};

/// Supported field types.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum FieldType {
    Text,
    Number,
    Date,
    Url,
    Boolean,
    Select,
    Relation,
}

impl FieldType {
    pub fn as_str(&self) -> &'static str {
        match self {
            FieldType::Text => "text",
            FieldType::Number => "number",
            FieldType::Date => "date",
            FieldType::Url => "url",
            FieldType::Boolean => "boolean",
            FieldType::Select => "select",
            FieldType::Relation => "relation",
        }
    }

    pub fn from_str(s: &str) -> Option<Self> {
        match s {
            "text" => Some(FieldType::Text),
            "number" => Some(FieldType::Number),
            "date" => Some(FieldType::Date),
            "url" => Some(FieldType::Url),
            "boolean" => Some(FieldType::Boolean),
            "select" => Some(FieldType::Select),
            "relation" => Some(FieldType::Relation),
            _ => None,
        }
    }
}

/// Options for field types (type-specific configuration).
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct FieldOptions {
    /// Maximum length for text fields
    #[serde(skip_serializing_if = "Option::is_none")]
    pub max_length: Option<i32>,
    /// Minimum value for number fields
    #[serde(skip_serializing_if = "Option::is_none")]
    pub min: Option<f64>,
    /// Maximum value for number fields
    #[serde(skip_serializing_if = "Option::is_none")]
    pub max: Option<f64>,
    /// Available choices for select fields
    #[serde(skip_serializing_if = "Option::is_none")]
    pub choices: Option<Vec<String>>,
    /// Target vault ID for relation fields
    #[serde(skip_serializing_if = "Option::is_none")]
    pub target_vault_id: Option<i32>,
    /// Display fields from target entry for relation fields (default: ["title"])
    #[serde(skip_serializing_if = "Option::is_none")]
    pub display_fields: Option<Vec<String>>,
}

/// DTO for creating a new field definition.
#[derive(Debug, Deserialize)]
pub struct CreateFieldDto {
    pub vault_id: i32,
    pub name: String,
    pub field_type: FieldType,
    #[serde(default)]
    pub options: Option<FieldOptions>,
    #[serde(default)]
    pub required: bool,
}

/// DTO for updating an existing field definition.
#[derive(Debug, Deserialize)]
pub struct UpdateFieldDto {
    pub name: Option<String>,
    pub options: Option<FieldOptions>,
    pub required: Option<bool>,
}

/// Response DTO for field definition data.
#[derive(Debug, Serialize, Clone)]
pub struct FieldDefinitionDto {
    pub id: i32,
    pub vault_id: i32,
    pub name: String,
    pub field_type: FieldType,
    pub options: Option<FieldOptions>,
    pub position: i32,
    pub required: bool,
    pub created_at: String,
    pub updated_at: String,
}

impl From<crate::entities::field_definition::Model> for FieldDefinitionDto {
    fn from(model: crate::entities::field_definition::Model) -> Self {
        let field_type = FieldType::from_str(&model.field_type).unwrap_or(FieldType::Text);
        let options: Option<FieldOptions> = model
            .options
            .as_ref()
            .and_then(|s| serde_json::from_str(s).ok());

        FieldDefinitionDto {
            id: model.id,
            vault_id: model.vault_id,
            name: model.name,
            field_type,
            options,
            position: model.position,
            required: model.required != 0,
            created_at: model.created_at,
            updated_at: model.updated_at,
        }
    }
}
