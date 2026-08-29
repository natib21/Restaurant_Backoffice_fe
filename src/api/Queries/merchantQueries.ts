// src/api/queries/merchantQueries.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';

export interface MerchantLocation {
  address: string;
  city: string;
  subcity: string;
}

export interface MerchantDocument {
  name: string;
  type: string;
  url: string;
  uploadedAt: string;
}

export interface MerchantFeatures {
  core?: {
    menu?: { enabled: boolean };
    tableManagement?: { enabled: boolean };
    [key: string]: any;
  };
  optional?: {
    orders?: { enabled: boolean };
    inventory?: { enabled: boolean };
    multiBranch?: { enabled: boolean };
    telegram?: { enabled: boolean };
    sales?: { enabled: boolean };
    reports?: { enabled: boolean };
    customerManagement?: { enabled: boolean };
    deliveryManagement?: { enabled: boolean };
    paymentIntegration?: { enabled: boolean };
    restaurantWebsite?: { enabled: boolean };
    [key: string]: any;
  };
}

export interface MerchantSettings {
  // QR Code
  showTableNumberOnQR?: boolean;
  qrStyle?: 'classic' | 'modern' | 'rounded' | 'dots';
  qrLogoEnabled?: boolean;
  qrForegroundColor?: string;
  qrBackgroundColor?: string;

  // Tips
  tipsEnabled?: boolean;
  tipOptions?: number[];
  allowCustomTip?: boolean;

  // Language
  language?: 'en' | 'am' | 'both';
  defaultLanguage?: 'en' | 'am';

  // Notifications
  notifications?: {
    orderSoundEnabled?: boolean;
    newOrderSound?: string;
    smsNotifications?: boolean;
    emailNotifications?: boolean;
  };

  // Pricing
  currency?: 'ETB' | 'USD';
  taxRate?: number;
  serviceCharge?: number;

  // Operations
  onlineOrderingEnabled?: boolean;
  deliveryEnabled?: boolean;
  pickupEnabled?: boolean;
  autoAcceptOrders?: boolean;
  requireWaiterConfirmation?: boolean;
  prepTimeMinutes?: number;

  businessHours?: Record<string, { enabled: boolean; open: string; close: string }>;
  [key: string]: any;
}

export interface Merchant {
  _id: string;
  businessName: string;
  ownerName?: string;
  slug?: string;
  customDomain?: string | null;
  customDomainVerified?: boolean;
  phone: string;
  taxId?: string;
  location: MerchantLocation;
  address?: string;
  sector?: 'Cafe' | 'Restaurant' | 'Hotel' | 'Food Truck' | 'Ghost Kitchen' | 'Bakery' | 'Other' | string;
  cuisineType?: string[];
  brandColor?: string;
  logo?: any;
  coverImage?: any;
  documents?: MerchantDocument[];
  tinId?: string;
  licenseNumber?: string;
  tradeLicense?: {
    url?: string;
    public_id?: string;
    verified?: boolean;
    licenseNumber?: string;
  };
  trialDaysLeft?: number;
  trialExpiresAt?: string;
  hasActiveAccess?: boolean;
  isSubscriptionActive?: boolean;
  features?: MerchantFeatures;
  mode?: string;
  status: 'pending' | 'approved' | 'suspended' | 'inactive';
  isActive?: boolean;
  subscriptionPlan?: 'free' | 'basic' | 'pro' | 'enterprise' | 'feature' | 'trial' | string;
  settings?: MerchantSettings;
  owner: {
    fullName: string;
    gender: 'Male' | 'Female';
    phone: string;
    email: string;
  };

  approvedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  suspendedReason?: string;
  suspendedAt?: string;
  branchCounter?: number;
  createdAt: string;
  updatedAt: string;
  // sometimes populated
  userCount?: number;
  documentCount?: number;
}

/* ======================================================
   User (Staff) Types
====================================================== */

