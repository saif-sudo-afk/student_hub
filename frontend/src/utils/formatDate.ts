export function formatDate(value: string | null | undefined, options?: Intl.DateTimeFormatOptions) {
  if (!value) {
    return 'N/A';
  }
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: options?.timeStyle ?? undefined,
    ...options,
  }).format(new Date(value));
}
