// src/features/Table/Components/TableFormPage.tsx
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  QrCode,
  Building2,
  Users,
  Check,
  Layers,
  Info,
  ExternalLink,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { toast } from 'sonner';
import {
  useCreateTableMutation,
  useUpdateTableMutation,
} from '../../../api/Queries/tableQueries';
import { useGetMeQuery } from '../../../api/Queries/authQueries';
import { useBranchesQuery } from '../../../api/Queries/branchQueries';
import { useSelector } from 'react-redux';
import { type RootState } from '@/app/store';

const formSchema = z.object({
  tableNumber: z.string().min(1, 'Table number is required').max(10),
  capacity: z.coerce.number().min(1, 'Min capacity is 1').max(50),
  location: z.string().min(1, 'Location is required'),
  status: z.enum(['available', 'occupied', 'needs-cleaning', 'disabled']),
  isActive: z.boolean().default(true),
  branchId: z.string().min(1, 'Branch selection is required'),
});

type FormValues = z.infer<typeof formSchema>;

interface TableFormPageProps {
  initialData?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

const TableFormPage: React.FC<TableFormPageProps> = ({
  initialData,
  onSuccess,
  onCancel,
}) => {
  const isEdit = !!initialData;
  const { data: user } = useGetMeQuery();
  const { data: branches = [] } = useBranchesQuery();
  const currentBranchId = useSelector(
    (state: RootState) => state.ui.currentBranchId
  );

  const createMutation = useCreateTableMutation();
  const updateMutation = useUpdateTableMutation();

  // Role Check
  const isSuperAdmin = user?.role?.name === 'SUPER-MERCHANT-ADMIN';

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      tableNumber: initialData?.tableNumber || '',
      capacity: initialData?.capacity || 4,
      location: initialData?.location || 'indoor',
      status: initialData?.status || 'available',
      isActive: initialData?.isActive ?? true,
      branchId:
        initialData?.branch?._id ||
        initialData?.branch ||
        currentBranchId ||
        '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      const payload = {
        ...values,
        branch: values.branchId, // Map to backend expected key
      };

      if (isEdit) {
        await updateMutation.mutateAsync({
          id: initialData._id,
          body: payload,
        });
        toast.success('Table updated');
      } else {
        await createMutation.mutateAsync(payload);
        toast.success('Table created successfully');
      }
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Error saving table');
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 p-4 md:p-6"
      >
        {/* SECTION: QR PREVIEW (Only on Edit) */}
        {isEdit && initialData?.qrCode && (
          <div className="flex flex-col items-center justify-center p-6 bg-muted/30 rounded-2xl border border-dashed border-primary/20">
            <div className="relative group">
              <img
                src={initialData.qrCode}
                alt="Table QR"
                className="h-32 w-32 object-contain bg-white p-2 rounded-xl shadow-sm transition-transform group-hover:scale-105"
              />
              <Button
                variant="secondary"
                size="icon"
                className="absolute -bottom-2 -right-2 rounded-full h-8 w-8 shadow-md"
                onClick={() => window.open(initialData.qrCode, '_blank')}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
            <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Active Table QR Code
            </p>
          </div>
        )}

        {/* SECTION: BRANCH SELECTION (Role Based) */}
        {isSuperAdmin && (
          <FormField
            control={form.control}
            name="branchId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase text-muted-foreground">
                  Target Branch
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="h-11 bg-muted/20 border-primary/10">
                      <SelectValue placeholder="Select a branch" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {branches.map((b) => (
                      <SelectItem key={b._id} value={b._id}>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-3 w-3" /> {b.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* SECTION: TABLE DETAILS */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="tableNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase text-muted-foreground">
                  Table ID
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="T-01"
                    className="h-11 bg-muted/20 font-mono text-lg"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="capacity"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase text-muted-foreground">
                  Seats
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Users className="absolute left-3 top-3 h-5 w-5 text-muted-foreground/40" />
                    <Input
                      type="number"
                      className="pl-10 h-11 bg-muted/20"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* SECTION: PLACEMENT & STATUS */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase text-muted-foreground">
                  Zone
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="h-11 bg-muted/20 capitalize">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {['indoor', 'outdoor', 'rooftop', 'vip', 'garden'].map(
                      (l) => (
                        <SelectItem key={l} value={l} className="capitalize">
                          {l}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase text-muted-foreground">
                  Live Status
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="h-11 bg-muted/20">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="available">🟢 Available</SelectItem>
                    <SelectItem value="occupied">🟠 Occupied</SelectItem>
                    <SelectItem value="needs-cleaning">
                      🧹 Cleaning Req.
                    </SelectItem>
                    <SelectItem value="disabled">⚪ Disabled</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
        </div>

        {/* SECTION: VISIBILITY */}
        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-xl border p-4 bg-muted/5">
              <div className="flex gap-3 items-center">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Layers className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <FormLabel className="text-sm">
                    Visible on Floorplan
                  </FormLabel>
                  <p className="text-[11px] text-muted-foreground">
                    Enable to show table in POS system
                  </p>
                </div>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* INFO CARD: QR ENGINE (Only on Create) */}
        {!isEdit && (
          <Card className="border-none bg-primary/[0.03] shadow-none ring-1 ring-primary/10">
            <CardContent className="p-4 flex items-center gap-3">
              <QrCode className="h-8 w-8 text-primary/40 shrink-0" />
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-primary">
                  Dynamic QR Generation
                </p>
                <p className="text-[10px] text-muted-foreground leading-tight">
                  Encrypted ordering links will be generated automatically upon
                  creation.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* FOOTER ACTIONS */}
        <div className="sticky bottom-0 bg-background pt-4 pb-2 mt-8 border-t flex items-center justify-end gap-3 z-20">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            className="text-muted-foreground"
          >
            Discard
          </Button>
          <Button
            type="submit"
            className="px-10 font-bold"
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {isEdit ? 'Save Changes' : 'Initialize Table'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default TableFormPage;
