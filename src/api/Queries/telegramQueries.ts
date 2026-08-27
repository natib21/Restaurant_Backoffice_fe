// src/api/Queries/telegramQueries.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api-client';

export interface TelegramSettings {
  deliveryEnabled: boolean;
  notificationsEnabled: boolean;
  marketingEnabled: boolean;
}

export interface TelegramStatusResponse {
  connected: boolean;
  botUsername?: string;
  connectedAt?: string;
  linkedCustomersCount: number;
  optInCount: number;
  settings: TelegramSettings;
  deepLink?: string;
}

export interface ConnectTelegramBotInput {
  botToken: string;
}

export interface ConnectTelegramBotResponse {
  botUsername: string;
  deepLink: string;
}

export interface UpdateTelegramSettingsInput {
  deliveryEnabled?: boolean;
  notificationsEnabled?: boolean;
  marketingEnabled?: boolean;
}

export interface BroadcastTelegramInput {
  text: string;
  promoCode?: string;
}

export interface BroadcastTelegramResponse {
  total: number;
  sent: number;
  failed: number;
}

export interface TelegramConversationCustomer {
  _id: string;
  fullName: string;
  phone: string;
  telegram?: {
    username?: string;
    optIn?: boolean;
    lastInteractionAt?: string;
  };
}

export interface TelegramLastMessage {
  text: string;
  direction: 'in' | 'out';
  createdAt: string;
}

export interface TelegramConversation {
  customer: TelegramConversationCustomer;
  lastMessage: TelegramLastMessage;
  unreadCount: number;
}

export interface TelegramConversationsResponse {
  conversations: TelegramConversation[];
}

export interface TelegramThreadMessage {
  _id: string;
  direction: 'in' | 'out';
  text: string;
  status?: 'sent' | 'failed' | 'pending';
  error?: string;
  createdAt: string;
  readAt?: string;
  isRead?: boolean;
}

export interface TelegramThreadResponse {
  customer: TelegramConversationCustomer;
  messages: TelegramThreadMessage[];
}

export interface SendTelegramMessageInput {
  customerId: string;
  text: string;
}

export const telegramKeys = {
  all: ['telegram'] as const,
  status: (merchantId: string) => ['telegram', 'status', merchantId] as const,
  conversations: (merchantId: string) => ['telegram', 'conversations', merchantId] as const,
  thread: (merchantId: string, customerId: string) => ['telegram', 'thread', merchantId, customerId] as const,
};

// GET /v1/merchant/:merchantId/telegram/status
export const fetchTelegramStatus = async (merchantId: string): Promise<TelegramStatusResponse> => {
  try {
    const response = await apiClient.get<TelegramStatusResponse>(
      `/v1/merchant/${merchantId}/telegram/status`
    );
    return response.data;
  } catch (err: any) {
    // Fallback URL if apiClient has double /v1 or single prefix
    const response = await apiClient.get<TelegramStatusResponse>(
      `/merchant/${merchantId}/telegram/status`
    );
    return response.data;
  }
};

export const useTelegramStatusQuery = (merchantId: string | undefined) => {
  return useQuery({
    queryKey: telegramKeys.status(merchantId || ''),
    queryFn: () => fetchTelegramStatus(merchantId!),
    enabled: !!merchantId,
    refetchInterval: 10000,
  });
};

// POST /v1/merchant/:merchantId/telegram/connect
export const connectTelegramBot = async (
  merchantId: string,
  data: ConnectTelegramBotInput
): Promise<ConnectTelegramBotResponse> => {
  try {
    const response = await apiClient.post<ConnectTelegramBotResponse>(
      `/v1/merchant/${merchantId}/telegram/connect`,
      data
    );
    return response.data;
  } catch (err) {
    const response = await apiClient.post<ConnectTelegramBotResponse>(
      `/merchant/${merchantId}/telegram/connect`,
      data
    );
    return response.data;
  }
};

export const useConnectTelegramBotMutation = (merchantId: string | undefined) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ConnectTelegramBotInput) => connectTelegramBot(merchantId!, data),
    onSuccess: () => {
      if (merchantId) {
        queryClient.invalidateQueries({ queryKey: telegramKeys.status(merchantId) });
      }
    },
  });
};

// PATCH /v1/merchant/:merchantId/telegram/settings
export const updateTelegramSettings = async (
  merchantId: string,
  settings: UpdateTelegramSettingsInput
): Promise<TelegramSettings> => {
  try {
    const response = await apiClient.patch(
      `/v1/merchant/${merchantId}/telegram/settings`,
      settings
    );
    return response.data;
  } catch (err) {
    const response = await apiClient.patch(
      `/merchant/${merchantId}/telegram/settings`,
      settings
    );
    return response.data;
  }
};

export const useUpdateTelegramSettingsMutation = (merchantId: string | undefined) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateTelegramSettingsInput) => updateTelegramSettings(merchantId!, data),
    onMutate: async (newSettings) => {
      if (!merchantId) return;
      await queryClient.cancelQueries({ queryKey: telegramKeys.status(merchantId) });
      const previousStatus = queryClient.getQueryData<TelegramStatusResponse>(
        telegramKeys.status(merchantId)
      );

      if (previousStatus) {
        queryClient.setQueryData<TelegramStatusResponse>(telegramKeys.status(merchantId), {
          ...previousStatus,
          settings: {
            ...previousStatus.settings,
            ...newSettings,
          },
        });
      }

      return { previousStatus };
    },
    onError: (_err, _variables, context) => {
      if (merchantId && context?.previousStatus) {
        queryClient.setQueryData(telegramKeys.status(merchantId), context.previousStatus);
      }
    },
    onSettled: () => {
      if (merchantId) {
        queryClient.invalidateQueries({ queryKey: telegramKeys.status(merchantId) });
      }
    },
  });
};

