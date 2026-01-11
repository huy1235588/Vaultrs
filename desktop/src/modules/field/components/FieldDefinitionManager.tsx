// Field Definition Manager - UI for managing custom fields in a vault

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus, Settings2 } from 'lucide-react';
import { useFieldStore } from '../store';
import { FieldDefinitionRow } from './FieldDefinitionRow';
import { CreateFieldDialog } from './CreateFieldDialog';
import { EditFieldDialog } from './EditFieldDialog';
import type { FieldDefinition } from '../types';

interface FieldDefinitionManagerProps {
    vaultId: number;
    vaultName: string;
    isOpen: boolean;
    onClose: () => void;
}

export function FieldDefinitionManager({
    vaultId,
    vaultName,
    isOpen,
    onClose,
}: FieldDefinitionManagerProps) {
    const { fields, isLoading, fetchFields, deleteField, reorderFields } = useFieldStore();
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [editingField, setEditingField] = useState<FieldDefinition | null>(null);

    // Fetch fields when dialog opens
    useEffect(() => {
        if (isOpen && vaultId) {
            fetchFields(vaultId).catch(console.error);
        }
    }, [isOpen, vaultId, fetchFields]);

    const handleMoveUp = async (index: number) => {
        if (index <= 0) return;
        const newOrder = [...fields];
        [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
        await reorderFields(vaultId, newOrder.map((f) => f.id));
    };

    const handleMoveDown = async (index: number) => {
        if (index >= fields.length - 1) return;
        const newOrder = [...fields];
        [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
        await reorderFields(vaultId, newOrder.map((f) => f.id));
    };

    const handleDelete = async (id: number) => {
        if (confirm('Are you sure you want to delete this field? This will remove the field definition but existing entry data will remain.')) {
            await deleteField(id);
        }
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
                <DialogContent className="max-w-xl max-h-[85vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Settings2 className="h-5 w-5" />
                            Custom Fields
                        </DialogTitle>
                        <DialogDescription>
                            Manage custom fields for <strong>{vaultName}</strong>. These fields will appear on all entries in this vault.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto py-4">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
                            </div>
                        ) : fields.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <p className="text-sm mb-4">No custom fields defined yet.</p>
                                <Button
                                    variant="outline"
                                    onClick={() => setShowCreateDialog(true)}
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Your First Field
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {fields.map((field, index) => (
                                    <FieldDefinitionRow
                                        key={field.id}
                                        field={field}
                                        onEdit={() => setEditingField(field)}
                                        onDelete={() => handleDelete(field.id)}
                                        onMoveUp={index > 0 ? () => handleMoveUp(index) : undefined}
                                        onMoveDown={index < fields.length - 1 ? () => handleMoveDown(index) : undefined}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {fields.length > 0 && (
                        <div className="border-t pt-4">
                            <Button
                                variant="outline"
                                onClick={() => setShowCreateDialog(true)}
                                className="w-full"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Field
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Create Field Dialog */}
            <CreateFieldDialog
                vaultId={vaultId}
                isOpen={showCreateDialog}
                onClose={() => setShowCreateDialog(false)}
            />

            {/* Edit Field Dialog */}
            <EditFieldDialog
                field={editingField}
                isOpen={!!editingField}
                onClose={() => setEditingField(null)}
            />
        </>
    );
}
