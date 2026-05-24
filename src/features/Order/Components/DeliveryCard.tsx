import React from 'react';
import { MapPin, Clock, User, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface DeliveryCardProps {
  delivery: any; // Adjust type later (e.g. DeliveryOrder type)
  onClick: () => void;
  className?: string;
}

const DeliveryCard: React.FC<DeliveryCardProps> = ({
  delivery,
  onClick,
  className,
}) => {
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'assigned':
      case 'picked_up':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'out_for_delivery':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'delivered':
      case 'completed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    return status?.replace('_', ' ') || 'Unknown';
  };
  console.log('Nati :', delivery);
  return (
    <Card
      className={cn(
        'cursor-pointer hover:shadow-md transition-all duration-200 border hover:border-primary/50',
        'overflow-hidden',
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-0">
        {/* Header */}
        <div className="p-4 pb-3 border-b bg-muted/30">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-bold text-lg tracking-tight">
                {delivery.orderNumber || `#${delivery._id?.slice(-6) || '—'}`}
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">
                {delivery.customerName || 'Customer'}
              </p>
            </div>

            <Badge
              variant="outline"
              className={cn(
                'px-3 py-1 font-medium capitalize',
                getStatusColor(delivery.status)
              )}
            >
              {getStatusLabel(delivery.status)}
            </Badge>
          </div>
        </div>

        {/* Main Info */}
        <div className="p-4 space-y-3 text-sm">
          {/* Customer / Address */}
          <div className="flex items-start gap-3">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">
                {delivery.address || 'No address provided'}
              </p>
              {delivery.addressDetails && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {delivery.addressDetails}
                </p>
              )}
            </div>
          </div>

          {/* ETA / Time */}
          <div className="flex items-center gap-3">
            <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium">ETA: {delivery.eta || '—'}</p>
              {delivery.estimatedDeliveryTime && (
                <p className="text-xs text-muted-foreground">
                  {delivery.estimatedDeliveryTime}
                </p>
              )}
            </div>
          </div>

          {/* Driver (if assigned) */}
          {delivery.driverName && (
            <div className="flex items-center gap-3">
              <Truck className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <p className="font-medium">
                Driver: {delivery.driverName}
                {delivery.driverPhone && ` • ${delivery.driverPhone}`}
              </p>
            </div>
          )}

          {/* Quick stats */}
          <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" />
              <span>{delivery.items?.length || '?'} items</span>
            </div>
            <div className="font-medium text-foreground">
              ${delivery.total?.toFixed(2) || '—'}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DeliveryCard;
