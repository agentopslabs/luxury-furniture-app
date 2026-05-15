
"use client";

import { useState, useMemo } from "react";
import { DashboardNav } from "@/components/dashboard/nav";
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
  Calendar as CalendarIcon,
  Filter,
  ArrowRight,
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
  ChevronDown,
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
import { Label } from "@/components/ui/label";
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

const statusTabsByNav: Record<string, { name: string; count: number }[]> = {
  docs: [
    { name: "Draft", count: 0 },
    { name: "Waiting for others", count: 0 },
    { name: "Completed", count: 0 },
    { name: "Payments", count: 0 },
    { name: "Archived", count: 0 },
  ],
  orders: [
    { name: "All", count: 0 },
    { name: "Pending", count: 0 },
    { name: "Paid", count: 0 },
    { name: "Refunded", count: 0 },
  ],
  subs: [
    { name: "Active", count: 0 },
    { name: "Trialing", count: 0 },
    { name: "Cancelled", count: 0 },
    { name: "All", count: 0 },
  ],
  transactions: [
    { name: "Successful", count: 0 },
    { name: "Failed", count: 0 },
    { name: "Refunded", count: 0 },
    { name: "All", count: 0 },
  ],
  products: [
    { name: "Active", count: 0 },
    { name: "Archived", count: 0 },
  ],
};

