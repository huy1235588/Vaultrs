// Entry grid card component for grid view

import { cn } from '@/lib/utils';
import { CoverImageDisplay } from './CoverImageDisplay';
import type { Entry } from '../types';

interface EntryGridCardProps {
    entry: Entry;
    onClick?: () => void;
    isSelected?: boolean;
}

export function EntryGridCard({ entry, onClick, isSelected }: EntryGridCardProps) {
    return (
        <div
            className={cn(
                'rounded-lg border bg-card overflow-hidden entry-card-hover cursor-pointer',
                isSelected && 'border-primary/50 bg-primary/5'
            )}
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
            {/* Cover Image */}
            <div className="aspect-[4/3] overflow-hidden">
                <CoverImageDisplay entry={entry} />
            </div>

            {/* Content */}
            <div className="p-3">
                <h3 className="font-medium text-sm line-clamp-2 leading-tight">
                    {entry.title}
                </h3>
                {entry.description && (
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                        {entry.description}
                    </p>
                )}
            </div>
        </div>
    );
}
