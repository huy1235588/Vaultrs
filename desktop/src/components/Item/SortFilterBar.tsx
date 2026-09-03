/**
 * SortFilterBar — Toolbar with sort dropdown and title filter input.
 *
 * Provides controls for sorting items (by title, created, updated)
 * and filtering by title with debounced input.
 */
import { useMemo } from "react";
import {
    ArrowDownAZ,
    ArrowUpAZ,
    Calendar,
    CalendarClock,
    Check,
    Filter,
    Search,
    SortAsc,
    X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { SortField, SortOrder } from "@/core/types/common";

// --- Sort option definitions ---

interface SortOption {
    label: string;
    field: SortField;
    order: SortOrder;
    icon: React.ReactNode;
}

const SORT_OPTIONS: SortOption[] = [
    {
        label: "Title (A → Z)",
        field: "title",
        order: "ASC",
        icon: <ArrowDownAZ className="size-4" />,
    },
    {
        label: "Title (Z → A)",
        field: "title",
        order: "DESC",
        icon: <ArrowUpAZ className="size-4" />,
    },
    {
        label: "Newest first",
        field: "created_at",
        order: "DESC",
        icon: <Calendar className="size-4" />,
    },
    {
        label: "Oldest first",
        field: "created_at",
        order: "ASC",
        icon: <Calendar className="size-4" />,
    },
    {
        label: "Recently updated",
        field: "updated_at",
        order: "DESC",
        icon: <CalendarClock className="size-4" />,
    },
];

// --- Component props ---

interface SortFilterBarProps {
    sortField: SortField;
    sortOrder: SortOrder;
    filterTitle: string;
    /** Total filtered count (for badge display). */
    filteredTotal?: number;
    /** Total unfiltered count. */
    unfilteredTotal?: number;
    onSortChange: (field: SortField, order: SortOrder) => void;
    onFilterChange: (value: string) => void;
}

function SortFilterBar({
    sortField,
    sortOrder,
    filterTitle,
    filteredTotal,
    onSortChange,
    onFilterChange,
}: SortFilterBarProps) {
    // Find current sort option for label display
    const activeSort = useMemo(
        () =>
            SORT_OPTIONS.find(
                (o) => o.field === sortField && o.order === sortOrder,
            ) ?? SORT_OPTIONS[2], // Default: "Newest first"
        [sortField, sortOrder],
    );

    const hasFilter = filterTitle.trim().length > 0;

    return (
        <div className="flex items-center gap-2">
            {/* Sort Dropdown */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-xs"
                    >
                        <SortAsc className="size-3.5" />
                        <span className="hidden sm:inline">
                            {activeSort.label}
                        </span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                    {SORT_OPTIONS.map((option, index) => (
                        <DropdownMenuItem
                            key={`${option.field}-${option.order}`}
                            onClick={() =>
                                onSortChange(option.field, option.order)
                            }
                            className={cn(
                                "gap-2 text-xs",
                                option.field === sortField &&
                                    option.order === sortOrder &&
                                    "bg-accent",
                            )}
                        >
                            {option.icon}
                            <span className="flex-1">{option.label}</span>
                            {option.field === sortField &&
                                option.order === sortOrder && (
                                    <Check className="size-3.5 text-primary" />
                                )}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Filter Input */}
            <div className="relative max-w-64 flex-1">
                <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                    type="text"
                    placeholder="Filter by title..."
                    value={filterTitle}
                    onChange={(e) => onFilterChange(e.target.value)}
                    className="h-8 pl-8 pr-8 text-xs transition-all duration-200 focus-visible:ring-primary/20 focus-visible:shadow-sm focus-visible:shadow-primary/10"
                />
                {hasFilter && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute right-0.5 top-1/2 size-7 -translate-y-1/2"
                                onClick={() => onFilterChange("")}
                            >
                                <X className="size-3.5" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Clear filter</TooltipContent>
                    </Tooltip>
                )}
            </div>

            {/* Filter badge */}
            {hasFilter && filteredTotal !== undefined && (
                <Badge
                    variant="secondary"
                    className="animate-scale-in gap-1 text-[10px] font-medium"
                >
                    <Filter className="size-3" />
                    {filteredTotal.toLocaleString()} results
                </Badge>
            )}
        </div>
    );
}

export { SortFilterBar };
export default SortFilterBar;
