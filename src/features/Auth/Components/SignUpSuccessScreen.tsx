// src/features/auth/components/SignUpSuccessScreen.tsx
import { Button } from '@/components/ui/button';
import { CheckCircle2, ArrowRight } from 'lucide-react';

interface SignUpSuccessScreenProps {
  onLoginClick: () => void;
}

export function SignUpSuccessScreen({
  onLoginClick,
}: SignUpSuccessScreenProps) {
  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-[#F8FAFC] p-6">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200/80 p-8 text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-600">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Account Created Successfully!
          </h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            Welcome to TiruSolutions. Please check your email inbox to verify your account and begin managing your restaurant operations.
          </p>
        </div>

        <Button
          onClick={onLoginClick}
          className="w-full h-12 text-white font-semibold text-sm rounded-none transition-all duration-200 flex items-center justify-center gap-2"
        >
          <span>Go to Login</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

