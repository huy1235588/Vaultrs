// Theme toggle button component

import { Sun, Moon, Monitor } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
    collapsed?: boolean;
}

export function ThemeToggle({ collapsed = false }: ThemeToggleProps) {
    const { theme, setTheme } = useUIStore();

    const cycleTheme = () => {
        const next = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
        setTheme(next);
    };

    const icon =
        theme === 'light' ? (
            <Sun className="h-4 w-4" />
        ) : theme === 'dark' ? (
            <Moon className="h-4 w-4" />
        ) : (
            <Monitor className="h-4 w-4" />
        );

    const label =
        theme === 'light' ? 'Light' : theme === 'dark' ? 'Dark' : 'System';

    return (
        <Button
            variant="ghost"
            size={collapsed ? 'icon' : 'sm'}
            onClick={cycleTheme}
            title={`Theme: ${label}`}
            className={cn(
                'text-muted-foreground hover:text-foreground',
                !collapsed && 'w-full justify-start gap-2'
            )}
        >
            {icon}
            {!collapsed && <span className="text-xs">{label}</span>}
        </Button>
    );
}
