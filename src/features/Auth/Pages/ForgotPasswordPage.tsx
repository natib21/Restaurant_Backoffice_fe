// src/features/auth/pages/ForgotPasswordPage.tsx
import { useState } from 'react';
import { AuthCard } from '../Components/AuthCard';
import { ForgotPasswordForm } from '../Components/ForgetPasswordForm';
import { toast } from 'sonner';

// You can create a mutation hook later, e.g., useForgotPasswordMutation
// For now, we'll simulate it

export default function ForgotPasswordPage() {
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [serverError, setServerError] = useState<string>('');
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (values: { email: string }) => {
    setIsPending(true);
    setServerError('');
    setSuccessMessage('');

    try {
      // Replace with your actual API call / mutation
      // await forgotPasswordMutation.mutateAsync(values);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

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
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 bg-gray-100">
      <AuthCard>
        <ForgotPasswordForm
          onSubmit={handleSubmit}
          isPending={isPending}
          successMessage={successMessage}
          serverError={serverError}
        />
      </AuthCard>
    </div>
  );
}
