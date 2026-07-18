/**
 * HomePage — Welcome screen shown when no collection is selected.
 */
import { useState } from "react";
import { FolderPlus } from "lucide-react";
import { CreateCollectionDialog } from "@/components/Collection/CreateCollectionDialog";

interface QuickStartOption {
    label: string;
    icon: string;
}

const QUICK_START: QuickStartOption[] = [
    { label: "Films", icon: "🎬" },
    { label: "Books", icon: "📚" },
    { label: "Games", icon: "🎮" },
    { label: "Music", icon: "🎵" },
];

function HomePage() {
    const [createOpen, setCreateOpen] = useState(false);
    const [quickStart, setQuickStart] = useState<QuickStartOption | null>(
        null,
    );

    function openBlank() {
        setQuickStart(null);
        setCreateOpen(true);
    }

    function openQuickStart(option: QuickStartOption) {
        setQuickStart(option);
        setCreateOpen(true);
    }

    return (
        <div className="relative flex h-full flex-col items-center justify-center overflow-hidden text-center">
            {/* Ambient backdrop */}
            <div
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-1/3 size-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl"
            />

            <div className="relative z-10 max-w-md animate-in fade-in slide-in-from-bottom-2 space-y-4 duration-500">
                <img
                    className="mx-auto size-28"
                    src="/logo-2.png"
                    alt="Vaultrs"
                    loading="eager"
                />
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                    Welcome to Vaultrs
                </h1>
                <p className="text-muted-foreground">
                    Your personal metadata vault. Create a collection to start
                    organizing your data — films, games, books, or anything
                    else.
                </p>

                <div className="pt-4">
                    <button
                        onClick={openBlank}
                        className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:opacity-90"
                    >
                        <FolderPlus className="size-4" />
                        New collection
                    </button>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                    <span className="text-xs text-muted-foreground">
                        Quick start:
                    </span>
                    {QUICK_START.map((option) => (
                        <button
                            key={option.label}
                            type="button"
                            onClick={() => openQuickStart(option)}
                            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                        >
                            <span>{option.icon}</span>
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>

            <CreateCollectionDialog
                open={createOpen}
                onOpenChange={setCreateOpen}
                initialName={quickStart?.label}
                initialIcon={quickStart?.icon}
            />
        </div>
    );
}

export default HomePage;
