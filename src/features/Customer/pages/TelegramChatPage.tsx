// src/features/Customer/pages/TelegramChatPage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMyMerchantQuery } from '@/api/Queries/merchantQueries';
import {
  useTelegramConversationsQuery,
  useTelegramThreadQuery,
  useMarkTelegramAsReadMutation,
  useSendTelegramMessageMutation,
  useTelegramStatusQuery,
} from '@/api/Queries/telegramQueries';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Search,
  Send,
  MessageSquare,
  Phone,
  SendHorizontal,
  Loader2,
  ArrowLeft,
  CheckCheck,
  Check,
  RefreshCw,
  Sparkles,
  AlertTriangle,
  Bot,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

function formatRelativeTime(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatMessageTime(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Extraction utilities to safely support flat and nested backend responses per §4.8 & §4.9
function getCustomerId(item: any): string {
  if (!item) return '';
  if (typeof item.customer === 'object' && item.customer?._id) return item.customer._id;
  if (typeof item.customer === 'string') return item.customer;
  return item.customerId || item._id || '';
}

function getCustomerName(item: any): string {
  if (!item) return 'Telegram User';
  if (typeof item.customer === 'object' && item.customer?.fullName) return item.customer.fullName;
  return item.customerName || item.customer?.name || 'Telegram User';
}

function getCustomerPhone(item: any): string | undefined {
  if (!item) return undefined;
  if (typeof item.customer === 'object' && item.customer?.phone) return item.customer.phone;
  return item.phone || item.customerPhone;
}

function getCustomerTelegramUsername(item: any): string | undefined {
  if (!item) return undefined;
  if (typeof item.customer === 'object' && item.customer?.telegram?.username) {
    return item.customer.telegram.username;
  }
  return item.telegramUsername || item.username;
}

function getCustomerOptIn(item: any): boolean | undefined {
  if (!item) return undefined;
  if (typeof item.customer === 'object' && item.customer?.telegram?.optIn !== undefined) {
    return item.customer.telegram.optIn;
  }
  return item.optIn;
}

function getLastMessageText(item: any): string {
  if (!item) return '';
  if (typeof item.lastMessage === 'object' && item.lastMessage?.text) return item.lastMessage.text;
  if (typeof item.lastMessage === 'string') return item.lastMessage;
  return '';
}

function getLastMessageTime(item: any): string {
  if (!item) return '';
  if (typeof item.lastMessage === 'object' && item.lastMessage?.createdAt) return item.lastMessage.createdAt;
  return item.lastMessageAt || item.updatedAt || item.createdAt || '';
}

function getLastMessageDirection(item: any): string {
  if (!item) return 'in';
  if (typeof item.lastMessage === 'object' && item.lastMessage?.direction) return item.lastMessage.direction;
  return item.lastDirection || 'in';
}

export const TelegramChatPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: merchantProfile } = useMyMerchantQuery();
  const merchantId = merchantProfile?._id;

  const { data: telegramStatus } = useTelegramStatusQuery(merchantId);
  const isConnected = telegramStatus?.connected ?? false;

  const {
    data: conversations = [],
    isLoading: isConversationsLoading,
    refetch: refetchConversations,
    isRefetching: isConversationsRefetching,
  } = useTelegramConversationsQuery(merchantId);

  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [messageText, setMessageText] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    data: threadData,
    isLoading: isThreadLoading,
    refetch: refetchThread,
  } = useTelegramThreadQuery(merchantId, selectedCustomerId);

  const { mutate: markAsRead } = useMarkTelegramAsReadMutation(merchantId);
  const { mutate: sendMessage, isPending: isSending } =
    useSendTelegramMessageMutation(merchantId);

  // Mark as read when thread opens or selected customer changes
  useEffect(() => {
    if (selectedCustomerId && merchantId) {
      markAsRead(selectedCustomerId);
    }
  }, [selectedCustomerId, merchantId, markAsRead]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (threadData?.messages) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [threadData?.messages]);

  const handleSelectCustomer = (customerId: string) => {
    setSelectedCustomerId(customerId);
    if (merchantId) {
      markAsRead(customerId);
    }
  };

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!messageText.trim() || !selectedCustomerId) return;

    if (!isConnected) {
      toast.error('Telegram bot is not connected. Connect your bot in Settings to send messages.');
      return;
    }

    const textToSend = messageText.trim();
    setMessageText('');

    sendMessage(
      { customerId: selectedCustomerId, text: textToSend },
      {
        onError: (err: any) => {
          const errMsg = err?.response?.data?.message || 'Failed to send message';
          toast.error(errMsg);
          setMessageText(textToSend); // restore on error
        },
        onSuccess: () => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        },
      }
    );
  };

  const filteredConversations = conversations.filter((item) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    const nameMatch = getCustomerName(item).toLowerCase().includes(term);
    const phoneMatch = getCustomerPhone(item)?.toLowerCase().includes(term);
    const usernameMatch = getCustomerTelegramUsername(item)
      ?.toLowerCase()
      .includes(term);
    const textMatch = getLastMessageText(item).toLowerCase().includes(term);
    return nameMatch || phoneMatch || usernameMatch || textMatch;
  });

  const totalUnread = conversations.reduce(
    (acc, item) => acc + (item.unreadCount || 0),
    0
  );

  const selectedConversation = conversations.find(
    (c) => getCustomerId(c) === selectedCustomerId
  );
  
  const activeCustomerName = threadData?.customer?.fullName || (selectedConversation ? getCustomerName(selectedConversation) : 'Telegram User');
  const activeCustomerPhone = threadData?.customer?.phone || (selectedConversation ? getCustomerPhone(selectedConversation) : undefined);
  const activeCustomerUsername = threadData?.customer?.telegram?.username || (selectedConversation ? getCustomerTelegramUsername(selectedConversation) : undefined);
  const activeCustomerOptIn = threadData?.customer?.telegram?.optIn !== undefined ? threadData.customer.telegram.optIn : (selectedConversation ? getCustomerOptIn(selectedConversation) : undefined);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-background overflow-hidden">
      {/* Bot Disconnected Alert Banner */}
      {!isConnected && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2.5 flex items-center justify-between text-xs text-amber-800 dark:text-amber-300 shrink-0">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>
              <strong>Telegram Bot disconnected:</strong> Customer messages will not be received or sent until your bot token is connected.
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate('/settings/telegram')}
            className="h-7 text-xs bg-amber-500 text-white border-none hover:bg-amber-600 gap-1.5 shrink-0"
          >
            <Bot className="h-3.5 w-3.5" />
            Connect Bot Now
          </Button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* LEFT SIDEBAR: Conversation List */}
        <div
          className={cn(
            'w-full md:w-80 lg:w-96 flex flex-col border-r bg-card transition-all duration-200 shrink-0',
            selectedCustomerId ? 'hidden md:flex' : 'flex'
          )}
        >
          {/* Header */}
          <div className="p-4 border-b space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-sky-500/10 text-sky-500">
                  <SendHorizontal className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="font-semibold text-lg leading-none">
                    Telegram Chat
                  </h1>
                  <p className="text-xs text-muted-foreground mt-1">
                    Customer messaging inbox
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {totalUnread > 0 && (
                  <Badge variant="destructive" className="animate-pulse px-2 py-0.5">
                    {totalUnread} new
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => refetchConversations()}
                  disabled={isConversationsRefetching}
                  title="Refresh conversations"
                  className="h-8 w-8"
                >
                  <RefreshCw
                    className={cn(
                      'h-4 w-4 text-muted-foreground',
                      isConversationsRefetching && 'animate-spin'
                    )}
                  />
                </Button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search chats by name, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-muted/50 border-none h-9 text-sm focus-visible:ring-1"
              />
            </div>
          </div>

          {/* Conversation Items List */}
          <div className="flex-1 overflow-y-auto divide-y divide-border/50">
            {isConversationsLoading ? (
              <div className="flex flex-col items-center justify-center h-48 gap-2 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-xs">Loading conversations...</p>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center gap-3 text-muted-foreground my-auto">
                <div className="p-3 rounded-full bg-muted">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-medium text-sm text-foreground">
                    No Telegram conversations
                  </p>
                  <p className="text-xs mt-1">
                    {searchTerm
                      ? 'No matches found for your search.'
                      : 'Messages from customers who connected via Telegram will appear here.'}
                  </p>
                </div>
              </div>
            ) : (
              filteredConversations.map((item, idx) => {
                const customerId = getCustomerId(item);
                const customerName = getCustomerName(item);
                const customerUsername = getCustomerTelegramUsername(item);
                const lastMsgText = getLastMessageText(item);
                const lastMsgTime = getLastMessageTime(item);
                const lastMsgDir = getLastMessageDirection(item);
                const isSelected = customerId === selectedCustomerId;
                const hasUnread = (item.unreadCount || 0) > 0;

                return (
                  <button
                    key={customerId || `chat-${idx}`}
                    onClick={() => handleSelectCustomer(customerId)}
                    className={cn(
                      'w-full text-left p-3.5 flex items-start gap-3 transition-colors hover:bg-accent/50 relative group',
                      isSelected && 'bg-accent/80 border-l-4 border-sky-500 pl-2.5'
                    )}
                  >
                    <div className="relative shrink-0">
                      <Avatar className="h-10 w-10 border border-border">
                        <AvatarFallback className="bg-sky-500/10 text-sky-600 dark:text-sky-400 font-semibold text-sm">
                          {customerName
                            ? customerName.substring(0, 2).toUpperCase()
                            : 'CU'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-0.5 -right-0.5 bg-sky-500 text-white p-0.5 rounded-full ring-2 ring-background">
                        <SendHorizontal className="h-2.5 w-2.5" />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span
                          className={cn(
                            'font-medium text-sm truncate',
                            hasUnread ? 'text-foreground font-semibold' : 'text-foreground'
                          )}
                        >
                          {customerName}
                        </span>
                        <span className="text-[11px] text-muted-foreground shrink-0">
                          {formatRelativeTime(lastMsgTime)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <p
                          className={cn(
                            'text-xs truncate max-w-[180px]',
                            hasUnread
                              ? 'text-foreground font-medium'
                              : 'text-muted-foreground'
                          )}
                        >
                          {lastMsgDir === 'out' && (
                            <span className="text-muted-foreground font-normal">You: </span>
                          )}
                          {lastMsgText || 'No message history'}
                        </p>

                        {hasUnread && (
                          <Badge
                            variant="destructive"
                            className="h-5 min-w-5 rounded-full px-1.5 flex items-center justify-center text-[10px] font-bold shrink-0"
                          >
                            {item.unreadCount}
                          </Badge>
                        )}
                      </div>

                      {customerUsername && (
                        <p className="text-[10px] text-sky-600 dark:text-sky-400 font-mono mt-0.5">
                          @{customerUsername}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT MAIN PANEL: Active Chat Thread */}
        <div
          className={cn(
            'flex-1 flex flex-col h-full bg-background min-w-0',
            !selectedCustomerId ? 'hidden md:flex' : 'flex'
          )}
        >
          {!selectedCustomerId ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground gap-4">
              <div className="p-4 rounded-full bg-sky-500/10 text-sky-500 border border-sky-500/20">
                <MessageSquare className="h-10 w-10" />
              </div>
              <div className="max-w-sm space-y-1">
                <h3 className="font-semibold text-lg text-foreground">
                  Select a Conversation
                </h3>
                <p className="text-xs text-muted-foreground">
                  Choose a customer from the left sidebar to view their message history and reply directly via Telegram.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Thread Top Header */}
              <div className="p-3.5 px-4 border-b bg-card flex items-center justify-between gap-3 shrink-0 shadow-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden h-8 w-8 shrink-0"
                    onClick={() => setSelectedCustomerId(null)}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>

                  <Avatar className="h-9 w-9 border">
                    <AvatarFallback className="bg-sky-500/10 text-sky-600 dark:text-sky-400 font-semibold text-sm">
                      {activeCustomerName
                        ? activeCustomerName.substring(0, 2).toUpperCase()
                        : 'CU'}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="font-semibold text-sm truncate">
                        {activeCustomerName}
                      </h2>
                      {activeCustomerOptIn !== undefined && (
                        <Badge
                          variant={
                            activeCustomerOptIn ? 'outline' : 'secondary'
                          }
                          className={cn(
                            'text-[10px] px-1.5 py-0 h-4 font-normal',
                            activeCustomerOptIn
                              ? 'border-emerald-500/30 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20'
                              : 'text-muted-foreground'
                          )}
                        >
                          {activeCustomerOptIn ? 'Opted in' : 'Opted out'}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {activeCustomerPhone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {activeCustomerPhone}
                        </span>
                      )}
                      {activeCustomerUsername && (
                        <span className="text-sky-600 dark:text-sky-400 font-mono">
                          @{activeCustomerUsername}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground"
                    onClick={() => refetchThread()}
                    title="Refresh thread"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Messages Thread Container */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/20">
                {isThreadLoading && !threadData ? (
                  <div className="flex items-center justify-center h-full gap-2 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <span className="text-xs">Loading messages...</span>
                  </div>
                ) : !threadData?.messages || threadData.messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-6 text-muted-foreground gap-2">
                    <Sparkles className="h-8 w-8 text-sky-500/50" />
                    <p className="text-sm font-medium text-foreground">
                      No messages in this chat yet
                    </p>
                    <p className="text-xs max-w-xs">
                      Type a message below to send your first message to{' '}
                      {activeCustomerName || 'this customer'}.
                    </p>
                  </div>
                ) : (
                  threadData.messages.map((msg) => {
                    const isInbound = msg.direction === 'in';

                    return (
                      <div
                        key={msg._id}
                        className={cn(
                          'flex flex-col max-w-[80%] md:max-w-[70%]',
                          isInbound ? 'mr-auto items-start' : 'ml-auto items-end'
                        )}
                      >
                        <div
                          className={cn(
                            'p-3 rounded-2xl text-sm leading-relaxed shadow-sm break-words',
                            isInbound
                              ? 'bg-card text-card-foreground rounded-tl-xs border border-border/60'
                              : 'bg-sky-600 text-white rounded-tr-xs'
                          )}
                        >
                          <p className="whitespace-pre-wrap">{msg.text}</p>
                        </div>

                        <div className="flex items-center gap-1 mt-1 px-1 text-[10px] text-muted-foreground">
                          <span>{formatMessageTime(msg.createdAt)}</span>
                          {!isInbound && (
                            <span>
                              {msg.isRead ? (
                                <CheckCheck className="h-3 w-3 text-sky-500 inline" />
                              ) : (
                                <Check className="h-3 w-3 text-muted-foreground inline" />
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Footer */}
              <form
                onSubmit={handleSend}
                className="p-3 border-t bg-card flex items-center gap-2 shrink-0"
              >
                <Input
                  placeholder={`Reply to ${
                    activeCustomerName || 'customer'
                  }...`}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  disabled={isSending || !isConnected}
                  className="flex-1 bg-muted/40 border-border/80 focus-visible:ring-1 text-sm h-10"
                />
                <Button
                  type="submit"
                  size="default"
                  disabled={!messageText.trim() || isSending || !isConnected}
                  className="bg-sky-600 hover:bg-sky-700 text-white gap-2 px-4 h-10"
                >
                  {isSending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <span>Send</span>
                      <Send className="h-3.5 w-3.5" />
                    </>
                  )}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TelegramChatPage;
