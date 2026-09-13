/**
 * CollectionSettingsPage — Dedicated settings page for a collection.
 *
 * Configures general metadata (name, icon, description) and media rules.
 * View layout & sorting have been moved to ViewOptionsDrawer on CollectionPage.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import {
    AlertTriangle,
    ArrowLeft,
    Check,
    Image,
    Info,
    Loader2,
    Save,
    Settings,
    SlidersHorizontal,
    Trash2,
} from "lucide-react";
import { useCollections } from "@/core/context/CollectionContext";
import { useCollectionSettings } from "@/core/hooks/useCollectionSettings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { DeleteCollectionDialog } from "@/components/Collection/DeleteCollectionDialog";
import { cn } from "@/lib/utils";
import type { AssetRole, MediaSettings } from "@/core/types/common";

const ICON_PRESETS = [
    "📁", "🎬", "📚", "🎮", "🎵", "📷", "🍳", "✈️",
    "💼", "🏷️", "⭐", "📦", "🎨", "🚗", "☕", "💻",
];

const ROLE_OPTIONS: { value: AssetRole; label: string; desc: string }[] = [
    { value: "COVER", label: "Cover", desc: "Main display cover art" },
    { value: "GALLERY", label: "Gallery", desc: "Image gallery slides" },
    { value: "SCREENSHOT", label: "Screenshot", desc: "UI or gameplay captures" },
    { value: "ATTACHMENT", label: "Attachment", desc: "General file attachments" },
    { value: "BACKGROUND", label: "Background", desc: "Hero or wallpaper images" },
    { value: "LOGO", label: "Logo", desc: "Emblem or brand icon" },
    { value: "BANNER", label: "Banner", desc: "Wide header banners" },
];

export function CollectionSettingsPage() {
    const { selectedCollection, editCollection, setActiveSubView } = useCollections();
    const { settings, isLoading: settingsLoading, updateSettings } =
        useCollectionSettings(selectedCollection?.id);

    // General form state
    const [name, setName] = useState(selectedCollection?.name ?? "");
    const [icon, setIcon] = useState(selectedCollection?.icon ?? "");
    const [description, setDescription] = useState(selectedCollection?.description ?? "");
    const [savingGeneral, setSavingGeneral] = useState(false);
    const [generalSaved, setGeneralSaved] = useState(false);
    const [generalError, setGeneralError] = useState<string | null>(null);

    // Media settings saved feedback
    const [mediaSaved, setMediaSaved] = useState(false);
    const mediaSavedTimerRef = useRef<ReturnType<typeof setTimeout>>();

    // Delete dialog
    const [deleteOpen, setDeleteOpen] = useState(false);

    // Sync form state when selected collection changes
    useEffect(() => {
        if (selectedCollection) {
            setName(selectedCollection.name);
            setIcon(selectedCollection.icon ?? "");
            setDescription(selectedCollection.description ?? "");
            setGeneralError(null);
            setGeneralSaved(false);
        }
    }, [selectedCollection]);

    // Clean up timer
    useEffect(() => {
        return () => {
            if (mediaSavedTimerRef.current) clearTimeout(mediaSavedTimerRef.current);
        };
    }, []);

    const flashMediaSaved = useCallback(() => {
        setMediaSaved(true);
        if (mediaSavedTimerRef.current) clearTimeout(mediaSavedTimerRef.current);
        mediaSavedTimerRef.current = setTimeout(() => setMediaSaved(false), 2000);
    }, []);

    if (!selectedCollection) return null;

    const isNameValid = name.trim().length > 0;
    const isGeneralDirty =
        name.trim() !== selectedCollection.name ||
        icon.trim() !== (selectedCollection.icon ?? "") ||
        description.trim() !== (selectedCollection.description ?? "");

    // Handle saving general information (Name, Icon, Description)
    const handleSaveGeneral = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!isNameValid || !isGeneralDirty || savingGeneral) return;

        setSavingGeneral(true);
        setGeneralError(null);

        try {
            await editCollection(selectedCollection.id, {
                name: name.trim(),
                icon: icon.trim() || undefined,
                description: description.trim() || undefined,
            });
            setGeneralSaved(true);
            setTimeout(() => setGeneralSaved(false), 2500);
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Failed to update collection";
            setGeneralError(msg);
        } finally {
            setSavingGeneral(false);
        }
    };

    // Auto-save media settings
    const updateMedia = async (partial: Partial<MediaSettings>) => {
        if (!settings) return;
        try {
            await updateSettings({
                media: { ...settings.media, ...partial },
            });
            flashMediaSaved();
        } catch (err) {
            console.error("Failed to update media settings:", err);
        }
    };

    const toggleRole = (role: AssetRole, checked: boolean) => {
        if (!settings) return;
        const current = settings.media.allowed_roles;
        const next = checked ? [...current, role] : current.filter((r) => r !== role);
        updateMedia({ allowed_roles: next });
    };

    return (
        <div className="flex h-full flex-col animate-slide-in-right max-w-4xl mx-auto w-full pb-16">
            {/* ═══ Top Breadcrumbs & Page Header ═══ */}
            <div className="mb-6 flex flex-col gap-4 border-b border-border/50 pb-5">
                <div className="flex items-center gap-3">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="outline"
                                size="icon-sm"
                                onClick={() => setActiveSubView("items")}
                                aria-label="Back to items"
                            >
                                <ArrowLeft className="size-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">Back to items</TooltipContent>
                    </Tooltip>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <button
                            type="button"
                            onClick={() => setActiveSubView("items")}
                            className="flex items-center gap-1.5 hover:text-foreground transition-colors cursor-pointer"
                        >
                            <span>{selectedCollection.icon || "📁"}</span>
                            <span className="font-medium">{selectedCollection.name}</span>
                        </button>
                        <span className="opacity-40">/</span>
                        <span className="font-semibold text-foreground">Collection Settings</span>
                    </div>
                </div>

                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
                        <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary text-base">
                            <Settings className="size-4" />
                        </span>
                        Collection Settings
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Manage name, icon, description, and media asset rules for{" "}
                        <span className="font-medium text-foreground">&ldquo;{selectedCollection.name}&rdquo;</span>.
                    </p>
                </div>
            </div>

            <div className="space-y-6">
                {/* ═══ SECTION 1: GENERAL INFORMATION ═══ */}
                <Card className="border-border/80 bg-card/60 shadow-xs">
                    <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="flex size-7 items-center justify-center rounded-md bg-muted text-muted-foreground">
                                    <Info className="size-3.5" />
                                </div>
                                <div>
                                    <CardTitle className="text-base">General Information</CardTitle>
                                    <CardDescription className="text-xs">
                                        Update the public identity and description of this collection.
                                    </CardDescription>
                                </div>
                            </div>

                            {generalSaved && (
                                <Badge
                                    variant="secondary"
                                    className="gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20 animate-scale-in"
                                >
                                    <Check className="size-3" />
                                    Saved
                                </Badge>
                            )}
                        </div>
                    </CardHeader>

                    <CardContent>
                        <form onSubmit={handleSaveGeneral} className="space-y-5">
                            {/* Collection Name */}
                            <div className="space-y-2">
                                <Label htmlFor="collection-name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Name <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="collection-name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Collection name..."
                                    className="max-w-md"
                                />
                            </div>

                            {/* Collection Icon */}
                            <div className="space-y-2">
                                <Label htmlFor="collection-icon" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Icon / Emoji
                                </Label>
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                                    <Input
                                        id="collection-icon"
                                        value={icon}
                                        onChange={(e) => setIcon(e.target.value)}
                                        placeholder="📁"
                                        maxLength={4}
                                        className="w-16 text-center text-xl shrink-0"
                                    />
                                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                                        {ICON_PRESETS.map((preset) => (
                                            <button
                                                key={preset}
                                                type="button"
                                                onClick={() => setIcon(preset)}
                                                className={cn(
                                                    "flex size-8 items-center justify-center rounded-lg border text-base transition-all hover:bg-muted cursor-pointer",
                                                    icon === preset
                                                        ? "border-primary bg-primary/10 ring-1 ring-primary/40 scale-105"
                                                        : "border-border/60 bg-muted/20"
                                                )}
                                            >
                                                {preset}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Live Preview */}
                            <div className="space-y-2">
                                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Live Preview
                                </span>
                                <div className="flex items-center gap-3 rounded-xl border border-dashed border-border/80 bg-muted/20 p-3.5 max-w-md">
                                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-xl shadow-xs">
                                        {icon || "📁"}
                                    </span>
                                    <div className="min-w-0">
                                        <div className="text-sm font-semibold truncate text-foreground">
                                            {name.trim() || "Untitled Collection"}
                                        </div>
                                        <div className="text-xs text-muted-foreground truncate">
                                            {description.trim() || "No description provided"}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Collection Description */}
                            <div className="space-y-2">
                                <Label htmlFor="collection-description" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Description
                                </Label>
                                <textarea
                                    id="collection-description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Optional description of this collection's purpose or contents..."
                                    rows={3}
                                    className="w-full max-w-xl rounded-lg border border-input bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/20"
                                />
                            </div>

                            {generalError && (
                                <p className="text-xs font-medium text-destructive">{generalError}</p>
                            )}

                            <div className="pt-2 flex items-center gap-3">
                                <Button
                                    type="submit"
                                    disabled={!isNameValid || !isGeneralDirty || savingGeneral}
                                    className="gap-2 shadow-xs"
                                >
                                    {savingGeneral ? (
                                        <Loader2 className="size-4 animate-spin" />
                                    ) : (
                                        <Save className="size-4" />
                                    )}
                                    Save Changes
                                </Button>
                                {isGeneralDirty && (
                                    <span className="text-xs text-muted-foreground">
                                        You have unsaved changes
                                    </span>
                                )}
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* ═══ SECTION 2: MEDIA SETTINGS ═══ */}
                <Card className="border-border/80 bg-card/60 shadow-xs">
                    <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="flex size-7 items-center justify-center rounded-md bg-muted text-muted-foreground">
                                    <Image className="size-3.5" />
                                </div>
                                <div>
                                    <CardTitle className="text-base">Media & Assets</CardTitle>
                                    <CardDescription className="text-xs">
                                        Configure cover images and allowable media asset attachments for this collection.
                                    </CardDescription>
                                </div>
                            </div>

                            {mediaSaved && (
                                <Badge
                                    variant="secondary"
                                    className="gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20 animate-scale-in"
                                >
                                    <Check className="size-3" />
                                    Saved
                                </Badge>
                            )}
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        {settingsLoading || !settings ? (
                            <div className="space-y-3 py-2">
                                <div className="h-10 animate-pulse rounded-lg bg-muted/40" />
                                <div className="h-10 animate-pulse rounded-lg bg-muted/40" />
                            </div>
                        ) : (
                            <>
                                {/* Enable Media */}
                                <div className="flex items-center justify-between gap-4">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="toggle-media" className="text-sm font-medium text-foreground cursor-pointer">
                                            Enable Media Attachments
                                        </Label>
                                        <p className="text-xs text-muted-foreground">
                                            Allow uploading and associating image and media assets with items.
                                        </p>
                                    </div>
                                    <Switch
                                        id="toggle-media"
                                        checked={settings.media.media_enabled}
                                        onCheckedChange={(checked) => updateMedia({ media_enabled: checked })}
                                    />
                                </div>

                                <Separator className="bg-border/60" />

                                {/* Enable Cover Images */}
                                <div className="flex items-center justify-between gap-4">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="toggle-cover" className="text-sm font-medium text-foreground cursor-pointer">
                                            Enable Cover Images
                                        </Label>
                                        <p className="text-xs text-muted-foreground">
                                            Show cover images prominently on item cards and detail headers.
                                        </p>
                                    </div>
                                    <Switch
                                        id="toggle-cover"
                                        checked={settings.media.cover_enabled}
                                        onCheckedChange={(checked) => updateMedia({ cover_enabled: checked })}
                                    />
                                </div>

                                <Separator className="bg-border/60" />

                                {/* Default Cover Mode */}
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                        Default Cover Mode
                                    </Label>
                                    <Select
                                        value={settings.media.default_cover_mode}
                                        onValueChange={(v) => updateMedia({ default_cover_mode: v })}
                                    >
                                        <SelectTrigger className="h-9 w-52 text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="SYSTEM" className="text-xs">
                                                System (Gradient fallback)
                                            </SelectItem>
                                            <SelectItem value="CUSTOM" className="text-xs">
                                                Custom image only
                                            </SelectItem>
                                            <SelectItem value="NONE" className="text-xs">
                                                None
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <Separator className="bg-border/60" />

                                {/* Allowed Asset Roles */}
                                <div className="space-y-3">
                                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                        Allowed Asset Roles
                                    </Label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                        {ROLE_OPTIONS.map((role) => {
                                            const isChecked = settings.media.allowed_roles.includes(role.value);
                                            return (
                                                <label
                                                    key={role.value}
                                                    className={cn(
                                                        "flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors",
                                                        isChecked
                                                            ? "border-primary/40 bg-primary/5 text-foreground"
                                                            : "border-border/60 bg-muted/10 text-muted-foreground hover:bg-muted/30"
                                                    )}
                                                >
                                                    <Checkbox
                                                        checked={isChecked}
                                                        onCheckedChange={(c) => toggleRole(role.value, !!c)}
                                                        className="mt-0.5"
                                                    />
                                                    <div className="min-w-0">
                                                        <span className="text-xs font-semibold block">
                                                            {role.label}
                                                        </span>
                                                        <span className="text-[11px] text-muted-foreground leading-snug">
                                                            {role.desc}
                                                        </span>
                                                    </div>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* ═══ SECTION 3: DANGER ZONE ═══ */}
                <Card className="border-destructive/30 bg-destructive/5 shadow-xs">
                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-2.5 text-destructive">
                            <AlertTriangle className="size-4" />
                            <CardTitle className="text-base text-destructive">Danger Zone</CardTitle>
                        </div>
                        <CardDescription className="text-xs text-muted-foreground">
                            Irreversible and destructive actions for this collection.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <div className="text-sm font-semibold text-foreground">
                                Delete this collection
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Once deleted, all items, fields, and files within &ldquo;{selectedCollection.name}&rdquo; will be permanently removed.
                            </p>
                        </div>

                        <Button
                            variant="destructive"
                            size="sm"
                            className="shrink-0 gap-1.5"
                            onClick={() => setDeleteOpen(true)}
                        >
                            <Trash2 className="size-3.5" />
                            Delete Collection
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Delete Confirmation Modal */}
            <DeleteCollectionDialog
                collection={selectedCollection}
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
            />
        </div>
    );
}

export default CollectionSettingsPage;
