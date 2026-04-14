/* ============================================================
   Utility functions
   ============================================================ */
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';

/**
 * Format a timestamp for message display.
 * Shows time for today, "Yesterday" for yesterday, or the full date.
 */
export function formatMessageTime(timestamp: string): string {
  const date = new Date(timestamp);
  if (isToday(date)) {
    return format(date, 'HH:mm');
  }
  if (isYesterday(date)) {
    return 'Yesterday';
  }
  return format(date, 'dd/MM/yyyy');
}

/**
 * Format a timestamp for chat list sidebar.
 */
export function formatChatListTime(timestamp: string): string {
  const date = new Date(timestamp);
  if (isToday(date)) {
    return format(date, 'HH:mm');
  }
  if (isYesterday(date)) {
    return 'Yesterday';
  }
  return format(date, 'dd/MM/yy');
}

/**
 * Format last seen time as relative ("5 minutes ago").
 */
export function formatLastSeen(timestamp: string): string {
  return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
}

/**
 * Get initials from a username for avatar fallback.
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Truncate text to a specified length.
 */
export function truncate(text: string, length: number = 40): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
}

/**
 * Get WebSocket URL based on environment.
 */
export function getWsUrl(path: string, token: string): string {
  const wsBase = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';
  return `${wsBase}/${path}?token=${token}`;
}

/**
 * Debounce function for typing indicators.
 */
export function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  wait: number
): T & { cancel: () => void } {
  let timeout: NodeJS.Timeout | null = null;
  
  const debounced = (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
  
  debounced.cancel = () => {
    if (timeout) clearTimeout(timeout);
  };
  
  return debounced as T & { cancel: () => void };
}
