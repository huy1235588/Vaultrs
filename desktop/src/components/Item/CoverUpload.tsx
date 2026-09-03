/**
 * CoverUpload — Cover image upload with URL input (primary) and local file (secondary).
 *
 * Supports:
 * - Image URL input as the primary upload method, with a live preview before submitting
 * - Native file picker dialog via @tauri-apps/plugin-dialog (secondary)
 * - Drag & drop files onto the drop zone (secondary)
 * - Preview of the current cover with change/remove actions
 *
 * Image handling: covers can arrive at any aspect ratio (800×600, 1920×1080,
 * 3000×1000, tall posters, etc). Rather than cropping to a fixed banner ratio —
 * which mutilates very wide or very square images — the preview keeps a fixed
 * height and shows the full image via `object-contain`, with a blurred,
 * color-matched backdrop filling any letterboxed space. The frame's footprint
 * never changes, and no part of the source image is ever lost to cropping.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import {
    AlertCircle,
    Globe,
    HardDrive,
    ImageOff,
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

// ── Dimension helpers ───────────────────────────────────────────────

function gcd(a: number, b: number): number {
    return b === 0 ? a : gcd(b, a % b);
}

/** e.g. "1920 × 1080 · 16:9" — falls back to plain pixels for odd ratios. */
function describeDimensions(width: number, height: number): string {
    const divisor = gcd(width, height) || 1;
    const rw = width / divisor;
    const rh = height / divisor;
    const isClean = rw <= 32 && rh <= 32;
    return isClean ? `${width} × ${height} · ${rw}:${rh}` : `${width} × ${height}`;
}

// ── Live preview for the URL tab ────────────────────────────────────
// Remounted (keyed by url) on every change, so loaded/error state never
// goes stale between different links — see render call below.

