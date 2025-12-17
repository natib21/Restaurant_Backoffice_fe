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
  branch: {
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
    id: string;
  };
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
  const response = await api.post('/v1/user/login', credentials);
  return response.data;
};

const registerApi = async (
  credentials: RegisterCredentials
): Promise<AuthResponse> => {
  const response = await api.post('/v1/user/signup', credentials);
  return response.data;
};

const forgotPasswordApi = async (credentials: ForgotPasswordCredentials) => {
  const response = await api.post('/auth/forgot-password', credentials);
  return response.data;
};

const resetPasswordApi = async (credentials: ResetPasswordCredentials) => {
  const response = await api.post('/auth/reset-password', credentials);
  return response.data;
};

const verifyEmailApi = async (token: string) => {
  const response = await api.get(`/auth/verify-email/${token}`);
  return response.data;
};

const getMeApi = async (): Promise<User> => {
  const response = await api.get('/auth/me');
  return response.data.data?.user || response.data.user;
};

// === React Query Hooks ===
export const useLoginMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: loginApi,
    onSuccess: (data: AuthResponse) => {
      if (data.token) {
        localStorage.setItem('token', data.token);
        if (data.data?.user) {
          queryClient.setQueryData(['user'], data.data.user);
        }
      }
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
    onSuccess: (data) => {
      if (data.token && data.data?.user) {
        localStorage.setItem('token', data.token);
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
      if (data.token && data.data?.user) {
        localStorage.setItem('token', data.token);
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
    enabled: !!localStorage.getItem('token'),
    staleTime: 1000 * 60 * 10,
    retry: 1,
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    queryClient.clear();
    queryClient.setQueryData(['user'], null);
    navigate('/login', { replace: true });
  };
};
