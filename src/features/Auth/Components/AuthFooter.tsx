// src/features/auth/components/AuthFooter.tsx
import { Link } from 'react-router-dom';

type AuthFooterProps = {
  text: string;
  linkText: string;
  linkTo: string;
};

export const AuthFooter = ({ text, linkText, linkTo }: AuthFooterProps) => {
  return (
    <div className="text-center text-sm text-muted-foreground mt-6">
      {text}{' '}
      <Link
        to={linkTo}
        className="text-primary font-mono text-lg font-semibold hover:underline focus-visible:underline outline-none"
      >
        {linkText}
      </Link>
    </div>
  );
};