export interface StaffUser {
  _id: string;
  firstName: string;
  lastName?: string;
  phone: string;
  email?: string;
  role?: string | {
    _id: string;
    name: string;
    description?: string;
  };
  branch?: string | {
    _id: string;
    name: string;
  };
  createdAt?: string;
  isActive: boolean;
  hireDate?: string;
  employmentStatus?: string;
  employmentType?: string;
  type?: string;
  salary?: number | string;
}

/* ======================================================
   Role Types
====================================================== */

export interface TaskReference {
  _id: string;
  name: string;
  endpoint?: string;
  method?: string;
  description?: string;
}

export interface MerchantRole {
  _id: string;
  name: string;
  description?: string;
  tasks: TaskReference[] | string[]; // populated or IDs
  merchant: string;
  isActive: boolean;
  isSystemRole: boolean;
  isSubscriptionBased: boolean;
  createdAt: string;
}

/* ======================================================
   Query Keys
====================================================== */

const merchantKeys = {
  all: ['merchant'] as const,
  list: () => [...merchantKeys.all, 'list'] as const,
  detail: (id: string) => [...merchantKeys.all, 'detail', id] as const,
  profile: () => [...merchantKeys.all, 'profile'] as const,
  stats: (id: string) => [...merchantKeys.all, 'stats', id] as const,
};

const staffKeys = {
  all: ['merchant', 'staff'] as const,
  list: () => [...staffKeys.all, 'list'] as const,
  detail: (id: string) => [...staffKeys.all, 'detail', id] as const,
  byBranch: (branchId: string) =>
    [...staffKeys.all, 'by-branch', branchId] as const,
};

const roleKeys = {
  all: ['merchant', 'roles'] as const,
  list: () => [...roleKeys.all, 'list'] as const,
  detail: (id: string) => [...roleKeys.all, 'detail', id] as const,
};

/* ======================================================
   API Calls - Merchant (Admin / Back-office)
====================================================== */

const fetchAllMerchants = async (): Promise<Merchant[]> => {
// const fetchAllMerchants = async (): Promise<Merchant[]> => {
//   const { data } = await api.get('/v1/merchants');
//   return data.data.merchants;
// };
  const { data } = await api.get('/v1/merchant');

  // const { data } = await api.get('/v1/merchants');

  return data.data.merchants;
};

const fetchMerchant = async (id: string): Promise<Merchant> => {
  const { data } = await api.get(`/v1/merchant/${id}`);
  return data.data.merchant;
};

const fetchMerchantStats = async (id: string): Promise<any> => {
  const { data } = await api.get(`/v1/merchant/${id}/stats`);
  return data.data.stats;
};

/* ======================================================
   API Calls - Merchant Self
====================================================== */

const fetchMyMerchant = async (): Promise<Merchant> => {
  try {
    const { data } = await api.get('/v1/merchants/me');
    return data?.data?.merchant || data?.data?.user?.merchant || data?.merchant || data?.user?.merchant || data?.data;
  } catch (err: any) {
    try {
      const { data } = await api.get('/v1/merchant/me');
      return data?.data?.merchant || data?.data?.user?.merchant || data?.merchant || data?.user?.merchant || data?.data;
    } catch {
      const { data } = await api.get('/v1/users/me');
      return data?.data?.user?.merchant || data?.data?.merchant || data?.merchant || data?.user?.merchant || data?.data;
    }
  }
};

const updateMe = async (payload: any): Promise<Merchant> => {
  let data;
  try {
    const res = await api.patch('/v1/merchants/me', payload);
    data = res.data;
  } catch (err: any) {
    try {
      const res = await api.patch('/v1/merchant/me', payload);
      data = res.data;
    } catch (fallbackErr) {
      throw err;
    }
  }
  return data?.data?.merchant || data?.merchant || data?.data;
};

const fetchMerchantStaff = async (): Promise<StaffUser[]> => {
  const { data } = await api.get('/v1/merchant/users');
  return data.data.users;
};

