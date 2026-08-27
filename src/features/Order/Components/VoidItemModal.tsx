import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertCircle,
  RotateCcw,
  XCircle,
  Loader2,
  Search,
  Check,
  Plus,
  Minus,
  ArrowRight,
  Sparkles,
  Utensils,
} from 'lucide-react';
import {
  useVoidOrderItemMutation,
  useAddItemsToOrderMutation,
  type OrderItem,
} from '@/api/Queries/orderQuery';
import { useMenuItemsQuery } from '@/api/Queries/menuQueries';
import { formatOrderItemName } from '../lib/orderUtils';
import { Badge } from '@/components/ui/badge';

interface VoidItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  item: OrderItem | null;
  onSuccess?: () => void;
}

const COMMON_REASONS = [
  'Out of stock - fridge / inventory empty',
  'Customer changed mind / requested alternative',
  'Food quality issue / rework needed',
  'Wrong dish entered by staff',
  'Customer left / duplicate entry',
];

type ReplacementType = 'none' | 'substitute' | 'same';

export const VoidItemModal: React.FC<VoidItemModalProps> = ({
  isOpen,
  onClose,
  orderId,
  item,
  onSuccess,
}) => {
  const [reason, setReason] = useState('Out of stock - fridge / inventory empty');
  const [replacementType, setReplacementType] = useState<ReplacementType>('substitute');
  const [searchMenu, setSearchMenu] = useState('');
  const [selectedMenuItem, setSelectedMenuItem] = useState<any | null>(null);
  const [replacementQty, setReplacementQty] = useState(1);
  const [replacementNotes, setReplacementNotes] = useState('');

  const { mutate: voidItem, isPending: isVoiding } = useVoidOrderItemMutation();
  const { mutate: addItems, isPending: isAdding } = useAddItemsToOrderMutation();
  const { data: menuItems = [], isLoading: isLoadingMenu } = useMenuItemsQuery({
    available: true,
  });

  const isSubmitting = isVoiding || isAdding;

  // Filter available menu items
  const filteredMenuItems = useMemo(() => {
    if (!menuItems || menuItems.length === 0) return [];
    const q = searchMenu.toLowerCase().trim();
    return menuItems.filter((m: any) => {
      const name = formatOrderItemName(m.name || m);
      if (!q) return true;
      return name.toLowerCase().includes(q) || (m.category?.name || '').toLowerCase().includes(q);
    });
  }, [menuItems, searchMenu]);

  if (!item) return null;

  const itemName = formatOrderItemName(item);
  const itemId = item._id || (item as any).id;
  const isItemServed = (item.status || '').toLowerCase() === 'served';

  const handleSelectAlternative = (menuItem: any) => {
    setSelectedMenuItem(menuItem);
    setReplacementQty(item.quantity || 1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || !itemId) return;

    if (replacementType === 'substitute' && selectedMenuItem) {
      const altName = formatOrderItemName(selectedMenuItem.name || selectedMenuItem);
      const combinedReason = `${reason.trim()} (Replaced with ${altName})`;

      // Step 1: Void the original item
      voidItem(
        {
          orderId,
          itemId,
          reason: combinedReason,
          createReplacement: false,
        },
        {
          onSuccess: () => {
            // Step 2: Add the substituted item
            const noteText = replacementNotes.trim()
              ? `${replacementNotes.trim()} [Replacement for voided ${itemName}]`
              : `[Replacement for voided ${itemName}]`;

            addItems(
              {
                orderId,
                items: [
                  {
                    menuItemId: selectedMenuItem._id,
                    quantity: replacementQty,
                    notes: noteText,
                  },
                ],
              },
              {
                onSuccess: () => {
                  handleClose();
                  onSuccess?.();
                },
              }
            );
          },
        }
      );
    } else if (replacementType === 'same') {
      // Void with duplicate kitchen re-fire
      voidItem(
        {
          orderId,
          itemId,
          reason: reason.trim(),
          createReplacement: true,
        },
        {
          onSuccess: () => {
            handleClose();
            onSuccess?.();
          },
        }
      );
    } else {
      // Void without replacement
      voidItem(
        {
          orderId,
          itemId,
          reason: reason.trim(),
          createReplacement: false,
        },
        {
          onSuccess: () => {
            handleClose();
            onSuccess?.();
          },
        }
      );
    }
  };

  const handleClose = () => {
    setReason('Out of stock - fridge / inventory empty');
    setReplacementType('substitute');
    setSelectedMenuItem(null);
    setSearchMenu('');
    setReplacementQty(1);
    setReplacementNotes('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[560px] max-h-[92vh] flex flex-col p-5 rounded-2xl overflow-hidden">
        <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
          <DialogHeader className="pb-3 border-b">
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <div className="p-2 rounded-xl bg-rose-500/10">
                <XCircle className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-foreground">
                  Void Item & Select Replacement
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground pt-0.5">
                  Voiding <span className="font-bold text-foreground">"{itemName}"</span> ({item.quantity}x)
                  {isItemServed && ' • Currently marked as Served'}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 py-3.5 pr-1">
            {/* Step 1: Reason Selection */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-foreground">
                Void Reason <span className="text-rose-500">*</span>
              </Label>
              <div className="flex flex-wrap gap-1.5 pb-1">
                {COMMON_REASONS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setReason(preset)}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                      reason === preset
                        ? 'bg-rose-50 border-rose-300 text-rose-700 dark:bg-rose-950/40 dark:border-rose-700 dark:text-rose-300 font-semibold'
                        : 'bg-muted/40 hover:bg-muted text-muted-foreground border-border/60'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
              <Textarea
                placeholder="Specify the reason for voiding this item (e.g., fridge empty, customer chose alternative)..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                className="text-xs resize-none rounded-xl"
                required
              />
            </div>

            {/* Step 2: Replacement Action Mode */}
            <div className="space-y-2 pt-1">
              <Label className="text-xs font-semibold text-foreground">
                Replacement Action
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {/* Option 1: Substitute */}
                <button
                  type="button"
                  onClick={() => setReplacementType('substitute')}
                  className={`flex flex-col p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    replacementType === 'substitute'
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-border bg-card hover:bg-muted/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1 w-full">
                    <span className="text-xs font-bold text-foreground flex items-center gap-1">
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                      Substitute
                    </span>
                    <span
                      className={`h-3 w-3 rounded-full border flex items-center justify-center ${
                        replacementType === 'substitute'
                          ? 'border-primary bg-primary'
                          : 'border-muted-foreground'
                      }`}
                    >
                      {replacementType === 'substitute' && (
                        <span className="h-1.5 w-1.5 rounded-full bg-white" />
                      )}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground leading-tight">
                    Pick a different drink or dish (e.g. Pepsi, Sprite)
                  </span>
                </button>

                {/* Option 2: Re-fire Same */}
                <button
                  type="button"
                  onClick={() => setReplacementType('same')}
                  className={`flex flex-col p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    replacementType === 'same'
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-border bg-card hover:bg-muted/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1 w-full">
                    <span className="text-xs font-bold text-foreground flex items-center gap-1">
                      <RotateCcw className="h-3.5 w-3.5 text-amber-500" />
                      Re-order Same
                    </span>
                    <span
                      className={`h-3 w-3 rounded-full border flex items-center justify-center ${
                        replacementType === 'same'
                          ? 'border-primary bg-primary'
                          : 'border-muted-foreground'
                      }`}
                    >
                      {replacementType === 'same' && (
                        <span className="h-1.5 w-1.5 rounded-full bg-white" />
                      )}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground leading-tight">
                    Send fresh ticket to kitchen for same item
                  </span>
                </button>

                {/* Option 3: Cancel without replacement */}
                <button
                  type="button"
                  onClick={() => setReplacementType('none')}
                  className={`flex flex-col p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    replacementType === 'none'
                      ? 'border-rose-400 bg-rose-50/30 dark:bg-rose-950/20 ring-1 ring-rose-400'
                      : 'border-border bg-card hover:bg-muted/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1 w-full">
                    <span className="text-xs font-bold text-foreground flex items-center gap-1">
                      <XCircle className="h-3.5 w-3.5 text-rose-500" />
                      No Replacement
                    </span>
                    <span
                      className={`h-3 w-3 rounded-full border flex items-center justify-center ${
                        replacementType === 'none'
                          ? 'border-rose-500 bg-rose-500'
                          : 'border-muted-foreground'
                      }`}
                    >
                      {replacementType === 'none' && (
                        <span className="h-1.5 w-1.5 rounded-full bg-white" />
                      )}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground leading-tight">
                    Cancel item only (customer declined alternative)
                  </span>
                </button>
              </div>
            </div>

            {/* If Substitute is selected: Catalog Browser */}
            {replacementType === 'substitute' && (
              <div className="space-y-3 p-3.5 rounded-xl border bg-muted/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Utensils className="h-3.5 w-3.5 text-primary" />
                    Select Substitute Item
                  </span>
                  {selectedMenuItem && (
                    <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30">
                      Selected: {formatOrderItemName(selectedMenuItem.name || selectedMenuItem)}
                    </Badge>
                  )}
                </div>

                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search replacement (e.g. Pepsi, Sprite, Fanta, Water)..."
                    value={searchMenu}
                    onChange={(e) => setSearchMenu(e.target.value)}
                    className="pl-8 h-8 text-xs bg-background rounded-lg"
                  />
                </div>

                <div className="max-h-[160px] overflow-y-auto space-y-1.5 pr-1 divide-y divide-border/40">
                  {isLoadingMenu ? (
                    <div className="py-6 text-center text-xs text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin mx-auto mb-1" />
                      Loading menu...
                    </div>
                  ) : filteredMenuItems.length === 0 ? (
                    <div className="py-6 text-center text-xs text-muted-foreground">
                      No matching menu items found
                    </div>
                  ) : (
                    filteredMenuItems.map((m: any) => {
                      const name = formatOrderItemName(m.name || m);
                      const price = m.price || m.variants?.[0]?.price || 0;
                      const isSelected = selectedMenuItem?._id === m._id;

                      return (
                        <button
                          key={m._id}
                          type="button"
                          onClick={() => handleSelectAlternative(m)}
                          className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-all ${
                            isSelected
                              ? 'bg-primary text-primary-foreground font-bold shadow-2xs'
                              : 'bg-card hover:bg-muted text-foreground border border-border/50'
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <p className="text-xs truncate">{name}</p>
                            <span
                              className={`text-[10px] font-mono ${
                                isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'
                              }`}
                            >
                              ETB {price.toLocaleString()}
                              {m.requiresKitchen === false ? ' • Direct Serve' : ' • Kitchen'}
                            </span>
                          </div>
                          {isSelected ? (
                            <Check className="h-4 w-4 shrink-0" />
                          ) : (
                            <Plus className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          )}
                        </button>
                      );
                    })
                  )}
                </div>

                {selectedMenuItem && (
                  <div className="pt-2 border-t space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-muted-foreground">Quantity</span>
                      <div className="flex items-center gap-1.5 border rounded-lg px-2 py-0.5 bg-background">
                        <button
                          type="button"
                          onClick={() => setReplacementQty(Math.max(1, replacementQty - 1))}
                          className="hover:text-primary p-0.5"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-5 text-center font-bold font-mono text-xs">
                          {replacementQty}
                        </span>
                        <button
                          type="button"
                          onClick={() => setReplacementQty(replacementQty + 1)}
                          className="hover:text-primary p-0.5"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    <Input
                      placeholder="Optional notes for replacement (e.g. Ice, Chilled)..."
                      value={replacementNotes}
                      onChange={(e) => setReplacementNotes(e.target.value)}
                      className="h-7 text-xs bg-background rounded-lg"
                    />

                    {/* Transition comparison pill */}
                    <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
                      <div className="flex items-center gap-1.5">
                        <span className="line-through text-muted-foreground">{itemName}</span>
                        <ArrowRight className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span className="font-bold">
                          {replacementQty}x {formatOrderItemName(selectedMenuItem.name || selectedMenuItem)}
                        </span>
                      </div>
                      <span className="font-mono font-bold">
                        ETB {((selectedMenuItem.price || 0) * replacementQty).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Audit warning info banner */}
            <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-[11px] text-muted-foreground">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
              <span>
                Voiding preserves the item in order history for complete accounting audit trail and links directly to any chosen replacement.
              </span>
            </div>
          </div>

          <DialogFooter className="pt-3 border-t gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClose}
              disabled={isSubmitting}
              className="text-xs rounded-xl"
            >
              Keep Item
            </Button>
            <Button
              type="submit"
              variant="destructive"
              size="sm"
              disabled={
                !reason.trim() ||
                isSubmitting ||
                (replacementType === 'substitute' && !selectedMenuItem)
              }
              className="text-xs font-bold rounded-xl gap-1.5 bg-rose-600 hover:bg-rose-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <XCircle className="h-3.5 w-3.5" />
                  <span>
                    {replacementType === 'substitute'
                      ? 'Void & Add Substitute'
                      : replacementType === 'same'
                      ? 'Void & Re-fire Same'
                      : 'Confirm Void'}
                  </span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
export default VoidItemModal;
