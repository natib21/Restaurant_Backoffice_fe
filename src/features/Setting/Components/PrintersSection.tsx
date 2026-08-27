// src/features/Setting/Components/PrintersSection.tsx
import React, { useState } from 'react';
import {
  Printer,
  Wifi,
  Usb,
  Bluetooth,
  Utensils,
  Receipt,
  CheckCircle2,
  Plus,
  Trash2,
  Play,
  Save,
  Volume2,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface PrinterDevice {
  id: string;
  name: string;
  role: 'receipt' | 'kitchen_kot' | 'bar_kot' | 'all';
  connectionType: 'network_ip' | 'usb' | 'bluetooth';
  ipAddress?: string;
  port?: number;
  paperWidth: '80mm' | '58mm';
  autoPrintOnOrder: boolean;
  buzzerOnOrder: boolean;
  status: 'online' | 'offline';
}

const initialPrinters: PrinterDevice[] = [
  {
    id: 'prn-1',
    name: 'Cashier Main Receipt Printer',
    role: 'receipt',
    connectionType: 'network_ip',
    ipAddress: '192.168.1.150',
    port: 9100,
    paperWidth: '80mm',
    autoPrintOnOrder: true,
    buzzerOnOrder: false,
    status: 'online',
  },
  {
    id: 'prn-2',
    name: 'Hot Kitchen KOT Printer',
    role: 'kitchen_kot',
    connectionType: 'network_ip',
    ipAddress: '192.168.1.151',
    port: 9100,
    paperWidth: '80mm',
    autoPrintOnOrder: true,
    buzzerOnOrder: true,
    status: 'online',
  },
  {
    id: 'prn-3',
    name: 'Bar & Beverage Printer',
    role: 'bar_kot',
    connectionType: 'bluetooth',
    paperWidth: '58mm',
    autoPrintOnOrder: true,
    buzzerOnOrder: false,
    status: 'offline',
  },
];

export const PrintersSection: React.FC = () => {
  const [printers, setPrinters] = useState<PrinterDevice[]>(initialPrinters);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newPrinter, setNewPrinter] = useState<Partial<PrinterDevice>>({
    name: '',
    role: 'kitchen_kot',
    connectionType: 'network_ip',
    ipAddress: '192.168.1.',
    port: 9100,
    paperWidth: '80mm',
    autoPrintOnOrder: true,
    buzzerOnOrder: true,
    status: 'online',
  });

  const toggleAutoPrint = (id: string) => {
    setPrinters((prev) =>
      prev.map((p) => (p.id === id ? { ...p, autoPrintOnOrder: !p.autoPrintOnOrder } : p))
    );
  };

  const toggleBuzzer = (id: string) => {
    setPrinters((prev) =>
      prev.map((p) => (p.id === id ? { ...p, buzzerOnOrder: !p.buzzerOnOrder } : p))
    );
  };

  const handleDelete = (id: string) => {
    setPrinters((prev) => prev.filter((p) => p.id !== id));
    toast.success('Printer removed');
  };

  const handleTestPrint = (printer: PrinterDevice) => {
    toast.info(`Sending test print ticket to "${printer.name}"...`);
    setTimeout(() => {
      toast.success(`Test ticket printed successfully on ${printer.name}`);
    }, 1200);
  };

  const handleAddPrinter = () => {
    if (!newPrinter.name) {
      toast.error('Please enter a printer name');
      return;
    }
    const created: PrinterDevice = {
      id: `prn-${Date.now()}`,
      name: newPrinter.name,
      role: (newPrinter.role as any) || 'kitchen_kot',
      connectionType: (newPrinter.connectionType as any) || 'network_ip',
      ipAddress: newPrinter.ipAddress,
      port: Number(newPrinter.port || 9100),
      paperWidth: (newPrinter.paperWidth as any) || '80mm',
      autoPrintOnOrder: Boolean(newPrinter.autoPrintOnOrder),
      buzzerOnOrder: Boolean(newPrinter.buzzerOnOrder),
      status: 'online',
    };
    setPrinters((prev) => [...prev, created]);
    setIsAddOpen(false);
    setNewPrinter({
      name: '',
      role: 'kitchen_kot',
      connectionType: 'network_ip',
      ipAddress: '192.168.1.',
      port: 9100,
      paperWidth: '80mm',
      autoPrintOnOrder: true,
      buzzerOnOrder: true,
      status: 'online',
    });
    toast.success('New printer added successfully');
  };

  return (
    <div className="space-y-6">
      <Card className="border-slate-200 shadow-2xs">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Printer className="h-5 w-5 text-indigo-600" /> Kitchen (KOT) & Receipt Printers
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                Configure thermal ESC/POS network and USB printers for automatic receipt and kitchen order ticket printing.
              </CardDescription>
            </div>
            <Button
              onClick={() => setIsAddOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold gap-1.5"
            >
              <Plus className="h-4 w-4" /> Add Printer
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {printers.map((printer) => (
              <div
                key={printer.id}
                className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                      <Printer className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900">{printer.name}</h4>
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-bold uppercase ${
                            printer.status === 'online'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {printer.status}
                        </Badge>
                        <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] uppercase">
                          {printer.role.replace('_', ' ')}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1 font-mono">
                          {printer.connectionType === 'network_ip' && (
                            <>
                              <Wifi className="h-3 w-3 text-indigo-500" />
                              {printer.ipAddress}:{printer.port}
                            </>
                          )}
                          {printer.connectionType === 'usb' && (
                            <>
                              <Usb className="h-3 w-3 text-indigo-500" /> USB Direct
                            </>
                          )}
                          {printer.connectionType === 'bluetooth' && (
                            <>
                              <Bluetooth className="h-3 w-3 text-indigo-500" /> Bluetooth ESC/POS
                            </>
                          )}
                        </span>
                        <span>•</span>
                        <span>Width: {printer.paperWidth}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestPrint(printer)}
                      className="h-8 text-xs font-semibold gap-1.5"
                    >
                      <Play className="h-3.5 w-3.5 text-emerald-600" /> Test Ticket
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(printer.id)}
                      className="h-8 w-8 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Print Triggers */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Switch
                        checked={printer.autoPrintOnOrder}
                        onCheckedChange={() => toggleAutoPrint(printer.id)}
                      />
                      <span className="font-semibold text-slate-700">Auto-Print on New Order</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <Switch
                        checked={printer.buzzerOnOrder}
                        onCheckedChange={() => toggleBuzzer(printer.id)}
                      />
                      <span className="font-semibold text-slate-700 flex items-center gap-1">
                        <Volume2 className="h-3.5 w-3.5 text-amber-500" /> Sound Buzzer
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ADD PRINTER DIALOG */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Printer className="h-5 w-5 text-indigo-600" /> Add New ESC/POS Printer
            </DialogTitle>
            <DialogDescription className="text-xs">
              Connect a thermal printer for customer receipts or kitchen order tickets.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Printer Name</Label>
              <Input
                placeholder="e.g. Pizza Kitchen Printer, Bar Counter"
                value={newPrinter.name}
                onChange={(e) => setNewPrinter({ ...newPrinter, name: e.target.value })}
                className="h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Printer Role</Label>
                <Select
                  value={newPrinter.role}
                  onValueChange={(val: any) => setNewPrinter({ ...newPrinter, role: val })}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="receipt" className="text-xs">Receipts (Cashier)</SelectItem>
                    <SelectItem value="kitchen_kot" className="text-xs">Kitchen KOT</SelectItem>
                    <SelectItem value="bar_kot" className="text-xs">Bar / Drinks KOT</SelectItem>
                    <SelectItem value="all" className="text-xs">All Tickets</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Paper Width</Label>
                <Select
                  value={newPrinter.paperWidth}
                  onValueChange={(val: any) => setNewPrinter({ ...newPrinter, paperWidth: val })}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="80mm" className="text-xs">80mm (Standard)</SelectItem>
                    <SelectItem value="58mm" className="text-xs">58mm (Small)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Connection Type</Label>
              <Select
                value={newPrinter.connectionType}
                onValueChange={(val: any) => setNewPrinter({ ...newPrinter, connectionType: val })}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="network_ip" className="text-xs">Network / IP LAN (Recommended)</SelectItem>
                  <SelectItem value="usb" className="text-xs">USB Cable</SelectItem>
                  <SelectItem value="bluetooth" className="text-xs">Bluetooth Wireless</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newPrinter.connectionType === 'network_ip' && (
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2 space-y-1">
                  <Label className="text-[11px] font-bold text-slate-600">IP Address</Label>
                  <Input
                    placeholder="192.168.1.150"
                    value={newPrinter.ipAddress}
                    onChange={(e) => setNewPrinter({ ...newPrinter, ipAddress: e.target.value })}
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-slate-600">Port</Label>
                  <Input
                    placeholder="9100"
                    value={newPrinter.port}
                    onChange={(e) => setNewPrinter({ ...newPrinter, port: Number(e.target.value) })}
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              onClick={handleAddPrinter}
            >
              Add Printer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
