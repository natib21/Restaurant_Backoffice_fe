// src/features/KDS/pages/KdsMainPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import {
  useKitchenStationsQuery,
  useKitchenTicketsQuery,
  useAcceptTicketMutation,
  useStartTicketMutation,
  useReadyTicketMutation,
  useCancelTicketMutation,
  useToggleTicketItemMutation,
  useUpdateTicketItemStatusMutation,
} from '@/api/Queries/kitchenQueries';
import { useKdsAudio } from '../hooks/useKdsAudio';
import { useKdsSocket } from '../hooks/useKdsSocket';
import type { KdsActiveTab, KdsTicket } from '../types/kdsTypes';

import { KdsSidebar } from '../components/KdsSidebar';
import { KdsHeader } from '../components/KdsHeader';
import { KdsStationOverview } from '../components/KdsStationOverview';
import { KdsStationLiveOrders } from '../components/KdsStationLiveOrders';
import { KdsOrderHistory } from '../components/KdsOrderHistory';
import { KdsStationPerformance } from '../components/KdsStationPerformance';
import { KdsStaffShift } from '../components/KdsStaffShift';
import { KdsKitchenInventory } from '../components/KdsKitchenInventory';
import { KdsStationManagement } from '../components/KdsStationManagement';

import { KdsSettingsModal } from '../components/KdsSettingsModal';
import { KdsOrderLookupModal } from '../components/KdsOrderLookupModal';
import { KdsEmergencyStopModal } from '../components/KdsEmergencyStopModal';
import { KdsCancelTicketModal } from '../components/KdsCancelTicketModal';

