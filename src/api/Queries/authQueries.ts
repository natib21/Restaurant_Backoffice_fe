// src/api/queries/authQueries.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useNavigate } from 'react-router-dom';

// === Types ===
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  passwordConfirm: string;
  phone: string;
  business: string;
}

export interface ForgotPasswordCredentials {
  email: string;
}

export interface ResetPasswordCredentials {
  token: string;
  password: string;
  passwordConfirm: string;
}

export interface VerifyEmailCredentials {
  token: string;
}

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  emailConfirmed: boolean;
  phone: string;
  avatar?: string;
  role: {
    _id: string;
    name: string;
    description: string;
    tasks: Array<{
      _id: string;
      name: string;
      endpoint: string;
      method: string;
      description: string;
    }>;
    id: string;
  };
  isActive: boolean;
  merchant: {
    _id: string;
    businessName: boolean;
    mode: string;
    publicWebsite: string;
    status: string;
  };
  branch: [
    {
      _id: string;
      name: string;
      location?: {
        type: 'Point';
        coordinates: [number, number];
        city: string;
        formattedAddress: string;
      };
      merchant?: string;
      isMain: boolean;
      publicUrl?: string;
      branchCode?: string;
      shortCode?: string;
      isActive: boolean;
      id: string;
    },
  ];
  createdAt: string;
  history?: any[];
  __v?: number;
}

export interface AuthResponse {
  status: string;
  token?: string;
  data?: {
    user?: User;
  };
  message?: string;
}

const loginApi = async (
  credentials: LoginCredentials
): Promise<AuthResponse> => {
  const response = await api.post('/v1/auth/login', credentials);
  return response.data;
};

const registerApi = async (
  credentials: RegisterCredentials
): Promise<AuthResponse> => {
  const response = await api.post('/v1/auth/signup', credentials);
  return response.data;
};

const forgotPasswordApi = async (credentials: ForgotPasswordCredentials) => {
  const response = await api.post('/v1/auth/forgot-password', credentials);
  return response.data;
};

const resetPasswordApi = async (
  credentials: ResetPasswordCredentials
): Promise<AuthResponse> => {
  const { token, password, passwordConfirm } = credentials;
  const response = await api.patch(`/v1/auth/reset-password/${token}`, {
    password,
    passwordConfirm,
  });
  return response.data;
};

const verifyEmailApi = async (token: string) => {
  const response = await api.get(`/auth/verify-email/${token}`);
  return response.data;
};

const getMeApi = async (): Promise<User> => {
<<<<<<< HEAD
  const response = await api.get('/v1/users/me');
=======
  const response = await api.get('/v1/user/getMe');
>>>>>>> e6a30dd025b29dafd404c32f005174dd65ee239c
  return response.data.data?.user ?? response.data.user ?? null;
};

// src/api/queries/authQueries.ts
export const useLoginMutation = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: loginApi,
    onSuccess: (data: AuthResponse) => {
      // No token in response body anymore! Cookie is set automatically
      // Backend now returns: { status: 'success', data: { user } }

      if (data.data?.user) {
        // Cache the user immediately
        queryClient.setQueryData(['user'], data.data.user);

        // Navigate to dashboard (or intended page)
        navigate('/dashboard', { replace: true });
      }
    },
    onError: (error: any) => {
      console.error('Login failed:', error);
      // Optional: toast.error(error.response?.data?.message || 'Login failed');
    },
  });
};

export const useLogoutMutation = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
<<<<<<< HEAD
    mutationFn: () => api.post('/v1/auth/logout'),
=======
    mutationFn: () => api.post('/v1/user/logout'),
>>>>>>> e6a30dd025b29dafd404c32f005174dd65ee239c
    onSuccess: () => {
      // Clear all cached data
      queryClient.clear();
      queryClient.setQueryData(['user'], null);

      // Redirect to login
      navigate('/login', { replace: true });
    },
    onError: (error) => {
      console.error('Logout failed:', error);
      // Still force logout client-side
      queryClient.clear();
      queryClient.setQueryData(['user'], null);
      navigate('/login', { replace: true });
    },
  });
};
export const useRegisterMutation = () => {
  return useMutation({
    mutationFn: registerApi,
    onSuccess: (data) => {
      console.log('Registration successful:', data);
      // No token returned → user must verify email
    },
  });
};

export const useForgotPasswordMutation = () => {
  return useMutation({
    mutationFn: forgotPasswordApi,
    onSuccess: (data) => {
      console.log('Reset link sent:', data);
    },
  });
};

export const useResetPasswordMutation = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: resetPasswordApi,
<<<<<<< HEAD
    onSuccess: (data: AuthResponse) => {
      if (data.data?.user) {
=======
    onSuccess: (data) => {
      if (data.token && data.data?.user) {
>>>>>>> e6a30dd025b29dafd404c32f005174dd65ee239c
        queryClient.setQueryData(['user'], data.data.user);
        navigate('/dashboard', { replace: true });
      }
    },
  });
};

export const useVerifyEmailMutation = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: ({ token }: { token: string }) => verifyEmailApi(token),
    onSuccess: (data: AuthResponse) => {
      if (data.data?.user) {
        queryClient.setQueryData(['user'], data.data.user);
        navigate('/dashboard', { replace: true });
      }
    },
  });
};

export const useGetMeQuery = () => {
  return useQuery({
    queryKey: ['user'],
    queryFn: getMeApi,
    staleTime: 1000 * 60 * 10, // 10 minutes
    retry: 1,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
};
