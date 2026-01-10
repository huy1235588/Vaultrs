// SearchInput component with debounced search functionality

import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { Input } from '../ui/input';
import { cn } from '../../lib/utils';

interface SearchInputProps {
    onSearch: (query: string) => void;
    onClear: () => void;
    isSearching?: boolean;
    placeholder?: string;
    debounceMs?: number;
    className?: string;
}

export function SearchInput({
    onSearch,
    onClear,
    isSearching = false,
    placeholder = 'Search entries...',
    debounceMs = 300,
    className,
}: SearchInputProps) {
    const [value, setValue] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Debounced search
    const debouncedSearch = useCallback(
        (query: string) => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
            debounceRef.current = setTimeout(() => {
                onSearch(query);
            }, debounceMs);
        },
        [onSearch, debounceMs]
    );

    // Handle input change
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setValue(newValue);
        debouncedSearch(newValue);
    };

    // Handle clear
    const handleClear = () => {
        setValue('');
        onClear();
        inputRef.current?.focus();
    };

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Escape to clear
            if (e.key === 'Escape' && value) {
                handleClear();
            }
            // Ctrl+F or Cmd+F to focus
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                inputRef.current?.focus();
                inputRef.current?.select();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [value]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, []);

    return (
        <div className={cn('relative flex items-center', className)}>
            {/* Search icon */}
            <div className="absolute left-3 text-muted-foreground pointer-events-none">
                {isSearching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <Search className="h-4 w-4" />
                )}
            </div>

            {/* Input */}
            <Input
                ref={inputRef}
                type="text"
                value={value}
                onChange={handleChange}
                placeholder={placeholder}
                className="pl-9 pr-9 h-9 bg-secondary/50 border-transparent focus:border-primary/50 focus:bg-background transition-colors"
            />

            {/* Clear button */}
            {value && (
                <button
                    type="button"
                    onClick={handleClear}
                    className="absolute right-2 p-1 rounded-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    aria-label="Clear search"
                >
                    <X className="h-4 w-4" />
                </button>
            )}
        </div>
    );
}
