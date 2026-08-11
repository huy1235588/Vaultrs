/**
 * CoverUpload — Cover image upload with URL input (primary) and local file (secondary).
 *
 * Supports:
 * - Image URL input as the primary upload method
 * - Native file picker dialog via @tauri-apps/plugin-dialog (secondary)
 * - Drag & drop files onto the drop zone (secondary)
 * - Preview of current cover with change/remove actions
 */
import { useCallback, useRef, useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import {
    Globe,
    HardDrive,
    ImagePlus,
    Link2,
    Loader2,
    RefreshCw,
    X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import * as assetService from "@/core/api/assetService";
import type { Asset } from "@/core/types/common";

interface CoverUploadProps {
    /** Current cover asset (null = no cover). */
    cover: Asset | null;
    /** The item ID to upload cover for. */
    itemId: number;
    /** Callback when cover changes (upload, change, remove). */
    onCoverChange: (cover: Asset | null) => void;
    /** Resolve a relative vault path to a displayable URL. */
    resolveAssetUrl: (relativePath: string) => string;
}

export function CoverUpload({
    cover,
    itemId,
    onCoverChange,
    resolveAssetUrl,
}: CoverUploadProps) {
    const [isDragOver, setIsDragOver] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [urlInput, setUrlInput] = useState("");
    const [showUrlInput, setShowUrlInput] = useState(true);
    const urlInputRef = useRef<HTMLInputElement>(null);

    // ── Upload by URL (Primary) ───────────────────────────────────────

    const handleUrlSubmit = useCallback(
        async (e?: React.FormEvent) => {
            e?.preventDefault();
            const url = urlInput.trim();
            if (!url) return;

            // Basic URL validation
            try {
                new URL(url);
            } catch {
                setError("Please enter a valid URL");
                return;
            }

            setIsUploading(true);
            setError(null);
            try {
                const result = await assetService.addRemoteAsset(
                    itemId,
                    "COVER",
                    url,
                );
                onCoverChange(result);
                setUrlInput("");
            } catch (err) {
                const msg =
                    err instanceof Error
                        ? err.message
                        : "Failed to add cover from URL";
                setError(msg);
            } finally {
                setIsUploading(false);
            }
        },
        [urlInput, itemId, onCoverChange],
    );

    // ── Upload local file (Secondary) ─────────────────────────────────

    const uploadFile = useCallback(
        async (filePath: string) => {
            setIsUploading(true);
            setError(null);
            try {
                const result = await assetService.uploadAsset(
                    itemId,
                    "COVER",
                    filePath,
                );
                onCoverChange(result);
            } catch (err) {
                const msg =
                    err instanceof Error
                        ? err.message
                        : "Failed to upload cover";
                setError(msg);
            } finally {
                setIsUploading(false);
            }
        },
        [itemId, onCoverChange],
    );

    const handlePickFile = useCallback(async () => {
        try {
            const selected = await open({
                multiple: false,
                title: "Select Cover Image",
                filters: [
                    {
                        name: "Images",
                        extensions: [
                            "jpg",
                            "jpeg",
                            "png",
                            "webp",
                            "gif",
                            "bmp",
                        ],
                    },
                ],
            });
            if (selected) {
                await uploadFile(selected);
            }
        } catch (err) {
            console.error("File dialog error:", err);
        }
    }, [uploadFile]);

    // ── Remove cover ──────────────────────────────────────────────────

    const handleRemoveCover = useCallback(async () => {
        if (!cover) return;
        try {
            await assetService.deleteAsset(cover.id);
            onCoverChange(null);
        } catch (err) {
            const msg =
                err instanceof Error
                    ? err.message
                    : "Failed to remove cover";
            setError(msg);
        }
    }, [cover, onCoverChange]);

    // ── Drag & drop handlers ──────────────────────────────────────────

    const handleDragOver = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            if (!isDragOver) setIsDragOver(true);
        },
        [isDragOver],
    );

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
    }, []);

    const handleDrop = useCallback(
        async (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragOver(false);

            const files = e.dataTransfer?.files;
            if (files && files.length > 0) {
                const file = files[0];
                const filePath = (file as any).path;
                if (filePath) {
                    await uploadFile(filePath);
                }
            }
        },
        [uploadFile],
    );

    // ═══════════════════════════════════════════════════════════════════
    // RENDER: Cover exists — show preview with actions
    // ═══════════════════════════════════════════════════════════════════

    if (cover && cover.state === "READY") {
        const coverUrl =
            cover.source_type === "REMOTE"
                ? cover.source_url
                : cover.thumbnail_path
                  ? resolveAssetUrl(cover.thumbnail_path)
                  : cover.relative_path
                    ? resolveAssetUrl(cover.relative_path)
                    : null;

        return (
            <div className="space-y-2">
                <div className="group relative overflow-hidden rounded-xl border border-border">
                    {/* Cover image */}
                    {coverUrl ? (
                        <img
                            src={coverUrl}
                            alt="Cover"
                            className="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                            draggable={false}
                        />
                    ) : (
                        <div className="flex h-48 items-center justify-center bg-muted/30">
                            <ImagePlus className="size-8 text-muted-foreground/50" />
                        </div>
                    )}

                    {/* Source badge */}
                    <div className="absolute top-2 left-2">
                        <span className="inline-flex items-center gap-1 rounded-md bg-black/50 px-2 py-0.5 text-[10px] font-medium text-white/80 backdrop-blur-sm">
                            {cover.source_type === "REMOTE" ? (
                                <>
                                    <Globe className="size-2.5" />
                                    URL
                                </>
                            ) : (
                                <>
                                    <HardDrive className="size-2.5" />
                                    Local
                                </>
                            )}
                        </span>
                    </div>

                    {/* Overlay actions — visible on hover */}
                    <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="gap-1.5 shadow-lg"
                                    onClick={() => {
                                        handleRemoveCover();
                                    }}
                                    disabled={isUploading}
                                >
                                    <RefreshCw className="size-3.5" />
                                    Change
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                Replace cover image
                            </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    className="gap-1.5 shadow-lg"
                                    onClick={handleRemoveCover}
                                >
                                    <X className="size-3.5" />
                                    Remove
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                Remove cover image
                            </TooltipContent>
                        </Tooltip>
                    </div>

                    {/* Error toast */}
                    {error && (
                        <div className="absolute bottom-2 left-2 right-2 rounded-md bg-destructive/90 px-3 py-1.5 text-xs text-white">
                            {error}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ═══════════════════════════════════════════════════════════════════
    // RENDER: No cover — show upload options (URL primary, file secondary)
    // ═══════════════════════════════════════════════════════════════════

    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Cover Image
                </span>
                {/* Method toggle tabs */}
                <div className="flex rounded-lg border border-border bg-muted/30 p-0.5">
                    <button
                        type="button"
                        className={cn(
                            "flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium transition-all duration-150",
                            showUrlInput
                                ? "bg-background text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground",
                        )}
                        onClick={() => setShowUrlInput(true)}
                    >
                        <Link2 className="size-3" />
                        URL
                    </button>
                    <button
                        type="button"
                        className={cn(
                            "flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium transition-all duration-150",
                            !showUrlInput
                                ? "bg-background text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground",
                        )}
                        onClick={() => setShowUrlInput(false)}
                    >
                        <HardDrive className="size-3" />
                        Local
                    </button>
                </div>
            </div>

            {showUrlInput ? (
                /* ── URL Input (Primary) ─────────────────────────────── */
                <form onSubmit={handleUrlSubmit} className="space-y-2">
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Globe className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/60" />
                            <Input
                                ref={urlInputRef}
                                type="url"
                                value={urlInput}
                                onChange={(e) => {
                                    setUrlInput(e.target.value);
                                    setError(null);
                                }}
                                placeholder="https://example.com/image.jpg"
                                className="pl-9 text-sm"
                                disabled={isUploading}
                                autoFocus
                            />
                        </div>
                        <Button
                            type="submit"
                            size="sm"
                            disabled={!urlInput.trim() || isUploading}
                            className="gap-1.5 shrink-0"
                        >
                            {isUploading ? (
                                <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                                <Link2 className="size-3.5" />
                            )}
                            {isUploading ? "Adding..." : "Add"}
                        </Button>
                    </div>

                    {/* URL preview hint */}
                    {urlInput.trim() && !error && (
                        <p className="text-[11px] text-muted-foreground">
                            Press Enter or click Add to set as cover
                        </p>
                    )}

                    {/* Error */}
                    {error && (
                        <p className="text-xs font-medium text-destructive">
                            {error}
                        </p>
                    )}
                </form>
            ) : (
                /* ── Local File Upload (Secondary) ───────────────────── */
                <div
                    className={cn(
                        "group relative flex h-36 cursor-pointer flex-col items-center justify-center gap-2.5 rounded-xl border-2 border-dashed transition-all duration-200",
                        isDragOver
                            ? "border-primary bg-primary/5 scale-[1.01]"
                            : "border-border/60 bg-muted/10 hover:border-primary/40 hover:bg-muted/20",
                        isUploading && "pointer-events-none opacity-60",
                    )}
                    onClick={handlePickFile}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    {isUploading ? (
                        <>
                            <Loader2 className="size-7 animate-spin text-primary" />
                            <span className="text-xs font-medium text-muted-foreground">
                                Uploading...
                            </span>
                        </>
                    ) : (
                        <>
                            <div
                                className={cn(
                                    "flex size-10 items-center justify-center rounded-full transition-colors duration-200",
                                    isDragOver
                                        ? "bg-primary/10 text-primary"
                                        : "bg-muted/40 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary",
                                )}
                            >
                                <HardDrive className="size-4.5" />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-medium text-foreground">
                                    {isDragOver
                                        ? "Drop to upload"
                                        : "Browse local files"}
                                </p>
                                <p className="mt-0.5 text-[11px] text-muted-foreground">
                                    Drag & drop or click to browse
                                </p>
                            </div>
                        </>
                    )}

                    {/* Error message */}
                    {error && (
                        <p className="absolute bottom-2.5 text-xs font-medium text-destructive">
                            {error}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
