import { useState, useEffect } from 'react';
import { ImageIcon, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { entryApi } from '../api';
import type { Entry } from '../types';

interface CoverImageDisplayProps {
    entry: Entry;
    thumbnail?: boolean;
    onRemove?: () => void;
    showRemoveButton?: boolean;
}

export function CoverImageDisplay({
    entry,
    thumbnail = false,
    onRemove,
    showRemoveButton = false
}: CoverImageDisplayProps) {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!entry.cover_image_path) {
            setImageUrl(null);
            return;
        }

        // If it's a URL, use it directly
        if (entry.cover_image_path.startsWith('http://') || entry.cover_image_path.startsWith('https://')) {
            setImageUrl(entry.cover_image_path);
            setLoading(false);
            return;
        }

        // Otherwise, load thumbnail from local storage
        let cancelled = false;

        const loadThumbnail = async () => {
            try {
                setLoading(true);
                setError(false);
                const dataUrl = await entryApi.getThumbnail(entry.id);
                if (!cancelled) {
                    setImageUrl(dataUrl);
                }
            } catch (err) {
                console.error('Failed to load thumbnail:', err);
                if (!cancelled) {
                    setError(true);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        loadThumbnail();

        return () => {
            cancelled = true;
        };
    }, [entry.id, entry.cover_image_path]);

    const handleRemove = async () => {
        try {
            await entryApi.removeCover(entry.id);
            setImageUrl(null);
            onRemove?.();
        } catch (err) {
            console.error('Failed to remove cover:', err);
        }
    };

    if (!entry.cover_image_path && !loading) {
        return (
            <div className={`flex items-center justify-center bg-muted rounded-md ${thumbnail ? 'w-16 h-16' : 'w-full h-48'
                }`}>
                <ImageIcon className={`text-muted-foreground ${thumbnail ? 'h-6 w-6' : 'h-12 w-12'
                    }`} />
            </div>
        );
    }

    if (loading) {
        return (
            <div className={`flex items-center justify-center bg-muted rounded-md ${thumbnail ? 'w-16 h-16' : 'w-full h-48'
                }`}>
                <Loader2 className={`animate-spin text-muted-foreground ${thumbnail ? 'h-4 w-4' : 'h-8 w-8'
                    }`} />
            </div>
        );
    }

    if (error || !imageUrl) {
        return (
            <div className={`flex items-center justify-center bg-muted rounded-md ${thumbnail ? 'w-16 h-16' : 'w-full h-48'
                }`}>
                <ImageIcon className={`text-destructive ${thumbnail ? 'h-6 w-6' : 'h-12 w-12'
                    }`} />
            </div>
        );
    }

    return (
        <div className={`relative group ${thumbnail ? 'w-16 h-16' : 'w-full'}`}>
            <img
                src={imageUrl}
                alt={entry.title}
                className={`rounded-md object-cover ${thumbnail ? 'w-16 h-16' : 'w-full h-48'
                    }`}
            />
            {showRemoveButton && !thumbnail && (
                <Button
                    size="icon"
                    variant="destructive"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={handleRemove}
                >
                    <X className="h-4 w-4" />
                </Button>
            )}
        </div>
    );
}
