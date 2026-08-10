// src/components/layout/Header.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { type RootState, type AppDispatch } from '@/app/store';
import { useSocket } from '@/lib/Socket';

import { Wifi, WifiOff } from 'lucide-react';
import {
  toggleSidebar,
  toggleTheme,
  setLanguage,
  setCurrentBranch,
} from '../../components/Layout/layoutSlice';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import NewOrderModalContent from '@/features/Order/Components/NewOrderContent';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

import {
  Menu as MenuIcon,
  Plus,
  Sun,
  Moon,
  LogOut,
  Building2,
  MapPin,
  User,
  Settings,
  Globe,
} from 'lucide-react';

import {
  useGetMeQuery,
  useLogoutMutation,
} from '../../api/Queries/authQueries';
import { useBranchesQuery } from '../../api/Queries/branchQueries';
import RightSideModal from '@/components/ui/RightSideModal';
import { Link } from 'react-router-dom';

type OrderType = 'dine-in' | 'takeaway' | 'delivery';

const Header: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { darkMode, language, currentBranchId } = useSelector(
    (state: RootState) => state.ui
  );
  const socket = useSocket();
  console.log(socket ? 'Socket is available in Header' : 'No socket in Header');  
  const [isConnected, setIsConnected] = useState(false);
  const { data: user } = useGetMeQuery();
  const { data: branches = [], isLoading: branchesLoading } =
    useBranchesQuery();
  const logoutMutation = useLogoutMutation();

  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [selectedOrderType, setSelectedOrderType] = useState<OrderType | null>(
    null
  );

  const currentBranch = useMemo(
    () => branches.find((b) => b._id === currentBranchId),
    [branches, currentBranchId]
  );

  const languages = [
    { code: 'EN', label: 'English' },
    { code: 'AR', label: 'العربية' },
    { code: 'FR', label: 'Français' },
  ];

  const handleBranchChange = (value: string) => {
    dispatch(setCurrentBranch(value === 'all' ? null : value));
  };

  const getInitials = () => {
    if (!user) return '??';
    return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();
  };
  useEffect(() => {
    if (!socket) return;
    setIsConnected(socket.connected);
    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, [socket]);
  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
  };

  const resetAndClose = () => {
    setSelectedOrderType(null);
    setIsNewOrderOpen(false);
  };

  return (
    <>
      <header className="bg-background/80 backdrop-blur-md border-b sticky top-0 z-50 w-full transition-all">
        <div className="px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* LEFT: Sidebar & Logo & Mobile Branch Trigger */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => dispatch(toggleSidebar())}
              className="lg:hidden"
            >
              <MenuIcon className="h-5 w-5" />
            </Button>

            <div className="flex items-center gap-2 mr-1">
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-primary rounded-lg sm:rounded-xl flex items-center justify-center shadow-sm">
                <Building2 className="h-4 w-4 sm:h-5 text-primary-foreground" />
              </div>
              <span className="text-base sm:text-lg font-extrabold tracking-tight hidden sm:block">
                Tiru<span className="text-primary">Solutions</span>
              </span>
            </div>

            {/* MOBILE BRANCH SELECTOR */}
            <div className="sm:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild className="">
                  <Button
                    variant="outline"
                    size="sm"
                    className=" h-8 gap-1 px-2 rounded-full border-primary/20 bg-primary/5"
                  >
                    <MapPin className="h-3 w-3 text-primary" />
                    <span className="text-[10px] font-bold max-w-[60px] truncate">
                      {currentBranch ? currentBranch.name : 'All'}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[200px]">
                  <DropdownMenuLabel className="text-[10px] uppercase text-muted-foreground">
                    Switch Branch
                  </DropdownMenuLabel>
                  <DropdownMenuRadioGroup
                    value={currentBranchId || 'all'}
                    onValueChange={handleBranchChange}
                  >
                    <DropdownMenuRadioItem value="all" className="text-xs">
                      All Locations
                    </DropdownMenuRadioItem>
                    {branches.map((b) => (
                      <DropdownMenuRadioItem
                        key={b._id}
                        value={b._id}
                        className="text-xs"
                      >
                        {b.name}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="flex-1 max-w-md hidden sm:flex items-center justify-center">
            {branchesLoading ? (
              <Skeleton className="h-10 w-full rounded-full" />
            ) : (
              <div className="flex items-center w-full bg-muted/50 border border-border rounded-full px-3 py-1 hover:border-primary/40 transition-all">
                <MapPin className="h-4 w-4 text-primary shrink-0 mr-2" />
                <Select
                  value={currentBranchId || 'all'}
                  onValueChange={handleBranchChange}
                >
                  <SelectTrigger className="border-0 bg-transparent focus:ring-0 shadow-none h-8 text-sm font-semibold grow">
                    <SelectValue placeholder="All Branches" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="all" className="font-semibold">
                      All Locations
                    </SelectItem>
                    <DropdownMenuSeparator />
                    {branches.map((b) => (
                      <SelectItem key={b._id} value={b._id}>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm">{b.name}</span>
                          <span className="text-[10px] opacity-60 italic">
                            {b.location?.city}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="h-4 w-[1px] bg-border mx-2" />

                {/* DYNAMIC LIVE INDICATOR */}
                <div className="h-4 w-[1px] bg-border mx-2" />

                {/* DYNAMIC LIVE INDICATOR */}
                <div className="flex items-center gap-1.5 px-2 shrink-0">
                  <div
                    className={`h-1.5 w-1.5 rounded-full transition-all duration-500 ${
                      isConnected
                        ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse'
                        : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]'
                    }`}
                  />
                  <div className="flex flex-col">
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider transition-colors ${
                        isConnected ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {isConnected ? 'Live' : 'Offline'}
                    </span>
                  </div>
                  {/* Subtle icon for extra clarity */}
                  {isConnected ? (
                    <Wifi className="h-3 w-3 text-emerald-500/70" />
                  ) : (
                    <WifiOff className="h-3 w-3 text-rose-500/70" />
                  )}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: Buttons & User Profile */}
          <div className="flex items-center gap-2 shrink-0">
            {/* DESKTOP THEME & LANG (Hidden on Mobile) */}
            <div className="hidden md:flex items-center gap-1 mr-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full"
                onClick={() => dispatch(toggleTheme())}
              >
                {darkMode ? (
                  <Sun className="h-4 w-4 text-yellow-500" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="h-9 gap-2 px-3 rounded-full font-bold text-xs uppercase"
                  >
                    <Globe className="h-4 w-4" />
                    {language}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {languages.map((l) => (
                    <DropdownMenuItem
                      key={l.code}
                      onClick={() => dispatch(setLanguage(l.code))}
                    >
                      {l.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <Button
              onClick={() => setIsNewOrderOpen(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground h-9 sm:h-10 px-3 sm:px-4 rounded-lg flex gap-2 active:scale-95 transition-all shadow-md shadow-primary/10"
            >
              <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="font-bold text-xs sm:text-sm hidden sm:inline">
                New Order
              </span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-9 w-9 sm:h-10 sm:w-10 rounded-full border border-primary/10 p-0.5"
                >
                  <Avatar className="h-full w-full">
                    <AvatarImage src={user?.avatar} />
                    <AvatarFallback className="bg-primary/5 text-[10px] font-bold">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 mt-2" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1 py-1">
                    <p className="text-sm font-bold leading-none">
                      {user
                        ? `${user.firstName} ${user.lastName}`
                        : 'System User'}
                    </p>
                    <p className="text-xs text-muted-foreground leading-none">
                      {user?.email || 'admin@pos.com'}
                    </p>
                    <div className="pt-2 flex gap-1">
                      <Badge
                        variant="secondary"
                        className="text-[9px] h-4 uppercase font-bold tracking-wider"
                      >
                        Admin
                      </Badge>
                      <Badge
                        variant="outline"
                        className="text-[9px] h-4 uppercase font-bold tracking-wider"
                      >
                        {language}
                      </Badge>
                    </div>
                  </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                {/* MOBILE THEME & LANG (Visible only on Mobile inside menu) */}
                <div className="md:hidden">
                  <div className="px-2 py-1.5 flex justify-between items-center">
                    <span className="text-xs font-medium text-muted-foreground">
                      Appearance
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 w-7 rounded-full p-0"
                      onClick={() => dispatch(toggleTheme())}
                    >
                      {darkMode ? (
                        <Sun className="h-3 w-3 text-yellow-500" />
                      ) : (
                        <Moon className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                  <div className="px-2 py-1.5 flex justify-between items-center">
                    <span className="text-xs font-medium text-muted-foreground">
                      Language
                    </span>
                    <div className="flex gap-1">
                      {languages.map((l) => (
                        <Button
                          key={l.code}
                          variant={language === l.code ? 'secondary' : 'ghost'}
                          className="h-6 px-1.5 text-[10px] font-bold"
                          onClick={() => dispatch(setLanguage(l.code))}
                        >
                          {l.code}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                </div>

                <DropdownMenuGroup>
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    <span>My Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:bg-destructive focus:text-destructive-foreground transition-colors"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <RightSideModal
        title="Create New Order"
        description={
          selectedOrderType
            ? `New ${selectedOrderType} order`
            : 'Choose service type'
        }
        open={isNewOrderOpen}
        onOpenChange={(open) => !open && resetAndClose()}
        showCancel={false}
      >
        <NewOrderModalContent onBack={resetAndClose} onClose={resetAndClose} />
      </RightSideModal>
    </>
  );
};

export default Header;
