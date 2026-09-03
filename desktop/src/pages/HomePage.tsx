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
            {/* Ambient backdrop — multiple animated orbs */}
            <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute left-1/2 top-1/3 size-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/8 blur-[100px] animate-glow-pulse" />
                <div className="absolute left-1/4 top-2/3 size-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-[80px] animate-glow-pulse" style={{ animationDelay: "1s" }} />
                <div className="absolute right-1/4 top-1/4 size-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-500/5 blur-[60px] animate-glow-pulse" style={{ animationDelay: "2s" }} />
            </div>

            <div className="relative z-10 max-w-md space-y-5">
                {/* Floating logo */}
                <img
                    className="mx-auto size-28 animate-float drop-shadow-lg"
                    src="/logo-2.png"
                    alt="Vaultrs"
                    loading="eager"
                />

                {/* Title with fade-in */}
                <div className="animate-fade-in-up">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">
                        Welcome to <span className="bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent">Vaultrs</span>
                    </h1>
                    <p className="mt-2 text-muted-foreground leading-relaxed">
                        Your personal metadata vault. Create a collection to start
                        organizing your data — films, games, books, or anything
                        else.
                    </p>
                </div>

                {/* CTA Button with glow */}
                <div className="animate-fade-in-up pt-2" style={{ animationDelay: "150ms" }}>
                    <button
                        onClick={openBlank}
                        className="group relative inline-flex items-center gap-2 rounded-xl bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-300 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 active:scale-[0.98]"
                    >
                        {/* Shine overlay */}
                        <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl">
                            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                        </span>
                        <FolderPlus className="size-4" />
                        New collection
                    </button>
                </div>

                {/* Quick start chips — staggered */}
                <div className="animate-fade-in-up flex flex-wrap items-center justify-center gap-2 pt-2" style={{ animationDelay: "300ms" }}>
                    <span className="text-xs text-muted-foreground/60 font-medium">
                        Quick start:
                    </span>
                    <div className="flex gap-2 stagger-children">
                        {QUICK_START.map((option) => (
                            <button
                                key={option.label}
                                type="button"
                                onClick={() => openQuickStart(option)}
                                className="animate-fade-in-up inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-background/60 px-3.5 py-1.5 text-xs font-medium text-foreground backdrop-blur-sm transition-all duration-200 hover:bg-primary/10 hover:border-primary/30 hover:text-primary hover:scale-105 active:scale-95"
                            >
                                <span>{option.icon}</span>
                                {option.label}
                            </button>
                        ))}
                    </div>
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
