// src/features/orders/components/OrderMessageInput.tsx
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { addOrderUpdate } from '../store/orderSlice';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const OrderMessageInput: React.FC<{ orderId: string }> = ({ orderId }) => {
  const dispatch = useDispatch();
  const [message, setMessage] = useState('');

  const sendMessage = () => {
    if (message.trim()) {
      dispatch(
        addOrderUpdate({
          orderId,
          update: {
            type: 'note',
            text: message,
            by: 'Agent', // Replace with real user
            time: new Date().toISOString(),
          },
        })
      );
      setMessage('');
    }
  };

  return (
    <div className="border-t p-4 flex gap-2">
      <Input
        placeholder="Add note or update..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
      />
      <Button onClick={sendMessage}>Send</Button>
    </div>
  );
};

export default OrderMessageInput;
