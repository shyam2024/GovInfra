import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Backend ids may be integers or UUID strings; keep whatever the form gave us if it is not numeric. */
export function toId(value: string | number): number | string {
  if (typeof value === 'number') return value;
  return /^\d+$/.test(value) ? Number(value) : value;
}
