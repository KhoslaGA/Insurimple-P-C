import clsx, { type ClassValue } from 'clsx';

/** Join class names. Keep utility conflicts out of call sites rather than merging them. */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}
