import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generate initials from a name
 * Example: "Dimsum Ayam" -> "DA"
 */
export function getInitials(name: string): string {
  if (!name) return '?';
  
  const words = name.trim().split(/\s+/);
  
  if (words.length === 1) {
    // Single word: take first 2 characters
    return words[0].substring(0, 2).toUpperCase();
  }
  
  // Multiple words: take first character of first 2 words
  return words
    .slice(0, 2)
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase();
}

/**
 * Generate a color based on string (for consistent placeholder colors)
 */
export function getColorFromString(str: string): string {
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-red-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500',
  ];
  
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
}