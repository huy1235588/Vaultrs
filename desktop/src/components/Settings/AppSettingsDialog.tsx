/**
 * AppSettingsDialog — Global application settings modal.
 *
 * Allows viewing vault paths, switching vault directories, and managing recent vaults.
 */
import { useState } from "react";
import {
    Folder,
    HardDrive,
    ExternalLink,
    CheckCircle2,
    Loader2,
    Database,
    ImageIcon,
    Clock,
    Trash2,
    ArrowRightLeft,
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAppConfig } from "@/core/context/AppConfigContext";

export function AppSettingsDialog() {
    const {
        settingsOpen,
        setSettingsOpen,
        vaultRootPath,
        dbPath,
        storageDir,
        recentVaults,
        chooseFolder,
        selectVault,
        removeRecentVault,
        revealInExplorer,
    } = useAppConfig();

    const [switching, setSwitching] = useState(false);
    const [switchError, setSwitchError] = useState<string | null>(null);

    const handleSwitchDirectory = async (targetPath?: string) => {
        try {
            const chosen = targetPath ?? (await chooseFolder());
            if (!chosen || chosen === vaultRootPath) return;

            setSwitching(true);
            setSwitchError(null);

            await selectVault(chosen);
        } catch (err) {
            setSwitchError(err instanceof Error ? err.message : String(err));
        } finally {
            setSwitching(false);
        }
    };

    return (
        <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
            <DialogContent className="max-w-md md:max-w-lg">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <HardDrive className="size-4" />
                        </div>
                        <div>
                            <DialogTitle className="text-base font-semibold">
                                Global App Settings
                            </DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground">
                                Machine preferences and active vault directory management.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {/* Active Vault Location Card */}
                    <div className="rounded-xl border border-border/80 bg-muted/40 p-4">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                                Active Vault Directory
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-500">
                                <CheckCircle2 className="size-3" />
                                Co-located
                            </span>
                        </div>

                        <p className="mt-2 break-all font-mono text-xs text-foreground/90 bg-background/60 p-2.5 rounded-lg border border-border/40">
                            {vaultRootPath || "No vault configured"}
                        </p>

                        <div className="mt-3 flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSwitchDirectory()}
                                disabled={switching}
                                className="gap-1.5 text-xs"
                            >
                                {switching ? (
                                    <Loader2 className="size-3.5 animate-spin" />
                                ) : (
                                    <Folder className="size-3.5" />
                                )}
                                Change Directory...
                            </Button>

                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={revealInExplorer}
                                disabled={!vaultRootPath || switching}
                                className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                            >
                                <ExternalLink className="size-3.5" />
                                Reveal in Explorer
                            </Button>
                        </div>

                        {switchError && (
                            <p className="mt-2 text-xs text-destructive">
                                {switchError}
                            </p>
                        )}
                    </div>

                    {/* Recent Vaults History */}
                    {recentVaults && recentVaults.length > 0 && (
                        <div className="space-y-2">
                            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                <Clock className="size-3.5" />
                                Recent Vaults
                            </span>
                            <div className="space-y-1.5 rounded-lg border border-border/50 bg-card p-2 text-xs">
                                {recentVaults.map((entry) => {
                                    const isActive = entry.path === vaultRootPath;
                                    return (
                                        <div
                                            key={entry.path}
                                            className="flex items-center justify-between gap-2 rounded-md p-1.5 hover:bg-muted/40 transition-colors"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="font-medium text-xs text-foreground truncate">
                                                        {entry.display_name}
                                                    </span>
                                                    {isActive ? (
                                                        <span className="inline-flex items-center rounded bg-primary/15 px-1.5 py-0.2 text-[10px] font-medium text-primary">
                                                            Current
                                                        </span>
                                                    ) : entry.is_reachable ? (
                                                        <span className="inline-flex items-center rounded bg-emerald-500/10 px-1.5 py-0.2 text-[10px] text-emerald-400">
                                                            Available
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center rounded bg-amber-500/10 px-1.5 py-0.2 text-[10px] text-amber-400">
                                                            Offline
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="block font-mono text-[11px] text-muted-foreground truncate">
                                                    {entry.path}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-1">
                                                {!isActive && (
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleSwitchDirectory(entry.path)}
                                                        disabled={switching || !entry.is_reachable}
                                                        className="h-6 px-2 text-[11px] gap-1 text-primary hover:text-primary hover:bg-primary/10"
                                                    >
                                                        <ArrowRightLeft className="size-3" />
                                                        Switch
                                                    </Button>
                                                )}
                                                <Button
                                                    type="button"
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() => removeRecentVault(entry.path)}
                                                    disabled={switching}
                                                    className="size-6 text-muted-foreground hover:text-destructive"
                                                    title="Remove from recents"
                                                >
                                                    <Trash2 className="size-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Co-located Storage Paths */}
                    <div className="space-y-2">
                        <span className="text-xs font-medium text-muted-foreground">
                            Storage Paths
                        </span>
                        <div className="space-y-1.5 rounded-lg border border-border/50 bg-card p-3 text-xs">
                            <div className="flex items-start gap-2">
                                <Database className="mt-0.5 size-3.5 shrink-0 text-primary" />
                                <div className="min-w-0 flex-1">
                                    <span className="text-muted-foreground">Database: </span>
                                    <span className="break-all font-mono text-[11px] text-foreground">
                                        {dbPath || "vaultrs.db"}
                                    </span>
                                </div>
                            </div>
                            <Separator className="my-1.5" />
                            <div className="flex items-start gap-2">
                                <ImageIcon className="mt-0.5 size-3.5 shrink-0 text-primary" />
                                <div className="min-w-0 flex-1">
                                    <span className="text-muted-foreground">Media Assets: </span>
                                    <span className="break-all font-mono text-[11px] text-foreground">
                                        {storageDir || "vault-storage"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
