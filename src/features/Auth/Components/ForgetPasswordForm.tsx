// src/features/auth/components/ForgotPasswordForm.tsx
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
import { Link } from 'react-router-dom';

import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from '../lib/Schemas';

interface ForgotPasswordFormProps {
  onSubmit: (values: ForgotPasswordFormValues) => Promise<void>;
  isPending: boolean;
  successMessage?: string; // Optional success feedback
  serverError?: string; // Optional error from server
}

export function ForgotPasswordForm({
  onSubmit,
  isPending,
  successMessage,
  serverError,
}: ForgotPasswordFormProps) {
  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="text-center space-y-2">
          <p className="text-muted-foreground text-sm text-left">
            Forgot your password? No problem. Just let us know your email
            address and we will email you a password reset link that will allow
            you to choose a new one.
          </p>
        </div>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  placeholder="merchant@example.com"
                  type="email"
                  autoComplete="email"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Success message */}
        {successMessage && (
          <div className="text-green-600 text-sm text-center bg-green-50 p-3 rounded-md">
            {successMessage}
          </div>
        )}

        {/* Server error */}
        {serverError && (
          <div className="text-destructive text-sm text-center">
            {serverError}
          </div>
        )}

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? 'Sending...' : 'Send Reset Link'}
        </Button>

        <div className="text-center text-sm">
          <Link
            to="/login"
            className="text-primary hover:underline font-medium"
          >
            ← Back to Login
          </Link>
        </div>
      </form>
    </Form>
  );
}
