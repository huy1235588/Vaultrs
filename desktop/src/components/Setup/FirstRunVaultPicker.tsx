/**
 * FirstRunVaultPicker — Onboarding screen shown when no vault is configured.
 *
 * Prompts user to select or create a vault directory anywhere on their computer,
 * displays non-destructive recovery banners for disconnected drives, and provides
 * quick-selection from recent vaults.
 */
import { useEffect, useState } from "react";
import {
    Folder,
    HardDrive,
    ShieldCheck,
    Sparkles,
    Loader2,
    ArrowRight,
    AlertTriangle,
    CheckCircle2,
    Clock,
    Trash2,
    RotateCw,
    Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppConfig } from "@/core/context/AppConfigContext";
import type { VaultDirectoryStatus } from "@/core/api/appSettingsService";

export function FirstRunVaultPicker() {
    const {
        selectVault,
        chooseFolder,
        recentVaults,
        unreachableVaultPath,
        validateFolder,
        removeRecentVault,
    } = useAppConfig();

    const [path, setPath] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [retrying, setRetrying] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);
    const [validationStatus, setValidationStatus] = useState<VaultDirectoryStatus | null>(null);

    // Validate path whenever user changes it or browses
    useEffect(() => {
        let active = true;
        if (!path.trim()) {
            setValidationStatus(null);
            return;
        }

        const timer = setTimeout(async () => {
            try {
                const status = await validateFolder(path.trim());
                if (active) {
                    setValidationStatus(status);
                }
            } catch {
                if (active) setValidationStatus(null);
            }
        }, 300);

        return () => {
            active = false;
            clearTimeout(timer);
        };
    }, [path, validateFolder]);

    const handleBrowse = async () => {
        try {
            const selected = await chooseFolder();
            if (selected) {
                setPath(selected);
                setLocalError(null);
            }
        } catch (err) {
            setLocalError(err instanceof Error ? err.message : String(err));
        }
    };

    const handleInitialize = async (targetPath?: string) => {
        const dest = (targetPath ?? path).trim();
        if (!dest) {
            setLocalError("Please select or enter a vault folder path.");
            return;
        }

        try {
            setSubmitting(true);
            setLocalError(null);
            await selectVault(dest);
        } catch (err) {
            setLocalError(err instanceof Error ? err.message : String(err));
        } finally {
            setSubmitting(false);
        }
    };

    const handleRetryUnreachable = async () => {
        if (!unreachableVaultPath) return;
        try {
            setRetrying(true);
            setLocalError(null);
            await selectVault(unreachableVaultPath);
        } catch (err) {
            setLocalError(`Retry failed: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
            setRetrying(false);
        }
    };

    const renderValidationBadge = () => {
        if (!validationStatus || !path.trim()) return null;

        switch (validationStatus) {
            case "ValidVault":
                return (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                        <CheckCircle2 className="size-3.5" />
                        <span>Existing Vaultrs database found ({path}/vaultrs.db)</span>
                    </div>
                );
            case "EmptyDirectory":
                return (
                    <div className="flex items-center gap-1.5 text-xs text-sky-400 font-medium">
                        <Info className="size-3.5" />
                        <span>Empty directory. A fresh vault will be initialized here.</span>
                    </div>
                );
            case "NonEmptyDirectory":
                return (
                    <div className="flex items-center gap-1.5 text-xs text-amber-400 font-medium">
                        <AlertTriangle className="size-3.5" />
                        <span>Directory has existing files, but no vaultrs.db. A new database will be created.</span>
                    </div>
                );
            case "DirectoryNotFound":
                return (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Folder className="size-3.5" />
                        <span>Directory does not exist yet; will be created automatically.</span>
                    </div>
                );
            case "PathIsAFile":
                return (
                    <div className="flex items-center gap-1.5 text-xs text-destructive font-medium">
                        <AlertTriangle className="size-3.5" />
                        <span>The specified path is a file, not a directory.</span>
                    </div>
                );
        }
    };

    return (
        <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-background px-4 py-12">
            {/* Background aesthetic glow */}
            <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-[36rem] -translate-x-1/2 rounded-full bg-primary/10 blur-[128px]" />
            <div className="pointer-events-none absolute -bottom-40 right-1/4 h-80 w-80 rounded-full bg-primary/5 blur-[96px]" />

            <div className="relative z-10 w-full max-w-xl rounded-2xl border border-border/80 bg-card/90 p-8 shadow-2xl backdrop-blur-xl md:p-10">
                {/* Header branding */}
                <div className="mb-6 text-center">
                    <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary/20 via-primary/10 to-transparent ring-1 ring-primary/30">
                        <HardDrive className="size-7 text-primary" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                        Welcome to Vaultrs
                    </h1>
                    <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                        Your private, offline knowledge base for organizing personal metadata at scale.
                    </p>
                </div>

                {/* Disconnected Vault Alert Banner */}
                {unreachableVaultPath && (
                    <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-200">
                        <div className="flex items-start gap-2.5">
                            <AlertTriangle className="size-5 shrink-0 text-amber-400 mt-0.5" />
                            <div className="flex-1 space-y-1.5">
                                <span className="font-semibold text-amber-300">
                                    Configured Vault Directory Offline
                                </span>
                                <p className="text-amber-200/90 leading-relaxed">
                                    Your previously configured vault is currently inaccessible:
                                </p>
                                <code className="block rounded bg-black/40 px-2 py-1 font-mono text-[11px] text-amber-100 break-all">
                                    {unreachableVaultPath}
                                </code>
                                <p className="text-amber-200/80 leading-relaxed pt-0.5">
                                    If this vault resides on an external drive, please connect it and retry, or select another vault folder below.
                                </p>
                                <div className="pt-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleRetryUnreachable}
                                        disabled={retrying}
                                        className="border-amber-500/40 text-amber-300 hover:bg-amber-500/20 gap-1.5 text-xs h-7"
                                    >
                                        <RotateCw className={`size-3.5 ${retrying ? "animate-spin" : ""}`} />
                                        Retry Connection
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Architecture Highlights */}
                <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-muted/40 p-3.5 text-xs text-muted-foreground">
                        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
                        <div>
                            <span className="font-semibold text-foreground">Self-Contained</span>
                            <p className="mt-0.5">Database and media files live side-by-side in one folder.</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-muted/40 p-3.5 text-xs text-muted-foreground">
                        <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
                        <div>
                            <span className="font-semibold text-foreground">100% Portable</span>
                            <p className="mt-0.5">Move or back up your vault anytime with zero broken paths.</p>
                        </div>
                    </div>
                </div>

                {/* Recent Vaults List */}
                {recentVaults && recentVaults.length > 0 && (
                    <div className="mb-6 space-y-2">
                        <span className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                            <Clock className="size-3.5 text-muted-foreground" />
                            Recent Vaults
                        </span>
                        <div className="space-y-1.5 rounded-xl border border-border/60 bg-background/50 p-2">
                            {recentVaults.map((entry) => (
                                <div
                                    key={entry.path}
                                    className="flex items-center justify-between gap-2 rounded-lg p-2 hover:bg-muted/50 transition-colors"
                                >
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-xs text-foreground truncate">
                                                {entry.display_name}
                                            </span>
                                            {entry.is_reachable ? (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-1.5 py-0.2 text-[10px] text-emerald-400">
                                                    Available
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-1.5 py-0.2 text-[10px] text-amber-400">
                                                    Offline
                                                </span>
                                            )}
                                        </div>
                                        <span className="block font-mono text-[11px] text-muted-foreground truncate">
                                            {entry.path}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="secondary"
                                            onClick={() => handleInitialize(entry.path)}
                                            disabled={submitting || !entry.is_reachable}
                                            className="text-xs h-7 px-2.5"
                                        >
                                            Open
                                        </Button>
                                        <Button
                                            type="button"
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => removeRecentVault(entry.path)}
                                            disabled={submitting}
                                            className="size-7 text-muted-foreground hover:text-destructive"
                                            title="Remove from recents"
                                        >
                                            <Trash2 className="size-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Folder Selection Form */}
                <div className="space-y-3">
                    <label className="block text-sm font-medium text-foreground">
                        {recentVaults?.length ? "Or Choose Another Directory" : "Vault Root Directory"}
                    </label>

                    <div className="flex items-center gap-2">
                        <Input
                            value={path}
                            onChange={(e) => setPath(e.target.value)}
                            placeholder="e.g. D:\Vaults\PersonalVault"
                            className="font-mono text-xs"
                            disabled={submitting}
                        />
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={handleBrowse}
                            disabled={submitting}
                            className="shrink-0 gap-2"
                        >
                            <Folder className="size-4" />
                            Browse...
                        </Button>
                    </div>

                    {renderValidationBadge()}

                    {localError && (
                        <p className="text-xs font-medium text-destructive">
                            {localError}
                        </p>
                    )}

                    <Button
                        type="button"
                        onClick={() => handleInitialize()}
                        disabled={submitting || !path.trim() || validationStatus === "PathIsAFile"}
                        className="mt-4 w-full gap-2 text-sm font-semibold shadow-lg shadow-primary/20"
                        size="lg"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="size-4 animate-spin" />
                                Initializing Vault...
                            </>
                        ) : (
                            <>
                                Create / Open Vault
                                <ArrowRight className="size-4" />
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
