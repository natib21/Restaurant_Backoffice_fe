// src/api/client.ts
import { QueryClient } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/react-query-persist-client'; // This stays
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'; // ← Fixed import

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 10, // 10 minutes
      gcTime: 1000 * 60 * 60 * 24, // 24 hours (replaced cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const persister = createSyncStoragePersister({
  storage: typeof window !== 'undefined' ? window.localStorage : undefined,
});

const sensitiveQueryKeys = ['user', 'orders', 'order'];

const isSensitiveQuery = (queryKey: unknown) => {
  if (typeof queryKey === 'string') {
    return sensitiveQueryKeys.includes(queryKey);
  }
  if (Array.isArray(queryKey)) {
    return queryKey.some(
      (segment) => typeof segment === 'string' && sensitiveQueryKeys.includes(segment)
    );
  }
  return false;
};

persistQueryClient({
  queryClient,
  persister,
  dehydrateOptions: {
    shouldDehydrateQuery: (query) => !isSensitiveQuery(query.queryKey),
  },
});
