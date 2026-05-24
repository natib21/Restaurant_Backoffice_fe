// src/features/auth/components/AuthHeader.tsx
type AuthHeaderProps = {
  title?: string;
  description?: string;
};

export const AuthHeader = ({ title, description }: AuthHeaderProps) => {
  return (
    <div className="text-center space-y-2 pb-8">
      <h1 className="text-1xl font-bold">{title}</h1>
      {description && (
        <p className=" text-muted-foreground text-sm">{description}</p>
      )}
    </div>
  );
};
