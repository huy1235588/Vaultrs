/**
 * ItemDetailPage — Detail and editing page for a single item.
 * Supports inline editing of title, dynamic editing of custom attributes,
 * required fields validation, and structured metadata display.
 * Includes cover image hero section with upload/change/remove.
 */
import { useCallback, useEffect, useState } from "react";
import {
    ArrowLeft,
    Save,
    Trash2,
    Calendar,
    FileText,
    Hash,
    Check,
    AlertCircle,
    Copy,
    Loader2,
} from "lucide-react";
import { useCollections } from "@/core/context/CollectionContext";
import { useItem } from "@/core/context/ItemContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { DynamicField } from "@/components/Item/DynamicField";
import { DeleteItemDialog } from "@/components/Item/DeleteItemDialog";
import { CoverUpload } from "@/components/Item/CoverUpload";
import { BackReferences } from "@/components/Item/BackReferences";
import * as itemService from "@/core/api/itemService";
import * as assetService from "@/core/api/assetService";
import { resolveAssetUrlSync } from "@/core/utils/assetResolver";
import { Badge } from "@/components/ui/badge";
import type { Asset } from "@/core/types/common";

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
    const [copiedId, setCopiedId] = useState(false);
    const [cover, setCover] = useState<Asset | null>(null);

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

            // Load cover image
            assetService.getItemCover(selectedItem.id)
                .then((asset) => setCover(asset))
                .catch((err) => console.error("Failed to load cover:", err));
        }
    }, [selectedItem]);

    // Handle cover change from CoverUpload
    const handleCoverChange = useCallback((newCover: Asset | null) => {
        setCover(newCover);
    }, []);

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
        if (!selectedItem || isSaveDisabled) return;

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

    // Keyboard shortcut: Cmd/Ctrl+S to save
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const isSaveShortcut = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s";
            if (!isSaveShortcut) return;
            e.preventDefault();
            handleSave();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleSave]);

    // Copy item ID to clipboard
    const handleCopyId = async () => {
        if (!selectedItem) return;
        try {
            await navigator.clipboard.writeText(String(selectedItem.id));
            setCopiedId(true);
            setTimeout(() => setCopiedId(false), 1500);
        } catch {
            // Clipboard access unavailable in this environment; ignore.
        }
    };

    // Guard against navigating away with unsaved changes
    const handleBackClick = () => {
        if (hasChanges) {
            const confirmLeave = window.confirm(
                "You have unsaved changes. Leave without saving?",
            );
            if (!confirmLeave) return;
        }
        clearItem();
    };

    if (!selectedItem || !selectedCollection) return null;

    const isMac = typeof navigator !== "undefined" && /mac/i.test(navigator.platform);

    return (
        <div className="flex h-full flex-col animate-slide-in-right">
                {/* Header / Actions bar */}
                <div className="flex items-center justify-between border-b border-border/50 pb-4 mb-6">
                    <div className="flex items-center gap-3">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="icon-sm"
                                    onClick={handleBackClick}
                                >
                                    <ArrowLeft className="size-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">Back to list</TooltipContent>
                        </Tooltip>
                        <div>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <span>{selectedCollection.icon || "📁"}</span>
                                <span>{selectedCollection.name}</span>
                                <span className="opacity-50">/</span>
                                <span className="font-medium text-foreground">Item Detail</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Status notifications */}
                        {saveSuccess && (
                            <span className="flex items-center gap-1.5 rounded-full bg-green-500/10 px-3 py-1 text-xs text-green-400 font-medium animate-scale-in">
                                <Check className="size-3.5" />
                                Saved
                            </span>
                        )}
                        {validationErrors.length > 0 && hasChanges && (
                            <Badge
                                variant="outline"
                                className="gap-1 border-destructive/30 text-[11px] font-medium text-destructive"
                            >
                                <AlertCircle className="size-3" />
                                Missing required fields
                            </Badge>
                        )}

                        <span className="mr-1 hidden items-center gap-0.5 rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground lg:inline-flex">
                            {isMac ? "⌘S" : "Ctrl+S"}
                        </span>

                        <div className="relative">
                            <Button
                                size="sm"
                                onClick={handleSave}
                                disabled={isSaveDisabled}
                                className="gap-1.5 min-w-[90px]"
                            >
                                {saving ? (
                                    <Loader2 className="size-4 animate-spin" />
                                ) : (
                                    <Save className="size-4" />
                                )}
                                {saving ? "Saving..." : "Save"}
                            </Button>
                            {hasChanges && !saving && validationErrors.length === 0 && (
                                <span className="absolute -right-1 -top-1 size-2 rounded-full bg-amber-500 animate-pulse" />
                            )}
                        </div>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    className="text-destructive hover:bg-destructive/10"
                                    onClick={() => setDeleteOpen(true)}
                                >
                                    <Trash2 className="size-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">Delete item</TooltipContent>
                        </Tooltip>
                    </div>
                </div>

                {/* Error display */}
                {error && (
                    <div className="mb-4 flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm font-medium text-destructive">
                        <AlertCircle className="mt-0.5 size-4 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Main content grid */}
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
                    {/* Left Panel: Field Editors (scrollable) */}
                    <div className="lg:col-span-2 overflow-y-auto pr-2 space-y-6">
                        {/* Cover Image Upload */}
                        <CoverUpload
                            cover={cover}
                            itemId={selectedItem.id}
                            onCoverChange={handleCoverChange}
                            resolveAssetUrl={resolveAssetUrlSync}
                        />

                        {/* Item Title Input */}
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                Item Title
                            </label>
                            <Input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="text-2xl font-bold bg-transparent border-0 border-b border-transparent hover:border-border focus:border-primary focus:ring-0 rounded-none px-0 pb-1.5 h-auto transition-colors placeholder:text-muted-foreground/50"
                                placeholder="Enter item title..."
                            />
                        </div>

                        <Separator className="my-6" />

                        {/* Custom fields list */}
                        <div className="space-y-5 pb-8">
                            <div className="flex items-center justify-between">
                                <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                    Custom Fields
                                </h2>
                                {attributes.length > 0 && (
                                    <span className="text-[11px] text-muted-foreground">
                                        {attributes.length} field{attributes.length === 1 ? "" : "s"}
                                    </span>
                                )}
                            </div>

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
                        <Card className="shadow-sm gradient-border overflow-hidden">
                            <CardContent className="p-5 space-y-4">
                                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                    <FileText className="size-4 text-primary" />
                                    Details
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
                                        <button
                                            type="button"
                                            onClick={handleCopyId}
                                            title="Copy item ID"
                                            className="group flex items-center gap-1 rounded font-mono text-muted-foreground transition-colors hover:text-foreground"
                                        >
                                            <Hash className="size-3" />
                                            {selectedItem.id}
                                            {copiedId ? (
                                                <Check className="size-3 text-green-500" />
                                            ) : (
                                                <Copy className="size-3 opacity-0 transition-opacity group-hover:opacity-100" />
                                            )}
                                        </button>
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
                                            <p className="flex items-center gap-1 font-bold uppercase tracking-wider">
                                                <AlertCircle className="size-3" />
                                                Required Actions
                                            </p>
                                            <ul className="list-disc pl-4 space-y-0.5">
                                                {validationErrors.map((err, i) => (
                                                    <li key={i}>{err}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Back-References Panel */}
                        <Card className="shadow-sm overflow-hidden">
                            <CardContent className="p-5">
                                <BackReferences itemId={selectedItem.id} />
                            </CardContent>
                        </Card>
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
