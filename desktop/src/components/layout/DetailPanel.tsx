// DetailPanel component for viewing/editing entry details

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    X,
    Pencil,
    Trash2,
    Calendar,
    Clock,
    Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useUIStore } from '@/stores/uiStore';
import { useEntryStore, CoverImageDisplay, EditEntryForm } from '@/modules/entry';
import type { Entry } from '@/modules/entry';
import { useFieldStore, CustomFieldsSection } from '@/modules/field';
import type { EntryMetadata } from '@/modules/field';

type PanelMode = 'view' | 'edit';

export function DetailPanel() {
    const {
        selectedEntryId,
        setSelectedEntryId,
        setDetailPanelOpen,
        detailPanelWidth,
    } = useUIStore();

    const { entries, searchResults, searchQuery, deleteEntry } = useEntryStore();
    const { fields } = useFieldStore();

    const [mode, setMode] = useState<PanelMode>('view');
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    // Find the selected entry from current entries or search results
    const entry: Entry | null = useMemo(() => {
        if (!selectedEntryId) return null;
        const allEntries = searchQuery ? searchResults : entries;
        return allEntries.find((e) => e.id === selectedEntryId) ?? null;
    }, [selectedEntryId, entries, searchResults, searchQuery]);

    // Reset mode when entry changes
    useEffect(() => {
        setMode('view');
    }, [selectedEntryId]);

    // Parse metadata
    const metadata: EntryMetadata | null = useMemo(() => {
        if (!entry?.metadata) return null;
        try {
            return JSON.parse(entry.metadata);
        } catch {
            return null;
        }
    }, [entry?.metadata]);

    // Close the panel
    const handleClose = useCallback(() => {
        setDetailPanelOpen(false);
        setSelectedEntryId(null);
    }, [setDetailPanelOpen, setSelectedEntryId]);

    // Delete entry
    const handleDelete = useCallback(async () => {
        if (!entry) return;
        setIsDeleting(true);
        try {
            await deleteEntry(entry.id);
            setShowDeleteDialog(false);
            handleClose();
        } catch (err) {
            console.error('Failed to delete entry:', err);
        } finally {
            setIsDeleting(false);
        }
    }, [entry, deleteEntry, handleClose]);

    // After save, switch back to view mode
    const handleSaveComplete = useCallback(() => {
        setMode('view');
    }, []);

    const handleCancelEdit = useCallback(() => {
        setMode('view');
    }, []);

    // Format timestamps
    const formatDate = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            });
        } catch {
            return dateStr;
        }
    };

    const formatDateTime = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return dateStr;
        }
    };

    // No entry selected
    if (!entry) {
        return (
            <div
                className="flex flex-col h-full bg-card border-l border-border"
                style={{ width: detailPanelWidth }}
            >
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <h3 className="font-semibold text-foreground">Details</h3>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={handleClose}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
                <div className="flex-1 flex items-center justify-center p-8">
                    <p className="text-sm text-muted-foreground text-center">
                        Select an entry to view its details
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div
            className="flex flex-col h-full bg-card border-l border-border"
            style={{ width: detailPanelWidth }}
        >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
                <h3 className="font-semibold text-foreground truncate pr-2">
                    {mode === 'edit' ? 'Edit Entry' : 'Details'}
                </h3>
                <div className="flex items-center gap-1">
                    {mode === 'view' && (
                        <>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => setMode('edit')}
                                title="Edit entry"
                            >
                                <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive"
                                onClick={() => setShowDeleteDialog(true)}
                                title="Delete entry"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                        </>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={handleClose}
                        title="Close panel"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                {mode === 'edit' ? (
                    <div className="px-4">
                        <EditEntryForm
                            entry={entry}
                            fields={fields}
                            onSaveComplete={handleSaveComplete}
                            onCancel={handleCancelEdit}
                        />
                    </div>
                ) : (
                    <div className="p-4 space-y-6">
                        {/* Cover image */}
                        {entry.cover_image_path && (
                            <CoverImageDisplay entry={entry} />
                        )}

                        {/* Title */}
                        <div>
                            <h2 className="text-lg font-semibold text-foreground leading-tight">
                                {entry.title}
                            </h2>
                        </div>

                        {/* Description */}
                        {entry.description && (
                            <div className="space-y-1">
                                <h4 className="text-sm font-medium text-muted-foreground">
                                    Description
                                </h4>
                                <p className="text-sm text-foreground whitespace-pre-wrap">
                                    {entry.description}
                                </p>
                            </div>
                        )}

                        {/* Custom fields */}
                        <CustomFieldsSection
                            fields={fields}
                            metadata={metadata}
                        />

                        {/* Timestamps */}
                        <div className="space-y-2 pt-4 border-t border-border">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                <span>Created {formatDate(entry.created_at)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                <span>Updated {formatDateTime(entry.updated_at)}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Delete confirmation dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Entry</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete &quot;{entry.title}&quot;? This action
                            cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                'Delete'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
