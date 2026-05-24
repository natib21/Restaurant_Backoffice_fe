// src/features/auth/components/AuthCard.tsx
import { Card, CardContent } from '@/components/ui/card';
import { AuthHeader } from './AuthHeader';
import { AuthFooter } from './AuthFooter';

type AuthCardProps = {
  title?: string;
  description?: string;
  children: React.ReactNode;
  footerText?: string;
  footerLinkText?: string;
  footerLinkTo?: string;
};

export const AuthCard = ({
  title,
  description,
  children,
  footerText,
  footerLinkText,
  footerLinkTo,
}: AuthCardProps) => {
  return (
    <Card className="w-full max-w-md shadow-none border-0 bg-transparent lg:bg-background/95 lg:backdrop-blur lg:py-6">
      <AuthHeader title={title} description={description} />
      <CardContent className="space-y-6">{children}</CardContent>
      {(footerText || footerLinkText) && (
        <AuthFooter
          text={footerText || ''}
          linkText={footerLinkText || ''}
          linkTo={footerLinkTo || ''}
        />
      )}
    </Card>
  );
};
