// src/features/KDS/components/KdsSidebar.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  Clock,
  BarChart3,
  Users,
  Package,
  Layers,
  AlertTriangle,
  HelpCircle,
  LogOut,
  ChevronRight,
  Tv,
  X,
} from 'lucide-react';
import type { KdsActiveTab, KdsStation } from '../types/kdsTypes';

interface KdsSidebarProps {
  currentStation: KdsStation | null;
  activeStaffCount: number;
  activeTab: KdsActiveTab;
  onTabChange: (tab: KdsActiveTab) => void;
  onEmergencyStopClick: () => void;
  onHelpClick: () => void;
  onTvModeClick?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
  isDarkMode?: boolean;
}

export const KdsSidebar: React.FC<KdsSidebarProps> = ({
  currentStation,
  activeStaffCount,
  activeTab,
  onTabChange,
  onEmergencyStopClick,
  onHelpClick,
  onTvModeClick,
  isOpen = false,
  onClose,
  isDarkMode = true,
}) => {
  const navigate = useNavigate();

  const navItems = [
    {
      id: 'orders' as KdsActiveTab,
      label: 'Live Orders',
      icon: ClipboardList,
    },
    {
      id: 'history' as KdsActiveTab,
      label: 'Order History',
      icon: Clock,
    },
    {
      id: 'performance' as KdsActiveTab,
      label: 'Station Performance',
      icon: BarChart3,
    },
    {
      id: 'shift' as KdsActiveTab,
      label: 'Staff Shift',
      icon: Users,
    },
    {
      id: 'inventory' as KdsActiveTab,
      label: 'Inventory & 86',
      icon: Package,
    },
    {
      id: 'stations' as KdsActiveTab,
      label: 'Kitchen Stations',
      icon: Layers,
    },
  ];

  const handleNavClick = (tab: KdsActiveTab) => {
    onTabChange(tab);
    if (onClose) onClose();
  };

  const sidebarContent = (
    <div
      className={`w-64 h-full flex flex-col justify-between border-r select-none transition-colors ${
        isDarkMode
          ? 'bg-[#0B0F19] text-white border-[#1E293B]'
          : 'bg-white text-slate-900 border-slate-200'
      }`}
    >
      {/* Station Title Header */}
      <div className={`p-4 sm:p-5 border-b ${isDarkMode ? 'border-[#1E293B]' : 'border-slate-200'}`}>
        <div className="flex items-center justify-between">
          <div>
            <h1
              className={`text-lg sm:text-xl font-extrabold tracking-wider uppercase font-mono ${
                isDarkMode ? 'text-white' : 'text-slate-900'
              }`}
            >
              {currentStation ? `${currentStation.name} STATION` : 'ALL STATIONS'}
            </h1>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-semibold tracking-wider text-emerald-500 uppercase">
                STAFF: {activeStaffCount} ACTIVE
              </span>
            </div>
          </div>

          {/* Close button for mobile drawer */}
          {onClose && (
            <button
              onClick={onClose}
              className={`p-1.5 rounded-lg md:hidden ${
                isDarkMode
                  ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation Buttons */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-semibold tracking-wide transition-all ${
                isActive
                  ? isDarkMode
                    ? 'bg-white text-slate-950 shadow-md font-bold'
                    : 'bg-slate-900 text-white shadow-md font-bold'
                  : isDarkMode
                  ? 'text-slate-300 hover:bg-[#1E293B] hover:text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`h-4 w-4 ${
                    isActive
                      ? isDarkMode
                        ? 'text-slate-950'
                        : 'text-white'
                      : isDarkMode
                      ? 'text-slate-400'
                      : 'text-slate-500'
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {isActive && (
                <ChevronRight
                  className={`h-4 w-4 ${isDarkMode ? 'text-slate-950' : 'text-white'}`}
                />
              )}
            </button>
          );
        })}

        {onTvModeClick && (
          <button
            onClick={() => {
              onTvModeClick();
              if (onClose) onClose();
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold tracking-wide transition-all mt-4 border border-dashed ${
              isDarkMode
                ? 'text-slate-300 hover:bg-[#1E293B] hover:text-white border-slate-700/60'
                : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950 border-slate-300'
            }`}
          >
            <Tv className="h-4 w-4 text-amber-500" />
            <span>TV Display Mode</span>
          </button>
        )}
      </nav>

      {/* Bottom Emergency & Help Actions */}
      <div className={`p-3 border-t space-y-2 ${isDarkMode ? 'border-[#1E293B]' : 'border-slate-200'}`}>
        {/* Emergency Stop Button */}
        <button
          onClick={() => {
            onEmergencyStopClick();
            if (onClose) onClose();
          }}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 rounded-lg text-xs sm:text-sm font-bold tracking-wider text-[#FF5A5F] bg-[#3B171A] hover:bg-[#4E1E22] transition-colors border border-[#FF5A5F]/30 uppercase"
        >
          <AlertTriangle className="h-4 w-4 text-[#FF5A5F]" />
          <span>Emergency Stop</span>
        </button>

        {/* Help and Logout */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={() => {
              onHelpClick();
              if (onClose) onClose();
            }}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              isDarkMode
                ? 'text-slate-400 hover:text-white hover:bg-[#1E293B]'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <HelpCircle className="h-3.5 w-3.5" />
            <span>Help</span>
          </button>

          <button
            onClick={() => navigate('/dashboard')}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              isDarkMode
                ? 'text-slate-400 hover:text-white hover:bg-[#1E293B]'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Back to POS</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:block h-full shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile / Tablet Drawer Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={onClose}
          />
          <div className="relative z-10 h-full shadow-2xl animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
export default KdsSidebar;
