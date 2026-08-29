// src/api/Queries/kitchenQueries.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';
import { formatOrderItemName } from '@/features/Order/lib/orderUtils';
import type {
  KdsStation,
  KdsTicket,
  KdsStationMetrics,
  KdsTicketStatus,
  KdsStaffMember,
  KdsInventoryItem,
  CreateKitchenStationDto,
  UpdateKitchenStationDto,
  TicketHistoryFilterParams,
  TicketHistoryResponse,
} from '@/features/KDS/types/kdsTypes';

export type {
  KdsStation,
  KdsTicket,
  KdsStationMetrics,
  KdsTicketStatus,
  KdsStaffMember,
  KdsInventoryItem,
  CreateKitchenStationDto,
  UpdateKitchenStationDto,
  TicketHistoryFilterParams,
  TicketHistoryResponse,
};

// ====================== OBJECT ID VALIDATOR ======================
export const isValidObjectId = (id?: string | null): boolean => {
  if (!id || typeof id !== 'string') return false;
  const trimmed = id.trim();
  return /^[0-9a-fA-F]{24}$/.test(trimmed);
};

// ====================== DATA NORMALIZERS ======================
export const normalizeKitchenStation = (raw: any): KdsStation => {
  if (!raw) return raw;
  const _id = raw._id || raw.id || '';
  const code = (raw.code || raw.stationCode || 'ST').toUpperCase();
  const stationId = raw.stationId || _id || raw.code?.toLowerCase();
  return {
    _id,
    stationId,
    name: raw.name || raw.stationName || 'Kitchen Station',
    code,
    description: raw.description || '',
    displayOrder: typeof raw.displayOrder === 'number' ? raw.displayOrder : 0,
    branchId: raw.branchId,
    color: raw.color || '#3B82F6',
    isActive: raw.isActive !== undefined ? !!raw.isActive : true,
    activeStaffCount: raw.activeStaffCount || 0,
    status: raw.status || 'on_pace',
    avgTicketTimeSeconds: raw.avgTicketTimeSeconds || 300,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
};

export const normalizeKitchenTicket = (raw: any): KdsTicket => {
  if (!raw) return raw;
  const stationObj = typeof raw.station === 'object' && raw.station !== null ? raw.station : null;
  const orderObj = typeof raw.order === 'object' && raw.order !== null ? raw.order : null;

  const stationId =
    raw.stationId ||
    stationObj?._id ||
    stationObj?.code?.toLowerCase() ||
    (typeof raw.station === 'string' ? raw.station : '');

  const stationName =
    raw.stationName ||
    stationObj?.name ||
    (stationObj?.code ? `STATION ${stationObj.code}` : 'KITCHEN');
  const stationCode = raw.stationCode || stationObj?.code || 'KD';

  const orderId =
    raw.orderId ||
    (orderObj?._id ? orderObj._id : typeof raw.order === 'string' ? raw.order : '');
  const orderNumber =
    raw.orderNumber ||
    orderObj?.orderNumber ||
    (orderId ? `ORD-${String(orderId).slice(-4)}` : 'ORD-001');

  const resolvedTableNumber =
    (raw.tableNumber !== null && raw.tableNumber !== undefined && String(raw.tableNumber).trim() !== '')
      ? String(raw.tableNumber).trim()
      : (orderObj?.tableNumber ? String(orderObj.tableNumber).trim() : undefined);

  return {
    _id: raw._id || raw.id || '',
    ticketNumber:
      raw.ticketNumber ||
      (stationCode ? `${stationCode}-${String(raw._id || '01').slice(-2)}` : 'TKT-01'),
    orderId,
    orderNumber,
    orderType: raw.orderType || orderObj?.orderType || 'dine_in',
    tableNumber: resolvedTableNumber,
    customerName: raw.customerName || orderObj?.customerName || undefined,
    branchId: raw.branchId || '',
    stationId,
    stationName,
    stationCode,
    status: raw.status || 'pending',
    priority: raw.priority || 'normal',
    notes: raw.notes,
    createdAt: raw.createdAt || new Date().toISOString(),
    acceptedAt: raw.acceptedAt,
    startedAt: raw.startedAt,
    readyAt: raw.readyAt || raw.completedAt,
    completedAt: raw.completedAt || raw.readyAt,
    canceledAt: raw.canceledAt,
    cancelReason: raw.cancelReason || raw.canceledReason,
    assignedStaffId: raw.assignedStaffId || raw.staff?._id || raw.assignedStaff?._id,
    assignedStaffName: raw.assignedStaffName || raw.staff?.name || raw.assignedStaff?.name,
    durationSeconds:
      raw.durationSeconds ||
      raw.prepDurationSeconds ||
      (raw.completedAt && raw.createdAt
        ? Math.max(0, Math.round((new Date(raw.completedAt).getTime() - new Date(raw.createdAt).getTime()) / 1000))
        : raw.readyAt && raw.createdAt
        ? Math.max(0, Math.round((new Date(raw.readyAt).getTime() - new Date(raw.createdAt).getTime()) / 1000))
        : undefined),
    completedBy: raw.completedBy || raw.completedByName,
    items: Array.isArray(raw.items)
      ? raw.items.map((itm: any, idx: number) => {
          const formattedName = formatOrderItemName(itm);
          const finalName = formattedName !== '—' ? formattedName : (itm.name || itm.menuItemName || 'Menu Item');
          return {
            _id: itm._id || itm.orderItemId || `itm_${idx}`,
            itemId: itm.itemId || itm.menuItem || itm._id || `menu_${idx}`,
            name: finalName,
            menuItemName: finalName,
            quantity: itm.quantity || 1,
            notes: itm.notes || '',
            modifiers: itm.modifiers || itm.modifierNames,
            status: itm.status || (itm.completed ? 'ready' : 'pending'),
            completed: itm.completed ?? (itm.status === 'ready' || itm.status === 'completed'),
            startedAt: itm.startedAt || null,
            completedAt: itm.completedAt || null,
          };
        })
      : [],
  };
};

// ====================== QUERY KEY FACTORY ======================
export const kitchenKeys = {
  all: ['kitchen'] as const,
  stations: (branchId?: string) => [...kitchenKeys.all, 'stations', branchId || 'all'] as const,
  tickets: (branchId?: string, stationId?: string) =>
    [...kitchenKeys.all, 'tickets', branchId || 'all', stationId || 'all'] as const,
  orderTickets: (orderId: string) => [...kitchenKeys.all, 'orderTickets', orderId] as const,
  performance: (branchId?: string, stationId?: string) =>
    [...kitchenKeys.all, 'performance', branchId || 'all', stationId || 'all'] as const,
  staff: (branchId?: string) => [...kitchenKeys.all, 'staff', branchId || 'all'] as const,
  inventory: (stationId?: string) =>
    [...kitchenKeys.all, 'inventory', stationId || 'all'] as const,
  history: (params?: TicketHistoryFilterParams) =>
    [...kitchenKeys.all, 'history', params || {}] as const,
};

// ====================== API FETCHERS ======================

// GET /api/v1/kitchen/stations (uses branchId only if valid ObjectId)
export const fetchKitchenStations = async (branchId?: string): Promise<KdsStation[]> => {
  const validBranchId = isValidObjectId(branchId) ? branchId : undefined;
  const { data } = await api.get('/v1/kitchen/stations', {
    params: validBranchId ? { branchId: validBranchId } : undefined,
  });
  const rawList =
    data?.data?.stations ||
    data?.stations ||
    (Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []));

  if (Array.isArray(rawList)) {
    return rawList.map(normalizeKitchenStation).sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  }
  return [];
};