export default function PaymentsPage() {
  const [activeSubNav, setActiveSubNav] = useState("docs");
  const [activeStatus, setActiveStatus] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const currentNav = useMemo(() => 
    subNavItems.find(item => item.value === activeSubNav) || subNavItems[0]
  , [activeSubNav]);

  const currentStatusTabs = useMemo(() => 
    statusTabsByNav[activeSubNav] || [{ name: "All", count: 0 }]
  , [activeSubNav]);

  const handleSubNavChange = (value: string) => {
    setActiveSubNav(value);
    const firstStatus = statusTabsByNav[value]?.[0]?.name || "All";
    setActiveStatus(firstStatus);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsCreateOpen(false);
      toast({
        title: "Record Created",
        description: `Successfully injected new ${currentNav.name.slice(0, -1)} into GHL repository.`,
      });
    }, 1500);
  };

  const renderTableHeader = () => {
    switch (activeSubNav) {
      case 'docs':
        return (
          <TableRow className="hover:bg-transparent border-white/5">
            <TableHead className="px-8 text-[10px] font-bold uppercase tracking-widest opacity-50 h-12">Document Title</TableHead>
            <TableHead className="text-[10px] font-bold uppercase tracking-widest opacity-50 h-12 text-center">Status</TableHead>
            <TableHead className="text-[10px] font-bold uppercase tracking-widest opacity-50 h-12">Customer</TableHead>
            <TableHead className="text-[10px] font-bold uppercase tracking-widest opacity-50 h-12">Modified</TableHead>
            <TableHead className="text-[10px] font-bold uppercase tracking-widest opacity-50 h-12">Value</TableHead>
            <TableHead className="px-8 text-right text-[10px] font-bold uppercase tracking-widest opacity-50 h-12">Ops</TableHead>
          </TableRow>
        );
      case 'orders':
        return (
          <TableRow className="hover:bg-transparent border-white/5">
            <TableHead className="px-8 text-[10px] font-bold uppercase tracking-widest opacity-50 h-12">Order ID</TableHead>
            <TableHead className="text-[10px] font-bold uppercase tracking-widest opacity-50 h-12 text-center">Payment</TableHead>
            <TableHead className="text-[10px] font-bold uppercase tracking-widest opacity-50 h-12">Customer</TableHead>
            <TableHead className="text-[10px] font-bold uppercase tracking-widest opacity-50 h-12">Source</TableHead>
            <TableHead className="text-[10px] font-bold uppercase tracking-widest opacity-50 h-12">Total</TableHead>
            <TableHead className="px-8 text-right text-[10px] font-bold uppercase tracking-widest opacity-50 h-12">Actions</TableHead>
          </TableRow>
        );
      case 'products':
        return (
          <TableRow className="hover:bg-transparent border-white/5">
            <TableHead className="px-8 text-[10px] font-bold uppercase tracking-widest opacity-50 h-12">Product Name</TableHead>
            <TableHead className="text-[10px] font-bold uppercase tracking-widest opacity-50 h-12">Type</TableHead>
            <TableHead className="text-[10px] font-bold uppercase tracking-widest opacity-50 h-12">Price</TableHead>
            <TableHead className="text-[10px] font-bold uppercase tracking-widest opacity-50 h-12">Updated</TableHead>
            <TableHead className="px-8 text-right text-[10px] font-bold uppercase tracking-widest opacity-50 h-12">Manage</TableHead>
          </TableRow>
        );
      default:
        return (
          <TableRow className="hover:bg-transparent border-white/5">
            <TableHead className="px-8 text-[10px] font-bold uppercase tracking-widest opacity-50 h-12">Item Name</TableHead>
            <TableHead className="text-[10px] font-bold uppercase tracking-widest opacity-50 h-12">Status</TableHead>
            <TableHead className="text-[10px] font-bold uppercase tracking-widest opacity-50 h-12">Date</TableHead>
            <TableHead className="text-[10px] font-bold uppercase tracking-widest opacity-50 h-12">Amount</TableHead>
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
              Payments
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
                    {item.isNew && (
                      <span className="bg-amber-400 text-black text-[8px] font-bold px-1 rounded uppercase tracking-tighter">New</span>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto no-scrollbar relative z-10 p-8 space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 animate-in fade-in slide-in-from-top-2 duration-500">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-3xl font-bold tracking-tight">{currentNav.name}</h2>
                <span className="text-muted-foreground text-sm font-medium opacity-60">
                  (GHL V2 Sub-Account Context)
                </span>
              </div>
              <p className="text-muted-foreground text-sm">
                Real-time management for your {currentNav.name.toLowerCase()} stream.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                onClick={() => toast({ title: "Payments Config", description: "Loading sub-account payment terminal settings..." })}
                className="h-10 rounded-xl border-white/10 bg-white/[0.03] hover:bg-white/[0.08]"
              >
                <SettingsIcon className="mr-2 h-4 w-4" /> Config
              </Button>
              <Button 
                className="glow-primary bg-primary hover:bg-primary/90 h-10 px-6 rounded-xl font-bold"
                onClick={() => setIsCreateOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" /> Create {currentNav.name.replace(/s$/, '')}
              </Button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex items-center gap-3 glass border-white/10 rounded-xl px-4 h-10 w-full md:w-auto cursor-pointer hover:bg-white/5 transition-all">
              <CalendarIcon size={16} className="text-muted-foreground" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">Registry Filter</span>
              <ArrowRight size={14} className="text-muted-foreground opacity-20" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">All Time</span>
              <ChevronDown size={14} className="text-muted-foreground ml-2 opacity-50" />
            </div>

            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
              <Input 
                placeholder={`Search ${currentNav.name.toLowerCase()}...`}
                className="glass pl-10 h-10 rounded-xl text-xs border-white/10 focus:ring-primary"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Button variant="outline" size="icon" className="h-10 w-10 glass border-white/10" onClick={() => toast({ title: "Refreshing", description: "Fetching latest financial logs..." })}>
              <RefreshCw size={16} className="text-muted-foreground" />
            </Button>
          </div>

          <div className="border-b border-white/5 flex gap-10 overflow-x-auto no-scrollbar">
            {currentStatusTabs.map((tab) => (
              <button
                key={tab.name}
                onClick={() => setActiveStatus(tab.name)}
                className={cn(
                  "pb-4 text-[11px] font-bold uppercase tracking-[0.2em] transition-all relative whitespace-nowrap",
                  activeStatus === tab.name 
                    ? "text-primary" 
                    : "text-muted-foreground/40 hover:text-foreground"
                )}
              >
                {tab.name} <span className="ml-1 opacity-30 font-mono text-[9px]">{tab.count}</span>
                {activeStatus === tab.name && (
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
                )}
              </button>
            ))}
          </div>

          <Card className="glass border-white/5 rounded-3xl overflow-hidden group">
            <div className="h-1 w-full bg-gradient-to-r from-primary via-accent to-primary animate-shimmer opacity-20" />
            <Table>
              <TableHeader className="bg-white/[0.02]">
                {renderTableHeader()}
              </TableHeader>
              <TableBody>
                <TableRow className="hover:bg-transparent border-none">
                  <TableCell colSpan={6} className="h-[400px] text-center">
                    <div className="flex flex-col items-center justify-center space-y-6 animate-in fade-in zoom-in-95 duration-700">
                      <div className="w-20 h-20 rounded-full bg-white/[0.02] border-2 border-dashed border-white/10 flex items-center justify-center relative">
                        <currentNav.icon size={32} className="text-muted-foreground opacity-20" />
                        <div className="absolute inset-0 bg-primary/5 blur-2xl rounded-full" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-lg font-bold text-muted-foreground/80 tracking-tight">No {currentNav.name.toLowerCase()} detected</p>
                        <p className="text-xs text-muted-foreground/40 max-w-[320px] mx-auto leading-relaxed">
                          Your GHL V2 sub-account workspace has no records matching the current <strong>{activeStatus}</strong> filter.
                        </p>
                      </div>
                      <Button variant="outline" className="h-9 text-xs rounded-xl border-white/5 bg-white/[0.02] hover:bg-white/[0.05]">
                        Import Existing Records
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Card>
        </div>
      </main>

      {/* Creation Modal for Payments */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="glass border-white/10 rounded-3xl p-8 max-w-lg">
          <form onSubmit={handleCreateSubmit}>
            <DialogHeader className="mb-8">
              <DialogTitle className="text-2xl font-bold">New {currentNav.name.replace(/s$/, '')}</DialogTitle>
              <DialogDescription className="text-muted-foreground">Injecting a new financial record into LeadConnector V2.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-6">
              <div className="space-y-2">
                <Label className="text-[11px] font-bold uppercase tracking-widest opacity-60">Record Title</Label>
                <Input className="glass h-12 rounded-xl" placeholder="e.g. Q4 Enterprise License" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold uppercase tracking-widest opacity-60">Value ($)</Label>
                  <Input className="glass h-12 rounded-xl" type="number" placeholder="0.00" required />
                </div>
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold uppercase tracking-widest opacity-60">Assignee</Label>
                  <Input className="glass h-12 rounded-xl" placeholder="Select Lead" />
                </div>
              </div>
            </div>
            <DialogFooter className="mt-10">
              <Button type="submit" size="lg" className="w-full h-12 rounded-xl glow-primary font-bold" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-5 w-5" />}
                Commit Transaction
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
