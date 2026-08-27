import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { type RootState } from '@/app/store';
import { clearCart } from '../store/orderSlice'; // Ensure setOrderType is available

import OrderTypeSelection from './MakeOrder/OrderTypeSelection';
import TableSelection from './MakeOrder/TableSelection';
import DeliveryDetailsForm from './MakeOrder/DeliveryDetailsForm'; // New Component
import MenuSelection from './MakeOrder/MenuSelection';
import CartReview from './MakeOrder/CartReview';

type ModalView =
  | 'type-selection'
  | 'table-selection'
  | 'delivery-details'
  | 'menu-selection'
  | 'cart-review';

const NewOrderModalContent: React.FC<{
  onBack: () => void;
  onClose?: () => void;
}> = ({ onBack, onClose }) => {
  const dispatch = useDispatch();
  const [view, setView] = useState<ModalView>('type-selection');
  const { cart } = useSelector((state: RootState) => state.orders);

  const handleBack = () => {
    if (view === 'cart-review') {
      setView('menu-selection');
    } else if (view === 'menu-selection') {
      // Determine if we go back to Table or Delivery form
      if (cart.orderType === 'dine_in') setView('table-selection');
      else if (cart.orderType === 'delivery') setView('delivery-details');
      else setView('type-selection');
    } else if (view === 'table-selection' || view === 'delivery-details') {
      dispatch(clearCart());
      setView('type-selection');
    } else {
      onBack();
    }
  };

  // Navigation handlers
  const handleTypeSelect = (type: 'dine_in' | 'delivery' | 'takeaway') => {
    // We assume your OrderTypeSelection component passes the type
    if (type === 'dine_in') {
      setView('table-selection');
    } else if (type === 'delivery') {
      setView('delivery-details');
    } else {
      // For takeaway or others, go straight to menu
      setView('menu-selection');
    }
  };

  const goToMenu = () => setView('menu-selection');
  const goToCart = () => setView('cart-review');

  return (
    <>
      {view === 'type-selection' && (
        <OrderTypeSelection onSelectType={handleTypeSelect} onBack={onBack} />
      )}

      {view === 'table-selection' && (
        <TableSelection onTableSelect={goToMenu} onBack={handleBack} />
      )}

      {view === 'delivery-details' && (
        <DeliveryDetailsForm onConfirm={goToMenu} onBack={handleBack} />
      )}

      {view === 'menu-selection' && (
        <MenuSelection onBack={handleBack} onReviewCart={goToCart} />
      )}

      {view === 'cart-review' && (
        <CartReview onBack={handleBack} onClose={onClose} />
      )}
    </>
  );
};

export default NewOrderModalContent;