// GET /api/v1/kitchen/stations/:id
export const fetchKitchenStationById = async (
  stationIdOrCode: string,
  branchId?: string
): Promise<KdsStation | null> => {
  const validBranchId = isValidObjectId(branchId) ? branchId : undefined;
  const { data } = await api.get(`/v1/kitchen/stations/${stationIdOrCode}`, {
    params: validBranchId ? { branchId: validBranchId } : undefined,
  });
  const stationData = data?.data?.station || data?.station || data?.data;
  if (stationData) {
    return normalizeKitchenStation(stationData);
  }
  return null;
};

// GET /api/v1/kitchen/tickets or /api/v1/kitchen/stations/:stationId/tickets
// Strictly uses ObjectId for stationId & branchId to prevent CastErrors
export const fetchKitchenTickets = async (
  branchId?: string,
  stationId?: string,
  status?: string
): Promise<KdsTicket[]> => {
  const validStationId = isValidObjectId(stationId) ? stationId : undefined;
  const validBranchId = isValidObjectId(branchId) ? branchId : undefined;

  const params: Record<string, any> = {};
  if (validBranchId) params.branchId = validBranchId;
  if (status && status !== 'all') params.status = status;

  if (validStationId) {
    const { data } = await api.get(`/v1/kitchen/stations/${validStationId}/tickets`, {
      params: Object.keys(params).length > 0 ? params : undefined,
    });
    const rawTickets =
      data?.data?.tickets ||
      data?.tickets ||
      (Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []));

    if (Array.isArray(rawTickets)) {
      return rawTickets.map(normalizeKitchenTicket);
    }
  } else {
    const { data } = await api.get('/v1/kitchen/tickets', {
      params: Object.keys(params).length > 0 ? params : undefined,
    });
    const rawTickets =
      data?.data?.tickets ||
      data?.tickets ||
      (Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []));

    if (Array.isArray(rawTickets)) {
      return rawTickets.map(normalizeKitchenTicket);
    }
  }
  return [];
};

