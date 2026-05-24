import React, { useState, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  User,
  Lock,
  Eye,
  EyeOff,
  Mail,
  Briefcase,
  Save,
  UserPlus,
  Building2,
  Phone,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  useCreateStaffMemberMutation,
  useUpdateStaffMemberMutation,
  useMerchantRolesQuery,
} from '../../../api/Queries/merchantQueries';
import { useBranchesQuery } from '@/api/Queries/branchQueries';
import { staffFormSchema, type StaffFormValues } from '../lib/StaffSchemas';

type StaffInviteFormProps = {
  branches: { _id: string; name: string }[];
  initialData?: StaffFormValues & { _id?: string };
  onSuccess?: () => void;
  onCancel?: () => void;
  isLoading?: boolean;
};

const StaffInviteForm: React.FC<StaffInviteFormProps> = ({
  initialData,
  onSuccess,
  onCancel,
  isLoading: externalLoading = false,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isEditMode = !!initialData?._id;

  const { data: roles = [], isLoading: rolesLoading } = useMerchantRolesQuery();
  const { data: branches = [] } = useBranchesQuery();
  const createMutation = useCreateStaffMemberMutation();
  const updateMutation = useUpdateStaffMemberMutation();

  const isMutating =
    externalLoading ||
    createMutation.isPending ||
    updateMutation.isPending ||
    rolesLoading;

  const form = useForm<StaffFormValues>({
    resolver: zodResolver(staffFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      passwordConfirm: '',
      branch: '',
      role: '',
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        firstName: initialData.firstName || '',
        lastName: initialData.lastName || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        password: '',
        passwordConfirm: '',
        branch: initialData.branch || '',
        role: initialData.role || '',
      });
    }
  }, [initialData, form]);

  const onSubmit: SubmitHandler<StaffFormValues> = async (values) => {
    try {
      const dataToSend = isEditMode
        ? {
            ...values,
            password: values.password || undefined,
            passwordConfirm: values.passwordConfirm || undefined,
          }
        : values;

      if (isEditMode && initialData?._id) {
        await updateMutation.mutateAsync({
          id: initialData._id,
          ...dataToSend,
        });
      } else {
        await createMutation.mutateAsync(dataToSend);
      }

      toast.success(isEditMode ? 'Staff updated' : 'Invitation sent');
      onSuccess?.();
    } catch (error: any) {
      toast.error(error?.message || 'Operation failed');
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col h-full bg-background"
      >
        <div className="flex-1 px-8 py-8 space-y-10 overflow-y-auto">
          {/* Section 1: Profile Details */}
          <section className="space-y-6">
            <SectionHeader
              icon={<User className="h-4 w-4" />}
              title="Staff Identity"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="label-style">First Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Abebe"
                        className="input-style"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="label-style">Last Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Bikila"
                        className="input-style"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="label-style">Phone Number</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="tel"
                          placeholder="+251912345678"
                          className="input-style pl-10"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormDescription className="text-[11px]">
                      Include country code (e.g. +251 for Ethiopia)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="label-style">Work Email</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="staff@company.com"
                        className="input-style pl-10"
                        disabled={isEditMode}
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormDescription className="text-[11px]">
                    Emails cannot be changed after account creation.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </section>

          <Separator className="opacity-50" />

          {/* Section 2: Organizational Assignment */}
          <section className="space-y-6">
            <SectionHeader
              icon={<Briefcase className="h-4 w-4" />}
              title="Workplace Assignment"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="branch"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="label-style">
                      Primary Branch
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="input-style">
                          <SelectValue placeholder="Assign a branch" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {branches?.map((b) => (
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

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="label-style">Access Role</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="input-style">
                          <SelectValue placeholder="Assign permissions" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {roles.map((r: any) => (
                          <SelectItem key={r._id} value={r._id}>
                            {r.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </section>

          <Separator className="opacity-50" />

          {/* Section 3: Security */}
          <section className="space-y-6">
            <SectionHeader
              icon={<Lock className="h-4 w-4" />}
              title="Security Credentials"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="label-style">
                      {isEditMode ? 'New Password' : 'Password'}
                    </FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          className="input-style pr-10"
                          {...field}
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    {isEditMode && (
                      <FormDescription className="text-[10px]">
                        Leave blank to keep current.
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="passwordConfirm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="label-style">
                      Confirm Password
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        className="input-style"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </section>
        </div>

        {/* Fixed Footer */}
        <div className="px-8 py-5 border-t bg-background flex justify-between items-center shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
          <Button
            variant="ghost"
            type="button"
            onClick={onCancel}
            className="font-bold text-xs uppercase tracking-widest text-muted-foreground hover:bg-transparent hover:text-foreground"
            disabled={isMutating}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            size="lg"
            className="font-black px-10 rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all active:scale-95"
            disabled={isMutating || roles.length === 0}
          >
            {isMutating ? (
              <span className="flex items-center gap-2">Processing...</span>
            ) : isEditMode ? (
              <>
                <Save className="mr-2 h-4 w-4" /> Save Changes
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" /> Invite Staff
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};

/* --- Refined Internal Styles --- */
const SectionHeader = ({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) => (
  <div className="flex items-center gap-3">
    <div className="p-2 rounded-xl bg-primary/5 text-primary ring-1 ring-primary/20 shadow-sm">
      {icon}
    </div>
    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/80">
      {title}
    </h3>
  </div>
);

// CSS Classes as logic strings (to be applied in Tailwind)
const styles = `
  .label-style { text-[10px] font-bold uppercase tracking-widest text-muted-foreground }
  .input-style { bg-muted/30 focus:bg-background transition-all h-11 border-muted-foreground/20 }
`;

export default StaffInviteForm;