// DELETE /v1/merchant/:merchantId/telegram/disconnect
export const disconnectTelegramBot = async (merchantId: string): Promise<void> => {
  try {
    await apiClient.delete(`/v1/merchant/${merchantId}/telegram/disconnect`);
  } catch (err) {
    await apiClient.delete(`/merchant/${merchantId}/telegram/disconnect`);
  }
};

export const useDisconnectTelegramBotMutation = (merchantId: string | undefined) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => disconnectTelegramBot(merchantId!),
    onSuccess: () => {
      if (merchantId) {
        queryClient.invalidateQueries({ queryKey: telegramKeys.status(merchantId) });
        queryClient.invalidateQueries({ queryKey: telegramKeys.conversations(merchantId) });
      }
    },
  });
};

// POST /v1/merchant/:merchantId/telegram/broadcast
export const sendTelegramBroadcast = async (
  merchantId: string,
  data: BroadcastTelegramInput
): Promise<BroadcastTelegramResponse> => {
  try {
    const response = await apiClient.post<BroadcastTelegramResponse>(
      `/v1/merchant/${merchantId}/telegram/broadcast`,
      data
    );
    return response.data;
  } catch (err) {
    const response = await apiClient.post<BroadcastTelegramResponse>(
      `/merchant/${merchantId}/telegram/broadcast`,
      data
    );
    return response.data;
  }
};

export const useSendTelegramBroadcastMutation = (merchantId: string | undefined) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: BroadcastTelegramInput) => sendTelegramBroadcast(merchantId!, data),
    onSuccess: () => {
      if (merchantId) {
        queryClient.invalidateQueries({ queryKey: telegramKeys.status(merchantId) });
      }
    },
  });
};

// GET /v1/merchant/:merchantId/telegram/conversations
export const fetchTelegramConversations = async (merchantId: string): Promise<TelegramConversation[]> => {
  try {
    const response = await apiClient.get<TelegramConversationsResponse>(
      `/v1/merchant/${merchantId}/telegram/conversations`
    );
    return response.data.conversations || [];
  } catch (err) {
    const response = await apiClient.get<TelegramConversationsResponse>(
      `/merchant/${merchantId}/telegram/conversations`
    );
    return response.data.conversations || [];
  }
};

export const useTelegramConversationsQuery = (merchantId: string | undefined) => {
  return useQuery({
    queryKey: telegramKeys.conversations(merchantId || ''),
    queryFn: () => fetchTelegramConversations(merchantId!),
    enabled: !!merchantId,
    refetchInterval: 7000,
  });
};

// GET /v1/merchant/:merchantId/telegram/conversations/:customerId
export const fetchTelegramThread = async (
  merchantId: string,
  customerId: string
): Promise<TelegramThreadResponse> => {
  try {
    const response = await apiClient.get<TelegramThreadResponse>(
      `/v1/merchant/${merchantId}/telegram/conversations/${customerId}`
    );
    return response.data;
  } catch (err) {
    const response = await apiClient.get<TelegramThreadResponse>(
      `/merchant/${merchantId}/telegram/conversations/${customerId}`
    );
    return response.data;
  }
};

export const useTelegramThreadQuery = (
  merchantId: string | undefined,
  customerId: string | null
) => {
  return useQuery({
    queryKey: telegramKeys.thread(merchantId || '', customerId || ''),
    queryFn: () => fetchTelegramThread(merchantId!, customerId!),
    enabled: !!merchantId && !!customerId,
    refetchInterval: 3000,
  });
};

// PATCH /v1/merchant/:merchantId/telegram/conversations/:customerId/read
export const markTelegramConversationAsRead = async (
  merchantId: string,
  customerId: string
): Promise<void> => {
  try {
    await apiClient.patch(
      `/v1/merchant/${merchantId}/telegram/conversations/${customerId}/read`
    );
  } catch (err) {
    await apiClient.patch(
      `/merchant/${merchantId}/telegram/conversations/${customerId}/read`
    );
  }
};

export const useMarkTelegramAsReadMutation = (merchantId: string | undefined) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (customerId: string) =>
      markTelegramConversationAsRead(merchantId!, customerId),
    onSuccess: (_, customerId) => {
      if (merchantId) {
        queryClient.invalidateQueries({
          queryKey: telegramKeys.conversations(merchantId),
        });
        queryClient.invalidateQueries({
          queryKey: telegramKeys.thread(merchantId, customerId),
        });
      }
    },
  });
};

// POST /v1/merchant/:merchantId/telegram/send
export const sendTelegramMessage = async (
  merchantId: string,
  data: SendTelegramMessageInput
): Promise<void> => {
  try {
    await apiClient.post(`/v1/merchant/${merchantId}/telegram/send`, data);
  } catch (err) {
    await apiClient.post(`/merchant/${merchantId}/telegram/send`, data);
  }
};

export const useSendTelegramMessageMutation = (merchantId: string | undefined) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SendTelegramMessageInput) =>
      sendTelegramMessage(merchantId!, data),
    onSuccess: (_, variables) => {
      if (merchantId) {
        queryClient.invalidateQueries({
          queryKey: telegramKeys.thread(merchantId, variables.customerId),
        });
        queryClient.invalidateQueries({
          queryKey: telegramKeys.conversations(merchantId),
        });
      }
    },
  });
};
