import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useDispatch } from 'react-redux';
import { MapPin, User, Phone, ArrowLeft, Globe } from 'lucide-react';
import { setDeliveryDetails } from '../../store/orderSlice';

// Shadcn UI imports
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

import { deliveryFormSchema, type DeliveryFormValues } from '../../lib/Schema';
interface Props {
  onBack: () => void;
  onConfirm?: () => void;
}
const DeliveryDetailsForm: React.FC<Props> = ({ onConfirm, onBack }) => {
  const dispatch = useDispatch();

  const form = useForm<DeliveryFormValues>({
    resolver: zodResolver(deliveryFormSchema) as any,
    defaultValues: {
      customerName: '',
      customerPhone: '',
      city: 'Addis Ababa',
      lng: 38.7578,
      lat: 8.9806,
    },
  });

  const onSubmit = (data: DeliveryFormValues) => {
    dispatch(
      setDeliveryDetails({
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        location: {
          coordinates: [data.lng, data.lat],
          city: data.city,
          specificArea: data.specificArea,
          building: data.building,
          formattedAddress:
            `${data.building || ''} ${data.specificArea || ''}, ${data.city}`.trim(),
        },
      })
    );
    onConfirm?.();
  };

  return (
    <div className="p-6 max-h-[90vh] overflow-y-auto">
      <div className="flex items-center gap-2 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="rounded-full"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-xl font-bold text-foreground">Delivery Details</h2>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="customerName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Customer Name</FormLabel>
                <FormControl>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="pl-10"
                      placeholder="Abebe Bikila"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="customerPhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input className="pl-10" placeholder="+251..." {...field} />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="building"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Building / Villa</FormLabel>
                  <FormControl>
                    <Input placeholder="Bldg 4, Apt 2" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="specificArea"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Specific Area / Landmarks</FormLabel>
                <FormControl>
                  <Textarea placeholder="Near Bole Medhanialem..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Coordinates Section */}
          <div className="p-4 bg-muted/30 rounded-lg border border-dashed">
            <p className="text-xs font-bold text-muted-foreground flex items-center gap-2 mb-3 uppercase tracking-wider">
              <Globe className="h-3 w-3" /> GPS Coordinates
            </p>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="lng"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        type="number"
                        step="any"
                        placeholder="Long"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lat"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        type="number"
                        step="any"
                        placeholder="Lat"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-lg font-bold rounded-xl mt-4"
          >
            Proceed to Menu
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default DeliveryDetailsForm;
