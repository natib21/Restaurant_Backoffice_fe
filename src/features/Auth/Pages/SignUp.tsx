// src/features/auth/pages/SignUpPage.tsx
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { AuthCard } from '../Components/AuthCard';
import { SignUpForm } from '../Components/SignUpForm';
import { SignUpSuccessScreen } from '../Components/SignUpSuccessScreen';

import { useRegisterMutation } from '../../../api/Queries/authQueries';

export default function SignUpPage() {
  const registerMutation = useRegisterMutation();
  const navigate = useNavigate();

  const handleSubmit = (values: any) => {
    registerMutation.mutate(values, {
      onSuccess: () => {
        toast.success('Account created successfully! 🎉', {
          description: 'Please check your email to verify your account.',
        });
      },
      onError: (error: any) => {
        toast.error('Registration failed', {
          description:
            error?.response?.data?.message ||
            'Please check your details and try again.',
        });
      },
    });
  };

  // Success state – full screen
  if (registerMutation.isSuccess) {
    return <SignUpSuccessScreen onLoginClick={() => navigate('/login')} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 bg-gray-100">
      <AuthCard
        title="Create Your Account"
        description="Start managing your restaurant with ease"
        footerText="Already have an account?"
        footerLinkText="Log in"
        footerLinkTo="/login"
      >
        <SignUpForm
          onSubmit={handleSubmit}
          isPending={registerMutation.isPending}
        />
      </AuthCard>
    </div>
  );
}
