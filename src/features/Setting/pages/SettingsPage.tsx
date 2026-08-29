import React from 'react';
import { useSearchParams } from 'react-router-dom';
import MerchantProfilePage from './MerchantProfilePage';
import BrandKycPage from './BrandKycPage';
import KitchenStationsPage from './KitchenStationsPage';
import OrderFlowSettingsPage from './OrderFlowSettingsPage';
import PaymentMethodsPage from './PaymentMethodsPage';
import TeamRolesPage from './TeamRolesPage';
import TelegramSettingsPage from './TelegramSettingsPage';
import BillingPlansPage from './BillingPlansPage';

export default function SettingsPage() {
  const [searchParams] = useSearchParams();
  const tab = searchParams.get('tab')?.toLowerCase() || 'profile';

  switch (tab) {
    case 'brand':
    case 'branding':
    case 'kyc':
      return <BrandKycPage />;
    case 'stations':
    case 'kitchen':
    case 'kitchen-stations':
    case 'printers':
      return <KitchenStationsPage />;
    case 'order-flow':
    case 'routing':
      return <OrderFlowSettingsPage />;
    case 'payments':
    case 'payment-methods':
    case 'taxes':
      return <PaymentMethodsPage />;
    case 'team':
    case 'roles':
    case 'staff':
      return <TeamRolesPage />;
    case 'telegram':
      return <TelegramSettingsPage />;
    case 'billing':
    case 'subscription':
    case 'plans':
      return <BillingPlansPage />;
    case 'profile':
    default:
      return <MerchantProfilePage />;
  }
}
