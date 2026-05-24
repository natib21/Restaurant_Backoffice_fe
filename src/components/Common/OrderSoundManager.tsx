import { useEffect, useRef } from 'react';
import { useSocket } from '@/lib/Socket';
import { playOrderSound } from '../../features/Order/lib/soundPlayer';
import { toast } from 'sonner';

// Keep track of pending IDs globally (or inside the component if preferred)
const activePendingOrders = new Set<string>();

export const OrderSoundManager = () => {
  const socket = useSocket();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Function to start repeating the sound
  const startRepeatingSound = () => {
    if (intervalRef.current) return; // Already running

    // Play immediately the first time
    playOrderSound();

    // Repeat every 5 seconds (adjust time as needed)
    intervalRef.current = setInterval(() => {
      if (activePendingOrders.size > 0) {
        playOrderSound();
      } else {
        stopRepeatingSound();
      }
    }, 5000);
  };

  const stopRepeatingSound = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    if (!socket) return;

    const onNewOrder = (order: any) => {
      console.log('🆕 order:create raw payload →', order);
      if (order.status === 'pending') {
        const orderId = order.orderId || order._id;
        console.log('🆔 New order ID →', orderId);
        if (!orderId || activePendingOrders.has(orderId)) return;

        activePendingOrders.add(orderId);

        toast.success(`New Order #${order.orderNumber}`, {
          description: order.tableNumber
            ? `Table ${order.tableNumber}`
            : 'Takeaway',
          duration: 8000,
        });

        startRepeatingSound(); // Trigger the repeating logic
      }
    };

    const onOrderUpdated = (updatedOrder: any) => {
      const orderId = updatedOrder.orderId || updatedOrder._id;
      if (!orderId) return;

      const statusesToRemove = [
        'accepted',
        'preparing',
        'ready',
        'served',
        'completed',
        'cancelled',
      ];
      if (statusesToRemove.includes(updatedOrder.status)) {
        if (activePendingOrders.delete(orderId)) {
          toast.info(`Order #${updatedOrder.orderNumber} updated.`);
          if (activePendingOrders.size === 0) {
            stopRepeatingSound();
          }
        }
      }

      // If no more pending orders, stop the sound immediately
      if (activePendingOrders.size === 0) {
        stopRepeatingSound();
      }
    };

    const onOrderPaid = (paidOrder: any) => {
      const orderId = paidOrder.orderId || paidOrder._id;
      if (orderId && activePendingOrders.delete(orderId)) {
        if (activePendingOrders.size === 0) stopRepeatingSound();
      }
    };

    socket.on('order:create', onNewOrder);
    socket.on('order:status-updated', onOrderUpdated);
    socket.on('order-paid', onOrderPaid);

    return () => {
      socket.off('order:create', onNewOrder);
      socket.off('order:status-updated', onOrderUpdated);
      socket.off('order-paid', onOrderPaid);
      stopRepeatingSound(); // Cleanup on unmount
    };
  }, [socket]);

  return null;
};
