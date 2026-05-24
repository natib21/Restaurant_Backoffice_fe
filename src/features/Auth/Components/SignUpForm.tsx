// src/features/auth/components/SignUpForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { signUpSchema, type SignUpFormValues } from '../lib/Schemas';

interface SignUpFormProps {
  onSubmit: (values: SignUpFormValues) => void;
  isPending: boolean;
}

export function SignUpForm({ onSubmit, isPending }: SignUpFormProps) {
  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '251', // Pre-filled for Ethiopian numbers
      business: '',
      password: '',
      passwordConfirm: '',
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input placeholder="John" {...field} className="px-2 py-5" />
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
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input placeholder="Doe" {...field} className="px-2 py-5" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Email */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="email"
                  {...field}
                  className="px-2 py-5"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Phone (Ethiopian) */}
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone (Ethiopian)</FormLabel>
              <FormControl>
                <Input placeholder="251..." {...field} className="px-2 py-5" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Restaurant Name */}
        <FormField
          control={form.control}
          name="business"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Restaurant Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="Bussiness Name"
                  {...field}
                  className="px-2 py-5"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Password & Confirm Password */}
        <div className="grid sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    {...field}
                    className="px-2 py-5"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="passwordConfirm"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    {...field}
                    className="px-2 py-5"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          size="lg"
          className="w-full text-lg font-medium "
          disabled={isPending}
        >
          {isPending ? 'Creating Account...' : 'Sign Up'}
        </Button>
      </form>
    </Form>
  );
}
