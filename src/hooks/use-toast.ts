// Simple toast implementation for demo purposes
export const useToast = () => {
  return {
    toast: (props: any) => {
      const { title, description, variant } = props;
      const message = `${title}: ${description}`;
      
      if (variant === 'destructive') {
        console.error('Toast (Error):', message);
      } else {
        console.log('Toast:', message);
      }
      
      // In a real app, you would show a proper toast notification
      alert(message);
    }
  };
};