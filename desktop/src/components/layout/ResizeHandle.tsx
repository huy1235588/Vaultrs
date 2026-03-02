// ResizeHandle component for resizing the detail panel

import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface ResizeHandleProps {
    onResize: (width: number) => void;
    minWidth?: number;
    maxWidth?: number;
}

export function ResizeHandle({
    onResize,
    minWidth = 320,
    maxWidth = 600,
}: ResizeHandleProps) {
    const [isDragging, setIsDragging] = useState(false);
    const startXRef = useRef(0);
    const startWidthRef = useRef(0);

    const handleMouseDown = useCallback(
        (e: React.MouseEvent) => {
            e.preventDefault();
            setIsDragging(true);
            startXRef.current = e.clientX;

            // Get the current width of the panel (sibling element to the right)
            const handle = e.currentTarget as HTMLElement;
            const panel = handle.nextElementSibling as HTMLElement | null;
            if (panel) {
                startWidthRef.current = panel.getBoundingClientRect().width;
            }
        },
        []
    );

    const handleMouseMove = useCallback(
        (e: MouseEvent) => {
            if (!isDragging) return;
            // Dragging left increases width, dragging right decreases width
            const delta = startXRef.current - e.clientX;
            const newWidth = Math.max(
                minWidth,
                Math.min(maxWidth, startWidthRef.current + delta)
            );
            onResize(newWidth);
        },
        [isDragging, minWidth, maxWidth, onResize]
    );

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            // Prevent text selection while dragging
            document.body.style.userSelect = 'none';
            document.body.style.cursor = 'col-resize';
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            document.body.style.userSelect = '';
            document.body.style.cursor = '';
        };
    }, [isDragging, handleMouseMove, handleMouseUp]);

    return (
        <div
            className={cn(
                'w-1.5 flex-shrink-0 cursor-col-resize relative group',
                'hover:bg-primary/20 transition-colors',
                isDragging && 'bg-primary/30'
            )}
            onMouseDown={handleMouseDown}
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize detail panel"
        >
            {/* Visual grip indicator */}
            <div
                className={cn(
                    'absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 rounded-full',
                    'bg-border group-hover:bg-primary/50 transition-colors',
                    isDragging && 'bg-primary/60'
                )}
            />
        </div>
    );
}
