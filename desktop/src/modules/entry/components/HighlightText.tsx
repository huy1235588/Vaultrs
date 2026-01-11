// HighlightText component - highlights matching search terms in text

import { cn } from '@/lib/utils';

interface HighlightTextProps {
    text: string;
    highlight: string;
    className?: string;
    highlightClassName?: string;
}

/**
 * Highlights occurrences of search terms within text.
 * Supports multiple words and is case-insensitive.
 */
export function HighlightText({
    text,
    highlight,
    className,
    highlightClassName = 'bg-yellow-200 dark:bg-yellow-800 text-foreground rounded-sm px-0.5',
}: HighlightTextProps) {
    // If no highlight term or empty text, return plain text
    if (!highlight.trim() || !text) {
        return <span className={className}>{text}</span>;
    }

    // Split highlight into words and escape regex special chars
    const words = highlight
        .trim()
        .split(/\s+/)
        .filter((w) => w.length > 0)
        .map((word) => escapeRegex(word));

    if (words.length === 0) {
        return <span className={className}>{text}</span>;
    }

    // Create regex pattern that matches any of the words
    const pattern = new RegExp(`(${words.join('|')})`, 'gi');

    // Split text by matches, keeping the matched parts
    const parts = text.split(pattern);

    return (
        <span className={className}>
            {parts.map((part, index) => {
                // Check if this part matches any highlight word
                const isMatch = words.some(
                    (word) => part.toLowerCase() === word.toLowerCase()
                );

                if (isMatch) {
                    return (
                        <mark
                            key={index}
                            className={cn('font-medium', highlightClassName)}
                        >
                            {part}
                        </mark>
                    );
                }

                return <span key={index}>{part}</span>;
            })}
        </span>
    );
}

/**
 * Escapes special regex characters in a string.
 */
function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
