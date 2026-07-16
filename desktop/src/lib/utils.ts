import { type ClassValue, clsx } from "clsx";
import { tailwindMerge } from "tailwind-merge";

/**
 * Combines tailwind class names safely.
 */
export function cn(...inputs: ClassValue[]) {
    return tailwindMerge(clsx(inputs));
}
