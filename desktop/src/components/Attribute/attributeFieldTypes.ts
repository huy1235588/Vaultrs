/**
 * attributeFieldTypes — shared metadata for custom field ("attribute") types.
 * Used by the create, edit, and manage-fields UI so field type icons and
 * labels stay identical everywhere they appear.
 */
import type { FieldType } from "@/core/types/common";
import {
    AlignLeft,
    Calendar,
    CalendarClock,
    CheckSquare,
    GitBranch,
    Hash,
    LayoutList,
    Link2,
    ListChecks,
    Percent,
    Type,
    type LucideIcon,
} from "lucide-react";

export interface FieldTypeMeta {
    value: FieldType;
    label: string;
    description: string;
    icon: LucideIcon;
}

export const FIELD_TYPES: FieldTypeMeta[] = [
    { value: "text", label: "Text", description: "Single line text field", icon: Type },
    { value: "textarea", label: "Text Area", description: "Multi-line text field", icon: AlignLeft },
    { value: "number", label: "Number", description: "Integer values", icon: Hash },
    { value: "decimal", label: "Decimal", description: "Floating point values", icon: Percent },
    { value: "date", label: "Date", description: "Calendar date selector", icon: Calendar },
    { value: "datetime", label: "Date & Time", description: "Date and time selector", icon: CalendarClock },
    { value: "select", label: "Select (Dropdown)", description: "Select single option from a list", icon: LayoutList },
    { value: "multiselect", label: "Multi-Select", description: "Select multiple options from a list", icon: ListChecks },
    { value: "checkbox", label: "Checkbox (Boolean)", description: "Yes/No toggler", icon: CheckSquare },
    { value: "url", label: "URL", description: "Web link", icon: Link2 },
    { value: "reference", label: "Reference", description: "Link to items in another collection", icon: GitBranch },
];

const FIELD_TYPE_MAP = new Map(FIELD_TYPES.map((t) => [t.value, t]));

/** Look up display metadata for a field type, falling back to the first type if unknown. */
export function getFieldTypeMeta(type: FieldType): FieldTypeMeta {
    return FIELD_TYPE_MAP.get(type) ?? FIELD_TYPES[0];
}

/** Whether a field type stores a fixed list of choices (select / multiselect). */
export function isChoiceFieldType(type: FieldType): boolean {
    return type === "select" || type === "multiselect";
}

/** Whether a field type is a cross-collection reference. */
export function isReferenceFieldType(type: FieldType): boolean {
    return type === "reference";
}