function UrlPreview({ url }: { url: string }) {
    const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");
    const [dims, setDims] = useState<{ w: number; h: number } | null>(null);

    return (
        <div
            className="relative w-full overflow-hidden rounded-lg border border-border/50 bg-muted/20 transition-all duration-300 max-h-56"
            style={
                dims
                    ? { aspectRatio: `${dims.w} / ${dims.h}` }
                    : { minHeight: "100px", aspectRatio: "16 / 9" }
            }
        >
            {status !== "error" && (
                <>
                    <img
                        src={url}
                        aria-hidden
                        className="absolute inset-0 h-full w-full scale-110 object-cover opacity-60 blur-xl"
                    />
                    <img
                        src={url}
                        alt=""
                        className={cn(
                            "relative h-full w-full object-contain transition-opacity duration-300",
                            status === "loaded" ? "opacity-100" : "opacity-0",
                        )}
                        onLoad={(e) => {
                            setDims({
                                w: e.currentTarget.naturalWidth,
                                h: e.currentTarget.naturalHeight,
                            });
                            setStatus("loaded");
                        }}
                        onError={() => setStatus("error")}
                    />
                </>
            )}

            {status === "loading" && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="size-4 animate-spin text-muted-foreground/40" />
                </div>
            )}

            {status === "error" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-muted-foreground/50">
                    <ImageOff className="size-5" />
                    <span className="text-[10px] font-medium">
                        Can't load a preview for this link
                    </span>
                </div>
            )}

            {status === "loaded" && dims && (
                <span className="absolute bottom-1.5 right-1.5 rounded-md bg-black/55 px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-white/90 backdrop-blur-sm">
                    {describeDimensions(dims.w, dims.h)}
                </span>
            )}
        </div>
    );
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
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageFailed, setImageFailed] = useState(false);
    const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);
    const urlInputRef = useRef<HTMLInputElement>(null);

    // Reset per-image state whenever the underlying cover changes, so a
    // freshly-set cover always re-runs its own load/shimmer sequence
    // regardless of whether it changed via this component or the parent.
    useEffect(() => {
        setImageLoaded(false);
        setImageFailed(false);
        setNaturalSize(null);
    }, [cover?.id]);

    const isValidUrl = (() => {
        const trimmed = urlInput.trim();
        if (!trimmed) return false;
        try {
            new URL(trimmed);
            return true;
        } catch {
            return false;
        }
    })();

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
                const result = await assetService.addRemoteAsset(itemId, "COVER", url);
                onCoverChange(result);
                setUrlInput("");
            } catch (err) {
                const msg = err instanceof Error ? err.message : "Failed to add cover from URL";
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
                const result = await assetService.uploadAsset(itemId, "COVER", filePath);
                onCoverChange(result);
            } catch (err) {
                const msg = err instanceof Error ? err.message : "Failed to upload cover";
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
                        extensions: ["jpg", "jpeg", "png", "webp", "gif", "bmp"],
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
            const msg = err instanceof Error ? err.message : "Failed to remove cover";
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

        const showImage = coverUrl && !imageFailed;

        return (
            <div className="space-y-2.5 animate-fade-in-up">
                <div
                    className="group relative w-full overflow-hidden rounded-xl border border-border/50 bg-muted/30 shadow-sm transition-all duration-300 max-h-[550px]"
                    style={
                        naturalSize
                            ? { aspectRatio: `${naturalSize.w} / ${naturalSize.h}` }
                            : { minHeight: "200px", aspectRatio: "16 / 9" }
                    }
                >
                    {showImage ? (
                        <>
                            {/* Ambient backdrop — fills any remaining space if max-h is reached */}
                            <img
                                src={coverUrl}
                                aria-hidden
                                className="absolute inset-0 h-full w-full scale-110 object-cover opacity-60 blur-2xl saturate-150"
                            />
                            <div className="absolute inset-0 bg-background/10" />

                            {!imageLoaded && (
                                <div className="absolute inset-0 bg-muted/30 animate-shimmer" />
                            )}

                            {/* Foreground — full image with its true natural aspect ratio */}
                            <img
                                src={coverUrl}
                                alt="Cover"
                                className={cn(
                                    "relative h-full w-full object-contain drop-shadow-lg transition-all duration-500 ease-out group-hover:scale-[1.015]",
                                    imageLoaded ? "opacity-100" : "opacity-0",
                                )}
                                draggable={false}
                                onLoad={(e) => {
                                    setNaturalSize({
                                        w: e.currentTarget.naturalWidth,
                                        h: e.currentTarget.naturalHeight,
                                    });
                                    setImageLoaded(true);
                                }}
                                onError={() => setImageFailed(true)}
                            />
                        </>
                    ) : (
                        <div className="flex h-full min-h-[200px] w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-muted/40 to-muted/10 text-muted-foreground/40">
                            {imageFailed ? (
                                <>
                                    <ImageOff className="size-8" />
                                    <span className="text-[11px] font-medium">
                                        Couldn't load this image
                                    </span>
                                </>
                            ) : (
                                <ImagePlus className="size-10" />
                            )}
                        </div>
                    )}

                    {/* Badges — top left */}
                    <div className="absolute left-3 top-3 flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-black/45 px-2.5 py-1 text-[10px] font-semibold text-white/90 backdrop-blur-md shadow-sm">
                            {cover.source_type === "REMOTE" ? (
                                <>
                                    <Globe className="size-3" />
                                    Remote
                                </>
                            ) : (
                                <>
                                    <HardDrive className="size-3" />
                                    Local
                                </>
                            )}
                        </span>
                        {naturalSize && (
                            <span className="inline-flex items-center rounded-full bg-black/45 px-2.5 py-1 text-[10px] font-medium tracking-wide text-white/80 backdrop-blur-md shadow-sm">
                                {describeDimensions(naturalSize.w, naturalSize.h)}
                            </span>
                        )}
                    </div>

                    {/* Overlay actions — visible on hover */}
                    <div className="absolute inset-0 flex items-center justify-center gap-3 bg-black/0 opacity-0 transition-all duration-300 group-hover:bg-black/40 group-hover:opacity-100 group-hover:backdrop-blur-[2px]">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="gap-1.5 rounded-lg border border-white/10 bg-white/15 text-white shadow-xl backdrop-blur-md transition-all duration-200 hover:scale-105 hover:bg-white/25 hover:text-white active:scale-95"
                                    onClick={handleRemoveCover}
                                    disabled={isUploading}
                                >
                                    <RefreshCw className="size-3.5" />
                                    Change
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Replace cover image</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    className="gap-1.5 rounded-lg shadow-xl transition-all duration-200 hover:scale-105 active:scale-95"
                                    onClick={handleRemoveCover}
                                    disabled={isUploading}
                                >
                                    <X className="size-3.5" />
                                    Remove
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Remove cover image</TooltipContent>
                        </Tooltip>
                    </div>

                    {/* Error toast — bottom overlay */}
                    {error && (
                        <div className="animate-fade-in-up absolute bottom-3 left-3 right-3 flex items-center gap-2 rounded-lg bg-destructive/90 px-3.5 py-2 text-xs font-medium text-white shadow-lg backdrop-blur-sm">
                            <AlertCircle className="size-3.5 shrink-0" />
                            <span className="flex-1">{error}</span>
                            <button
                                type="button"
                                onClick={() => setError(null)}
                                aria-label="Dismiss error"
                                className="shrink-0 rounded-full p-0.5 transition-colors hover:bg-white/20"
                            >
                                <X className="size-3" />
                            </button>
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
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">
                    Cover Image
                </span>

                {/* Method toggle — sliding segmented control */}
                <div
                    role="tablist"
                    aria-label="Cover upload method"
                    className="relative flex w-[152px] rounded-lg bg-muted/30 p-1 ring-1 ring-inset ring-border/50"
                >
                    <div
                        aria-hidden
                        className="absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-md bg-background shadow-sm transition-transform duration-200 ease-out"
                        style={{ transform: showUrlInput ? "translateX(0%)" : "translateX(100%)" }}
                    />
                    <button
                        type="button"
                        role="tab"
                        aria-selected={showUrlInput}
                        className={cn(
                            "relative z-10 flex flex-1 items-center justify-center gap-1.5 rounded-md py-1 text-[11px] font-medium transition-colors duration-200",
                            showUrlInput ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                        )}
                        onClick={() => setShowUrlInput(true)}
                    >
                        <Link2 className="size-3" />
                        URL
                    </button>
                    <button
                        type="button"
                        role="tab"
                        aria-selected={!showUrlInput}
                        className={cn(
                            "relative z-10 flex flex-1 items-center justify-center gap-1.5 rounded-md py-1 text-[11px] font-medium transition-colors duration-200",
                            !showUrlInput ? "text-foreground" : "text-muted-foreground hover:text-foreground",
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
                            <Globe className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/50" />
                            <Input
                                ref={urlInputRef}
                                type="url"
                                value={urlInput}
                                onChange={(e) => {
                                    setUrlInput(e.target.value);
                                    setError(null);
                                }}
                                placeholder="https://example.com/image.jpg"
                                className="pl-9 text-sm transition-shadow duration-200 focus-visible:shadow-sm focus-visible:shadow-primary/10"
                                disabled={isUploading}
                                autoFocus
                            />
                        </div>
                        <Button
                            type="submit"
                            size="sm"
                            disabled={!urlInput.trim() || isUploading}
                            className="shrink-0 gap-1.5 rounded-lg"
                        >
                            {isUploading ? (
                                <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                                <Link2 className="size-3.5" />
                            )}
                            {isUploading ? "Adding..." : "Add"}
                        </Button>
                    </div>

                    {/* Live preview — confirms the image before it's committed,
                        no matter what dimensions it turns out to be. */}
                    {isValidUrl && !error && <UrlPreview key={urlInput} url={urlInput} />}

                    {isValidUrl && !error && (
                        <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground/70">
                            <span className="inline-flex size-4 items-center justify-center rounded border border-border/60 font-mono text-[9px] text-muted-foreground/60">
                                ↵
                            </span>
                            Press Enter or click Add to set as cover
                        </p>
                    )}

                    {error && (
                        <p className="animate-fade-in-up flex items-center gap-1.5 text-xs font-medium text-destructive">
                            <AlertCircle className="size-3.5 shrink-0" />
                            {error}
                        </p>
                    )}
                </form>
            ) : (
                /* ── Local File Upload (Secondary) ───────────────────── */
                <div
                    role="button"
                    tabIndex={0}
                    aria-label="Browse for a cover image file"
                    className={cn(
                        "group relative flex h-40 w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed transition-all duration-300",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                        isDragOver
                            ? "scale-[1.01] border-primary bg-primary/5 shadow-lg shadow-primary/10"
                            : "border-border/50 bg-gradient-to-br from-muted/10 to-transparent hover:border-primary/30 hover:bg-muted/15",
                        isUploading && "pointer-events-none opacity-60",
                    )}
                    onClick={handlePickFile}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handlePickFile();
                        }
                    }}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    {isUploading ? (
                        <div className="flex flex-col items-center gap-2">
                            <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
                                <Loader2 className="size-6 animate-spin text-primary" />
                            </div>
                            <span className="text-xs font-medium text-muted-foreground">
                                Uploading...
                            </span>
                        </div>
                    ) : (
                        <>
                            <div
                                className={cn(
                                    "flex size-12 items-center justify-center rounded-full transition-all duration-300",
                                    isDragOver
                                        ? "scale-110 bg-primary/15 text-primary"
                                        : "bg-muted/30 text-muted-foreground group-hover:scale-105 group-hover:bg-primary/10 group-hover:text-primary",
                                )}
                            >
                                {isDragOver ? (
                                    <ImagePlus className="size-5" />
                                ) : (
                                    <HardDrive className="size-5" />
                                )}
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-medium text-foreground">
                                    {isDragOver ? "Drop to upload" : "Browse local files"}
                                </p>
                                <p className="mt-1 text-[11px] text-muted-foreground/60">
                                    Drag & drop or click to browse · JPG, PNG, WebP, GIF · any resolution
                                </p>
                            </div>
                        </>
                    )}

                    {error && (
                        <p className="animate-fade-in-up absolute bottom-3 flex items-center gap-1.5 text-xs font-medium text-destructive">
                            <AlertCircle className="size-3.5 shrink-0" />
                            {error}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}