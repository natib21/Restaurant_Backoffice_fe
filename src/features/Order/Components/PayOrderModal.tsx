// src/features/Order/Components/PayOrderModal.tsx
import React from 'react';
import { VerifyPaymentModal, type VerifyPaymentModalProps } from './VerifyPaymentModal';

export interface PayOrderModalProps extends VerifyPaymentModalProps {}

export const PayOrderModal: React.FC<PayOrderModalProps> = (props) => {
  return <VerifyPaymentModal {...props} />;
};

export default PayOrderModal;
