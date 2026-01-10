// Entry row component

import { Trash2 } from 'lucide-react';
import type { Entry } from '../../types';
import { HighlightText } from './HighlightText';
import { CoverImageDisplay } from './CoverImageDisplay';

interface EntryRowProps {
    entry: Entry;
    onClick?: () => void;
    onDelete?: () => void;
    searchQuery?: string;
}

export function EntryRow({ entry, onClick, onDelete, searchQuery = '' }: EntryRowProps) {
    const createdDate = new Date(entry.created_at).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });

    return (
        <div
            className="group flex items-center gap-3 p-3 rounded-lg bg-card border border-border hover:border-accent transition-colors h-full cursor-pointer"
            onClick={onClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onClick?.();
                }
            }}
        >
            {/* Cover Image Thumbnail */}
            <div className="flex-shrink-0">
                <CoverImageDisplay entry={entry} thumbnail={true} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm truncate">
                    {searchQuery ? (
                        <HighlightText text={entry.title} highlight={searchQuery} />
                    ) : (
                        entry.title
                    )}
                </h3>
                {entry.description ? (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {searchQuery ? (
                            <HighlightText text={entry.description} highlight={searchQuery} />
                        ) : (
                            entry.description
                        )}
                    </p>
                ) : (
                    <p className="text-xs text-muted-foreground/50 italic mt-0.5">
                        No description
                    </p>
                )}
            </div>

            {/* Date */}
            <div className="flex-shrink-0 text-xs text-muted-foreground hidden sm:block">
                {createdDate}
            </div>

            {/* Actions */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete?.();
                }}
                className="flex-shrink-0 p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-destructive/10 text-destructive transition-opacity"
                title="Delete entry"
            >
                <Trash2 className="h-4 w-4" />
            </button>
        </div>
    );
}
