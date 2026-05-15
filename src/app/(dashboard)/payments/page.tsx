"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { DashboardNav } from "@/components/dashboard/nav";
import { 
  getOrders, 
  createOrder, 
  getTransactions, 
  getContacts, 
  getInvoices, 
  createInvoice,
  getSubscriptions,
  getProducts
} from "@/lib/ghl-actions";
import { GHLContact } from "@/lib/ghl";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Search, 
  Plus, 
  Settings as SettingsIcon, 
  Filter,
  MoreVertical,
  FileText,
  CreditCard,
  Package,
  Ticket,
  Link as LinkIcon,
  RefreshCw,
  History,
  Repeat,
  Gift,
  Unplug,
  Loader2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const subNavItems = [
  { name: "Documents & Contracts", value: "docs", icon: FileText },
  { name: "Orders", value: "orders", icon: Package },
  { name: "Subscriptions", value: "subs", icon: Repeat },
  { name: "Payment Links", value: "links", icon: LinkIcon },
  { name: "Transactions", value: "transactions", icon: History },
  { name: "Products", value: "products", isNew: true, icon: Package },
  { name: "Coupons", value: "coupons", icon: Ticket },
  { name: "Gift Cards", value: "gift-cards", isNew: true, icon: Gift },
  { name: "Settings", value: "settings", icon: SettingsIcon },
  { name: "Integrations", value: "integrations", icon: Unplug },
];

