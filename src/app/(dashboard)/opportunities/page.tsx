"use client";

import { useEffect, useState, useCallback } from "react";
import { DashboardNav } from "@/components/dashboard/nav";
import { 
  getOpportunities, 
  updateOpportunityStatus, 
  deleteOpportunity, 
  createOpportunity, 
  updateOpportunity,
  getPipelines,
  getContacts
} from "@/lib/ghl-actions";
import { GHLOpportunity, GHLPipeline, GHLContact } from "@/lib/ghl";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Target, 
  RefreshCw, 
  DollarSign, 
  User, 
  BadgeCheck, 
  MoreVertical,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Plus,
  Trash2,
  Pencil,
  Loader2,
  Filter,
  ArrowUpDown,
  TrendingUp,
  Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<GHLOpportunity[]>([]);
  const [pipelines, setPipelines] = useState<GHLPipeline[]>([]);
  const [contacts, setContacts] = useState<GHLContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [selectedOpp, setSelectedOpp] = useState<GHLOpportunity | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    monetaryValue: 0,
    pipelineId: "",
    pipelineStageId: "",
    contactId: "",
    status: "open" as any
  });

  const { toast } = useToast();

  const fetchData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const [opps, pipes, conts] = await Promise.all([
        getOpportunities(),
        getPipelines(),
        getContacts(100)
      ]);
      setOpportunities(opps);
      setPipelines(pipes);
      setContacts(conts);
      
      if (isManual) {
        toast({
          title: "Registry Synchronized",
          description: "V2 Intelligence reports updated deal flow records.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Sync Error",
        description: "Core communication with LeadConnector V2 was severed.",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsActionLoading(true);
    try {
      await createOpportunity(formData);
      setIsCreateOpen(false);
      toast({ title: "Deal Created", description: "Opportunity injected into GHL Cloud." });
      fetchData(true);
    } catch (error) {
      toast({ variant: "destructive", title: "Operation Error", description: "Inbound record failed to synchronize." });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOpp) return;
    setIsActionLoading(true);
    try {
      await updateOpportunity(selectedOpp.id, formData);
      setIsEditOpen(false);
      toast({ title: "Registry Updated", description: "V2 Metadata successfully overwritten." });
      fetchData(true);
    } catch (error) {
      toast({ variant: "destructive", title: "Mutation Failed", description: "Cloud update command was rejected." });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteOpportunity(id);
      setOpportunities(prev => prev.filter(o => o.id !== id));
      toast({ title: "Record Purged", description: "Opportunity permanently removed from location repository." });
    } catch (error) {
      toast({ variant: "destructive", title: "Erasure Error", description: "Could not execute DELETE on GHL server." });
    }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await updateOpportunityStatus(id, status);
      setOpportunities(prev => prev.map(o => o.id === id ? { ...o, status: status as any } : o));
      toast({ title: "Status Injected", description: `Deal stage successfully transitioned to ${status}.` });
    } catch (error) {
      toast({ variant: "destructive", title: "Transition Error", description: "Status override command failed." });
    }
  };

  const filtered = opportunities.filter(o => 
    o.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.contact?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-background text-foreground overflow-hidden">
      <DashboardNav />
      <main className="flex-1 p-8 overflow-y-auto no-scrollbar relative">
        <div className="absolute top-0 left-0 w-[40%] h-[40%] bg-accent/5 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="max-w-6xl mx-auto space-y-10 relative z-10">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="space-y-2">
              <h1 className="text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/40">
                Opportunities
              </h1>
              <p className="text-muted-foreground font-medium flex items-center gap-2">
                <Target size={16} className="text-primary" />
                Live deal lifecycle management • V2 Sync
              </p>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                size="lg" 
                onClick={() => fetchData(true)} 
                disabled={loading || refreshing}
                className="h-12 px-6 rounded-2xl border-white/10 bg-white/[0.03] hover:bg-white/[0.08] backdrop-blur-md font-bold transition-all"
              >
                <RefreshCw className={cn("mr-2 h-4 w-4", refreshing && "animate-spin")} />
                Sync Registry
              </Button>
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button size="lg" className="glow-primary h-12 px-6 rounded-2xl bg-primary hover:bg-primary/90 font-bold transition-all" onClick={() => setFormData({ name: "", monetaryValue: 0, pipelineId: pipelines[0]?.id || "", pipelineStageId: pipelines[0]?.stages[0]?.id || "", contactId: "", status: "open" })}>
                    <Plus className="mr-2 h-5 w-5" /> New Opportunity
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass border-white/10 rounded-3xl p-8 max-w-lg">
                  <form onSubmit={handleCreate}>
                    <DialogHeader className="mb-8">
                      <DialogTitle className="text-2xl font-bold">New Opportunity</DialogTitle>
                      <DialogDescription className="text-muted-foreground">Infect a new deal record into the GHL V2 cloud registry.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6">
                      <div className="space-y-2">
                        <Label className="text-[11px] font-bold uppercase tracking-widest opacity-60">Deal Identity</Label>
                        <Input className="glass h-12 rounded-xl focus:ring-primary" placeholder="Enterprise Contract Alpha" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[11px] font-bold uppercase tracking-widest opacity-60">Monetary Value ($)</Label>
                          <Input className="glass h-12 rounded-xl" type="number" placeholder="5000" value={formData.monetaryValue} onChange={e => setFormData({ ...formData, monetaryValue: Number(e.target.value) })} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[11px] font-bold uppercase tracking-widest opacity-60">Target Contact</Label>
                          <Select onValueChange={val => setFormData({ ...formData, contactId: val })}>
                            <SelectTrigger className="glass h-12 rounded-xl focus:ring-primary">
                              <SelectValue placeholder="Select Contact" />
                            </SelectTrigger>
                            <SelectContent className="glass border-white/10 rounded-xl">
                              {contacts.map(c => <SelectItem key={c.id} value={c.id} className="rounded-lg">{c.firstName} {c.lastName}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[11px] font-bold uppercase tracking-widest opacity-60">Revenue Pipeline</Label>
                        <Select value={formData.pipelineId} onValueChange={val => setFormData({ ...formData, pipelineId: val, pipelineStageId: pipelines.find(p => p.id === val)?.stages[0]?.id || "" })}>
                          <SelectTrigger className="glass h-12 rounded-xl focus:ring-primary">
                            <SelectValue placeholder="Select Pipeline" />
                          </SelectTrigger>
                          <SelectContent className="glass border-white/10 rounded-xl">
                            {pipelines.map(p => <SelectItem key={p.id} value={p.id} className="rounded-lg">{p.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter className="mt-10">
                      <Button type="submit" size="lg" className="w-full h-12 rounded-xl glow-primary font-bold" disabled={isActionLoading}>
                        {isActionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BadgeCheck className="mr-2 h-5 w-5" />}
                        Initialize Record
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </header>

          <Card className="glass border-border/40 overflow-hidden">
            <CardHeader className="p-8 border-b border-white/5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                  <CardTitle className="text-2xl font-bold flex items-center gap-3">
                    <Activity className="h-6 w-6 text-primary" /> 
                    Live Deal Inventory
                  </CardTitle>
                  <CardDescription>Managed Registry ({filtered.length} Active Records)</CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="relative w-full md:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
                    <Input 
                      placeholder="Search deal registry..." 
                      className="glass pl-11 h-11 rounded-xl text-sm border-white/5 focus:ring-primary transition-all"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Button variant="outline" size="icon" className="glass h-11 w-11 rounded-xl border-white/5"><Filter size={18} /></Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-8 space-y-4">
                  {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
                </div>
              ) : filtered.length > 0 ? (
                <div className="divide-y divide-white/5">
                  {filtered.map((opp, i) => (
                    <div 
                      key={opp.id} 
                      className="flex items-center justify-between p-8 hover:bg-white/[0.02] transition-all group animate-in fade-in duration-500"
                      style={{ animationDelay: `${i * 50}ms` }}
                    >
                      <div className="flex items-center gap-6">
                        <div className="relative">
                          <div className="absolute inset-0 bg-primary/10 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-all" />
                          <div className="w-16 h-16 rounded-3xl bg-white/[0.03] border border-white/5 text-primary flex items-center justify-center font-bold text-2xl relative z-10 transition-all group-hover:scale-110 group-hover:border-primary/30">
                            {opp.name?.[0] || 'O'}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="font-bold text-lg group-hover:text-primary transition-colors">{opp.name}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground font-medium">
                            <span className="flex items-center gap-1.5"><User size={14} className="opacity-50" /> {opp.contact?.name || 'Contact Missing'}</span>
                            <span className="w-1 h-1 rounded-full bg-white/20" />
                            <span className="flex items-center gap-1 text-emerald-400 font-bold font-mono tracking-tighter">
                              <DollarSign size={14} />
                              {opp.monetaryValue?.toLocaleString() || 0}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <Badge variant={opp.status === 'open' ? 'default' : 'secondary'} className={cn(
                          "capitalize text-[10px] h-7 px-4 rounded-xl font-bold tracking-widest",
                          opp.status === 'won' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : 
                          opp.status === 'lost' ? "bg-destructive/10 text-destructive border-destructive/20" : 
                          "bg-primary text-white glow-primary"
                        )}>
                          {opp.status}
                        </Badge>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-white/10"><MoreVertical size={20} /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56 glass border-white/10 rounded-2xl p-2 animate-in slide-in-from-right-2">
                            <DropdownMenuLabel className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest opacity-50">Operation Hub</DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-white/5 mx-2" />
                            <DropdownMenuItem className="rounded-xl px-4 py-2.5 focus:bg-primary/10 cursor-pointer" onClick={() => {
                              setSelectedOpp(opp);
                              setFormData({
                                name: opp.name,
                                monetaryValue: opp.monetaryValue || 0,
                                pipelineId: opp.pipelineId,
                                pipelineStageId: opp.pipelineStageId,
                                contactId: opp.contact?.id || "",
                                status: opp.status
                              });
                              setIsEditOpen(true);
                            }}>
                              <Pencil className="mr-3 h-4 w-4 text-primary" /> Modify record
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-white/5 mx-2" />
                            <DropdownMenuItem className="rounded-xl px-4 py-2.5 focus:bg-emerald-500/10 cursor-pointer" onClick={() => handleStatusUpdate(opp.id, 'won')}><CheckCircle className="mr-3 h-4 w-4 text-emerald-400" /> Mark Victory</DropdownMenuItem>
                            <DropdownMenuItem className="rounded-xl px-4 py-2.5 focus:bg-destructive/10 cursor-pointer" onClick={() => handleStatusUpdate(opp.id, 'lost')}><XCircle className="mr-3 h-4 w-4 text-destructive" /> Mark Defeat</DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-white/5 mx-2" />
                            <DropdownMenuItem className="rounded-xl px-4 py-2.5 text-destructive focus:bg-destructive/10 cursor-pointer" onClick={() => handleDelete(opp.id)}><Trash2 className="mr-3 h-4 w-4" /> Purge deal</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-40 text-center space-y-6 animate-in fade-in duration-1000">
                  <div className="w-24 h-24 bg-white/[0.02] border border-white/5 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:glow-primary transition-all">
                    <Target className="h-10 w-10 text-muted-foreground opacity-20" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-2xl font-bold text-muted-foreground">Deal Reservoir Empty</p>
                    <p className="text-sm text-muted-foreground/60 max-w-[320px] mx-auto leading-relaxed font-medium">No opportunities were found in the current V2 synchronicity window. Initialize a new deal flow to start tracking.</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Futuristic Edit Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="glass border-white/10 rounded-3xl p-8 max-w-lg">
          <form onSubmit={handleUpdate}>
            <DialogHeader className="mb-8">
              <DialogTitle className="text-2xl font-bold">Modify Opportunity</DialogTitle>
              <DialogDescription className="text-muted-foreground">Override deal metadata in the GHL V2 repository.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-6">
              <div className="space-y-2">
                <Label className="text-[11px] font-bold uppercase tracking-widest opacity-60">Identity Override</Label>
                <Input className="glass h-12 rounded-xl" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] font-bold uppercase tracking-widest opacity-60">Value Alignment ($)</Label>
                <Input className="glass h-12 rounded-xl" type="number" value={formData.monetaryValue} onChange={e => setFormData({ ...formData, monetaryValue: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] font-bold uppercase tracking-widest opacity-60">Status Transition</Label>
                <Select value={formData.status} onValueChange={val => setFormData({ ...formData, status: val as any })}>
                  <SelectTrigger className="glass h-12 rounded-xl focus:ring-primary"><SelectValue /></SelectTrigger>
                  <SelectContent className="glass border-white/10 rounded-xl">
                    <SelectItem value="open" className="rounded-lg">Open Deal</SelectItem>
                    <SelectItem value="won" className="rounded-lg">Mark Won</SelectItem>
                    <SelectItem value="lost" className="rounded-lg">Mark Lost</SelectItem>
                    <SelectItem value="abandoned" className="rounded-lg">Abandoned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="mt-10">
              <Button type="submit" size="lg" className="w-full h-12 rounded-xl glow-primary font-bold transition-all active:scale-95" disabled={isActionLoading}>
                {isActionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <TrendingUp className="mr-2 h-5 w-5" />}
                Commit Synchronization
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}