const fetchMerchantStaffMember = async (id: string): Promise<StaffUser> => {
  const { data } = await api.get(`/v1/merchant/users/${id}`);
  return data.data.user;
};

const createStaffMember = async (payload: any): Promise<StaffUser> => {
  const { data } = await api.post('/v1/merchant/users', payload);
  return data.data.user;
};

const updateStaffMember = async ({
  id,
  ...payload
}: { id: string } & Partial<StaffUser>): Promise<StaffUser> => {
  const { data } = await api.patch(`/v1/merchant/users/${id}`, payload);
  return data.data.user;
};

const deactivateStaffMember = async (id: string): Promise<void> => {
  await api.delete(`/v1/merchant/users/${id}`);
};

const activateStaffMember = async (id: string): Promise<StaffUser> => {
  const { data } = await api.patch(`/v1/merchant/users/${id}/activate`);
  return data.data.user;
};
// API Calls - Staff / Users (merchant-self scope)

const fetchMerchantStaffByBranch = async (
  branchId: string
): Promise<{
  branch: { _id: string; name: string };
  users: StaffUser[];
}> => {
  const { data } = await api.get(`/v1/merchant/users/branch/${branchId}`);
  return data.data;
};
/* ======================================================
   API Calls - Roles (merchant-self scope)
====================================================== */

const fetchMerchantRoles = async (): Promise<MerchantRole[]> => {
  const { data } = await api.get('/v1/merchant/roles');
  return data.data.roles;
};

const fetchMerchantRole = async (id: string): Promise<MerchantRole> => {
  const { data } = await api.get(`/v1/merchant/roles/${id}`);
  return data.data.role;
};

const createMerchantRole = async (payload: {
  name: string;
  description: string;
  tasks: string[];
}): Promise<MerchantRole> => {
  const { data } = await api.post('/v1/merchant/roles', payload);
  return data.data.role;
};

const updateMerchantRole = async ({
  id,
  ...payload
}: { id: string } & Partial<MerchantRole>): Promise<MerchantRole> => {
  const { data } = await api.patch(`/v1/merchant/roles/${id}`, payload);
  return data.data.role;
};

const deactivateMerchantRole = async (id: string): Promise<void> => {
  await api.delete(`/v1/merchant/roles/${id}`);
};

const activateMerchantRole = async (id: string): Promise<MerchantRole> => {
  const { data } = await api.patch(`/v1/merchant/roles/${id}/activate`);
  return data.data.role;
};

/* ======================================================
   Hooks - Merchant (Admin / Back-office)
====================================================== */

export const useMerchantsQuery = () =>
  useQuery<Merchant[], AxiosError>({
    queryKey: merchantKeys.list(),
    queryFn: fetchAllMerchants,
    staleTime: 4 * 60 * 1000,
  });

export const useMerchantQuery = (id?: string) =>
  useQuery<Merchant, AxiosError>({
    queryKey: merchantKeys.detail(id!),
    queryFn: () => fetchMerchant(id!),
    enabled: !!id,
  });

export const useMerchantStatsQuery = (id?: string) =>
  useQuery<any, AxiosError>({
    queryKey: merchantKeys.stats(id!),
    queryFn: () => fetchMerchantStats(id!),
    enabled: !!id,
    staleTime: 90 * 1000,
  });

/* ======================================================
   Hooks - My Merchant Profile
====================================================== */

export const useMyMerchantQuery = () =>
  useQuery<Merchant, AxiosError>({
    queryKey: merchantKeys.profile(),
    queryFn: fetchMyMerchant,
    staleTime: 10 * 60 * 1000,
  });