export default function PaymentsPage() {
  const [activeSubNav, setActiveSubNav] = useState("docs");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dataList, setDataList] = useState<any[]>([]);
  const [contacts, setContacts] = useState<GHLContact[]>([]);
  const [createFormData, setCreateFormData] = useState({
    title: "",
    amount: 0,
    contactId: ""
  });

  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let listData: any[] = [];
      const contData = await getContacts(100);
      setContacts(contData);

      if (activeSubNav === 'orders') {
        listData = await getOrders();
      } else if (activeSubNav === 'transactions') {
        listData = await getTransactions();
      } else if (activeSubNav === 'docs') {
        listData = await getInvoices();
      } else if (activeSubNav === 'subs') {
        listData = await getSubscriptions();
      } else if (activeSubNav === 'products') {
        listData = await getProducts();
      }
      
      setDataList(listData || []);
    } catch (error) {
      console.error("Payment fetch error:", error);
    } finally {
      setLoading(false);
    }
  }, [activeSubNav]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const currentNav = useMemo(() => 
    subNavItems.find(item => item.value === activeSubNav) || subNavItems[0]
  , [activeSubNav]);

  const handleSubNavChange = (value: string) => {
    setActiveSubNav(value);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createFormData.contactId) {
      toast({ variant: "destructive", title: "Missing Contact", description: "This record must be linked to a customer identity." });
      return;
    }

    setIsSubmitting(true);
    try {
      if (activeSubNav === 'orders') {
        await createOrder({
          productName: createFormData.title,
          totalAmount: Number(createFormData.amount),
          contactId: createFormData.contactId,
          status: 'pending'
        });
        toast({ title: "Order Synchronized", description: "Order committed to GHL backend." });
      } else if (activeSubNav === 'docs') {
        await createInvoice({
          title: createFormData.title,
          amount: Number(createFormData.amount),
          contactId: createFormData.contactId
        });
        toast({ title: "Document Created", description: "Contract injected into GHL repository." });
      } else {
        toast({ title: "Module Locked", description: "This payment type is in read-only mode." });
      }
      
      setIsCreateOpen(false);
      setCreateFormData({ title: "", amount: 0, contactId: "" });
      fetchData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Sync Failure",
        description: error.message || "LeadConnector validation failed.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredData = useMemo(() => {
    return dataList.filter(item => {
      const title = (item.title || item.productName || item.customerName || item.name || "").toLowerCase();
      return title.includes(searchQuery.toLowerCase());
    });
  }, [dataList, searchQuery]);

  const renderTableHeader = () => {
    switch (activeSubNav) {
      case 'docs':
        return (
          <TableRow className="hover:bg-transparent border-white/5">
            <TableHead className="px-8 text-[10px] font-bold uppercase tracking-widest opacity-50 h-12 text-left">Document Title</TableHead>
            <TableHead className="text-[10px] font-bold uppercase tracking-widest opacity-50 h-12 text-center">Status</TableHead>
            <TableHead className="text-[10px] font-bold uppercase tracking-widest opacity-50 h-12 text-left">Customer</TableHead>
            <TableHead className="text-[10px] font-bold uppercase tracking-widest opacity-50 h-12 text-left">Created</TableHead>
            <TableHead className="text-[10px] font-bold uppercase tracking-widest opacity-50 h-12 text-left">Value</TableHead>
            <TableHead className="px-8 text-right text-[10px] font-bold uppercase tracking-widest opacity-50 h-12">Ops</TableHead>
          </TableRow>
        );
      case 'orders':
        return (
          <TableRow className="hover:bg-transparent border-white/5">
            <TableHead className="px-8 text-[10px] font-bold uppercase tracking-widest opacity-50 h-12 text-left">Order Item</TableHead>
            <TableHead className="text-[10px] font-bold uppercase tracking-widest opacity-50 h-12 text-center">Payment Status</TableHead>
            <TableHead className="text-[10px] font-bold uppercase tracking-widest opacity-50 h-12 text-left">Customer</TableHead>
            <TableHead className="text-[10px] font-bold uppercase tracking-widest opacity-50 h-12 text-left">Date</TableHead>
            <TableHead className="text-[10px] font-bold uppercase tracking-widest opacity-50 h-12 text-left">Total</TableHead>
            <TableHead className="px-8 text-right text-[10px] font-bold uppercase tracking-widest opacity-50 h-12">Actions</TableHead>
          </TableRow>
        );
      case 'subs':
        return (
          <TableRow className="hover:bg-transparent border-white/5">
            <TableHead className="px-8 text-[10px] font-bold uppercase tracking-widest opacity-50 h-12 text-left">Plan Name</TableHead>
            <TableHead className="text-[10px] font-bold uppercase tracking-widest opacity-50 h-12 text-center">Status</TableHead>
            <TableHead className="text-[10px] font-bold uppercase tracking-widest opacity-50 h-12 text-left">Cycle</TableHead>
            <TableHead className="text-[10px] font-bold uppercase tracking-widest opacity-50 h-12 text-left">Value</TableHead>
            <TableHead className="px-8 text-right text-[10px] font-bold uppercase tracking-widest opacity-50 h-12">Ops</TableHead>
          </TableRow>
        );
      default:
        return (
          <TableRow className="hover:bg-transparent border-white/5">
            <TableHead className="px-8 text-[10px] font-bold uppercase tracking-widest opacity-50 h-12 text-left">Item Name</TableHead>
            <TableHead className="text-[10px] font-bold uppercase tracking-widest opacity-50 h-12 text-left">Status</TableHead>
            <TableHead className="text-[10px] font-bold uppercase tracking-widest opacity-50 h-12 text-left">Date</TableHead>
            <TableHead className="text-[10px] font-bold uppercase tracking-widest opacity-50 h-12 text-left">Amount</TableHead>
            <TableHead className="px-8 text-right text-[10px] font-bold uppercase tracking-widest opacity-50 h-12">Action</TableHead>
          </TableRow>
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground overflow-hidden">
      <DashboardNav />
      <main className="flex-1 flex flex-col h-screen relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
        
        <header className="border-b border-white/5 bg-background/50 backdrop-blur-md z-10 shrink-0">
          <div className="px-8 pt-8 pb-4">
            <h1 className="text-2xl font-bold font-headline mb-6 flex items-center gap-3">
              <CreditCard className="text-primary" />
              Payments Hub
            </h1>
            
            <Tabs value={activeSubNav} onValueChange={handleSubNavChange} className="w-full">
              <TabsList className="bg-transparent border-b border-white/5 w-full justify-start rounded-none h-auto p-0 gap-8 overflow-x-auto no-scrollbar">
                {subNavItems.map((item) => (
                  <TabsTrigger 
                    key={item.value} 
                    value={item.value} 
                    className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none border-b-2 border-transparent px-0 py-2 text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 group"
                  >
                    <item.icon size={14} className={cn("transition-colors", activeSubNav === item.value ? "text-primary" : "text-muted-foreground")} />
                    {item.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto no-scrollbar relative z-10 p-8 space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <h2 className="text-3xl font-bold tracking-tight">{currentNav.name}</h2>
              <p className="text-muted-foreground text-sm">Synchronized records from LeadConnector V2.</p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                onClick={fetchData}
                disabled={loading}
                className="h-10 rounded-xl border-white/10 bg-white/[0.03]"
              >
                <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} /> Refresh
              </Button>
              <Button 
                className="glow-primary bg-primary hover:bg-primary/90 h-10 px-6 rounded-xl font-bold"
                onClick={() => setIsCreateOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" /> Create {currentNav.name.replace(/s$/, '')}
              </Button>
            </div>
          </div>

          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
            <Input 
              placeholder={`Search in ${currentNav.name.toLowerCase()}...`}
              className="glass pl-10 h-10 rounded-xl text-xs border-white/10 focus:ring-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Card className="glass border-white/5 rounded-3xl overflow-hidden group">
            <div className="h-1 w-full bg-gradient-to-r from-primary via-accent to-primary animate-shimmer opacity-20" />
            <Table>
              <TableHeader className="bg-white/[0.02]">
                {renderTableHeader()}
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array(5).fill(0).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={6} className="px-8"><Skeleton className="h-12 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredData.length > 0 ? (
                  filteredData.map((item, i) => (
                    <TableRow key={i} className="hover:bg-white/[0.02] border-white/5 animate-in fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                      <TableCell className="px-8 font-bold text-left">{item.title || item.productName || item.name || 'Untitled Record'}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="uppercase text-[9px]">{item.status || item.paymentStatus || 'Active'}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-left">{item.customerName || item.contactName || 'Anonymous'}</TableCell>
                      <TableCell className="text-xs opacity-50 text-left">{item.dateAdded || item.createdAt ? new Date(item.dateAdded || item.createdAt).toLocaleDateString('en-US') : '—'}</TableCell>
                      <TableCell className="font-mono text-emerald-400 font-bold text-left">${(item.totalAmount || item.amount || 0).toLocaleString('en-US')}</TableCell>
                      <TableCell className="px-8 text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10"><MoreVertical size={14} /></Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-[400px] text-center">
                      <div className="flex flex-col items-center justify-center space-y-6">
                        <currentNav.icon size={32} className="text-muted-foreground opacity-20" />
                        <p className="text-lg font-bold text-muted-foreground/80">No {currentNav.name.toLowerCase()} records found.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      </main>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="glass border-white/10 rounded-3xl p-8 max-w-lg">
          <form onSubmit={handleCreateSubmit}>
            <DialogHeader className="mb-8">
              <DialogTitle className="text-2xl font-bold">New {currentNav.name.replace(/s$/, '')}</DialogTitle>
              <DialogDescription className="text-muted-foreground">Synchronizing financial record with GHL sub-account.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-6">
              <div className="space-y-2">
                <Label className="text-[11px] font-bold uppercase tracking-widest opacity-60">Record Title</Label>
                <Input 
                  className="glass h-12 rounded-xl" 
                  placeholder="e.g. Enterprise License" 
                  value={createFormData.title}
                  onChange={e => setCreateFormData({...createFormData, title: e.target.value})}
                  required 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold uppercase tracking-widest opacity-60">Value ($)</Label>
                  <Input 
                    className="glass h-12 rounded-xl" 
                    type="number" 
                    placeholder="0.00" 
                    value={createFormData.amount}
                    onChange={e => setCreateFormData({...createFormData, amount: Number(e.target.value)})}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold uppercase tracking-widest opacity-60">Identity Link</Label>
                  <Select value={createFormData.contactId} onValueChange={val => setCreateFormData(prev => ({ ...prev, contactId: val }))}>
                    <SelectTrigger className="glass h-12 rounded-xl focus:ring-primary">
                      <SelectValue placeholder="Select Contact" />
                    </SelectTrigger>
                    <SelectContent className="glass border-white/10 rounded-xl max-h-60">
                      {contacts.map(c => (
                        <SelectItem key={c.id} value={c.id} className="rounded-lg">
                          {c.firstName} {c.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter className="mt-10">
              <Button type="submit" size="lg" className="w-full h-12 rounded-xl glow-primary font-bold" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-5 w-5" />}
                Sync Record
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
