/**
 * OptionsTagInput — chip/tag editor for select & multiselect field choices.
 * Shared by CreateAttributeDialog and EditAttributeDialog so both keep the
 * same interaction: type a choice, press Enter or comma to add it, paste a
 * comma-separated list, or backspace to pop the last chip.
 */
import type { ClipboardEvent, KeyboardEvent } from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface OptionsTagInputProps {
    id?: string;
    options: string[];
    draft: string;
    onOptionsChange: (options: string[]) => void;
    onDraftChange: (draft: string) => void;
    placeholder?: string;
}

export function OptionsTagInput({
    id,
    options,
    draft,
    onOptionsChange,
    onDraftChange,
    placeholder = "Type an option and press Enter",
}: OptionsTagInputProps) {
    function commit() {
        const value = draft.trim();
        if (!value) return;
        if (!options.includes(value)) onOptionsChange([...options, value]);
        onDraftChange("");
    }

    function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
        if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            commit();
        } else if (e.key === "Backspace" && draft === "" && options.length > 0) {
            onOptionsChange(options.slice(0, -1));
        }
    }

    function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
        const text = e.clipboardData.getData("text");
        if (!text.includes(",")) return; // single value — let default paste happen
        e.preventDefault();
        const parts = text.split(",").map((p) => p.trim()).filter(Boolean);
        const merged = [...options];
        for (const p of parts) if (!merged.includes(p)) merged.push(p);
        onOptionsChange(merged);
    }

    function remove(value: string) {
        onOptionsChange(options.filter((o) => o !== value));
    }

    return (
        <div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-md border border-input bg-transparent px-3 py-2 transition-shadow focus-within:ring-1 focus-within:ring-ring">
            {options.map((opt) => (
                <Badge key={opt} variant="secondary" className="gap-1 rounded-md pr-1 font-normal">
                    {opt}
                    <button
                        type="button"
                        onClick={() => remove(opt)}
                        className="rounded-sm p-0.5 hover:bg-muted-foreground/20"
                        aria-label={`Remove ${opt}`}
                    >
                        <X className="h-3 w-3" />
                    </button>
                </Badge>
            ))}
            <input
                id={id}
                value={draft}
                onChange={(e) => onDraftChange(e.target.value)}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                onBlur={commit}
                placeholder={options.length === 0 ? placeholder : "Add another…"}
                className="min-w-[8ch] flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
        </div>
    );
}
