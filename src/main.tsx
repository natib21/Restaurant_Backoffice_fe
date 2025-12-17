import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './app/store.ts';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './api/client.ts';
import { Toaster } from 'sonner';
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
          <Toaster
            richColors
            closeButton
            position="top-right"
            toastOptions={{
              duration: 5000,
            }}
          />
        </BrowserRouter>
      </QueryClientProvider>
    </Provider>
  </StrictMode>
);
