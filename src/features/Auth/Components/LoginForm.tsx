// src/features/auth/components/LoginForm.tsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Link } from 'react-router-dom';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';
import { loginSchema, type LoginFormValues } from '../lib/Schemas';

interface LoginFormProps {
  onSubmit: (values: LoginFormValues) => Promise<void>;
  isPending: boolean;
  serverError?: string;
}

export function LoginForm({
  onSubmit,
  isPending,
  serverError,
}: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Email or Phone Number
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <Input
                    placeholder="admin@restaurant.com"
                    type="email"
                    autoComplete="email"
                    {...field}
                    className="pl-10 h-12 bg-[#F8FAFC] border border-slate-200 text-slate-900 rounded-none focus:bg-white focus:border-[#b15f00] focus:ring-2 focus:ring-[#b15f00]/20 transition-all text-sm"
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Password
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <Input
                    placeholder="••••••••"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    {...field}
                    className="pl-10 pr-10 h-12 bg-[#F8FAFC] border border-slate-200 text-slate-900 rounded-none focus:bg-white focus:border-[#b15f00] focus:ring-2 focus:ring-[#b15f00]/20 transition-all text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="remember-me"
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(!!checked)}
              className="border-slate-300 data-[state=checked]:bg-[#8d4b00] data-[state=checked]:border-[#8d4b00]"
            />
            <label
              htmlFor="remember-me"
              className="text-xs font-medium text-slate-600 cursor-pointer select-none"
            >
              Remember me
            </label>
          </div>
          <Link
            to="/forgot-password"
            className="text-xs font-semibold text-[#8d4b00] hover:text-[#b15f00] transition-colors"
          >
            Forgot Password?
          </Link>
        </div>

        {/* Server-side error */}
        {serverError && (
          <div className="flex items-center gap-2 p-3 rounded-none bg-destructive/10 text-destructive text-xs font-medium border border-destructive/20">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        <Button
          type="submit"
          className="w-full h-12 text-white font-semibold text-sm  transition-all duration-200 flex items-center justify-center gap-2 mt-2"
          disabled={isPending}
        >
          {isPending ? 'Signing In...' : 'Sign In'}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </form>
    </Form>
  );
}

