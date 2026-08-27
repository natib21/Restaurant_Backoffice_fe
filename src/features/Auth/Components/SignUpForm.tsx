// src/features/auth/components/SignUpForm.tsx
import { useState } from 'react';
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
import {
  User,
  Mail,
  Phone,
  Store,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
} from 'lucide-react';
import { signUpSchema, type SignUpFormValues } from '../lib/Schemas';

interface SignUpFormProps {
  onSubmit: (values: SignUpFormValues) => void;
  isPending: boolean;
}

export function SignUpForm({ onSubmit, isPending }: SignUpFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '251',
      business: '',
      password: '',
      passwordConfirm: '',
    },
  });

  const passwordValue = form.watch('password') || '';

  // Simple visual password strength score (0 to 4)
  const getPasswordStrength = (pass: string) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass) || /[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    return score;
  };

  const strengthScore = getPasswordStrength(passwordValue);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Name Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  First Name
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="h-4 w-4" />
                    </div>
                    <Input
                      placeholder="e.g. Abebe"
                      {...field}
                      className="pl-10 h-11 bg-[#F8FAFC] border border-slate-200 text-slate-900   focus:bg-white focus:border-[#b15f00] focus:ring-2 focus:ring-[#b15f00]/20 transition-all text-sm"
                    />
                  </div>
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
                <FormLabel className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Last Name
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="h-4 w-4" />
                    </div>
                    <Input
                      placeholder="e.g. Bekele"
                      {...field}
                      className="pl-10 h-11 bg-[#F8FAFC] border border-slate-200 text-slate-900   focus:bg-white focus:border-[#b15f00] focus:ring-2 focus:ring-[#b15f00]/20 transition-all text-sm"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Business Phone & Email Row */}
        {/* <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"> */}
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Business Phone (Ethiopian)
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Phone className="h-4 w-4" />
                    </div>
                    <Input
                      placeholder="251911223344"
                      {...field}
                      className="pl-10 h-11 bg-[#F8FAFC] border border-slate-200 text-slate-900   focus:bg-white focus:border-[#b15f00] focus:ring-2 focus:ring-[#b15f00]/20 transition-all text-sm"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Work Email
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="h-4 w-4" />
                    </div>
                    <Input
                      type="email"
                      placeholder="owner@restaurant.com"
                      {...field}
                      className="pl-10 h-11 bg-[#F8FAFC] border border-slate-200 text-slate-900   focus:bg-white focus:border-[#b15f00] focus:ring-2 focus:ring-[#b15f00]/20 transition-all text-sm"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        {/* </div> */}

        {/* Restaurant / Business Name */}
        <FormField
          control={form.control}
          name="business"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Restaurant / Business Name
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Store className="h-4 w-4" />
                  </div>
                  <Input
                    placeholder="e.g. Lalibela Fine Dining"
                    {...field}
                    className="pl-10 h-11 bg-[#F8FAFC] border border-slate-200 text-slate-900   focus:bg-white focus:border-[#b15f00] focus:ring-2 focus:ring-[#b15f00]/20 transition-all text-sm"
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Password & Confirm Password Row */}
        {/* <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"> */}
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
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      {...field}
                      className="pl-10 pr-10 h-11 bg-[#F8FAFC] border border-slate-200 text-slate-900   focus:bg-white focus:border-[#b15f00] focus:ring-2 focus:ring-[#b15f00]/20 transition-all text-sm"
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

          <FormField
            control={form.control}
            name="passwordConfirm"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Confirm Password
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="h-4 w-4" />
                    </div>
                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      {...field}
                      className="pl-10 pr-10 h-11 bg-[#F8FAFC] border border-slate-200 text-slate-900   focus:bg-white focus:border-[#b15f00] focus:ring-2 focus:ring-[#b15f00]/20 transition-all text-sm"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showConfirmPassword ? (
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
        {/* </div> */}

        {/* Visual Password Strength Indicator */}
        {passwordValue && (
          <div className="space-y-1 pt-1">
            <div className="flex gap-1.5">
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                    strengthScore >= step
                      ? strengthScore <= 1
                        ? 'bg-amber-500'
                        : strengthScore <= 3
                        ? 'bg-[#b15f00]'
                        : 'bg-emerald-600'
                      : 'bg-slate-200'
                  }`}
                />
              ))}
            </div>
            <p className="text-[10px] text-right text-slate-500 font-medium">
              {strengthScore <= 1
                ? 'Weak password'
                : strengthScore <= 3
                ? 'Moderate password'
                : 'Strong password'}
            </p>
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full h-12  text-white font-semibold text-sm  transition-all duration-200 flex items-center justify-center gap-2 mt-4"
          disabled={isPending}
        >
          {isPending ? 'Creating Account...' : 'Create Business Account'}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </form>
    </Form>
  );
}

