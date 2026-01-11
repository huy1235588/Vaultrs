import { useState } from 'react';
import { Upload, Link2, Loader2 } from 'lucide-react';
import { open } from '@tauri-apps/plugin-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { entryApi } from '../api';

interface CoverImageUploaderProps {
    entryId: number;
    onSuccess?: () => void;
    onError?: (error: string) => void;
}

export function CoverImageUploader({ entryId, onSuccess, onError }: CoverImageUploaderProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [url, setUrl] = useState('');
    const [urlError, setUrlError] = useState('');

    const handleFileUpload = async () => {
        try {
            setIsUploading(true);
            setUrlError('');

            const selected = await open({
                multiple: false,
                filters: [{
                    name: 'Images',
                    extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif']
                }]
            });

            if (!selected) {
                setIsUploading(false);
                return;
            }

            await entryApi.uploadCoverImage(entryId, selected as string);
            onSuccess?.();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to upload image';
            setUrlError(message);
            onError?.(message);
        } finally {
            setIsUploading(false);
        }
    };

    const handleUrlSubmit = async () => {
        if (!url.trim()) {
            setUrlError('URL is required');
            return;
        }

        try {
            setIsUploading(true);
            setUrlError('');
            await entryApi.setCoverUrl(entryId, url.trim());
            setUrl('');
            onSuccess?.();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to download image';
            setUrlError(message);
            onError?.(message);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div>
                <Label>Upload from File</Label>
                <Button
                    onClick={handleFileUpload}
                    disabled={isUploading}
                    className="w-full mt-2"
                    variant="outline"
                >
                    {isUploading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Uploading...
                        </>
                    ) : (
                        <>
                            <Upload className="mr-2 h-4 w-4" />
                            Choose File
                        </>
                    )}
                </Button>
                <p className="text-xs text-muted-foreground mt-1">
                    Supported formats: JPEG, PNG, WebP, GIF (max 10MB)
                </p>
            </div>

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or</span>
                </div>
            </div>

            <div>
                <Label htmlFor="image-url">Image URL</Label>
                <div className="flex gap-2 mt-2">
                    <Input
                        id="image-url"
                        type="url"
                        placeholder="https://example.com/image.jpg"
                        value={url}
                        onChange={(e) => {
                            setUrl(e.target.value);
                            setUrlError('');
                        }}
                        disabled={isUploading}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handleUrlSubmit();
                            }
                        }}
                    />
                    <Button
                        onClick={handleUrlSubmit}
                        disabled={isUploading || !url.trim()}
                        size="icon"
                    >
                        {isUploading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Link2 className="h-4 w-4" />
                        )}
                    </Button>
                </div>
                {urlError && (
                    <p className="text-sm text-destructive mt-2">{urlError}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                    Paste an image URL from the internet
                </p>
            </div>
        </div>
    );
}
