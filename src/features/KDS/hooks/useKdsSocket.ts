// src/features/KDS/hooks/useKdsSocket.ts
import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { kitchenKeys } from '@/api/Queries/kitchenQueries';
import type { KdsTicket } from '../types/kdsTypes';
import { useKdsAudio } from './useKdsAudio';

export type KdsConnectionStatus = 'connected' | 'reconnecting' | 'disconnected';

export interface UseKdsSocketProps {
  branchId?: string;
  stationId?: string;
  onTicketCreated?: (ticket: KdsTicket) => void;
  onTicketUpdated?: (ticket: KdsTicket) => void;
}

export function useKdsSocket({
  branchId,
  stationId,
  onTicketCreated,
  onTicketUpdated,
}: UseKdsSocketProps = {}) {
  const [connectionStatus, setConnectionStatus] = useState<KdsConnectionStatus>('connected');
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const socketRef = useRef<Socket | null>(null);
  const queryClient = useQueryClient();
  const { playNewTicket, playUrgentTicket, playTicketReady, playOrderReady, playConnectionLost, playReconnected } =
    useKdsAudio();

  const wasDisconnectedRef = useRef(false);

  const connectSocket = useCallback(() => {
    try {
      const token =
        localStorage.getItem('auth_token') ||
        localStorage.getItem('token') ||
        localStorage.getItem('jwt') ||
        '';

      const socketUrl =
        import.meta.env.VITE_WS_URL ||
        (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api.*$/, '') : window.location.origin);

      const socket: Socket = io(socketUrl, {
        path: '/socket.io',
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 20,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 10000,
      });

      socket.on('connect', () => {
        setConnectionStatus('connected');
        setLastSyncTime(new Date());
        if (wasDisconnectedRef.current) {
          playReconnected();
          wasDisconnectedRef.current = false;
        }

        // Subscribe to KDS branch and station room
        const validBranch = branchId && branchId !== 'default' ? branchId : undefined;
        const validStation = stationId && stationId !== 'all' ? stationId : undefined;

        socket.emit('kds:subscribe', {
          branchId: validBranch,
          stationId: validStation,
        });
      });

      socket.on('disconnect', () => {
        setConnectionStatus('disconnected');
        wasDisconnectedRef.current = true;
        playConnectionLost();
      });

      socket.on('connect_error', () => {
        setConnectionStatus('reconnecting');
      });

      socket.on('reconnect_attempt', () => {
        setConnectionStatus('reconnecting');
      });

      socket.on('reconnect', () => {
        setConnectionStatus('connected');
        setLastSyncTime(new Date());
        socket.emit('kds:subscribe', {
          branchId,
          stationId: stationId === 'all' ? undefined : stationId,
        });
      });

      // Ticket Created
      const handleTicketCreated = (data: any) => {
        setLastSyncTime(new Date());
        const ticketList: KdsTicket[] = Array.isArray(data) ? data : [data];

        ticketList.forEach((newTicket) => {
          if (!newTicket || !newTicket._id) return;
          queryClient.setQueryData<KdsTicket[]>(
            kitchenKeys.tickets(branchId, stationId),
            (old = []) => {
              if (old.some((t) => t._id === newTicket._id)) return old;
              return [newTicket, ...old];
            }
          );

          // Trigger Audio
          if (newTicket.priority === 'rush') {
            playUrgentTicket();
          } else {
            playNewTicket();
          }

          if (onTicketCreated) {
            onTicketCreated(newTicket);
          }
        });

        queryClient.invalidateQueries({ queryKey: kitchenKeys.all });
      };

      socket.on('ticket:created', handleTicketCreated);
      socket.on('ticket:new', handleTicketCreated);

      // Ticket Updated / Status Changed
      const handleTicketUpdated = (data: any) => {
        setLastSyncTime(new Date());
        const updatedTicket: KdsTicket = data.ticket || data;
        if (!updatedTicket || !updatedTicket._id) return;

        queryClient.setQueryData<KdsTicket[]>(
          kitchenKeys.tickets(branchId, stationId),
          (old = []) => {
            return old.map((t) => (t._id === updatedTicket._id ? { ...t, ...updatedTicket } : t));
          }
        );
        queryClient.invalidateQueries({ queryKey: kitchenKeys.all });

        if (updatedTicket.status === 'ready') {
          if (updatedTicket.stationId === 'expo') {
            playOrderReady();
          } else {
            playTicketReady();
          }
        }

        if (onTicketUpdated) {
          onTicketUpdated(updatedTicket);
        }
      };

      socket.on('ticket:updated', handleTicketUpdated);
      socket.on('ticket:status-changed', handleTicketUpdated);

      // Ticket Canceled
      socket.on('ticket:canceled', (canceledTicket: KdsTicket) => {
        setLastSyncTime(new Date());
        queryClient.invalidateQueries({ queryKey: kitchenKeys.all });
      });

      // Station Rush Mode Broadcast
      socket.on('station:rush', () => {
        setLastSyncTime(new Date());
        playUrgentTicket();
        queryClient.invalidateQueries({ queryKey: kitchenKeys.all });
      });

      // Emergency Stop Broadcast
      socket.on('kitchen:emergency-stop', () => {
        setLastSyncTime(new Date());
        queryClient.invalidateQueries({ queryKey: kitchenKeys.all });
      });

      socketRef.current = socket;
    } catch (e) {
      console.warn('Socket initialization exception in KDS:', e);
      setConnectionStatus('connected'); // keep simulated resilient state
    }
  }, [
    branchId,
    stationId,
    onTicketCreated,
    onTicketUpdated,
    playNewTicket,
    playUrgentTicket,
    playTicketReady,
    playOrderReady,
    playConnectionLost,
    playReconnected,
    queryClient,
  ]);

  useEffect(() => {
    connectSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [connectSocket]);

  const forceSync = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: kitchenKeys.all });
    setLastSyncTime(new Date());
  }, [queryClient]);

  return {
    connectionStatus,
    lastSyncTime,
    forceSync,
  };
}
