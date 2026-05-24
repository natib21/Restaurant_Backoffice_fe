// src/features/orders/components/OrderTimeline.tsx
import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';

const OrderTimeline: React.FC<{ order: any }> = ({ order }) => {
  return (
    <ScrollArea className="flex-1 p-6">
      {order.timeline.map((msg: any, i: number) => (
        <div key={i} className="mb-6 flex gap-3">
          <Avatar>
            <AvatarFallback>{msg.by[0].toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">{msg.by}</span>
              <span className="text-muted-foreground">
                {new Date(msg.time).toLocaleTimeString()}
              </span>
            </div>
            <p className="mt-1">{msg.text}</p>
          </div>
        </div>
      ))}
    </ScrollArea>
  );
};

export default OrderTimeline;
