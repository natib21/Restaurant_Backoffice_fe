// src/components/Common/AdvancedFilter/AdvancedFilterDrawer.tsx
import React, { useState } from 'react';
import {
  X,
  RotateCcw,
  Check,
  BookmarkPlus,
  SlidersHorizontal,
  Calendar,
  DollarSign,
  Hash,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {type AdvancedFilterField } from './types';

interface AdvancedFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filterFields: AdvancedFilterField[];
  values: Record<string, any>;
  onChange: (key: string, value: any) => void;
  onApply: () => void;
  onReset: () => void;
  onSavePreset?: (presetName: string) => void;
  activeCount: number;
}

export const AdvancedFilterDrawer: React.FC<AdvancedFilterDrawerProps> = ({
  isOpen,
  onClose,
  filterFields,
  values,
  onChange,
  onApply,
  onReset,
  onSavePreset,
  activeCount,
}) => {
  const [savePresetOpen, setSavePresetOpen] = useState(false);
  const [presetNameInput, setPresetNameInput] = useState('');

  if (!isOpen) return null;

  const handleSavePreset = () => {
    if (!presetNameInput.trim() || !onSavePreset) return;
    onSavePreset(presetNameInput.trim());
    setPresetNameInput('');
    setSavePresetOpen(false);
  };

  return (
    <div className="w-full rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-4 sm:p-5 space-y-5 animate-in slide-in-from-top-2 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <SlidersHorizontal className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Advanced Filters
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Refine and customize your view with precise filtering criteria.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onSavePreset && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSavePresetOpen(true)}
              className="h-8 text-xs font-semibold rounded-xl gap-1 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <BookmarkPlus className="h-3.5 w-3.5 text-primary" />
              <span>Save View</span>
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Dynamic Fields Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filterFields.map((field) => {
          const val = values[field.id];

          // 1. Text Field
          if (field.type === 'text') {
            return (
              <div key={field.id} className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {field.label}
                </Label>
                <div className="relative">
                  <Input
                    placeholder={field.placeholder || `Filter by ${field.label}...`}
                    value={val || ''}
                    onChange={(e) => onChange(field.id, e.target.value)}
                    className="h-9 text-xs rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700"
                  />
                  {val && (
                    <button
                      type="button"
                      onClick={() => onChange(field.id, '')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          }

          // 2. Select Field
          if (field.type === 'select') {
            return (
              <div key={field.id} className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {field.label}
                </Label>
                <Select
                  value={val || 'all'}
                  onValueChange={(v) => onChange(field.id, v === 'all' ? '' : v)}
                >
                  <SelectTrigger className="h-9 text-xs rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700">
                    <SelectValue placeholder={field.placeholder || `All ${field.label}`} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs font-medium">
                      All {field.label}
                    </SelectItem>
                    {field.options?.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="text-xs">
                        <div className="flex items-center justify-between w-full gap-2">
                          <span>{opt.label}</span>
                          {opt.count !== undefined && (
                            <span className="text-[10px] text-slate-400">({opt.count})</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            );
          }

          // 3. Multi-Select Pills / Checkboxes
          if (field.type === 'multi-select') {
            const selectedArray: string[] = Array.isArray(val) ? val : [];
            const toggleItem = (optVal: string) => {
              if (selectedArray.includes(optVal)) {
                onChange(
                  field.id,
                  selectedArray.filter((x) => x !== optVal)
                );
              } else {
                onChange(field.id, [...selectedArray, optVal]);
              }
            };

            return (
              <div key={field.id} className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {field.label}
                </Label>
                <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700 min-h-[42px] items-center">
                  {field.options?.map((opt) => {
                    const isChecked = selectedArray.includes(opt.value);
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => toggleItem(opt.value)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                          isChecked
                            ? 'bg-primary text-white shadow-2xs'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-primary/50'
                        }`}
                      >
                        {isChecked && <Check className="h-3 w-3" />}
                        <span>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          }

          // 4. Number Range (Min & Max)
          if (field.type === 'number-range') {
            const rangeVal = val || { min: '', max: '' };
            return (
              <div key={field.id} className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>{field.label}</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {field.prefix || ''} Min — Max {field.suffix || ''}
                  </span>
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    min={field.min}
                    max={field.max}
                    step={field.step || 1}
                    value={rangeVal.min ?? ''}
                    onChange={(e) =>
                      onChange(field.id, { ...rangeVal, min: e.target.value })
                    }
                    className="h-9 text-xs rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700"
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    min={field.min}
                    max={field.max}
                    step={field.step || 1}
                    value={rangeVal.max ?? ''}
                    onChange={(e) =>
                      onChange(field.id, { ...rangeVal, max: e.target.value })
                    }
                    className="h-9 text-xs rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700"
                  />
                </div>
              </div>
            );
          }

          // 5. Date Range (From & To)
          if (field.type === 'date-range') {
            const dateVal = val || { from: '', to: '' };
            return (
              <div key={field.id} className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-primary" />
                  <span>{field.label}</span>
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">
                      From
                    </span>
                    <Input
                      type="date"
                      value={dateVal.from || ''}
                      onChange={(e) =>
                        onChange(field.id, { ...dateVal, from: e.target.value })
                      }
                      className="h-9 text-xs rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">
                      To
                    </span>
                    <Input
                      type="date"
                      value={dateVal.to || ''}
                      onChange={(e) =>
                        onChange(field.id, { ...dateVal, to: e.target.value })
                      }
                      className="h-9 text-xs rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700"
                    />
                  </div>
                </div>
              </div>
            );
          }

          // 6. Status Pills
          if (field.type === 'status-pills') {
            return (
              <div key={field.id} className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {field.label}
                </Label>
                <div className="flex flex-wrap gap-1.5 p-1.5 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => onChange(field.id, 'all')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      !val || val === 'all'
                        ? 'bg-primary text-white shadow-2xs'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    All
                  </button>
                  {field.options?.map((opt) => {
                    const isSelected = val === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => onChange(field.id, opt.value)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-primary text-white shadow-2xs'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          }

          // 7. Boolean Switch
          if (field.type === 'boolean') {
            return (
              <div
                key={field.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700"
              >
                <div className="space-y-0.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                    {field.label}
                  </Label>
                  {field.description && (
                    <p className="text-[10px] text-slate-400">{field.description}</p>
                  )}
                </div>
                <Switch
                  checked={Boolean(val)}
                  onCheckedChange={(checked) => onChange(field.id, checked)}
                />
              </div>
            );
          }

          return null;
        })}
      </div>

      {/* Footer Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          {activeCount > 0 && (
            <span className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-lg">
              {activeCount} custom criteria configured
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={onReset}
            className="h-9 text-xs font-semibold rounded-xl border-slate-200 dark:border-slate-700"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            Reset
          </Button>

          <Button
            size="sm"
            onClick={() => {
              onApply();
              onClose();
            }}
            className="h-9 text-xs font-bold rounded-xl gap-1 bg-primary text-primary-foreground shadow-2xs hover:bg-primary/90"
          >
            <Check className="h-3.5 w-3.5" />
            Apply Filters
          </Button>
        </div>
      </div>

      {/* Save Preset Dialog */}
      <Dialog open={savePresetOpen} onOpenChange={setSavePresetOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Save View Preset</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label className="text-xs font-semibold">Preset Name</Label>
            <Input
              placeholder="e.g. VIP Active Diners, Low Stock Kitchen..."
              value={presetNameInput}
              onChange={(e) => setPresetNameInput(e.target.value)}
              className="h-9 text-xs rounded-xl"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSavePreset();
              }}
            />
            <p className="text-[11px] text-muted-foreground">
              This will save current search terms, filters, grouping, view mode, and density settings to your browser for quick 1-click access.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSavePresetOpen(false)}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSavePreset}
              disabled={!presetNameInput.trim()}
              className="rounded-xl text-xs font-bold"
            >
              Save View
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
