"use client";

import { useState } from "react";
import { DashboardNav } from "@/components/dashboard/nav";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
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
  ChevronDown,
  Filter,
  ArrowRight,
  MoreVertical,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  CreditCard
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const subNavItems = [
  { name: "Documents & Contracts", value: "docs" },
  { name: "Orders", value: "orders" },
  { name: "Subscriptions", value: "subs" },
  { name: "Payment Links", value: "links" },
  { name: "Transactions", value: "transactions" },
  { name: "Products", value: "products", isNew: true },
  { name: "Coupons", value: "coupons" },
  { name: "Gift Cards", value: "gift-cards", isNew: true },
  { name: "Settings", value: "settings" },
  { name: "Integrations", value: "integrations" },
];

const statusTabs = [
  { name: "Draft", count: 0 },
  { name: "Waiting for others", count: 0 },
  { name: "Completed", count: 0 },
  { name: "Payments", count: 0 },
  { name: "Archived", count: 0 },
];

export default function PaymentsPage() {
  const [activeSubNav, setActiveSubNav] = useState("docs");
  const [activeStatus, setActiveStatus] = useState("Draft");
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="flex min-h-screen bg-background text-foreground overflow-hidden">
      <DashboardNav />
      <main className="flex-1 flex flex-col h-screen relative overflow-hidden">
        {/* Ambient background decoration */}
        <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
        
        {/* Payments Header & Sub-Nav */}
        <header className="border-b border-white/5 bg-background/50 backdrop-blur-md z-10 shrink-0">
          <div className="px-8 pt-8 pb-4">
            <h1 className="text-2xl font-bold font-headline mb-6">Payments</h1>
            
            <Tabs value={activeSubNav} onValueChange={setActiveSubNav} className="w-full">
              <TabsList className="bg-transparent border-b border-white/5 w-full justify-start rounded-none h-auto p-0 gap-8 overflow-x-auto no-scrollbar">
                {subNavItems.map((item) => (
                  <TabsTrigger 
                    key={item.value} 
                    value={item.value} 
                    className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none border-b-2 border-transparent px-0 py-2 text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 group"
                  >
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

        {/* Dynamic Content Area */}
        <div className="flex-1 overflow-y-auto no-scrollbar relative z-10 p-8 space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-3xl font-bold tracking-tight">Documents & Contracts</h2>
                <span className="text-muted-foreground text-sm font-medium opacity-60">(Proposals, Estimates & Contracts)</span>
              </div>
              <p className="text-muted-foreground text-sm">Manage and oversee all documents & contracts created for your business.</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" className="h-10 rounded-xl border-white/10 bg-white/[0.03] hover:bg-white/[0.08]">
                <SettingsIcon className="mr-2 h-4 w-4" /> Settings
              </Button>
              <Button className="glow-primary bg-primary hover:bg-primary/90 h-10 px-6 rounded-xl font-bold">
                <Plus className="mr-2 h-4 w-4" /> New
              </Button>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex items-center gap-3 glass border-white/10 rounded-xl px-4 h-10 w-full md:w-auto cursor-pointer hover:bg-white/5 transition-all">
              <CalendarIcon size={16} className="text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">Start Date</span>
              <ArrowRight size={14} className="text-muted-foreground opacity-40" />
              <span className="text-xs font-medium text-muted-foreground">End Date</span>
              <CalendarIcon size={16} className="text-muted-foreground ml-2" />
            </div>

            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
              <Input 
                placeholder="Search..." 
                className="glass pl-10 h-10 rounded-xl text-xs border-white/10 focus:ring-primary"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Status Tabs */}
          <div className="border-b border-white/5 flex gap-10">
            {statusTabs.map((tab) => (
              <button
                key={tab.name}
                onClick={() => setActiveStatus(tab.name)}
                className={cn(
                  "pb-4 text-sm font-bold transition-all relative",
                  activeStatus === tab.name 
                    ? "text-primary" 
                    : "text-muted-foreground/60 hover:text-foreground"
                )}
              >
                {tab.name} <span className="ml-1 opacity-50 font-mono text-[10px]">{tab.count}</span>
                {activeStatus === tab.name && (
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
                )}
              </button>
            ))}
          </div>

          {/* Records Table */}
          <Card className="glass border-white/5 rounded-2xl overflow-hidden group">
            <div className="h-1 w-full bg-gradient-to-r from-primary via-accent to-primary animate-shimmer opacity-20" />
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="hover:bg-transparent border-white/5">
                  <TableHead className="px-8 text-[10px] font-bold uppercase tracking-widest opacity-50 h-12">Title</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest opacity-50 h-12 text-center">Status</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest opacity-50 h-12">Customer</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest opacity-50 h-12">Date modified</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest opacity-50 h-12">Value</TableHead>
                  <TableHead className="px-8 text-right text-[10px] font-bold uppercase tracking-widest opacity-50 h-12">Ops</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Empty State based on photo */}
                <TableRow className="hover:bg-transparent border-none">
                  <TableCell colSpan={6} className="h-[300px] text-center">
                    <div className="flex flex-col items-center justify-center space-y-4 opacity-20">
                      <div className="w-16 h-16 rounded-full border-2 border-dashed border-white flex items-center justify-center">
                        <Search size={32} />
                      </div>
                      <p className="text-sm font-bold uppercase tracking-widest">No documents found</p>
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Card>
        </div>
      </main>
    </div>
  );
}
