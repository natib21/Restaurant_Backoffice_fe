import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface LayoutState {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  orderSidebarOpen: boolean;
  darkMode: boolean;
  language: string;
  isTestMode: boolean;
  currentBranchId: string | null;
}

const initialState: LayoutState = {
  sidebarOpen: true,
  sidebarCollapsed: false,
  orderSidebarOpen: false,
  darkMode: false,
  language: 'EN',
  isTestMode: false,

  currentBranchId: null, // Default to "All Branches" for multi-branch users
  // Note: For single-branch users, this will be auto-set to their only branch ID on login (in Header or auth flow)
};

const layoutSlice = createSlice({
  name: 'layout',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    toggleSidebarCollapse: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    toggleTheme: (state) => {
      state.darkMode = !state.darkMode;
    },
    setTheme: (state, action: PayloadAction<boolean>) => {
      state.darkMode = action.payload;
    },
    setLanguage: (state, action: PayloadAction<string>) => {
      state.language = action.payload;
    },
    setTestMode: (state, action: PayloadAction<boolean>) => {
      state.isTestMode = action.payload;
    },
    setCurrentBranch: (state, action: PayloadAction<string | null>) => {
      state.currentBranchId = action.payload;
    },
    // Optional: Clear branch (e.g., on logout)
    clearCurrentBranch: (state) => {
      state.currentBranchId = null;
    },
    setOrderSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.orderSidebarOpen = action.payload;
    },
    toggleOrderSidebar: (state) => {
      state.orderSidebarOpen = !state.orderSidebarOpen;
    },
  },
});

export const {
  toggleSidebar,
  toggleSidebarCollapse,
  setSidebarOpen,
  toggleTheme,
  setTheme,
  setLanguage,
  setTestMode,
  setCurrentBranch,
  clearCurrentBranch,
  setOrderSidebarOpen,
  toggleOrderSidebar,
} = layoutSlice.actions;

export default layoutSlice.reducer;