export const useUpdateMeMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<Merchant, AxiosError<any>, any>({
    mutationFn: updateMe,
    onSuccess: (updatedMerchant) => {
      queryClient.setQueryData(merchantKeys.profile(), updatedMerchant);
      queryClient.invalidateQueries({ queryKey: merchantKeys.profile() });
      toast.success('Merchant settings updated successfully');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Update failed');
    },
  });
};
/* ======================================================
   Hooks - Staff Management (Merchant-self)
====================================================== */

export const useMerchantStaffQuery = () =>
  useQuery<StaffUser[], AxiosError>({
    queryKey: staffKeys.list(),
    queryFn: fetchMerchantStaff,
    staleTime: 3 * 60 * 1000,
  });

export const useMerchantStaffMemberQuery = (id?: string) =>
  useQuery<StaffUser, AxiosError>({
    queryKey: staffKeys.detail(id!),
    queryFn: () => fetchMerchantStaffMember(id!),
    enabled: !!id,
  });

export const useCreateStaffMemberMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createStaffMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffKeys.list() });
      toast.success('Staff member created');
    },
    onError: (err: AxiosError<any>) =>
      toast.error(err.response?.data?.message || 'Failed to create staff'),
  });
};

export const useUpdateStaffMemberMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateStaffMember,
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: staffKeys.list() });
      queryClient.invalidateQueries({ queryKey: staffKeys.detail(vars.id) });
      toast.success('Staff member updated');
    },
    onError: (err: AxiosError<any>) =>
      toast.error(err.response?.data?.message || 'Update failed'),
  });
};

export const useDeactivateStaffMemberMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deactivateStaffMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffKeys.list() });
      toast.success('Staff member deactivated');
    },
    onError: () => toast.error('Deactivation failed'),
  });
};

export const useActivateStaffMemberMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: activateStaffMember,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: staffKeys.list() });
      queryClient.invalidateQueries({ queryKey: staffKeys.detail(id) });
      toast.success('Staff member reactivated');
    },
    onError: () => toast.error('Activation failed'),
  });
};

export const useMerchantStaffByBranchQuery = (branchId?: string | null) =>
  useQuery<
    { branch: { _id: string; name: string }; users: StaffUser[] },
    AxiosError
  >({
    queryKey: staffKeys.byBranch(branchId!),
    queryFn: () => fetchMerchantStaffByBranch(branchId!),
    enabled: !!branchId,
    staleTime: 3 * 60 * 1000,
  });

export const useMerchantRolesQuery = () =>
  useQuery<MerchantRole[], AxiosError>({
    queryKey: roleKeys.list(),
    queryFn: fetchMerchantRoles,
    staleTime: 5 * 60 * 1000,
  });

export const useMerchantRoleQuery = (id?: string) =>
  useQuery<MerchantRole, AxiosError>({
    queryKey: roleKeys.detail(id!),
    queryFn: () => fetchMerchantRole(id!),
    enabled: !!id,
  });

export const useCreateMerchantRoleMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createMerchantRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.list() });
      toast.success('Role created successfully');
    },
    onError: (err: AxiosError<any>) =>
      toast.error(err.response?.data?.message || 'Failed to create role'),
  });
};

export const useUpdateMerchantRoleMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateMerchantRole,
    onSuccess: (data, vars) => {
      queryClient.invalidateQueries({ queryKey: roleKeys.list() });
      queryClient.setQueryData(roleKeys.detail(vars.id), data);
      toast.success('Role updated');
    },
    onError: (err: AxiosError<any>) =>
      toast.error(err.response?.data?.message || 'Update failed'),
  });
};

export const useDeactivateMerchantRoleMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deactivateMerchantRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.list() });
      toast.success('Role deactivated');
    },
    onError: () => toast.error('Deactivation failed'),
  });
};

export const useActivateMerchantRoleMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: activateMerchantRole,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: roleKeys.list() });
      queryClient.invalidateQueries({ queryKey: roleKeys.detail(id) });
      toast.success('Role reactivated');
    },
    onError: () => toast.error('Activation failed'),
  });
};
