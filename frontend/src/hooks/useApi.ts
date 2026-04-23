import { useQuery, type UseQueryOptions } from '@tanstack/react-query';

export function useApiQuery<TData>(
  queryKey: readonly unknown[],
  queryFn: () => Promise<TData>,
  options?: Omit<UseQueryOptions<TData>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey,
    queryFn,
    ...options,
  });
}
