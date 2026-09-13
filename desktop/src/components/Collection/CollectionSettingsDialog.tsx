/**
 * CollectionSettingsDialog — Settings panel for per-collection configuration.
 *
 * Three sections: Appearance, Media, and Behavior.
 * Auto-saves on every change with optimistic updates and brief "Saved" feedback.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import {
    Check,
    Image,
    LayoutGrid,
    List,
    Palette,
    Settings2,
    SlidersHorizontal,
    Sparkles,
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useCollectionSettings } from "@/core/hooks/useCollectionSettings";
import type {
    AppearanceSettings,
    BehaviorSettings,
    MediaSettings,
    AssetRole,
} from "@/core/types/common";

interface CollectionSettingsDialogProps {
    collectionId: number;
    collectionName: string;
    collectionIcon?: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

// --- View mode toggle component ---

interface ViewModeOptionProps {
    value: string;
    activeValue: string;
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
}

function ViewModeOption({
    value,
    activeValue,
    icon,
    label,
    onClick,
}: ViewModeOptionProps) {
    const isActive = value === activeValue;
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-all",
                isActive
                    ? "border-primary/50 bg-primary/10 text-primary shadow-sm"
                    : "border-border bg-background text-muted-foreground hover:border-primary/30 hover:text-foreground",
            )}
        >
            {icon}
            {label}
        </button>
    );
}

// --- Card size visual selector ---

const CARD_SIZE_OPTIONS = [
    { value: "SMALL", label: "Small" },
    { value: "MEDIUM", label: "Medium" },
    { value: "LARGE", label: "Large" },
] as const;

// --- Asset role options ---

const ROLE_OPTIONS: { value: AssetRole; label: string }[] = [
    { value: "COVER", label: "Cover" },
    { value: "GALLERY", label: "Gallery" },
    { value: "SCREENSHOT", label: "Screenshot" },
    { value: "ATTACHMENT", label: "Attachment" },
    { value: "BACKGROUND", label: "Background" },
    { value: "LOGO", label: "Logo" },
    { value: "BANNER", label: "Banner" },
];

// --- Section header ---

function SectionHeader({
    icon,
    title,
    description,
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
}) {
    return (
        <div className="flex items-start gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                {icon}
            </div>
            <div>
                <h3 className="text-sm font-semibold text-foreground">
                    {title}
                </h3>
                <p className="text-xs text-muted-foreground">{description}</p>
            </div>
        </div>
    );
}

// --- Main component ---

export function CollectionSettingsDialog({
    collectionId,
    collectionName,
    collectionIcon,
    open,
    onOpenChange,
}: CollectionSettingsDialogProps) {
    const { settings, isLoading, updateSettings } =
        useCollectionSettings(collectionId);

    // "Saved" feedback state
    const [saved, setSaved] = useState(false);
    const savedTimerRef = useRef<ReturnType<typeof setTimeout>>();

    // Show "Saved" badge briefly
    const flashSaved = useCallback(() => {
        setSaved(true);
        if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
        savedTimerRef.current = setTimeout(() => setSaved(false), 2000);
    }, []);

    // Cleanup timer
    useEffect(() => {
        return () => {
            if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
        };
    }, []);

    // --- Updaters (auto-save) ---

    const updateAppearance = useCallback(
        async (partial: Partial<AppearanceSettings>) => {
            if (!settings) return;
            try {
                await updateSettings({
                    appearance: { ...settings.appearance, ...partial },
                });
                flashSaved();
            } catch (err) {
                console.error("Failed to update appearance:", err);
            }
        },
        [settings, updateSettings, flashSaved],
    );

    const updateMedia = useCallback(
        async (partial: Partial<MediaSettings>) => {
            if (!settings) return;
            try {
                await updateSettings({
                    media: { ...settings.media, ...partial },
                });
                flashSaved();
            } catch (err) {
                console.error("Failed to update media:", err);
            }
        },
        [settings, updateSettings, flashSaved],
    );

    const updateBehavior = useCallback(
        async (partial: Partial<BehaviorSettings>) => {
            if (!settings) return;
            try {
                await updateSettings({
                    behavior: { ...settings.behavior, ...partial },
                });
                flashSaved();
            } catch (err) {
                console.error("Failed to update behavior:", err);
            }
        },
        [settings, updateSettings, flashSaved],
    );

    // --- Role checkbox toggling ---

    const toggleRole = useCallback(
        (role: AssetRole, checked: boolean) => {
            if (!settings) return;
            const current = settings.media.allowed_roles;
            const next = checked
                ? [...current, role]
                : current.filter((r) => r !== role);
            updateMedia({ allowed_roles: next });
        },
        [settings, updateMedia],
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
                <DialogHeader>
                    <div className="mb-1 flex size-10 items-center justify-center rounded-lg bg-primary/10">
                        <Settings2 className="size-5 text-primary" />
                    </div>
                    <div className="flex items-center gap-2">
                        <DialogTitle>Collection settings</DialogTitle>
                        {saved && (
                            <Badge
                                variant="secondary"
                                className="gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400"
                            >
                                <Check className="size-3" />
                                Saved
                            </Badge>
                        )}
                    </div>
                    <DialogDescription>
                        Configure display, media, and behavior for{" "}
                        <span className="font-medium text-foreground">
                            {collectionIcon && `${collectionIcon} `}
                            {collectionName}
                        </span>
                        .
                    </DialogDescription>
                </DialogHeader>

                {isLoading || !settings ? (
                    <div className="mt-4 space-y-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <Skeleton className="size-8 rounded-lg" />
                                    <div className="space-y-1">
                                        <Skeleton className="h-4 w-24 rounded" />
                                        <Skeleton className="h-3 w-40 rounded" />
                                    </div>
                                </div>
                                <Skeleton className="h-10 w-full rounded-lg" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="mt-4 space-y-6">
                        {/* ═══ APPEARANCE ═══ */}
                        <section className="space-y-4">
                            <SectionHeader
                                icon={<Palette className="size-4" />}
                                title="Appearance"
                                description="Default view mode and card display preferences."
                            />

                            {/* Default View Mode */}
                            <div className="ml-11 space-y-2">
                                <Label className="text-xs font-medium text-muted-foreground">
                                    Default view mode
                                </Label>
                                <div className="flex gap-2">
                                    <ViewModeOption
                                        value="LIST"
                                        activeValue={
                                            settings.appearance
                                                .default_view_mode
                                        }
                                        icon={<List className="size-3.5" />}
                                        label="List"
                                        onClick={() =>
                                            updateAppearance({
                                                default_view_mode: "LIST",
                                            })
                                        }
                                    />
                                    <ViewModeOption
                                        value="GRID"
                                        activeValue={
                                            settings.appearance
                                                .default_view_mode
                                        }
                                        icon={
                                            <LayoutGrid className="size-3.5" />
                                        }
                                        label="Grid"
                                        onClick={() =>
                                            updateAppearance({
                                                default_view_mode: "GRID",
                                            })
                                        }
                                    />
                                </div>
                            </div>

                            {/* Card Size */}
                            <div className="ml-11 space-y-2">
                                <Label className="text-xs font-medium text-muted-foreground">
                                    Card size (Grid mode)
                                </Label>
                                <Select
                                    value={settings.appearance.card_size}
                                    onValueChange={(v) =>
                                        updateAppearance({ card_size: v })
                                    }
                                >
                                    <SelectTrigger className="h-8 w-40 text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {CARD_SIZE_OPTIONS.map((opt) => (
                                            <SelectItem
                                                key={opt.value}
                                                value={opt.value}
                                                className="text-xs"
                                            >
                                                {opt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Show Title on Card */}
                            <div className="ml-11 flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label
                                        htmlFor="show-title"
                                        className="text-xs font-medium"
                                    >
                                        Show title on cards
                                    </Label>
                                    <p className="text-[11px] text-muted-foreground">
                                        Display item title below the cover in
                                        Grid mode.
                                    </p>
                                </div>
                                <Switch
                                    id="show-title"
                                    checked={
                                        settings.appearance.show_title_on_card
                                    }
                                    onCheckedChange={(checked) =>
                                        updateAppearance({
                                            show_title_on_card: checked,
                                        })
                                    }
                                />
                            </div>
                        </section>

                        <Separator />

                        {/* ═══ MEDIA ═══ */}
                        <section className="space-y-4">
                            <SectionHeader
                                icon={<Image className="size-4" />}
                                title="Media"
                                description="Cover images and media asset configuration."
                            />

                            {/* Media Enabled */}
                            <div className="ml-11 flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label
                                        htmlFor="media-enabled"
                                        className="text-xs font-medium"
                                    >
                                        Enable media
                                    </Label>
                                    <p className="text-[11px] text-muted-foreground">
                                        Allow uploading and managing media
                                        assets.
                                    </p>
                                </div>
                                <Switch
                                    id="media-enabled"
                                    checked={settings.media.media_enabled}
                                    onCheckedChange={(checked) =>
                                        updateMedia({ media_enabled: checked })
                                    }
                                />
                            </div>

                            {/* Cover Enabled */}
                            <div className="ml-11 flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label
                                        htmlFor="cover-enabled"
                                        className="text-xs font-medium"
                                    >
                                        Enable cover images
                                    </Label>
                                    <p className="text-[11px] text-muted-foreground">
                                        Show cover images on item cards and
                                        detail pages.
                                    </p>
                                </div>
                                <Switch
                                    id="cover-enabled"
                                    checked={settings.media.cover_enabled}
                                    onCheckedChange={(checked) =>
                                        updateMedia({ cover_enabled: checked })
                                    }
                                />
                            </div>

                            {/* Default Cover Mode */}
                            <div className="ml-11 space-y-2">
                                <Label className="text-xs font-medium text-muted-foreground">
                                    Default cover mode
                                </Label>
                                <Select
                                    value={settings.media.default_cover_mode}
                                    onValueChange={(v) =>
                                        updateMedia({ default_cover_mode: v })
                                    }
                                >
                                    <SelectTrigger className="h-8 w-40 text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem
                                            value="SYSTEM"
                                            className="text-xs"
                                        >
                                            System (gradient)
                                        </SelectItem>
                                        <SelectItem
                                            value="CUSTOM"
                                            className="text-xs"
                                        >
                                            Custom image
                                        </SelectItem>
                                        <SelectItem
                                            value="NONE"
                                            className="text-xs"
                                        >
                                            None
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Allowed Roles */}
                            <div className="ml-11 space-y-2.5">
                                <Label className="text-xs font-medium text-muted-foreground">
                                    Allowed asset roles
                                </Label>
                                <div className="grid grid-cols-2 gap-2">
                                    {ROLE_OPTIONS.map((role) => {
                                        const isChecked =
                                            settings.media.allowed_roles.includes(
                                                role.value,
                                            );
                                        return (
                                            <label
                                                key={role.value}
                                                className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-2.5 py-1.5 text-xs transition-colors hover:bg-muted/50"
                                            >
                                                <Checkbox
                                                    checked={isChecked}
                                                    onCheckedChange={(
                                                        checked,
                                                    ) =>
                                                        toggleRole(
                                                            role.value,
                                                            !!checked,
                                                        )
                                                    }
                                                />
                                                <span
                                                    className={cn(
                                                        isChecked
                                                            ? "text-foreground"
                                                            : "text-muted-foreground",
                                                    )}
                                                >
                                                    {role.label}
                                                </span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                        </section>

                        <Separator />

                        {/* ═══ BEHAVIOR ═══ */}
                        <section className="space-y-4">
                            <SectionHeader
                                icon={
                                    <SlidersHorizontal className="size-4" />
                                }
                                title="Behavior"
                                description="Default sorting when opening this collection."
                            />

                            {/* Default Sort Field */}
                            <div className="ml-11 space-y-2">
                                <Label className="text-xs font-medium text-muted-foreground">
                                    Default sort by
                                </Label>
                                <Select
                                    value={
                                        settings.behavior.default_sort_field
                                    }
                                    onValueChange={(v) =>
                                        updateBehavior({
                                            default_sort_field: v,
                                        })
                                    }
                                >
                                    <SelectTrigger className="h-8 w-48 text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem
                                            value="title"
                                            className="text-xs"
                                        >
                                            Title
                                        </SelectItem>
                                        <SelectItem
                                            value="created_at"
                                            className="text-xs"
                                        >
                                            Created date
                                        </SelectItem>
                                        <SelectItem
                                            value="updated_at"
                                            className="text-xs"
                                        >
                                            Updated date
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Default Sort Order */}
                            <div className="ml-11 space-y-2">
                                <Label className="text-xs font-medium text-muted-foreground">
                                    Default sort order
                                </Label>
                                <div className="flex gap-2">
                                    <ViewModeOption
                                        value="ASC"
                                        activeValue={
                                            settings.behavior
                                                .default_sort_order
                                        }
                                        icon={
                                            <Sparkles className="size-3.5" />
                                        }
                                        label="Ascending"
                                        onClick={() =>
                                            updateBehavior({
                                                default_sort_order: "ASC",
                                            })
                                        }
                                    />
                                    <ViewModeOption
                                        value="DESC"
                                        activeValue={
                                            settings.behavior
                                                .default_sort_order
                                        }
                                        icon={
                                            <Sparkles className="size-3.5" />
                                        }
                                        label="Descending"
                                        onClick={() =>
                                            updateBehavior({
                                                default_sort_order: "DESC",
                                            })
                                        }
                                    />
                                </div>
                            </div>
                        </section>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
