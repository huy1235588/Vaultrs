/**
 * useLocalStorage — Hook for reading/writing values to localStorage.
 *
 * @example
 * ```tsx
 * const [viewMode, setViewMode] = useLocalStorage("viewMode", "list");
 * ```
 */
import { useCallback, useState } from "react";

export function useLocalStorage<T>(
    key: string,
    initialValue: T,
): [T, (value: T | ((prev: T) => T)) => void] {
    // Lazy initial state — read from localStorage on first render
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? (JSON.parse(item) as T) : initialValue;
        } catch (error) {
            console.warn(`Error reading localStorage key "${key}":`, error);
            return initialValue;
        }
    });

    // Setter that also persists to localStorage
    const setValue = useCallback(
        (value: T | ((prev: T) => T)) => {
            setStoredValue((prev) => {
                const newValue =
                    value instanceof Function ? value(prev) : value;
                try {
                    window.localStorage.setItem(
                        key,
                        JSON.stringify(newValue),
                    );
                } catch (error) {
                    console.warn(
                        `Error setting localStorage key "${key}":`,
                        error,
                    );
                }
                return newValue;
            });
        },
        [key],
    );

    return [storedValue, setValue];
}
