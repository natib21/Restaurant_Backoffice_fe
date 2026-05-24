import { AuthCard } from '../Components/AuthCard';
import { LoginForm } from '../Components/LoginForm';
import { useLoginMutation } from '../../../api/Queries/authQueries';

export default function LoginPage() {
  const loginMutation = useLoginMutation();

  const handleSubmit = async (values: any) => {
    console.log(values);
    try {
      await loginMutation.mutateAsync(values);
      // navigate(from, { replace: true });
    } catch {
      // Error handled inside LoginForm (or via toast)
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 bg-gray-100">
      <AuthCard
        title="Login to Merchant Portal"
        description="Welcome back! Please enter your credentials."
        footerText="Don't have an account?"
        footerLinkText="Sign up"
        footerLinkTo="/sign-up"
      >
        <LoginForm
          onSubmit={handleSubmit}
          isPending={loginMutation.isPending}
          serverError={
            loginMutation.isError ? 'Invalid email or password' : undefined
          }
        />
      </AuthCard>
    </div>
  );
}
