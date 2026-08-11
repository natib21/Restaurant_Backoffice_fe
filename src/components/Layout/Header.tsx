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
      <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/95 backdrop-blur-sm transition-colors">
        <div className="px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3 sm:gap-4">
          {/* LEFT: Sidebar & Logo & Mobile Branch Trigger */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => dispatch(toggleSidebar())}
              className="lg:hidden h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <MenuIcon className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-2.5 mr-1">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center">
                <Building2 className="h-4 w-4" />
              </div>
              <span className="text-sm font-semibold tracking-tight text-foreground hidden sm:inline-block">
                Tiru<span className="text-primary">Solutions</span>
              </span>
            </div>

            {/* MOBILE BRANCH SELECTOR */}
            <div className="sm:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1.5 px-2.5 rounded-md border-border bg-muted/40 hover:bg-muted/70 text-xs font-medium shadow-none"
                  >
                    <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className="text-xs max-w-[80px] truncate">
                      {currentBranch ? currentBranch.name : 'All Locations'}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[200px] rounded-lg">
                  <DropdownMenuLabel className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
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

          {/* CENTER: Desktop Branch Selector & Status */}
          <div className="flex-1 max-w-sm lg:max-w-md hidden sm:flex items-center justify-center">
            {branchesLoading ? (
              <Skeleton className="h-9 w-full rounded-lg" />
            ) : (
              <div className="flex items-center w-full bg-muted/40 hover:bg-muted/60 border border-border/80 rounded-lg px-2.5 py-0.5 transition-colors">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0 ml-0.5 mr-1" />
                <Select
                  value={currentBranchId || 'all'}
                  onValueChange={handleBranchChange}
                >
                  <SelectTrigger className="border-0 bg-transparent focus:ring-0 shadow-none h-7 text-xs font-medium text-foreground grow hover:bg-transparent px-1 focus:outline-none">
                    <SelectValue placeholder="All Branches" />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg border border-border shadow-md">
                    <SelectItem value="all" className="font-medium text-xs">
                      All Locations
                    </SelectItem>
                    <DropdownMenuSeparator />
                    {branches.map((b) => (
                      <SelectItem key={b._id} value={b._id} className="text-xs">
                        <div className="flex flex-col py-0.5">
                          <span className="font-medium text-xs text-foreground">{b.name}</span>
                          {b.location?.city && (
                            <span className="text-[10px] text-muted-foreground">
                              {b.location.city}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="h-3.5 w-[1px] bg-border/80 shrink-0 mx-2" />

                {/* DYNAMIC LIVE INDICATOR */}
                <div className="flex items-center gap-1.5 px-1 shrink-0">
                  <span
                    className={`h-2 w-2 rounded-full shrink-0 ${
                      isConnected
                        ? 'bg-emerald-500 ring-2 ring-emerald-500/20'
                        : 'bg-zinc-400 dark:bg-zinc-500'
                    }`}
                  />
                  <span
                    className={`text-[11px] font-medium tracking-wide ${
                      isConnected
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {isConnected ? 'Live' : 'Offline'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: Buttons & User Profile */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* DESKTOP THEME & LANG (Hidden on Mobile) */}
            <div className="hidden md:flex items-center gap-1 mr-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-md text-muted-foreground hover:text-foreground"
                onClick={() => dispatch(toggleTheme())}
                title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {darkMode ? (
                  <Sun className="h-4 w-4 text-amber-500" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2.5 rounded-md font-medium text-xs text-muted-foreground hover:text-foreground gap-1.5"
                  >
                    <Globe className="h-3.5 w-3.5" />
                    <span>{language}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-32 rounded-lg">
                  {languages.map((l) => (
                    <DropdownMenuItem
                      key={l.code}
                      onClick={() => dispatch(setLanguage(l.code))}
                      className="text-xs font-medium"
                    >
                      {l.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Primary CTA Button */}
            <Button
              onClick={() => setIsNewOrderOpen(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground h-8 sm:h-9 px-3 sm:px-3.5 rounded-md text-xs sm:text-sm font-medium flex items-center gap-1.5 shadow-sm transition-all active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New Order</span>
            </Button>

            {/* User Dropdown Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 sm:h-9 sm:w-9 rounded-full p-0 border border-border hover:border-border/80 transition-colors focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <Avatar className="h-full w-full">
                    <AvatarImage src={user?.avatar} />
                    <AvatarFallback className="bg-muted text-muted-foreground text-xs font-medium">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-60 rounded-lg shadow-lg border border-border p-1 mt-1.5" align="end" forceMount>
                <DropdownMenuLabel className="font-normal p-2">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-semibold leading-none text-foreground">
                      {user
                        ? `${user.firstName} ${user.lastName}`
                        : 'System User'}
                    </p>
                    <p className="text-xs text-muted-foreground leading-none truncate">
                      {user?.email || 'admin@pos.com'}
                    </p>
                    <div className="pt-2 flex items-center gap-1.5">
                      <Badge
                        variant="secondary"
                        className="text-[10px] font-medium px-1.5 py-0.2 rounded-md bg-muted text-muted-foreground border-0"
                      >
                        Admin
                      </Badge>
                      <Badge
                        variant="outline"
                        className="text-[10px] font-medium px-1.5 py-0.2 rounded-md text-muted-foreground border-border"
                      >
                        {language}
                      </Badge>
                    </div>
                  </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator className="-mx-1 my-1" />

                {/* MOBILE THEME & LANG (Visible only on Mobile inside menu) */}
                <div className="md:hidden">
                  <div className="px-2 py-1.5 flex justify-between items-center">
                    <span className="text-xs font-medium text-muted-foreground">
                      Appearance
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 w-7 rounded-md p-0"
                      onClick={() => dispatch(toggleTheme())}
                    >
                      {darkMode ? (
                        <Sun className="h-3.5 w-3.5 text-amber-500" />
                      ) : (
                        <Moon className="h-3.5 w-3.5" />
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
                          className="h-6 px-1.5 text-[10px] font-medium rounded-md"
                          onClick={() => dispatch(setLanguage(l.code))}
                        >
                          {l.code}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <DropdownMenuSeparator className="-mx-1 my-1" />
                </div>

                <DropdownMenuGroup>
                  <DropdownMenuItem className="text-xs font-medium cursor-pointer rounded-md">
                    <User className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                    <span>My Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="text-xs font-medium cursor-pointer rounded-md">
                    <Link to="/settings" className="flex items-center">
                      <Settings className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator className="-mx-1 my-1" />
                <DropdownMenuItem
                  className="text-xs font-medium text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer rounded-md transition-colors"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-3.5 w-3.5" />
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
