// src/features/auth/pages/ForgotPasswordPage.tsx
import { useState } from 'react';
import { AuthCard } from '../Components/AuthCard';
import { ForgotPasswordForm } from '../Components/ForgetPasswordForm';
import { toast } from 'sonner';
import { useForgotPasswordMutation } from '@/api/Queries/authQueries';

export default function ForgotPasswordPage() {
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [serverError, setServerError] = useState<string>('');
  const forgotPasswordMutation = useForgotPasswordMutation();

  const handleSubmit = async (values: { email: string }) => {
    setServerError('');
    setSuccessMessage('');

    try {
      await forgotPasswordMutation.mutateAsync(values);

      setSuccessMessage(
        'If an account exists with this email, we have sent a password reset link.'
      );
      toast.success('Check your email for the reset link');
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        'Something went wrong. Please try again.';
      setServerError(message);
      toast.error(message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 bg-gray-100">
      <AuthCard>
        <ForgotPasswordForm
          onSubmit={handleSubmit}
          isPending={forgotPasswordMutation.isPending}
          successMessage={successMessage}
          serverError={serverError}
        />
      </AuthCard>
    </div>
  );
}
