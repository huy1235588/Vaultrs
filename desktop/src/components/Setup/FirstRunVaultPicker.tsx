/**
 * FirstRunVaultPicker — Onboarding screen shown when no vault is configured.
 *
 * Prompts user to select or create a vault directory anywhere on their computer.
 */
import { useState } from "react";
import { Folder, HardDrive, ShieldCheck, Sparkles, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppConfig } from "@/core/context/AppConfigContext";

export function FirstRunVaultPicker() {
    const { selectVault, chooseFolder } = useAppConfig();
    const [path, setPath] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);

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

    const handleInitialize = async () => {
        if (!path.trim()) {
            setLocalError("Please select or enter a vault folder path.");
            return;
        }

        try {
            setSubmitting(true);
            setLocalError(null);
            await selectVault(path.trim());
        } catch (err) {
            setLocalError(err instanceof Error ? err.message : String(err));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-background px-4 py-12">
            {/* Background aesthetic glow */}
            <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-[36rem] -translate-x-1/2 rounded-full bg-primary/10 blur-[128px]" />
            <div className="pointer-events-none absolute -bottom-40 right-1/4 h-80 w-80 rounded-full bg-primary/5 blur-[96px]" />

            <div className="relative z-10 w-full max-w-xl rounded-2xl border border-border/80 bg-card/90 p-8 shadow-2xl backdrop-blur-xl md:p-10">
                {/* Header branding */}
                <div className="mb-8 text-center">
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

                {/* Architecture Highlights */}
                <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
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

                {/* Folder Selection Form */}
                <div className="space-y-4">
                    <label className="block text-sm font-medium text-foreground">
                        Vault Root Directory
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

                    {localError && (
                        <p className="text-xs font-medium text-destructive">
                            {localError}
                        </p>
                    )}

                    <Button
                        type="button"
                        onClick={handleInitialize}
                        disabled={submitting || !path.trim()}
                        className="mt-6 w-full gap-2 text-sm font-semibold shadow-lg shadow-primary/20"
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
