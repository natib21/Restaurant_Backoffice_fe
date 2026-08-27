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
import { useMenuItemsQuery } from '@/api/Queries/menuQueries';
import { useAddItemsToOrderMutation } from '@/api/Queries/orderQuery';
import { Plus, Minus, Trash2, Search, UtensilsCrossed, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatOrderItemName } from '../lib/orderUtils';

interface AddItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: {
    _id: string;
    orderNumber: string;
    status: string;
  } | null;
}

interface DraftItem {
  menuItemId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  notes: string;
}

export const AddItemsModal: React.FC<AddItemsModalProps> = ({
  isOpen,
  onClose,
  order,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [draftItems, setDraftItems] = useState<DraftItem[]>([]);

  const { data: menuItems = [], isLoading: isLoadingMenu } = useMenuItemsQuery({
    available: true,
  });
  const { mutate: addItems, isPending } = useAddItemsToOrderMutation();

  const filteredMenuItems = useMemo(() => {
    if (!searchTerm) return menuItems.slice(0, 15);
    const q = searchTerm.toLowerCase();
    return menuItems.filter((item: any) => {
      const name = formatOrderItemName(item.name || item);
      return name.toLowerCase().includes(q);
    });
  }, [menuItems, searchTerm]);

  const handleSelectItem = (item: any) => {
    const itemName = formatOrderItemName(item.name || item);
    const price = item.price || item.variants?.[0]?.price || 0;

    setDraftItems((prev) => {
      const existing = prev.find((d) => d.menuItemId === item._id);
      if (existing) {
        return prev.map((d) =>
          d.menuItemId === item._id
            ? { ...d, quantity: d.quantity + 1 }
            : d
        );
      }
      return [
        ...prev,
        {
          menuItemId: item._id,
          name: itemName,
          unitPrice: price,
          quantity: 1,
          notes: '',
        },
      ];
    });
  };

  const handleUpdateQuantity = (menuItemId: string, delta: number) => {
    setDraftItems((prev) =>
      prev
        .map((d) => {
          if (d.menuItemId === menuItemId) {
            const newQty = d.quantity + delta;
            return newQty > 0 ? { ...d, quantity: newQty } : null;
          }
          return d;
        })
        .filter(Boolean) as DraftItem[]
    );
  };

  const handleUpdateNotes = (menuItemId: string, notes: string) => {
    setDraftItems((prev) =>
      prev.map((d) => (d.menuItemId === menuItemId ? { ...d, notes } : d))
    );
  };

  const handleRemoveDraftItem = (menuItemId: string) => {
    setDraftItems((prev) => prev.filter((d) => d.menuItemId !== menuItemId));
  };

  const handleSubmit = () => {
    if (!order || draftItems.length === 0) return;

    addItems(
      {
        orderId: order._id,
        items: draftItems.map((d) => ({
          menuItemId: d.menuItemId,
          quantity: d.quantity,
          notes: d.notes,
        })),
      },
      {
        onSuccess: () => {
          setDraftItems([]);
          setSearchTerm('');
          onClose();
        },
      }
    );
  };

  if (!order) return null;

  const totalAddedAmount = draftItems.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[620px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <UtensilsCrossed className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">
                Add Items to Order {order.orderNumber}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Select menu items to append. Kitchen will be automatically notified.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-4 flex-1 overflow-hidden py-2">
          {/* Left Column: Menu Item Browser */}
          <div className="flex flex-col border rounded-lg p-3 bg-muted/20 overflow-hidden">
            <div className="relative mb-2">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search menu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-8 text-xs bg-background"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-[260px]">
              {isLoadingMenu ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin mx-auto mb-1" />
                  Loading items...
                </div>
              ) : filteredMenuItems.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  No matching menu items
                </div>
              ) : (
                filteredMenuItems.map((item: any) => {
                  const name = formatOrderItemName(item.name || item);
                  const price = item.price || item.variants?.[0]?.price || 0;
                  return (
                    <button
                      key={item._id}
                      type="button"
                      onClick={() => handleSelectItem(item)}
                      className="w-full flex items-center justify-between p-2 rounded-md bg-card border hover:border-primary/50 text-left transition-colors group"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="text-xs font-semibold truncate group-hover:text-primary">
                          {name}
                        </p>
                        <p className="text-[11px] text-muted-foreground font-mono">
                          ETB {price.toLocaleString()}
                        </p>
                      </div>
                      <div className="p-1 rounded bg-muted group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0">
                        <Plus className="h-3 w-3" />
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Selected Items Staging */}
          <div className="flex flex-col border rounded-lg p-3 bg-muted/20 overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Selected ({draftItems.length})
              </span>
              {draftItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => setDraftItems([])}
                  className="text-[11px] text-destructive hover:underline"
                >
                  Clear All
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[260px]">
              {draftItems.length === 0 ? (
                <div className="py-12 text-center text-xs text-muted-foreground">
                  No items selected yet.<br />Click items on the left to add.
                </div>
              ) : (
                draftItems.map((item) => (
                  <div
                    key={item.menuItemId}
                    className="p-2 rounded-md bg-card border space-y-1.5 shadow-2xs"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-semibold truncate">
                        {item.name}
                      </p>
                      <button
                        type="button"
                        onClick={() => handleRemoveDraftItem(item.menuItemId)}
                        className="text-muted-foreground hover:text-destructive p-0.5"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1 border rounded-md px-1 py-0.5 bg-muted/30">
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.menuItemId, -1)}
                          className="hover:text-primary"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-5 text-center font-bold font-mono">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.menuItemId, 1)}
                          className="hover:text-primary"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      <span className="font-mono font-semibold text-xs text-foreground">
                        ETB {(item.unitPrice * item.quantity).toLocaleString()}
                      </span>
                    </div>

                    <Input
                      placeholder="Special note (e.g. Extra spicy)..."
                      value={item.notes}
                      onChange={(e) =>
                        handleUpdateNotes(item.menuItemId, e.target.value)
                      }
                      className="h-6 text-[11px] px-1.5"
                    />
                  </div>
                ))
              )}
            </div>

            {draftItems.length > 0 && (
              <div className="border-t pt-2 mt-2 flex justify-between items-center text-xs font-bold">
                <span>Extra Total</span>
                <span className="text-primary font-mono">
                  +ETB {totalAddedAmount.toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={isPending || draftItems.length === 0}
            className="gap-1.5"
          >
            {isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Appending Items...</span>
              </>
            ) : (
              <>
                <Plus className="h-3.5 w-3.5" />
                <span>Add {draftItems.reduce((s, i) => s + i.quantity, 0)} Items</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
export default AddItemsModal;
