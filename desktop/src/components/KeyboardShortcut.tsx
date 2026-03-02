// Keyboard shortcut badge component

import { cn } from '@/lib/utils';

interface KeyboardShortcutProps {
    keys: string[];
    className?: string;
}

export function KeyboardShortcut({ keys, className }: KeyboardShortcutProps) {
    return (
        <span className={cn('inline-flex items-center gap-0.5', className)}>
            {keys.map((key, i) => (
                <kbd
                    key={i}
                    className={cn(
                        'inline-flex items-center justify-center',
                        'min-w-[1.25rem] h-5 px-1 rounded',
                        'text-[10px] font-medium leading-none',
                        'bg-muted text-muted-foreground',
                        'border border-border',
                        'shadow-[0_1px_0_var(--border)]'
                    )}
                >
                    {key}
                </kbd>
            ))}
        </span>
    );
}