export const KdsMainPage: React.FC = () => {
  const { stationId: routeStationId } = useParams<{ stationId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const isHistoryRoute =
    routeStationId === 'history' ||
    location.pathname === '/kds/history' ||
    searchParams.get('tab') === 'history';

  const [selectedStationId, setSelectedStationId] = useState<string>(
    routeStationId && routeStationId !== 'history' ? routeStationId : 'all'
  );
  const [activeTab, setActiveTab] = useState<KdsActiveTab>(
    isHistoryRoute ? 'history' : 'orders'
  );
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // Synchronize route and tab changes
  useEffect(() => {
    if (
      routeStationId === 'history' ||
      location.pathname === '/kds/history' ||
      searchParams.get('tab') === 'history'
    ) {
      setActiveTab('history');
      setSelectedStationId('all');
    } else if (routeStationId && routeStationId !== 'history') {
      setSelectedStationId(routeStationId);
    }
  }, [routeStationId, location.pathname, searchParams]);

  // Modals state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isOrderLookupOpen, setIsOrderLookupOpen] = useState(false);
  const [orderLookupQuery, setOrderLookupQuery] = useState('');
  const [isEmergencyStopOpen, setIsEmergencyStopOpen] = useState(false);
  const [cancelingTicket, setCancelingTicket] = useState<KdsTicket | null>(null);

  // Audio Hook
  const {
    audioSettings,
    isAudioUnlocked,
    updateSettings: updateAudioSettings,
    toggleMasterSound,
    unlockAudio,
    playTestSound,
  } = useKdsAudio();

  // Data Queries
  const { data: stations = [] } = useKitchenStationsQuery();

  const currentStationObj =
    selectedStationId === 'all'
      ? null
      : stations.find(
          (s) =>
            s.stationId.toLowerCase() === selectedStationId.toLowerCase() ||
            s._id === selectedStationId ||
            s.code.toLowerCase() === selectedStationId.toLowerCase()
        ) || null;

  const stationTargetId = currentStationObj?._id || (selectedStationId !== 'all' ? selectedStationId : undefined);

  const { data: tickets = [] } = useKitchenTicketsQuery(undefined, stationTargetId);

  // Socket.IO Real-time Hook
  const { connectionStatus, lastSyncTime, forceSync } = useKdsSocket({
    branchId: undefined,
    stationId: stationTargetId,
  });

  // Mutations
  const acceptMutation = useAcceptTicketMutation();
  const startMutation = useStartTicketMutation();
  const readyMutation = useReadyTicketMutation();
  const cancelMutation = useCancelTicketMutation();
  const toggleItemMutation = useToggleTicketItemMutation();
  const updateItemStatusMutation = useUpdateTicketItemStatusMutation();

  const handleSelectStation = (stationId: string) => {
    setSelectedStationId(stationId);
    if (activeTab === 'history') {
      // Stay on history view with station filter updated
      return;
    }
    if (stationId === 'all') {
      navigate('/kds');
    } else {
      navigate(`/kds/${stationId.toLowerCase()}`);
    }
  };

  const handleTabChange = (tab: KdsActiveTab) => {
    setActiveTab(tab);
    if (tab === 'history') {
      navigate('/kds/history');
    } else if (tab === 'orders') {
      if (selectedStationId === 'all') {
        navigate('/kds');
      } else {
        navigate(`/kds/${selectedStationId.toLowerCase()}`);
      }
    }
  };

  const handleCancelConfirm = (ticketId: string, reason: string) => {
    cancelMutation.mutate({ ticketId, reason });
  };

  const handleOpenOrderLookup = (query?: string) => {
    setOrderLookupQuery(query || '');
    setIsOrderLookupOpen(true);
  };

  const activeStaffCount = currentStationObj?.activeStaffCount || 4;

  return (
    <div
      className={`flex h-screen w-screen overflow-hidden ${
        isDarkMode ? 'bg-[#0B0F19]' : 'bg-slate-50'
      }`}
    >
      {/* Left Sidebar (Desktop fixed + Mobile responsive drawer) */}
      <KdsSidebar
        currentStation={currentStationObj}
        activeStaffCount={activeStaffCount}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onEmergencyStopClick={() => setIsEmergencyStopOpen(true)}
        onHelpClick={() => setIsSettingsOpen(true)}
        onTvModeClick={() => navigate('/kds/tv')}
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
        isDarkMode={isDarkMode}
      />

      {/* Main Right Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header */}
        <KdsHeader
          currentStationId={selectedStationId}
          stations={stations}
          onSelectStation={handleSelectStation}
          connectionStatus={connectionStatus}
          lastSyncTime={lastSyncTime}
          onForceSync={forceSync}
          isSoundEnabled={audioSettings.masterSoundEnabled}
          onToggleSound={toggleMasterSound}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenOrderLookup={handleOpenOrderLookup}
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
          onToggleTvMode={() => navigate('/kds/tv')}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
        />

        {/* View Switcher based on Sidebar and Header */}
        <main className="flex-1 flex overflow-hidden">
          {activeTab === 'orders' &&
            (selectedStationId === 'all' ? (
              <KdsStationOverview
                stations={stations}
                tickets={tickets}
                onSelectStation={handleSelectStation}
                isDarkMode={isDarkMode}
              />
            ) : (
              <KdsStationLiveOrders
                station={currentStationObj}
                tickets={tickets}
                onAcceptTicket={(ticketId) => acceptMutation.mutate(ticketId)}
                onStartTicket={(ticketId) => startMutation.mutate(ticketId)}
                onReadyTicket={(ticketId) => readyMutation.mutate(ticketId)}
                onCancelTicketClick={(ticket) => setCancelingTicket(ticket)}
                onToggleItem={(ticketId, itemId, completed) =>
                  toggleItemMutation.mutate({ ticketId, itemId, completed })
                }
                onUpdateItemStatus={(ticketId, itemId, status) =>
                  updateItemStatusMutation.mutate({ ticketId, itemId, status })
                }
                isDarkMode={isDarkMode}
              />
            ))}

          {activeTab === 'history' && (
            <KdsOrderHistory
              stationId={stationTargetId}
              branchId={currentStationObj?.branchId}
              stations={stations}
              isDarkMode={isDarkMode}
            />
          )}

          {activeTab === 'performance' && (
            <KdsStationPerformance stations={stations} tickets={tickets} isDarkMode={isDarkMode} />
          )}

          {activeTab === 'shift' && <KdsStaffShift isDarkMode={isDarkMode} />}

          {activeTab === 'inventory' && (
            <KdsKitchenInventory stationId={selectedStationId} isDarkMode={isDarkMode} />
          )}

          {activeTab === 'stations' && (
            <div className="flex-1 overflow-y-auto">
              <KdsStationManagement
                darkMode={isDarkMode}
                onSelectStationForLiveView={(stId) => {
                  handleSelectStation(stId);
                  setActiveTab('orders');
                }}
              />
            </div>
          )}
        </main>
      </div>

      {/* Settings Modal */}
      <KdsSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        audioSettings={audioSettings}
        isAudioUnlocked={isAudioUnlocked}
        onUpdateAudioSettings={updateAudioSettings}
        onUnlockAudio={unlockAudio}
        onPlayTestSound={playTestSound}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        onOpenTvMode={() => navigate('/kds/tv')}
        onOpenStationManagement={() => setActiveTab('stations')}
      />

      {/* Order Lookup Modal */}
      <KdsOrderLookupModal
        isOpen={isOrderLookupOpen}
        onClose={() => setIsOrderLookupOpen(false)}
        initialQuery={orderLookupQuery}
        isDarkMode={isDarkMode}
      />

      {/* Emergency Stop Modal */}
      <KdsEmergencyStopModal
        isOpen={isEmergencyStopOpen}
        onClose={() => setIsEmergencyStopOpen(false)}
        isDarkMode={isDarkMode}
      />

      {/* Cancel Ticket Modal */}
      <KdsCancelTicketModal
        ticket={cancelingTicket}
        isOpen={!!cancelingTicket}
        onClose={() => setCancelingTicket(null)}
        onConfirmCancel={handleCancelConfirm}
        isDarkMode={isDarkMode}
      />
    </div>
  );
};
export default KdsMainPage;
