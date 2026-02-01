// RelationFieldDisplay - Display component for relation fields

import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, ExternalLink, FileText } from 'lucide-react';
import { relationApi } from '../api';
import type { RelationValue, ResolvedRelation } from '../types';

interface RelationFieldDisplayProps {
    value: RelationValue;
    resolvedData?: ResolvedRelation;
    onNavigate?: (entryId: number, vaultId: number) => void;
    compact?: boolean;
}

export function RelationFieldDisplay({
    value,
    resolvedData: initialResolvedData,
    onNavigate,
    compact = false,
}: RelationFieldDisplayProps) {
    const [resolvedData, setResolvedData] = useState<ResolvedRelation | null>(
        initialResolvedData || null
    );
    const [isLoading, setIsLoading] = useState(!initialResolvedData);

    // Fetch resolved data if not provided
    useEffect(() => {
        if (!initialResolvedData && value) {
            setIsLoading(true);
            relationApi
                .resolveRelations([{ entry_id: value.entry_id, vault_id: value.vault_id }])
                .then((resolved) => {
                    const key = relationApi.createRelationKey(value.entry_id, value.vault_id);
                    setResolvedData(resolved[key] || null);
                })
                .catch((err) => {
                    console.error('Failed to resolve relation:', err);
                    setResolvedData(null);
                })
                .finally(() => setIsLoading(false));
        }
    }, [value, initialResolvedData]);

    // Update if external resolved data changes
    useEffect(() => {
        if (initialResolvedData) {
            setResolvedData(initialResolvedData);
            setIsLoading(false);
        }
    }, [initialResolvedData]);

    const handleClick = () => {
        if (onNavigate && resolvedData?.exists) {
            onNavigate(value.entry_id, value.vault_id);
        }
    };

    // Loading state
    if (isLoading) {
        return compact ? (
            <Skeleton className="h-5 w-24" />
        ) : (
            <Skeleton className="h-12 w-48" />
        );
    }

    // No data resolved
    if (!resolvedData) {
        return (
            <div className="flex items-center gap-2 text-muted-foreground">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">Failed to load</span>
            </div>
        );
    }

    // Entry was deleted
    if (!resolvedData.exists) {
        return (
            <div className="flex items-center gap-2 text-muted-foreground">
                <AlertCircle className="h-4 w-4" />
                <span className={`${compact ? 'text-sm' : ''} line-through`}>
                    [Deleted Entry]
                </span>
            </div>
        );
    }

    // Compact display (for lists/tables)
    if (compact) {
        return (
            <button
                onClick={handleClick}
                className="flex items-center gap-2 text-sm hover:text-primary transition-colors text-left max-w-full"
                disabled={!onNavigate}
            >
                <span className="truncate">{resolvedData.title}</span>
                {onNavigate && <ExternalLink className="h-3 w-3 shrink-0" />}
            </button>
        );
    }

    // Full display (for detail views)
    return (
        <button
            onClick={handleClick}
            disabled={!onNavigate}
            className="flex items-center gap-3 p-2 rounded-md hover:bg-accent transition-colors text-left w-full group"
        >
            {resolvedData.coverImagePath ? (
                <img
                    src={resolvedData.coverImagePath}
                    alt=""
                    className="w-12 h-12 rounded object-cover"
                />
            ) : (
                <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                    <FileText className="h-6 w-6 text-muted-foreground" />
                </div>
            )}
            <div className="flex-1 min-w-0">
                <div className="font-medium truncate group-hover:text-primary transition-colors">
                    {resolvedData.title}
                </div>
                {resolvedData.vaultName && (
                    <div className="text-sm text-muted-foreground">
                        {resolvedData.vaultName}
                    </div>
                )}
            </div>
            {onNavigate && (
                <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
            )}
        </button>
    );
}
