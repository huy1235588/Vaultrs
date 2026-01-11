// Entry Detail Dialog - Full view for entry with custom fields

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, X, Calendar, Clock } from 'lucide-react';
import type { Entry } from '../types';
import { useEntryStore } from '../store';
import { useFieldStore } from '@/modules/field';
import { EditEntryForm } from './EditEntryForm';
import { CustomFieldsSection } from '@/modules/field/components/CustomFieldsSection';
import { CoverImageDisplay } from './';

interface EntryDetailDialogProps {
    entry: Entry | null;
    isOpen: boolean;
    onClose: () => void;
    vaultId: number;
}

export function EntryDetailDialog({
    entry,
    isOpen,
    onClose,
    vaultId,
}: EntryDetailDialogProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const { deleteEntry } = useEntryStore();
    const { fields, fetchFields } = useFieldStore();

    // Fetch field definitions when dialog opens
    useEffect(() => {
        if (isOpen && vaultId) {
            fetchFields(vaultId).catch(console.error);
        }
    }, [isOpen, vaultId, fetchFields]);

    // Reset edit mode when entry changes
    useEffect(() => {
        setIsEditing(false);
    }, [entry?.id]);

    if (!entry) return null;

    const createdDate = new Date(entry.created_at);
    const updatedDate = new Date(entry.updated_at);

    const handleDelete = async () => {
        try {
            await deleteEntry(entry.id);
            setShowDeleteConfirm(false);
            onClose();
        } catch (err) {
            console.error('Failed to delete entry:', err);
        }
    };

    const handleSaveComplete = () => {
        setIsEditing(false);
    };

    // Parse metadata JSON
    const metadata = entry.metadata
        ? (() => {
            try {
                return JSON.parse(entry.metadata);
            } catch {
                return null;
            }
        })()
        : null;

    return (
        <>
            <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader className="space-y-4">
                        <div className="flex items-start justify-between gap-4">
                            <DialogTitle className="text-xl font-semibold leading-normal pr-8">
                                {entry.title}
                            </DialogTitle>
                            <div className="flex items-center gap-2">
                                {!isEditing && (
                                    <>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setIsEditing(true)}
                                            title="Edit entry"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setShowDeleteConfirm(true)}
                                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                            title="Delete entry"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </>
                                )}
                                {isEditing && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setIsEditing(false)}
                                        title="Cancel editing"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Date badges */}
                        <div className="flex flex-wrap gap-2 text-xs">
                            <Badge variant="secondary" className="gap-1">
                                <Calendar className="h-3 w-3" />
                                Created{' '}
                                {createdDate.toLocaleDateString(undefined, {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                })}
                            </Badge>
                            {entry.updated_at !== entry.created_at && (
                                <Badge variant="outline" className="gap-1">
                                    <Clock className="h-3 w-3" />
                                    Updated{' '}
                                    {updatedDate.toLocaleDateString(undefined, {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                    })}
                                </Badge>
                            )}
                        </div>
                    </DialogHeader>

                    {isEditing ? (
                        <EditEntryForm
                            entry={entry}
                            fields={fields}
                            onSaveComplete={handleSaveComplete}
                            onCancel={() => setIsEditing(false)}
                        />
                    ) : (
                        <div className="space-y-6 py-4">
                            {/* Cover Image */}
                            <div className="space-y-2">
                                <h4 className="text-sm font-medium text-muted-foreground">
                                    Cover Image
                                </h4>
                                <CoverImageDisplay
                                    entry={entry}
                                    showRemoveButton={false}
                                />
                            </div>

                            {/* Description */}
                            {entry.description && (
                                <div className="space-y-2">
                                    <h4 className="text-sm font-medium text-muted-foreground">
                                        Description
                                    </h4>
                                    <p className="text-sm whitespace-pre-wrap">
                                        {entry.description}
                                    </p>
                                </div>
                            )}

                            {/* Custom Fields */}
                            {fields.length > 0 && (
                                <CustomFieldsSection
                                    fields={fields}
                                    metadata={metadata}
                                />
                            )}

                            {/* Empty state */}
                            {!entry.description && fields.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground">
                                    <p className="text-sm">No additional details</p>
                                    <Button
                                        variant="link"
                                        className="mt-2"
                                        onClick={() => setIsEditing(true)}
                                    >
                                        Add details
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog
                open={showDeleteConfirm}
                onOpenChange={setShowDeleteConfirm}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Entry</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete "{entry.title}"? This
                            action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
