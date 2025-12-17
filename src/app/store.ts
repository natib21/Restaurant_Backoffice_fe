// src/app/store.ts
import { configureStore } from '@reduxjs/toolkit';
import authSlice from '../features/Auth/AuthSlice';
// Import other slices as you create them
// import menuSlice from '@/features/menu/menuSlice';
// import ordersSlice from '@/features/orders/ordersSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    // menu: menuSlice,
    // orders: ordersSlice,
    // ... other feature slices
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore non-serializable values from React Query or router if needed
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
