// src/api/Queries/taskQueries.ts (or wherever your task queries are defined)

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api'; // or your axios/api instance

export const useMerchantTasksQuery = () => {
  return useQuery({
    queryKey: ['merchantTasks'],
    queryFn: async () => {
      const response = await api.get('/v1/tasks/merchant-tasks');
      // Your controller returns: { status: 'success', results: number, data: { tasks: [...] } }
      return response.data.data.tasks || []; // safe array return
    },
    staleTime: 5 * 60 * 1000, // 5 minutes — tasks don't change often
    select: (tasks) =>
      tasks.map((t: any) => ({
        _id: t._id,
        name: t.name,
        endpoint: t.endpoint,
        method: t.method,
        description: t.description,
        isMerchant: t.isMerchant,
      })),
  });
};
