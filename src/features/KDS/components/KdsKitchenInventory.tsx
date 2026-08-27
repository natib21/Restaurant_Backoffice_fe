// src/features/KDS/components/KdsKitchenInventory.tsx
import React, { useState } from 'react';
import { Package, AlertTriangle, CheckCircle2, Search, XCircle } from 'lucide-react';
import { useKitchenInventoryQuery, useToggle86ItemMutation } from '@/api/Queries/kitchenQueries';
import type { KdsInventoryItem } from '../types/kdsTypes';

interface KdsKitchenInventoryProps {
  stationId?: string;
  isDarkMode?: boolean;
}

export const KdsKitchenInventory: React.FC<KdsKitchenInventoryProps> = ({
  stationId = 'all',
  isDarkMode = true,
}) => {
  const { data: inventory = [] } = useKitchenInventoryQuery(stationId);
  const toggle86Mutation = useToggle86ItemMutation();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredInventory = inventory.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.stationName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStatusToggle = (item: KdsInventoryItem, nextStatus: 'in_stock' | 'low_stock' | '86ed') => {
    toggle86Mutation.mutate({ itemId: item._id, status: nextStatus });
  };

  return (
    <div className={`p-6 lg:p-8 flex-1 overflow-y-auto ${isDarkMode ? 'bg-[#0B0F19]' : 'bg-slate-50'}`}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2
              className={`text-xl font-bold tracking-wider uppercase font-mono ${
                isDarkMode ? 'text-white' : 'text-slate-900'
              }`}
            >
              Kitchen Item Availability &amp; 86 Management
            </h2>
            <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Instantly mark out-of-stock items (86ed) to prevent servers from placing unobtainable dishes
            </p>
          </div>

          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter inventory item..."
              className={`w-full text-xs rounded-lg pl-9 pr-3 py-2 border focus:outline-none ${
                isDarkMode
                  ? 'bg-[#1E293B] border-slate-700 text-white placeholder:text-slate-500'
                  : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
              }`}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredInventory.map((item) => {
            const is86ed = item.status === '86ed';
            const isLow = item.status === 'low_stock';

            return (
              <div
                key={item._id}
                className={`p-5 rounded-xl border transition-all ${
                  is86ed
                    ? 'bg-[#2A1317] border-rose-900/60'
                    : isLow
                    ? 'bg-[#2A2312] border-amber-900/60'
                    : isDarkMode
                    ? 'bg-[#111827] border-[#1E293B]'
                    : 'bg-white border-slate-200 shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between pb-3 border-b border-slate-800">
                  <div>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-400 font-bold">
                      {item.stationName}
                    </span>
                    <h4 className="text-sm font-bold text-white mt-1.5">{item.name}</h4>
                    <span className="text-xs text-slate-400">{item.category}</span>
                  </div>

                  {is86ed ? (
                    <span className="flex items-center gap-1 text-[11px] font-black text-rose-400 px-2 py-0.5 rounded bg-rose-950/80 border border-rose-800">
                      <XCircle className="h-3.5 w-3.5" /> 86&#39;D
                    </span>
                  ) : isLow ? (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-amber-400 px-2 py-0.5 rounded bg-amber-950/80 border border-amber-800">
                      <AlertTriangle className="h-3.5 w-3.5" /> LOW
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800">
                      <CheckCircle2 className="h-3.5 w-3.5" /> IN STOCK
                    </span>
                  )}
                </div>

                <div className="py-3 flex items-center justify-between text-xs text-slate-300">
                  <span>Current Line Quantity:</span>
                  <span className="font-mono font-bold text-white text-sm">
                    {item.currentStock} {item.unit}
                  </span>
                </div>

                {/* Quick 86 Action Buttons */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80">
                  <button
                    onClick={() => handleStatusToggle(item, 'in_stock')}
                    className={`py-1.5 text-[11px] font-bold rounded-lg uppercase tracking-wider transition-colors ${
                      item.status === 'in_stock'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                    }`}
                  >
                    In Stock
                  </button>

                  <button
                    onClick={() => handleStatusToggle(item, 'low_stock')}
                    className={`py-1.5 text-[11px] font-bold rounded-lg uppercase tracking-wider transition-colors ${
                      item.status === 'low_stock'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                    }`}
                  >
                    Low Stock
                  </button>

                  <button
                    onClick={() => handleStatusToggle(item, '86ed')}
                    className={`py-1.5 text-[11px] font-bold rounded-lg uppercase tracking-wider transition-colors ${
                      item.status === '86ed'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                    }`}
                  >
                    86 It
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
