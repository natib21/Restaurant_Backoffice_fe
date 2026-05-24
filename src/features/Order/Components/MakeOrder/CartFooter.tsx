// src/components/layout/order/CartFooter.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { useSelector } from 'react-redux';
import { type RootState } from '@/app/store';

interface Props {
  onReview: () => void;
}

const CartFooter: React.FC<Props> = ({ onReview }) => {
  const { cart } = useSelector((state: RootState) => state.orders);
  const cartCount = cart.items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div className="p-5 bg-primary text-primary-foreground rounded-t-3xl shadow-2xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm opacity-90">{cartCount} items</p>
          <p className="text-2xl font-black">
            {cart.totalAmount.toLocaleString()} ETB
          </p>
        </div>
        <Button
          variant="secondary"
          size="lg"
          className="font-bold"
          onClick={onReview}
        >
          Review Order
        </Button>
      </div>
    </div>
  );
};

export default CartFooter;
