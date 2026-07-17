/**
 * ItemDetailPage — Detail and editing page for a single item.
 * Supports inline editing of title, dynamic editing of custom attributes,
 * required fields validation, and structured metadata display.
 */
import { useEffect, useState } from "react";
import { ArrowLeft, Save, Trash2, Calendar, FileText, Hash, Check } from "lucide-react";
import { useCollections } from "@/core/context/CollectionContext";
import { useItem } from "@/core/context/ItemContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { DynamicField } from "@/components/Item/DynamicField";
import { DeleteItemDialog } from "@/components/Item/DeleteItemDialog";
import * as itemService from "@/core/api/itemService";
import { Badge } from "@/components/ui/badge";

function formatDate(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export function ItemDetailPage() {
    const { attributes, selectedCollection } = useCollections();
    const { selectedItem, clearItem, setSelectedItem } = useItem();

    const [title, setTitle] = useState("");
    const [properties, setProperties] = useState<Record<string, any>>({});
    const [originalTitle, setOriginalTitle] = useState("");
    const [originalProperties, setOriginalProperties] = useState<Record<string, any>>({});

    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [deleteOpen, setDeleteOpen] = useState(false);

    // Load item data into form state
    useEffect(() => {
        if (selectedItem) {
            setTitle(selectedItem.title);
            setOriginalTitle(selectedItem.title);

            let propsObj: Record<string, any> = {};
            if (selectedItem.properties) {
                try {
                    propsObj = JSON.parse(selectedItem.properties);
                } catch (e) {
                    console.error("Failed to parse item properties:", e);
                }
            }
            setProperties(propsObj);
            setOriginalProperties(propsObj);
            setError(null);
            setSaveSuccess(false);
        }
    }, [selectedItem]);

    if (!selectedItem || !selectedCollection) return null;

    // Detect if there are unsaved changes
    const hasChanges =
        title !== originalTitle ||
        JSON.stringify(properties) !== JSON.stringify(originalProperties);

    // Validate required fields
    const validationErrors: string[] = [];
    if (!title.trim()) {
        validationErrors.push("Item title is required");
    }
    attributes.forEach((attr) => {
        if (attr.required === 1) {
            const val = properties[attr.key];
            if (val === undefined || val === null || val === "" || (Array.isArray(val) && val.length === 0)) {
                validationErrors.push(`Field "${attr.name}" is required`);
            }
        }
    });

    const isSaveDisabled = validationErrors.length > 0 || !hasChanges || saving;

    // Handle field updates
    const handleFieldChange = (key: string, value: any) => {
        setProperties((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    // Save item changes
    const handleSave = async () => {
        if (isSaveDisabled) return;

        setSaving(true);
        setError(null);
        setSaveSuccess(false);

        try {
            const updated = await itemService.updateItem(selectedItem.id, {
                title: title.trim(),
                properties,
            });

            // Update local original copy and context
            setOriginalTitle(updated.title);
            setOriginalProperties(properties);
            setSelectedItem(updated);

            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (err) {
            const message =
                err instanceof Error ? err.message : "Failed to save item changes";
            setError(message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex h-full flex-col">
            {/* Header / Actions bar */}
            <div className="flex items-center justify-between border-b pb-4 mb-6">
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="icon-sm"
                        onClick={clearItem}
                        title="Back to List"
                    >
                        <ArrowLeft className="size-4" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span>{selectedCollection.icon || "📁"}</span>
                            <span>{selectedCollection.name}</span>
                            <span>/</span>
                            <span>Item Detail</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Status notifications */}
                    {saveSuccess && (
                        <span className="flex items-center gap-1 text-xs text-green-500 font-medium animate-in fade-in-0 duration-200">
                            <Check className="size-3.5" />
                            Changes saved
                        </span>
                    )}
                    {validationErrors.length > 0 && hasChanges && (
                        <span className="text-xs text-destructive font-medium">
                            Missing required fields
                        </span>
                    )}

                    <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={isSaveDisabled}
                        className="gap-1.5 min-w-[90px]"
                    >
                        <Save className="size-4" />
                        {saving ? "Saving..." : "Save"}
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => setDeleteOpen(true)}
                        title="Delete Item"
                    >
                        <Trash2 className="size-4" />
                    </Button>
                </div>
            </div>

            {/* Error display */}
            {error && (
                <div className="mb-4 p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
                    {error}
                </div>
            )}

            {/* Main content grid */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
                {/* Left Panel: Field Editors (scrollable) */}
                <div className="lg:col-span-2 overflow-y-auto pr-2 space-y-6">
                    {/* Item Title Input */}
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                            Item Title
                        </label>
                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="text-2xl font-bold bg-transparent border-0 border-b border-transparent hover:border-border focus:border-primary focus:ring-0 rounded-none px-0 pb-1.5 h-auto transition-all placeholder:text-muted-foreground/50"
                            placeholder="Enter item title..."
                        />
                    </div>

                    <Separator className="my-6" />

                    {/* Custom fields list */}
                    <div className="space-y-5 pb-8">
                        {attributes.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-8 rounded-lg border border-dashed text-center bg-muted/10">
                                <FileText className="size-8 text-muted-foreground opacity-50 mb-2" />
                                <h3 className="font-semibold text-sm">No custom fields defined</h3>
                                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                                    Manage this collection's schema to add properties like ratings, links, or dates.
                                </p>
                            </div>
                        ) : (
                            attributes.map((attr) => (
                                <DynamicField
                                    key={attr.id}
                                    attribute={attr}
                                    value={properties[attr.key]}
                                    onChange={(val) => handleFieldChange(attr.key, val)}
                                />
                            ))
                        )}
                    </div>
                </div>

                {/* Right Panel: Metadata (sidebar-style) */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-xs">
                        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                            <FileText className="size-4 text-primary" />
                            Properties & Metadata
                        </h3>
                        <Separator />

                        <div className="space-y-3.5 text-xs">
                            {/* Collection Info */}
                            <div className="flex justify-between items-center py-0.5">
                                <span className="text-muted-foreground font-medium">Collection</span>
                                <Badge variant="secondary" className="gap-1">
                                    <span>{selectedCollection.icon || "📁"}</span>
                                    <span>{selectedCollection.name}</span>
                                </Badge>
                            </div>

                            {/* Item ID */}
                            <div className="flex justify-between items-center py-0.5">
                                <span className="text-muted-foreground font-medium">Item ID</span>
                                <span className="font-mono text-muted-foreground flex items-center gap-1">
                                    <Hash className="size-3" />
                                    {selectedItem.id}
                                </span>
                            </div>

                            {/* Created Date */}
                            <div className="space-y-1 pt-1">
                                <span className="text-muted-foreground font-medium flex items-center gap-1">
                                    <Calendar className="size-3 text-muted-foreground/75" />
                                    Created
                                </span>
                                <div className="pl-4 font-medium text-foreground">
                                    {formatDate(selectedItem.created_at)}
                                </div>
                            </div>

                            {/* Updated Date */}
                            <div className="space-y-1 pt-1">
                                <span className="text-muted-foreground font-medium flex items-center gap-1">
                                    <Calendar className="size-3 text-muted-foreground/75" />
                                    Last Updated
                                </span>
                                <div className="pl-4 font-medium text-foreground">
                                    {formatDate(selectedItem.updated_at)}
                                </div>
                            </div>
                        </div>

                        {/* Informational validation summary */}
                        {validationErrors.length > 0 && (
                            <div className="pt-2">
                                <div className="p-3 text-[11px] bg-destructive/10 border border-destructive/20 text-destructive rounded-lg space-y-1 animate-in fade-in zoom-in-95 duration-150">
                                    <p className="font-bold uppercase tracking-wider">Required Actions:</p>
                                    <ul className="list-disc pl-4 space-y-0.5">
                                        {validationErrors.map((err, i) => (
                                            <li key={i}>{err}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Delete Item Dialog */}
            <DeleteItemDialog
                itemId={selectedItem.id}
                itemTitle={selectedItem.title}
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
                onDeleted={() => {
                    clearItem();
                }}
            />
        </div>
    );
}

export default ItemDetailPage;

