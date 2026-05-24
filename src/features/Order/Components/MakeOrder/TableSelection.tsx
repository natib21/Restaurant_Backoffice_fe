// src/components/layout/order/TableSelection.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, ChevronLeft, Users, Circle } from 'lucide-react';
import { useTablesQuery } from '@/api/Queries/tableQueries';
import { useSelector, useDispatch } from 'react-redux';
import { type RootState } from '@/app/store';
import { setOrderContext } from '../../store/orderSlice';
import { cn } from '@/lib/utils';

interface Props {
  onTableSelect: () => void;
  onBack: () => void;
}

const TableSelection: React.FC<Props> = ({ onTableSelect, onBack }) => {
  const dispatch = useDispatch();
  const { currentBranchId } = useSelector((state: RootState) => state.ui);
  const { cart } = useSelector((state: RootState) => state.orders);

  const { data: tables = [], isLoading } = useTablesQuery(currentBranchId);

  const handleSelect = (table: any) => {
    dispatch(setOrderContext({ type: cart.orderType!, tableId: table._id }));
    onTableSelect();
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="p-5 border-b flex items-center justify-between bg-card">
        <div>
          <h3 className="text-xl font-bold tracking-tight">Select Table</h3>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
            Table Map View
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="rounded-full"
        >
          <ChevronLeft className="h-4 w-4 mr-1" /> Back
        </Button>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary/50" />
        </div>
      ) : (
        <ScrollArea className="flex-1">
          <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-4">
            {tables
              .filter((t: any) => t.isActive)
              .map((table: any) => {
                const isAvailable = table.status === 'available';

                return (
                  <div
                    key={table._id}
                    onClick={() => isAvailable && handleSelect(table)}
                    className={cn(
                      'relative h-32 rounded-2xl border-2 transition-all duration-200 cursor-pointer flex flex-col p-4 overflow-hidden',
                      isAvailable
                        ? 'bg-background border-border hover:border-primary hover:shadow-md active:scale-95'
                        : 'bg-muted/50 border-transparent cursor-not-allowed'
                    )}
                  >
                    {/* Status Indicator Dot */}
                    <div className="flex justify-between items-start mb-2">
                      <div
                        className={cn(
                          'flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase',
                          isAvailable
                            ? 'bg-green-100 text-green-700'
                            : 'bg-amber-100 text-amber-700'
                        )}
                      >
                        <Circle
                          className={cn(
                            'h-2 w-2 fill-current',
                            isAvailable ? 'text-green-600' : 'text-amber-600'
                          )}
                        />
                        {table.status}
                      </div>
                      <Users className="h-4 w-4 text-muted-foreground/40" />
                    </div>

                    {/* Table Number */}
                    <div className="mt-auto">
                      <p className="text-xs text-muted-foreground font-semibold leading-none">
                        Table
                      </p>
                      <h4 className="text-3xl font-black tracking-tighter text-foreground">
                        {table.tableNumber}
                      </h4>
                    </div>

                    {/* Capacity / Detail (Optional Placeholder) */}
                    <div className="absolute -right-2 -bottom-2 opacity-[0.03] rotate-12">
                      <TableIcon size={80} />
                    </div>
                  </div>
                );
              })}
          </div>
        </ScrollArea>
      )}

      {/* Footer Legend */}
      <div className="p-4 border-t bg-muted/20 flex justify-center gap-6">
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          <div className="h-3 w-3 rounded-full bg-background border-2 border-border" />{' '}
          Available
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          <div className="h-3 w-3 rounded-full bg-amber-100 border border-amber-200" />{' '}
          Occupied
        </div>
      </div>
    </div>
  );
};

// Simple Icon for the background decoration
const TableIcon = ({ size }: { size: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 3v18M3 12h18" />
  </svg>
);

export default TableSelection;
