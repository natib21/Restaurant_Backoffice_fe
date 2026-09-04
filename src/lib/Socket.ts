import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { io, type Socket } from 'socket.io-client';
import { toast } from 'sonner';
import { type User } from '@/api/Queries/authQueries';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:8000';

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

  useEffect(() => {
    // Only connect if user is authenticated and branch is selected
    if (!user || !currentBranchId) {
      if (socketRef.current?.connected) {
        socketRef.current.disconnect();
      }
      socketRef.current = null;
      setSocket(null);
      return;
    }

    // Reuse existing socket if connected, just update branch
    if (socketRef.current) {
      if (socketRef.current.connected) {
        socketRef.current.emit('setup:session', {
          branchId: currentBranchId,
        });
      }
      return;
    }

    // Connect using withCredentials: true so HttpOnly cookies are automatically sent
    const newSocket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('✅ Socket connected:', newSocket.id);
      toast.success('Connected to real-time updates');

      // Join branch room (REQUIRED)
      newSocket.emit('setup:session', {
        branchId: currentBranchId,
      });
    });

    newSocket.on('connect_error', (error: any) => {
      console.error('❌ Socket connection error:', error.message);
    });

    newSocket.on('disconnect', (reason: string) => {
      console.log('⚠️ Socket disconnected:', reason);
      if (reason === 'io server disconnect') {
        toast.error('Disconnected from server');
      } else {
        toast.warning('Connection lost – reconnecting...');
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
      }
    };
  }, [user?._id, currentBranchId]);

  return React.createElement(
    SocketContext.Provider,
    { value: socket },
    children
  );
};
