// src/hooks/useTestMode.ts
import { useSelector } from 'react-redux';
import { type RootState } from '@/app/store';

export const useTestMode = () => {
  const isTestMode = useSelector((state: RootState) => state.ui.isTestMode);
  return { isTestMode };
};
