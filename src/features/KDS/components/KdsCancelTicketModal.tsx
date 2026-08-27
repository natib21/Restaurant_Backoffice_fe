// src/features/KDS/components/KdsCancelTicketModal.tsx
import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import type { KdsTicket } from '../types/kdsTypes';

interface KdsCancelTicketModalProps {
  ticket: KdsTicket | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmCancel: (ticketId: string, reason: string) => void;
  isDarkMode?: boolean;
}

export const KdsCancelTicketModal: React.FC<KdsCancelTicketModalProps> = ({
  ticket,
  isOpen,
  onClose,
  onConfirmCancel,
  isDarkMode = true,
}) => {
  const [reason, setReason] = useState('Customer changed mind / modified order');

  if (!isOpen || !ticket) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div
        className={`w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden flex flex-col ${
          isDarkMode ? 'bg-[#111827] border-[#1E293B] text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div
          className={`px-6 py-4 border-b flex items-center justify-between ${
            isDarkMode ? 'border-[#1E293B] bg-[#0E1626]' : 'border-slate-100 bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-5 w-5 text-rose-500" />
            <h2 className="text-base font-black font-mono tracking-wider uppercase text-rose-500">
              Cancel Ticket?
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-300">
            Are you sure you want to cancel ticket <strong className="font-mono text-white">{ticket.ticketNumber}</strong> ({ticket.orderNumber}) from the kitchen queue?
          </p>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Cancellation Reason
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-[#1E293B] border border-slate-700 text-slate-200 text-xs rounded-lg p-2.5 focus:outline-none focus:border-rose-500"
            >
              <option value="Customer changed mind / modified order">Customer changed mind / modified order</option>
              <option value="Ingredient out of stock (86ed)">Ingredient out of stock (86ed)</option>
              <option value="Duplicate order entry">Duplicate order entry</option>
              <option value="Accidental POS dispatch">Accidental POS dispatch</option>
              <option value="Kitchen supervisor manual override">Kitchen supervisor manual override</option>
            </select>
          </div>
        </div>

        {/* Actions */}
        <div
          className={`px-6 py-4 border-t flex items-center justify-between ${
            isDarkMode ? 'border-[#1E293B] bg-[#0E1626]' : 'border-slate-100 bg-slate-50'
          }`}
        >
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold uppercase tracking-wider hover:bg-slate-700 transition-colors"
          >
            Keep Ticket
          </button>

          <button
            onClick={() => {
              onConfirmCancel(ticket._id, reason);
              onClose();
            }}
            className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-md"
          >
            Cancel Ticket
          </button>
        </div>
      </div>
    </div>
  );
};