// GET /api/v1/kitchen/orders/:orderId/tickets
export const fetchOrderTickets = async (orderId: string): Promise<KdsTicket[]> => {
  if (!orderId) return [];
  const { data } = await api.get(`/v1/kitchen/orders/${orderId}/tickets`);
  const rawTickets =
    data?.data?.tickets ||
    data?.tickets ||
    (Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []));

  if (Array.isArray(rawTickets)) {
    return rawTickets.map(normalizeKitchenTicket);
  }
  return [];
};

// GET /api/v1/kitchen/tickets/history
// Query params: ?branchId, ?stationId, ?startDate, ?endDate, ?page, ?limit, ?status, ?search
// RBAC Task: kitchen.tickets.history
export const fetchKitchenTicketHistory = async (
  params?: TicketHistoryFilterParams
): Promise<TicketHistoryResponse> => {
  const validBranchId = isValidObjectId(params?.branchId) ? params?.branchId : undefined;
  const validStationId = isValidObjectId(params?.stationId) ? params?.stationId : undefined;

  const queryParams: Record<string, any> = {};
  if (validBranchId) queryParams.branchId = validBranchId;
  if (validStationId) queryParams.stationId = validStationId;
  if (params?.startDate) queryParams.startDate = params.startDate;
  if (params?.endDate) queryParams.endDate = params.endDate;
  if (params?.page) queryParams.page = params.page;
  if (params?.limit) queryParams.limit = params.limit;
  if (params?.status && params.status !== 'all') queryParams.status = params.status;
  if (params?.search && params.search.trim()) queryParams.search = params.search.trim();

  try {
    const { data } = await api.get('/v1/kitchen/tickets/history', {
      params: Object.keys(queryParams).length > 0 ? queryParams : undefined,
    });

    const rawTickets =
      data?.data?.tickets ||
      data?.tickets ||
      (Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []));

    const total =
      typeof data?.total === 'number'
        ? data.total
        : typeof data?.data?.total === 'number'
        ? data.data.total
        : typeof data?.results === 'number'
        ? data.results
        : Array.isArray(rawTickets)
        ? rawTickets.length
        : 0;

    const page = Number(data?.page || data?.data?.page || params?.page || 1);
    const limit = Number(data?.limit || data?.data?.limit || params?.limit || 20);
    const pages = Number(data?.pages || data?.data?.pages || Math.max(1, Math.ceil(total / (limit || 20))));

    const tickets = Array.isArray(rawTickets) ? rawTickets.map(normalizeKitchenTicket) : [];

    return {
      tickets,
      total,
      page,
      pages,
      limit,
    };
  } catch (err: any) {
    console.error('Error fetching kitchen ticket history:', err);
    return {
      tickets: [],
      total: 0,
      page: Number(params?.page || 1),
      pages: 1,
      limit: Number(params?.limit || 20),
    };
  }
};

