/**
 * ViewModeToggle — Toggle between List and Grid view modes.
 *
 * Renders a compact button group showing the active view mode.
 */
import { LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/utils";

export type ViewMode = "list" | "grid";

interface ViewModeToggleProps {
    value: ViewMode;
    onChange: (mode: ViewMode) => void;
}

const modes: { value: ViewMode; icon: typeof List; label: string }[] = [
    { value: "list", icon: List, label: "List view" },
    { value: "grid", icon: LayoutGrid, label: "Grid view" },
];

function ViewModeToggle({ value, onChange }: ViewModeToggleProps) {
    return (
        <div className="flex items-center rounded-lg border border-border bg-muted/40 p-0.5">
            {modes.map(({ value: mode, icon: Icon, label }) => (
                <button
                    key={mode}
                    type="button"
                    onClick={() => onChange(mode)}
                    title={label}
                    aria-label={label}
                    aria-pressed={value === mode}
                    className={cn(
                        "flex size-7 items-center justify-center rounded-md text-muted-foreground transition-all",
                        value === mode
                            ? "bg-background text-foreground shadow-sm"
                            : "hover:text-foreground",
                    )}
                >
                    <Icon className="size-3.5" />
                </button>
            ))}
        </div>
    );
}

export default ViewModeToggle;
export { ViewModeToggle };
