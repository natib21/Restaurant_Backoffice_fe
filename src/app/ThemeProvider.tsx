// src/app/ThemeProvider.tsx
import { useSelector, useDispatch } from 'react-redux';
import { type RootState, type AppDispatch } from './store';
import { useEffect } from 'react';
import { setTheme } from '../components/Layout/layoutSlice';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const dispatch = useDispatch<AppDispatch>();

  const darkMode = useSelector((state: RootState) => state.ui.darkMode);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');

    if (savedTheme === 'dark' || savedTheme === 'light') {
      dispatch(setTheme(savedTheme === 'dark'));
    } else {
      const prefersDark = window.matchMedia(
        '(prefers-color-scheme: dark)'
      ).matches;
      dispatch(setTheme(prefersDark));
    }
  }, [dispatch]);

  return <>{children}</>;
};