// KITCHEN STAFF: Fetched from Users API where user's role includes Kitchen Tasks
export const fetchKitchenStaff = async (branchId?: string): Promise<KdsStaffMember[]> => {
  const validBranchId = isValidObjectId(branchId) ? branchId : undefined;

  try {
    const usersPromise = validBranchId
      ? api.get(`/v1/merchant/users/branch/${validBranchId}`).catch(() => api.get('/v1/merchant/users'))
      : api.get('/v1/merchant/users');

    const rolesPromise = api.get('/v1/merchant/roles').catch(() => ({ data: { data: { roles: [] } } }));

    const [usersRes, rolesRes] = await Promise.all([usersPromise, rolesPromise]);

    const usersData: any[] =
      usersRes?.data?.data?.users ||
      usersRes?.data?.users ||
      (Array.isArray(usersRes?.data?.data) ? usersRes.data.data : []);

    const rolesData: any[] =
      rolesRes?.data?.data?.roles ||
      rolesRes?.data?.roles ||
      (Array.isArray(rolesRes?.data?.data) ? rolesRes.data.data : []);

    // Build role map and role kitchen capability set
    const roleMap = new Map<string, any>();
    const kitchenRoleIds = new Set<string>();

    rolesData.forEach((role: any) => {
      const roleId = String(role._id);
      roleMap.set(roleId, role);

      const roleName = String(role.name || '').toLowerCase();
      const roleDesc = String(role.description || '').toLowerCase();

      const isRoleNameKitchen =
        roleName.includes('kitchen') ||
        roleName.includes('cook') ||
        roleName.includes('chef') ||
        roleName.includes('kds') ||
        roleName.includes('line') ||
        roleName.includes('prep') ||
        roleName.includes('baker') ||
        roleName.includes('grill') ||
        roleDesc.includes('kitchen');

      const tasks = Array.isArray(role.tasks) ? role.tasks : [];
      const hasKitchenTask = tasks.some((t: any) => {
        if (typeof t === 'string') {
          return t.toLowerCase().includes('kitchen') || t.toLowerCase().includes('kds');
        }
        if (typeof t === 'object' && t !== null) {
          const tName = String(t.name || '').toLowerCase();
          const tEndpoint = String(t.endpoint || '').toLowerCase();
          const tDesc = String(t.description || '').toLowerCase();
          return (
            tName.includes('kitchen') ||
            tName.includes('kds') ||
            tEndpoint.includes('kitchen') ||
            tEndpoint.includes('kds') ||
            tDesc.includes('kitchen')
          );
        }
        return false;
      });

      if (isRoleNameKitchen || hasKitchenTask) {
        kitchenRoleIds.add(roleId);
      }
    });

    // Filter for users whose role has kitchen tasks
    const kitchenUsers = usersData.filter((u: any) => {
      if (!u) return false;
      if (typeof u.role === 'object' && u.role !== null) {
        const roleId = String(u.role._id);
        const roleName = String(u.role.name || '').toLowerCase();
        if (
          kitchenRoleIds.has(roleId) ||
          roleName.includes('kitchen') ||
          roleName.includes('cook') ||
          roleName.includes('chef') ||
          roleName.includes('kds')
        ) {
          return true;
        }
        if (Array.isArray(u.role.tasks)) {
          return u.role.tasks.some((t: any) => {
            const taskStr = typeof t === 'string' ? t : `${t?.name || ''} ${t?.endpoint || ''}`;
            return taskStr.toLowerCase().includes('kitchen') || taskStr.toLowerCase().includes('kds');
          });
        }
      }
      if (typeof u.role === 'string') {
        return kitchenRoleIds.has(u.role);
      }
      return false;
    });

    // If users with kitchen-specific role found, use them; otherwise display active users
    const targetUsers = kitchenUsers.length > 0 ? kitchenUsers : usersData;

    return targetUsers.map((u: any) => {
      const roleName =
        typeof u.role === 'object' && u.role?.name
          ? u.role.name
          : roleMap.get(String(u.role))?.name || 'Kitchen Staff';

      const fullName = `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.phone || 'Staff Member';

      return {
        _id: u._id,
        name: fullName,
        role: roleName,
        avatar: u.avatar,
        stationId: u.stationId || undefined,
        stationName: u.stationName || (typeof u.branch === 'object' ? u.branch?.name : undefined) || 'Kitchen Line',
        shiftStart: u.shiftStart || '10:00 AM',
        isActive: u.isActive !== undefined ? !!u.isActive : true,
        clockedIn: u.clockedIn !== undefined ? !!u.clockedIn : !!u.isActive,
        ticketsHandledToday: u.ticketsHandledToday || 0,
      };
    });
  } catch (err) {
    return [];
  }
};

// KITCHEN INVENTORY: Fetched directly from the Inventory API (/v1/ingredients)
export const fetchKitchenInventory = async (stationId?: string): Promise<KdsInventoryItem[]> => {
  try {
    const { data } = await api.get('/v1/ingredients');
    const rawIngredients =
      data?.data?.ingredients ||
      data?.ingredients ||
      (Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []));

    if (Array.isArray(rawIngredients)) {
      const items: KdsInventoryItem[] = rawIngredients.map((ing: any) => {
        const is86ed = ing.currentStock <= 0 || ing.isActive === false || ing.stockStatus === 'out_of_stock';
        const isLow = !is86ed && (ing.currentStock <= (ing.minStock || 5) || ing.stockStatus === 'low_stock');
        const status: 'in_stock' | 'low_stock' | '86ed' = is86ed ? '86ed' : isLow ? 'low_stock' : 'in_stock';

        const category = ing.category || 'General';

        return {
          _id: ing._id,
          name: ing.name || 'Inventory Item',
          stationId: category.toLowerCase().replace(/\s+/g, '_'),
          stationName: category.toUpperCase(),
          category,
          status,
          currentStock: typeof ing.currentStock === 'number' ? ing.currentStock : 0,
          unit: ing.unit || 'unit',
          minThreshold: typeof ing.minStock === 'number' ? ing.minStock : 0,
        };
      });

      if (stationId && stationId !== 'all') {
        const target = stationId.toLowerCase();
        return items.filter(
          (itm) => itm.stationId.toLowerCase() === target || itm.category.toLowerCase() === target
        );
      }

      return items;
    }
  } catch (err) {
    return [];
  }
  return [];
};

// ====================== QUERY HOOKS ======================
export const useKitchenStationsQuery = (branchId?: string) => {
  return useQuery<KdsStation[], AxiosError>({
    queryKey: kitchenKeys.stations(branchId),
    queryFn: () => fetchKitchenStations(branchId),
    staleTime: 60 * 1000,
  });
};

export const useKitchenStationByIdQuery = (stationIdOrCode?: string, branchId?: string) => {
  return useQuery<KdsStation | null, AxiosError>({
    queryKey: [...kitchenKeys.all, 'station', stationIdOrCode || 'none', branchId || 'all'],
    queryFn: () =>
      stationIdOrCode ? fetchKitchenStationById(stationIdOrCode, branchId) : Promise.resolve(null),
    enabled: !!stationIdOrCode,
    staleTime: 60 * 1000,
  });
};

export const useKitchenTicketsQuery = (branchId?: string, stationId?: string) => {
  return useQuery<KdsTicket[], AxiosError>({
    queryKey: kitchenKeys.tickets(branchId, stationId),
    queryFn: () => fetchKitchenTickets(branchId, stationId),
    staleTime: 5 * 1000,
    refetchInterval: 10 * 1000,
  });
};

export const useOrderTicketsQuery = (orderId: string) => {
  return useQuery<KdsTicket[], AxiosError>({
    queryKey: kitchenKeys.orderTickets(orderId),
    queryFn: () => fetchOrderTickets(orderId),
    enabled: !!orderId && orderId.length >= 2,
  });
};

export const useKitchenTicketHistoryQuery = (
  params?: TicketHistoryFilterParams,
  options?: { enabled?: boolean; refetchInterval?: number | false }
) => {
  return useQuery<TicketHistoryResponse, AxiosError>({
    queryKey: kitchenKeys.history(params),
    queryFn: () => fetchKitchenTicketHistory(params),
    staleTime: 15 * 1000,
    ...options,
  });
};

export const useKitchenStaffQuery = (branchId?: string) => {
  return useQuery<KdsStaffMember[], AxiosError>({
    queryKey: kitchenKeys.staff(branchId),
    queryFn: () => fetchKitchenStaff(branchId),
    staleTime: 60 * 1000,
  });
};

export const useKitchenInventoryQuery = (stationId?: string) => {
  return useQuery<KdsInventoryItem[], AxiosError>({
    queryKey: kitchenKeys.inventory(stationId),
    queryFn: () => fetchKitchenInventory(stationId),
    staleTime: 30 * 1000,
  });
};

// ====================== MUTATION HOOKS ======================

// PATCH /api/v1/kitchen/tickets/:ticketId/accept
export const useAcceptTicketMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ticketId: string) => {
      const { data } = await api.patch(`/v1/kitchen/tickets/${ticketId}/accept`);
      const updated = data?.data?.ticket || data?.ticket || data?.data;
      return updated ? normalizeKitchenTicket(updated) : { _id: ticketId, status: 'accepted' };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kitchenKeys.all });
      toast.success('Ticket Accepted into Kitchen');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to accept ticket');
    },
  });
};

// PATCH /api/v1/kitchen/tickets/:ticketId/start
export const useStartTicketMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ticketId: string) => {
      const { data } = await api.patch(`/v1/kitchen/tickets/${ticketId}/start`);
      const updated = data?.data?.ticket || data?.ticket || data?.data;
      return updated ? normalizeKitchenTicket(updated) : { _id: ticketId, status: 'in_progress' };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kitchenKeys.all });
      toast.info('Ticket Preparation Started');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to start ticket');
    },
  });
};

// PATCH /api/v1/kitchen/tickets/:ticketId/ready
export const useReadyTicketMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ticketId: string) => {
      const { data } = await api.patch(`/v1/kitchen/tickets/${ticketId}/ready`);
      const updated = data?.data?.ticket || data?.ticket || data?.data;
      return updated ? normalizeKitchenTicket(updated) : { _id: ticketId, status: 'ready' };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kitchenKeys.all });
      toast.success('Ticket Marked Ready for Expo / Service!');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to mark ticket ready');
    },
  });
};

// PATCH /api/v1/kitchen/tickets/:ticketId/cancel
export const useCancelTicketMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ ticketId, reason }: { ticketId: string; reason: string }) => {
      const { data } = await api.patch(`/v1/kitchen/tickets/${ticketId}/cancel`, { reason });
      const updated = data?.data?.ticket || data?.ticket || data?.data;
      return updated
        ? normalizeKitchenTicket(updated)
        : { _id: ticketId, status: 'canceled', cancelReason: reason };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kitchenKeys.all });
      toast.warning('Ticket Cancelled');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to cancel ticket');
    },
  });
};

// PATCH /api/v1/kitchen/tickets/:ticketId/status
export const useUpdateTicketStatusMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      ticketId,
      status,
      reason,
    }: {
      ticketId: string;
      status: KdsTicketStatus;
      reason?: string;
    }) => {
      const { data } = await api.patch(`/v1/kitchen/tickets/${ticketId}/status`, { status, reason });
      const updated = data?.data?.ticket || data?.ticket || data?.data;
      return updated ? normalizeKitchenTicket(updated) : { _id: ticketId, status };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kitchenKeys.all });
      toast.success('Ticket Status Updated');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to update ticket status');
    },
  });
};

// PATCH or PUT /api/v1/kitchen/tickets/:ticketId/items/:itemId/status
export const useUpdateTicketItemStatusMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      ticketId,
      itemId,
      status,
    }: {
      ticketId: string;
      itemId: string;
      status: 'pending' | 'in_progress' | 'ready';
    }) => {
      try {
        const { data } = await api.patch(`/v1/kitchen/tickets/${ticketId}/items/${itemId}/status`, { status });
        return data?.data || data;
      } catch {
        try {
          const { data } = await api.put(`/v1/kitchen/tickets/${ticketId}/items/${itemId}/status`, { status });
          return data?.data || data;
        } catch {
          const { data } = await api.patch(`/v1/kitchen/tickets/${ticketId}/item/${itemId}`, {
            completed: status === 'ready',
          });
          return data?.data || data;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kitchenKeys.all });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to update ticket item status');
    },
  });
};

// PATCH /api/v1/kitchen/tickets/:ticketId/item/:itemId
export const useToggleTicketItemMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      ticketId,
      itemId,
      completed,
    }: {
      ticketId: string;
      itemId: string;
      completed: boolean;
    }) => {
      const { data } = await api.patch(`/v1/kitchen/tickets/${ticketId}/item/${itemId}`, { completed });
      return data?.data?.ticket || data?.ticket || data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kitchenKeys.all });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to update ticket item');
    },
  });
};

// PATCH /api/v1/ingredients/:itemId (Inventory 86 Toggle)
export const useToggle86ItemMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      itemId,
      status,
    }: {
      itemId: string;
      status: 'in_stock' | 'low_stock' | '86ed';
    }) => {
      if (status === '86ed') {
        await api.patch(`/v1/ingredients/${itemId}`, { isActive: false });
      } else {
        await api.patch(`/v1/ingredients/${itemId}`, { isActive: true });
      }
      return { itemId, status };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: kitchenKeys.all });
      queryClient.invalidateQueries({ queryKey: ['ingredientsList'] });
      queryClient.invalidateQueries({ queryKey: ['lowStockItems'] });
      if (variables.status === '86ed') {
        toast.error('Item marked 86 (Out of Stock)');
      } else if (variables.status === 'low_stock') {
        toast.warning('Item marked Low Stock');
      } else {
        toast.success('Item restored In Stock');
      }
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to update inventory status');
    },
  });
};

// POST /api/v1/kitchen/emergency-stop
export const useEmergencyStopMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      branchId,
      paused,
      reason,
    }: {
      branchId?: string;
      paused: boolean;
      reason?: string;
    }) => {
      const validBranchId = isValidObjectId(branchId) ? branchId : undefined;
      const { data } = await api.post('/v1/kitchen/emergency-stop', {
        branchId: validBranchId,
        paused,
        reason,
      });
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: kitchenKeys.all });
      if (variables.paused) {
        toast.error('EMERGENCY STOP ACTIVATED: Kitchen Incoming Orders Paused');
      } else {
        toast.success('Emergency Stop Lifted: Kitchen Operations Resumed');
      }
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to toggle emergency stop');
    },
  });
};

// ====================== STATION CRUD MUTATIONS ======================

// POST /api/v1/kitchen/stations
export const useCreateStationMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dto: CreateKitchenStationDto) => {
      const codeUpper = (dto.code || '').trim().toUpperCase();
      if (!dto.name?.trim()) {
        throw new Error('Station name is required');
      }
      if (!codeUpper) {
        throw new Error('Station code is required');
      }

      const validBranchId = isValidObjectId(dto.branchId) ? dto.branchId : undefined;

      const { data } = await api.post('/v1/kitchen/stations', {
        name: dto.name.trim(),
        code: codeUpper,
        description: dto.description?.trim() || '',
        displayOrder: typeof dto.displayOrder === 'number' ? dto.displayOrder : undefined,
        color: dto.color || '#3B82F6',
        branchId: validBranchId,
      });
      const created = data?.data?.station || data?.station || data?.data;
      return created ? normalizeKitchenStation(created) : null;
    },
    onSuccess: (newStation) => {
      queryClient.invalidateQueries({ queryKey: kitchenKeys.all });
      toast.success(`Kitchen Station '${newStation?.name || 'Station'}' created successfully`);
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || error.message || 'Failed to create kitchen station';
      toast.error(msg);
    },
  });
};

// PATCH /api/v1/kitchen/stations/:id
export const useUpdateStationMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      stationId,
      data: dto,
    }: {
      stationId: string;
      data: UpdateKitchenStationDto;
    }) => {
      const codeUpper = dto.code ? dto.code.trim().toUpperCase() : undefined;

      const { data } = await api.patch(`/v1/kitchen/stations/${stationId}`, {
        ...dto,
        ...(codeUpper ? { code: codeUpper } : {}),
      });
      const updated = data?.data?.station || data?.station || data?.data;
      return updated ? normalizeKitchenStation(updated) : null;
    },
    onSuccess: (station) => {
      queryClient.invalidateQueries({ queryKey: kitchenKeys.all });
      toast.success(`Kitchen Station '${station?.name || 'Station'}' updated`);
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || error.message || 'Failed to update kitchen station';
      toast.error(msg);
    },
  });
};

// DELETE /api/v1/kitchen/stations/:id
export const useDeleteStationMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ stationId, hardDelete }: { stationId: string; hardDelete?: boolean }) => {
      const { data } = await api.delete(`/v1/kitchen/stations/${stationId}`, {
        params: { hardDelete },
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kitchenKeys.all });
      toast.success('Kitchen station deleted / deactivated');
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || error.message || 'Failed to delete kitchen station';
      toast.error(msg);
    },
  });
};

// ====================== MENU ITEM STATION ASSIGNMENT ======================
export const assignMenuItemStation = async ({
  menuItemId,
  stationId,
}: {
  menuItemId: string;
  stationId: string | null;
}) => {
  const validStationId = isValidObjectId(stationId) ? stationId : null;
  const { data } = await api.patch(`/v1/kitchen/menu-items/${menuItemId}/station`, {
    stationId: validStationId,
  });
  return data?.data?.menuItem || data?.data || data;
};

export const useAssignMenuItemStationMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: assignMenuItemStation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu'] });
      queryClient.invalidateQueries({ queryKey: ['kitchen'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to assign kitchen station');
    },
  });
};

export const useAssignMenuItemStation = useAssignMenuItemStationMutation;
