// src/components/layout/order/MenuSelection.tsx
import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ChevronLeft,
  Plus,
  Minus,
  Utensils,
  Loader2,
  LayoutGrid,
  List,
  ShoppingBag,
} from 'lucide-react';
import { useStaffMenuQuery } from '@/api/Queries/menuQueries';
import { useSelector, useDispatch } from 'react-redux';
import { type RootState } from '@/app/store';
import {
  addToCart,
  updateCartQuantity,
  removeFromCart,
} from '../../store/orderSlice';
import { useTablesQuery } from '@/api/Queries/tableQueries';
import { cn } from '@/lib/utils';
import { formatOrderItemName } from '../../lib/orderUtils';

interface Props {
  onBack: () => void;
  onReviewCart: () => void;
}

const MenuSelection: React.FC<Props> = ({ onBack, onReviewCart }) => {
  const dispatch = useDispatch();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');

  const { currentBranchId } = useSelector((state: RootState) => state.ui);
  const { cart } = useSelector((state: RootState) => state.orders);
  const { data: tables = [] } = useTablesQuery(currentBranchId);

  const selectedTable = tables.find((t: any) => t._id === cart.tableId);
  const { data: staffMenuData, isLoading } = useStaffMenuQuery();

  const categories = useMemo(() => {
    if (!staffMenuData?.menu) return ['All'];
    const cats = staffMenuData.menu.map((item: any) => item.category);
    return ['All', ...Array.from(new Set(cats))];
  }, [staffMenuData]);

  const filteredMenuItems = useMemo(() => {
    if (!staffMenuData?.menu) return [];
    return staffMenuData.menu
      .map((item: any) => ({
        ...item,
        id: item.id || item._id, // Normalize id (critical for MongoDB)
        displayName: formatOrderItemName(item.name || item),
      }))
      .filter((item: any) => {
        const matchesSearch = item.displayName
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
        const matchesCategory =
          activeCategory === 'All' || item.category === activeCategory;
        return matchesSearch && matchesCategory;
      });
  }, [staffMenuData, searchTerm, activeCategory]);

  const cartCount = cart.items.reduce((sum, i) => sum + i.quantity, 0);
  const getItemQuantity = (itemId: string) =>
    cart.items.find((i) => i.id === itemId)?.quantity || 0;

  const handleDecrement = (itemId: string, currentQty: number) => {
    if (currentQty <= 1) {
      dispatch(removeFromCart(itemId));
    } else {
      dispatch(updateCartQuantity({ id: itemId, delta: -1 }));
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50">
      {/* Header */}
      <header className="shrink-0 bg-white border-b z-10">
        <div className="flex items-center justify-between ">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="rounded-full hover:bg-primary/10 text-primary"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <div>
              <h2 className="text-lg font-black text-slate-900 leading-none mb-2">
                Menu
              </h2>
              <div className="flex items-center gap-2">
                {selectedTable ? (
                  <Badge className="bg-primary/10 text-primary border-none hover:bg-primary/15 text-[10px] font-bold">
                    TABLE {selectedTable.tableNumber}
                  </Badge>
                ) : (
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Walk-in Customer
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 border rounded-xl p-1 bg-slate-100/50">
            <Button
              variant={layout === 'grid' ? 'default' : 'ghost'}
              size="icon"
              className={cn(
                'h-8 w-8 rounded-lg',
                layout === 'grid' && 'bg-primary shadow-sm'
              )}
              onClick={() => setLayout('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={layout === 'list' ? 'default' : 'ghost'}
              size="icon"
              className={cn(
                'h-8 w-8 rounded-lg',
                layout === 'list' && 'bg-primary shadow-sm'
              )}
              onClick={() => setLayout('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Menu Items */}
      <ScrollArea className="flex-1">
        <div className="">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                Fetching Merchant Data
              </p>
            </div>
          ) : (
            <div
              className={cn(
                'grid gap-4',
                layout === 'grid' ? 'grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
              )}
            >
              {filteredMenuItems.map((item: any) => {
                const quantity = getItemQuantity(item.id);
                return (
                  <div
                    key={item.id}
                    className={cn(
                      'group relative flex transition-all border-2 p-3 rounded-2xl',
                      layout === 'grid'
                        ? 'flex-col'
                        : 'flex-row items-center gap-4',
                      quantity > 0
                        ? 'border-primary bg-primary/[0.02] shadow-sm'
                        : 'border-transparent bg-white shadow-sm hover:border-slate-200'
                    )}
                  >
                    <div
                      className={cn(
                        'bg-slate-100 overflow-hidden shrink-0 rounded-xl',
                        layout === 'grid'
                          ? 'w-full aspect-square mb-3'
                          : 'w-20 h-20'
                      )}
                    >
                      {item.image ? (
                        <img
                          src={item.image}
                          className="w-full h-full object-cover transition-transform group-hover:scale-110"
                          alt={item.displayName}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <Utensils size={32} />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black text-primary/60 uppercase tracking-tighter mb-0.5">
                        {item.category}
                      </p>
                      <h4 className="font-bold text-[15px] text-slate-900 leading-tight truncate">
                        {item.displayName}
                      </h4>
                      <p className="text-primary font-black mt-1 text-lg">
                        {item.price.toLocaleString()}{' '}
                        <span className="text-xs font-medium opacity-60">
                          ETB
                        </span>
                      </p>
                    </div>

                    <div
                      className={cn(
                        'mt-3 md:mt-0',
                        layout === 'grid' ? 'w-full' : 'shrink-0'
                      )}
                    >
                      {quantity === 0 ? (
                        <Button
                          className="w-full bg-slate-100 hover:bg-primary text-slate-900 hover:text-white border-none rounded-xl font-bold h-10 transition-all active:scale-95"
                          onClick={() =>
                            dispatch(
                              addToCart({
                                id: item.id,
                                name: item.displayName,
                                price: Number(item.price),
                                category: item.category,
                                image: item.image,
                              })
                            )
                          }
                        >
                          <Plus className="h-4 w-4 mr-1" /> Add
                        </Button>
                      ) : (
                        <div className="flex items-center justify-between w-full bg-primary rounded-xl p-1 shadow-md">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-white hover:bg-white/20"
                            onClick={() => handleDecrement(item.id, quantity)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="text-white font-black text-sm px-3">
                            {quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-white hover:bg-white/20"
                            onClick={() =>
                              dispatch(
                                updateCartQuantity({ id: item.id, delta: 1 })
                              )
                            }
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Bottom Review Cart Button */}
      {cartCount > 0 && (
        <div className="p-5 bg-white border-t border-slate-100">
          <Button
            onClick={onReviewCart}
            className="w-full h-14 bg-primary hover:opacity-90  flex items-center justify-between px-6  shadow-primary/20 transition-all active:scale-[0.98] text-lg"
          >
            <div className="flex items-center gap-3">
              <div className="bg-white text-primary w-8 h-8 rounded-lg flex items-center justify-center shadow-inner">
                <ShoppingBag className="h-4 w-4" />
              </div>
              <div className="text-left leading-none">
                <span className="block text-white font-black text-sm uppercase tracking-wider">
                  Review Order
                </span>
                <span className="text-primary-foreground/80 text-[10px] font-bold">
                  {cartCount} Items Selected
                </span>
              </div>
            </div>
            <div className="bg-white/20 h-8 w-[1px] mx-2" />
            <div className="text-right">
              <span className="text-xl font-black text-white">
                {cart.totalAmount.toLocaleString()}{' '}
                <span className="text-xs">ETB</span>
              </span>
            </div>
          </Button>
        </div>
      )}
    </div>
  );
};

export default MenuSelection;
