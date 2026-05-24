// src/features/auth/components/SignUpSuccessScreen.tsx
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react'; // Optional: nice success icon

interface SignUpSuccessScreenProps {
  onLoginClick: () => void;
}

export function SignUpSuccessScreen({
  onLoginClick,
}: SignUpSuccessScreenProps) {
  return (
    <div className="h-screen flex items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center space-y-4">
          {/* Optional success icon */}
          <div className="mx-auto flex justify-center">
            <CheckCircle2 className="w-16 h-16 text-green-600" />
          </div>

          <CardTitle className="text-3xl font-bold text-green-600">
            Account Created Successfully!
          </CardTitle>

          <CardDescription className="text-lg text-muted-foreground">
            Welcome to your merchant portal. Please check your email to verify
            your account and get started managing your restaurant.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex justify-center pt-6">
          <Button onClick={onLoginClick} size="lg" className="w-full max-w-xs">
            Go to Login
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
