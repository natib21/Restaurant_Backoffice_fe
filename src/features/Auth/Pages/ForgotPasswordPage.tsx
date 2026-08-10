// src/features/auth/pages/ForgotPasswordPage.tsx
import { useState } from 'react';
import { AuthCard } from '../Components/AuthCard';
import { ForgotPasswordForm } from '../Components/ForgetPasswordForm';
import { toast } from 'sonner';
<<<<<<< HEAD
import { useForgotPasswordMutation } from '@/api/Queries/authQueries';
=======

// You can create a mutation hook later, e.g., useForgotPasswordMutation
// For now, we'll simulate it
>>>>>>> e6a30dd025b29dafd404c32f005174dd65ee239c

export default function ForgotPasswordPage() {
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [serverError, setServerError] = useState<string>('');
<<<<<<< HEAD
  const forgotPasswordMutation = useForgotPasswordMutation();

  const handleSubmit = async (values: { email: string }) => {
=======
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (values: { email: string }) => {
    setIsPending(true);
>>>>>>> e6a30dd025b29dafd404c32f005174dd65ee239c
    setServerError('');
    setSuccessMessage('');

    try {
<<<<<<< HEAD
      await forgotPasswordMutation.mutateAsync(values);
=======
      // Replace with your actual API call / mutation
      // await forgotPasswordMutation.mutateAsync(values);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
>>>>>>> e6a30dd025b29dafd404c32f005174dd65ee239c

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
<<<<<<< HEAD
=======
    } finally {
      setIsPending(false);
>>>>>>> e6a30dd025b29dafd404c32f005174dd65ee239c
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 bg-gray-100">
      <AuthCard>
        <ForgotPasswordForm
          onSubmit={handleSubmit}
<<<<<<< HEAD
          isPending={forgotPasswordMutation.isPending}
=======
          isPending={isPending}
>>>>>>> e6a30dd025b29dafd404c32f005174dd65ee239c
          successMessage={successMessage}
          serverError={serverError}
        />
      </AuthCard>
    </div>
  );
}
