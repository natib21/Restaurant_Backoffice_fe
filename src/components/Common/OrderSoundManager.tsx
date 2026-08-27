import { useEffect, useRef } from 'react';
import { useSocket } from '@/lib/Socket';
import {
  playNewOrderSound,
  playOrderAcceptedSound,
  playKitchenAlertSound,
  playOrderReadySound,
  playOrderServedSound,
} from '../../features/Order/lib/soundPlayer';
import { toast } from 'sonner';

// Keep track of pending IDs globally
const activePendingOrders = new Set<string>();

export const OrderSoundManager = () => {
  const socket = useSocket();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Function to start repeating the new-order alert sound until accepted
  const startRepeatingSound = () => {
    if (intervalRef.current) return;

    // Play immediately the first time
    playNewOrderSound();

    // Repeat every 6 seconds if pending orders remain unacknowledged
    intervalRef.current = setInterval(() => {
      if (activePendingOrders.size > 0) {
        playNewOrderSound();
      } else {
        stopRepeatingSound();
      }
    }, 6000);
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
      console.log('🔔 [Socket] New Order received:', order);
      const status = order.status || 'pending';
      const orderId = order.orderId || order._id || order.id;

      if (status === 'pending') {
        if (orderId && !activePendingOrders.has(orderId)) {
          activePendingOrders.add(orderId);
        }

        const tableInfo =
          typeof order.table === 'object'
            ? order.table?.tableNumber
            : order.tableNumber || (order.table as string);

        toast.success(`New Order #${order.orderNumber || ''}`, {
          description: tableInfo
            ? `Table ${tableInfo} • ${order.orderType || 'Dine-in'}`
            : `${order.orderType || 'Takeaway'} • Ready for acceptance`,
          duration: 8000,
        });

        startRepeatingSound();
      }
    };

    const onOrderStatusUpdated = (payload: any) => {
      console.log('🔄 [Socket] Order status updated:', payload);
      const updatedOrder = payload.order || payload;
      const orderId = updatedOrder.orderId || updatedOrder._id || updatedOrder.id;
      const newStatus = payload.status || updatedOrder.status;
      const orderNumber = updatedOrder.orderNumber || payload.orderNumber || '';

      if (orderId && activePendingOrders.has(orderId) && newStatus !== 'pending') {
        activePendingOrders.delete(orderId);
        if (activePendingOrders.size === 0) {
          stopRepeatingSound();
        }
      }

      switch (newStatus) {
        case 'accepted':
          playOrderAcceptedSound();
          toast.info(`Order #${orderNumber} Accepted`, {
            description: 'Staff acknowledged. Ready to prepare.',
            duration: 4000,
          });
          break;

        case 'preparing':
          playKitchenAlertSound();
          toast.info(`Order #${orderNumber} Cooking`, {
            description: 'Sent to Kitchen Display System (KDS).',
            duration: 4000,
          });
          break;

        case 'ready':
          playOrderReadySound();
          toast.success(`✨ Order #${orderNumber} Ready!`, {
            description: 'Food is ready for service / pickup.',
            duration: 7000,
          });
          break;

        case 'served':
          playOrderServedSound();
          toast.info(`Order #${orderNumber} Served`, {
            description: 'Delivered to customer.',
            duration: 3000,
          });
          break;

        case 'completed':
          toast.success(`Order #${orderNumber} Completed`, {
            description: 'Payment settled.',
            duration: 3000,
          });
          break;

        case 'canceled':
        case 'cancelled':
          toast.error(`Order #${orderNumber} Canceled`);
          break;
      }
    };

    const onTicketCreated = (ticket: any) => {
      console.log('🍳 [Socket] Kitchen Ticket Created:', ticket);
      playKitchenAlertSound();
      toast.info(`KDS Ticket #${ticket.ticketNumber || ticket._id?.slice(-4)} Generated`, {
        description: `Station: ${ticket.station || 'Kitchen'} • Order #${ticket.orderNumber || ''}`,
      });
    };

    const onOrderPaid = (paidOrder: any) => {
      const orderId = paidOrder.orderId || paidOrder._id || paidOrder.id;
      if (orderId && activePendingOrders.delete(orderId)) {
        if (activePendingOrders.size === 0) stopRepeatingSound();
      }
    };

    // Listen to all socket event aliases for robustness
    socket.on('order:create', onNewOrder);
    socket.on('order:created', onNewOrder);
    socket.on('order:new', onNewOrder);

    socket.on('order:status-updated', onOrderStatusUpdated);
    socket.on('order:status-changed', onOrderStatusUpdated);
    socket.on('order-updated', onOrderStatusUpdated);

    socket.on('ticket:created', onTicketCreated);
    socket.on('ticket:new', onTicketCreated);

    socket.on('order-paid', onOrderPaid);

    return () => {
      socket.off('order:create', onNewOrder);
      socket.off('order:created', onNewOrder);
      socket.off('order:new', onNewOrder);

      socket.off('order:status-updated', onOrderStatusUpdated);
      socket.off('order:status-changed', onOrderStatusUpdated);
      socket.off('order-updated', onOrderStatusUpdated);

      socket.off('ticket:created', onTicketCreated);
      socket.off('ticket:new', onTicketCreated);

      socket.off('order-paid', onOrderPaid);
      stopRepeatingSound();
    };
  }, [socket]);

  return null;
};
