import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { io, type Socket } from 'socket.io-client';
import { toast } from 'sonner';
import { type User } from '@/api/Queries/authQueries';

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  import.meta.env.VITE_WS_URL ||
  (import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace(/\/api.*$/, '')
    : 'http://localhost:8000');

/**
 * Retrieve auth token from all possible client storage locations
 */
export const getAuthToken = (): string => {
  // Check sessionStorage (per WebSocket guide)
  const sessionToken =
    sessionStorage.getItem('jwtToken') ||
    sessionStorage.getItem('token') ||
    sessionStorage.getItem('auth_token');
  if (sessionToken) return sessionToken;

  // Check localStorage
  const localToken =
    localStorage.getItem('auth_token') ||
    localStorage.getItem('token') ||
    localStorage.getItem('jwt');
  if (localToken) return localToken;

  // Check readable document cookies if available
  if (typeof document !== 'undefined' && document.cookie) {
    const match = document.cookie.match(/(?:^|;\s*)(?:jwt|token|auth_token|jwtToken)=([^;]+)/);
    if (match && match[1]) {
      return decodeURIComponent(match[1]);
    }
  }

  return '';
};

interface SessionPayload {
  branchId: string;
  userId: string;
  permissions: string[];
}

const mapTasksToPermissions = (tasks: { name: string }[] = []): string[] => {
  const permissionMap: Record<string, string> = {
    'Get All Orders': 'ORDER_VIEW',
    'Place New Order': 'ORDER_MANAGE',
    'Update Order Status': 'ORDER_MANAGE',
    'Get Pending Orders': 'ORDER_VIEW',
    'Get Accepted Orders': 'ORDER_VIEW',
    'Get Preparing Orders': 'KITCHEN_VIEW',
    'Get Ready Orders': 'KITCHEN_VIEW',
    'Get Served Orders': 'ORDER_VIEW',
    'Get Canceled Orders': 'ORDER_VIEW',
    'Get Completed Orders': 'ORDER_VIEW',
    'Mark Order As Paid': 'ORDER_MANAGE',
    'Add Item to Order': 'ORDER_MANAGE',
    'Merge Orders': 'ORDER_MANAGE',
    'Cancel Order': 'ORDER_MANAGE',
    'Create New Table': 'TABLE_MANAGE',
    'Update Table': 'TABLE_MANAGE',
  };

  return Array.from(
    new Set(tasks.map((task) => permissionMap[task.name]).filter(Boolean))
  );
};

const SocketContext = createContext<Socket | null>(null);

export const useSocket = (): Socket | null => useContext(SocketContext);

interface SocketProviderProps {
  children: React.ReactNode;
  user: User | null | undefined;
  currentBranchId: string | null;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({
  children,
  user,
  currentBranchId,
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const prevBranchRef = useRef<string | null>(null);

  const permissions = useMemo(
    () => mapTasksToPermissions(user?.role?.tasks ?? []),
    [user?.role?.tasks]
  );

  useEffect(() => {
    if (!user || !currentBranchId) {
      if (socketRef.current?.connected) {
        socketRef.current.disconnect();
      }
      socketRef.current = null;
      setSocket(null);
      return;
    }

    let createdSocket = false;
    const token = getAuthToken();

    if (!socketRef.current) {
      const newSocket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        withCredentials: true,
        auth: {
          token: token || undefined,
        },
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        randomizationFactor: 0.5,
      });

      socketRef.current = newSocket;
      setSocket(newSocket);
      createdSocket = true;

      const setupSession = () => {
        const currentToken = getAuthToken();
        newSocket.auth = { token: currentToken || undefined };

        newSocket.emit('setup:session', {
          branchId: currentBranchId,
          userId: user._id,
          permissions,
        } as SessionPayload);
        newSocket.emit('join:branch', { branchId: currentBranchId });
        prevBranchRef.current = currentBranchId;
      };

      const onConnect = () => {
        console.log('✅ WebSocket connected successfully!');
        toast.success('Connected to real-time updates');
        setupSession();
      };

      const onDisconnect = (reason: string) => {
        console.log('SOCKET DISCONNECTED:', reason);
        if (reason === 'io server disconnect') {
          toast.error('Disconnected from server');
        } else {
          toast.warning('Connection lost – reconnecting...');
        }
      };

      const onReconnectFailed = () => {
        toast.error('Failed to reconnect. Please refresh the page.');
      };

      const onError = (err: any) => {
        console.error('Socket error:', err);
        toast.error('Real-time error: ' + (err.message || 'Unknown'));
      };

      const onConnectError = (err: any) => {
        console.error('CONNECT ERROR:', err.message);
        // Refresh token in auth object in case it was updated
        const latestToken = getAuthToken();
        if (latestToken && newSocket.auth) {
          (newSocket.auth as any).token = latestToken;
        }
      };

      newSocket.on('connect', onConnect);
      newSocket.on('disconnect', onDisconnect);
      newSocket.on('reconnect_failed', onReconnectFailed);
      newSocket.on('error', onError);
      newSocket.on('connect_error', onConnectError);
    }

    // If socket already exists and is connected, update session for the new branch
    if (socketRef.current) {
      const activeSocket = socketRef.current;
      const latestToken = getAuthToken();
      activeSocket.auth = { token: latestToken || undefined };

      if (activeSocket.connected) {
        // Leave previous branch room if switching
        if (prevBranchRef.current && prevBranchRef.current !== currentBranchId) {
          activeSocket.emit('leave:branch', { branchId: prevBranchRef.current });
        }

        activeSocket.emit('setup:session', {
          branchId: currentBranchId,
          userId: user._id,
          permissions,
        } as SessionPayload);
        activeSocket.emit('join:branch', { branchId: currentBranchId });
        prevBranchRef.current = currentBranchId;
      } else if (!activeSocket.active) {
        // If it was disconnected due to earlier missing auth, trigger reconnect
        activeSocket.connect();
      }
    }

    return () => {
      if (createdSocket && socketRef.current) {
        socketRef.current.off('connect');
        socketRef.current.off('disconnect');
        socketRef.current.off('reconnect_failed');
        socketRef.current.off('error');
        socketRef.current.off('connect_error');
      }
    };
  }, [user?._id, currentBranchId, permissions.join(',')]);

  return React.createElement(
    SocketContext.Provider,
    { value: socket },
    children
  );
};
