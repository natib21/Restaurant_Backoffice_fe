// src/components/layout/order/OrderTypeSelection.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { Table as TableIcon, ShoppingBag, Bike } from 'lucide-react';

import { useDispatch } from 'react-redux';
import { setOrderContext } from '../../store/orderSlice';

type OrderType = 'dine_in' | 'takeaway' | 'delivery';

interface Props {
  onSelectType: (type: OrderType) => void;
  onBack: () => void;
}

const OrderTypeSelection: React.FC<Props> = ({ onSelectType }) => {
  const dispatch = useDispatch();
  // src/components/layout/order/OrderTypeSelection.tsx

  const handleSelect = (type: OrderType) => {
    // Convert "dine-in" → "dine_in" etc.
    const normalizedType = type.replace('-', '_') as
      | 'dine_in'
      | 'takeaway'
      | 'delivery';
    dispatch(setOrderContext({ type: normalizedType }));
    onSelectType(type); // keep original for navigation if needed
  };

  // Update types array
  const types = [
    { id: 'dine-in', icon: TableIcon, label: 'Dine In', value: 'dine_in' },
    { id: 'takeaway', icon: ShoppingBag, label: 'Takeaway', value: 'takeaway' },
    { id: 'delivery', icon: Bike, label: 'Delivery', value: 'delivery' },
  ] as const;

  return (
    <div className="grid grid-cols-1 gap-4">
      {types.map(({ id, icon: Icon, label, value }) => (
        <Button
          key={id}
          variant="outline"
          className="h-28 justify-start gap-6 px-6 border-2 hover:border-primary"
          onClick={() => handleSelect(value)} // ← use normalized value
        >
          <div className="p-4 rounded-xl bg-primary/10 text-primary">
            <Icon className="h-8 w-8" />
          </div>
          <div className="text-left">
            <p className="text-xl font-bold">{label}</p>
            <p className="text-sm text-muted-foreground">Tap to begin</p>
          </div>
        </Button>
      ))}
    </div>
  );
};
export default OrderTypeSelection;
