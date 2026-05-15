"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { DashboardNav } from "@/components/dashboard/nav";
import { 
  getOpportunities, 
  updateOpportunity,
  getPipelines,
  getContacts,
  createOpportunity
} from "@/lib/ghl-actions";
import { GHLOpportunity, GHLPipeline, GHLContact } from "@/lib/ghl";
import { 
  Plus, 
  Search, 
  RefreshCw, 
  MoreHorizontal, 
  LayoutGrid, 
  List, 
  Phone, 
  MessageSquare, 
  Loader2, 
  Target,
  Layout,
  TrendingUp,
  DollarSign,
  Trash2,
  Eye,
  CheckSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

type ViewMode = 'kanban' | 'list';
type StatusFilter = 'open' | 'won' | 'lost' | 'abandoned' | 'all';

export default function OpportunitiesPage() {
  const [pipelines, setPipelines] = useState<GHLPipeline[]>([]);
  const [opportunities, setOpportunities] = useState<GHLOpportunity[]>([]);
  const [contacts, setContacts] = useState<GHLContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('open');
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    monetaryValue: 0,
    pipelineId: "",
    pipelineStageId: "",
    contactId: "",
    status: "open" as const
  });

  const { toast } = useToast();

  const fetchData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const [pipes, opps, conts] = await Promise.all([
        getPipelines(),
        getOpportunities(),
        getContacts(100)
      ]);
      
      setPipelines(pipes);
      setOpportunities(opps);
      setContacts(conts);
      
      if (pipes.length > 0 && !selectedPipelineId) {
        setSelectedPipelineId(pipes[0].id);
      }
      
      if (isManual) {
        toast({ title: "Deal Flow Synced", description: `Synchronized ${opps.length} records across ${pipes.length} pipelines.` });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Sync Error", description: "Could not reach LeadConnector cloud." });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast, selectedPipelineId]);

  useEffect(() => {
    fetchData();
  }, []); // Initial mount fetch

  const activePipeline = useMemo(() => 
    pipelines.find(p => p.id === selectedPipelineId) || pipelines[0]
  , [pipelines, selectedPipelineId]);

  const filteredOpps = useMemo(() => {
    return opportunities.filter(o => {
      const matchesSearch = o.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           o.contact?.name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
      const matchesPipeline = !selectedPipelineId || o.pipelineId === selectedPipelineId;
      return matchesSearch && matchesStatus && matchesPipeline;
    });
  }, [opportunities, searchQuery, statusFilter, selectedPipelineId]);

  const kanbanData = useMemo(() => {
    if (!activePipeline) return [];
    return activePipeline.stages.map(stage => ({
      ...stage,
      opps: filteredOpps.filter(o => o.pipelineStageId === stage.id)
    }));
  }, [activePipeline, filteredOpps]);

  const statsBreakdown = useMemo(() => {
    const counts = {
      open: opportunities.filter(o => o.status === 'open').length,
      won: opportunities.filter(o => o.status === 'won').length,
      lost: opportunities.filter(o => o.status === 'lost').length,
      abandoned: opportunities.filter(o => o.status === 'abandoned').length,
    };
    return { counts };
  }, [opportunities]);

  const handleDragStart = (e: React.DragEvent, oppId: string) => {
    e.dataTransfer.setData("oppId", oppId);
  };

  const handleDrop = async (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    const oppId = e.dataTransfer.getData("oppId");
    const opp = opportunities.find(o => o.id === oppId);
    
    if (opp && opp.pipelineStageId !== stageId) {
      // Optimistic update
      setOpportunities(prev => prev.map(o => o.id === oppId ? { ...o, pipelineStageId: stageId } : o));
      
      try {
        await updateOpportunity(oppId, { 
          pipelineStageId: stageId,
          pipelineId: opp.pipelineId 
        });
        toast({ title: "Deal Transitioned", description: `Opportunity moved to new stage.` });
      } catch (error) {
        fetchData(true); 
        toast({ variant: "destructive", title: "Move Failed", description: "Could not sync stage change." });
      }
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsActionLoading(true);
    try {
      await createOpportunity(formData);
      setIsCreateOpen(false);
      toast({ title: "Opportunity Created", description: "Successfully pushed to GHL cloud." });
      fetchData(true);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Sync Failure", description: error.message });
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground overflow-hidden">
      <DashboardNav />
      <main className="flex-1 flex flex-col h-screen relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

        <header className="border-b border-white/5 px-8 pt-8 pb-4 shrink-0 bg-background/50 backdrop-blur-md z-10">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-4xl font-bold font-headline tracking-tight">Opportunities</h1>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => fetchData(true)} disabled={refreshing || loading} className="h-10 px-4 rounded-xl border-white/10 bg-white/5">
                <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
                {refreshing ? "Refreshing..." : "Refresh Hub"}
              </Button>
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-white/5">
                <MoreHorizontal size={20} />
              </Button>
            </div>
          </div>
          
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="bg-transparent border-b border-white/5 w-full justify-start rounded-none h-auto p-0 gap-8">
              <TabsTrigger value="overview" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none border-b-2 border-transparent px-0 py-3 text-sm font-bold transition-all uppercase tracking-widest opacity-60 data-[state=active]:opacity-100">Overview</TabsTrigger>
              <TabsTrigger value="stats" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none border-b-2 border-transparent px-0 py-3 text-sm font-bold transition-all uppercase tracking-widest opacity-60 data-[state=active]:opacity-100">Deal Analytics</TabsTrigger>
              <TabsTrigger value="pipelines" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none border-b-2 border-transparent px-0 py-3 text-sm font-bold transition-all uppercase tracking-widest opacity-60 data-[state=active]:opacity-100">Pipeline Config</TabsTrigger>
            </TabsList>
          </Tabs>
        </header>

        <div className="px-8 py-4 border-b border-white/5 bg-background/30 backdrop-blur-sm shrink-0 z-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground opacity-50 ml-1">Active Pipeline</p>
                <Select value={selectedPipelineId} onValueChange={setSelectedPipelineId}>
                  <SelectTrigger className="w-[280px] h-11 glass border-white/10 rounded-xl font-bold">
                    <SelectValue placeholder="Select Pipeline" />
                  </SelectTrigger>
                  <SelectContent className="glass border-white/10 rounded-2xl">
                    {pipelines.length > 0 ? pipelines.map(p => (
                      <SelectItem key={p.id} value={p.id} className="rounded-lg">{p.name}</SelectItem>
                    )) : (
                      <div className="p-4 text-center text-xs text-muted-foreground">No pipelines detected</div>
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="h-10 w-px bg-white/10 self-end mb-1 mx-2" />

              <div className="space-y-1">
                 <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground opacity-50 ml-1">Visualization</p>
                <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl h-11 border border-white/5">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setViewMode('kanban')}
                    className={cn("h-9 px-4 rounded-lg font-bold flex items-center gap-2 transition-all", viewMode === 'kanban' ? "bg-white/10 shadow-lg text-primary" : "opacity-40 hover:opacity-100")}
                  >
                    <LayoutGrid size={16} /> Kanban
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setViewMode('list')}
                    className={cn("h-9 px-4 rounded-lg font-bold flex items-center gap-2 transition-all", viewMode === 'list' ? "bg-white/10 shadow-lg text-primary" : "opacity-40 hover:opacity-100")}
                  >
                    <List size={16} /> Registry
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-end md:items-center gap-4">
              <div className="relative w-full md:w-72">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
                <Input 
                  placeholder="Filter records..." 
                  className="glass pl-11 h-11 rounded-xl text-xs border-white/10 focus:ring-primary"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button className="glow-primary bg-primary hover:bg-primary/90 h-11 px-8 rounded-xl font-bold shadow-2xl active:scale-95 transition-all" onClick={() => {
                if (activePipeline) {
                  setFormData({
                    name: "",
                    monetaryValue: 0,
                    pipelineId: activePipeline.id,
                    pipelineStageId: activePipeline.stages[0].id,
                    contactId: "",
                    status: "open"
                  });
                  setIsCreateOpen(true);
                } else {
                  toast({ variant: "destructive", title: "No Active Pipeline", description: "Please select a pipeline before adding opportunities." });
                }
              }}>
                <Plus size={18} className="mr-2" /> Inject Opportunity
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-6 mt-6 overflow-x-auto no-scrollbar pb-1">
            {[
              { id: 'open', label: 'Open Deals', color: 'text-primary' },
              { id: 'won', label: 'Won', color: 'text-emerald-400' },
              { id: 'lost', label: 'Lost', color: 'text-destructive' },
              { id: 'abandoned', label: 'Abandoned', color: 'text-amber-500' },
              { id: 'all', label: 'All Past Data', color: 'text-foreground' }
            ].map((filter) => (
              <Button 
                key={filter.id}
                variant="ghost" 
                size="sm" 
                onClick={() => setStatusFilter(filter.id as StatusFilter)}
                className={cn(
                  "h-9 text-[11px] font-bold uppercase tracking-[0.2em] rounded-none px-0 border-b-2 transition-all shrink-0 flex items-center gap-2",
                  statusFilter === filter.id ? `${filter.color} border-current` : "text-muted-foreground border-transparent opacity-40 hover:opacity-100"
                )}
              >
                {filter.label}
                <Badge variant="secondary" className="text-[10px] h-4 px-1.5 bg-white/5 border-white/5">
                  {filter.id === 'all' ? opportunities.length : statsBreakdown.counts[filter.id as keyof typeof statsBreakdown.counts] || 0}
                </Badge>
              </Button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-hidden relative">
          {viewMode === 'kanban' ? (
            <div className="flex gap-8 h-full overflow-x-auto p-10 no-scrollbar">
              {loading ? (
                Array(4).fill(0).map((_, i) => (
                  <div key={i} className="w-80 shrink-0 space-y-6">
                    <Skeleton className="h-12 w-full rounded-2xl" />
                    <Skeleton className="h-full w-full rounded-[2rem]" />
                  </div>
                ))
              ) : kanbanData.length > 0 ? (
                kanbanData.map((stage) => (
                  <div 
                    key={stage.id} 
                    className="w-80 shrink-0 flex flex-col group/stage"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDrop(e, stage.id)}
                  >
                    <div className="flex flex-col mb-6 px-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-2.5 h-2.5 rounded-full bg-primary glow-primary" />
                          <h3 className="text-sm font-bold truncate uppercase tracking-widest">{stage.name}</h3>
                        </div>
                        <Badge variant="outline" className="bg-white/5 border-white/10 text-[10px] font-mono">
                          {stage.opps.length}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-[10px] font-bold text-emerald-400 font-mono opacity-80">
                        <span className="uppercase tracking-widest opacity-50">Stage Value</span>
                        <span>${stage.opps.reduce((acc, curr) => acc + (curr.monetaryValue || 0), 0).toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto no-scrollbar space-y-5 rounded-[2rem] bg-white/[0.01] border border-white/5 p-3 transition-all hover:bg-white/[0.03] min-h-[200px]">
                      {stage.opps.map((opp) => (
                        <div 
                          key={opp.id} 
                          draggable
                          onDragStart={(e) => handleDragStart(e, opp.id)}
                          className="glass glass-hover p-5 rounded-2xl border-white/5 group transition-all cursor-grab active:cursor-grabbing hover:glow-primary animate-in fade-in slide-in-from-bottom-4 duration-500"
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div className="space-y-1">
                              <p className="text-sm font-bold text-foreground leading-tight group-hover:text-primary transition-colors pr-4 whitespace-normal">
                                {opp.name}
                              </p>
                              <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">#{opp.id.slice(0, 8)}</p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold border border-primary/20 shrink-0 transition-all group-hover:bg-primary group-hover:text-white">
                              {opp.contact?.name?.[0] || 'L'}
                            </div>
                          </div>

                          <div className="space-y-4 pt-4 border-t border-white/5">
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest opacity-40">Contract Value</span>
                              <span className="text-base font-mono font-bold text-emerald-400">
                                ${opp.monetaryValue?.toLocaleString() || '0.00'}
                              </span>
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center opacity-30 group-hover:opacity-100 hover:text-primary transition-all cursor-pointer">
                                  <Phone size={14} />
                                </div>
                                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center opacity-30 group-hover:opacity-100 hover:text-primary transition-all cursor-pointer">
                                  <MessageSquare size={14} />
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 opacity-40">
                                 <Layout size={12} />
                                 <span className="text-[9px] font-bold font-mono">Synced</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {stage.opps.length === 0 && (
                        <div className="h-40 border-2 border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center opacity-10 gap-2">
                          <TrendingUp size={24} />
                          <span className="text-[10px] font-bold uppercase tracking-widest">Awaiting Deals</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center py-40">
                   {loading ? <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50" /> : (
                     <div className="text-center space-y-4">
                       <LayoutGrid size={48} className="mx-auto text-muted-foreground opacity-20" />
                       <p className="text-sm font-bold uppercase tracking-widest opacity-40 italic">No deals found for this pipeline</p>
                     </div>
                   )}
                </div>
              )}
            </div>
          ) : (
            <div className="h-full overflow-y-auto p-10 no-scrollbar">
              <Card className="glass border-white/5 rounded-3xl overflow-hidden group">
                <div className="h-1 w-full bg-gradient-to-r from-primary via-accent to-primary animate-shimmer opacity-20" />
                <Table>
                  <TableHeader className="bg-white/[0.02]">
                    <TableRow className="hover:bg-transparent border-white/5">
                      <TableHead className="text-[10px] font-bold uppercase tracking-widest opacity-50 px-8 py-5">Name & ID</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-widest opacity-50 py-5">Contact Entity</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-widest opacity-50 py-5 text-right">Revenue Value</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-widest opacity-50 py-5">Flow Stage</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-widest opacity-50 py-5 text-center">Status</TableHead>
                      <TableHead className="text-right text-[10px] font-bold uppercase tracking-widest opacity-50 px-8 py-5">Ops</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOpps.length > 0 ? (
                      filteredOpps.map((opp, i) => (
                        <TableRow key={opp.id} className="hover:bg-white/[0.02] border-white/5 animate-in fade-in" style={{ animationDelay: `${i * 30}ms` }}>
                          <TableCell className="px-8 font-bold py-5">
                            <div className="space-y-1">
                              <p className="text-sm">{opp.name}</p>
                              <p className="text-[9px] font-mono opacity-30">ID: {opp.id}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold border border-primary/20">
                                {opp.contact?.name?.[0] || 'L'}
                              </div>
                              <span className="text-xs font-bold">{opp.contact?.name || 'Lead Anonymous'}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-emerald-400 font-bold text-right text-sm">
                            ${opp.monetaryValue?.toLocaleString() || '0'}
                          </TableCell>
                          <TableCell className="text-xs font-bold opacity-60 uppercase tracking-tighter">
                            {activePipeline?.stages.find(s => s.id === opp.pipelineStageId)?.name || 'Unknown Stage'}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge 
                              variant={opp.status === 'won' ? 'default' : opp.status === 'lost' ? 'destructive' : 'secondary'} 
                              className={cn(
                                "capitalize text-[9px] px-3 py-0.5 rounded-lg font-bold border",
                                opp.status === 'won' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : 
                                opp.status === 'lost' ? "bg-destructive/10 text-destructive border-destructive/20" : 
                                "bg-primary/10 text-primary border-primary/20"
                              )}
                            >
                              {opp.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right px-8">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-white/10 transition-all"><Eye size={16} /></Button>
                              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-white/10 transition-all text-destructive"><Trash2 size={16} /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="h-80 text-center">
                          <div className="flex flex-col items-center justify-center opacity-30 space-y-4">
                            <Target size={48} />
                            <p className="text-sm font-bold uppercase tracking-widest italic">No records in registry</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Card>
            </div>
          )}
        </div>
      </main>

      {/* Inject Opportunity Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="glass border-white/10 rounded-[2.5rem] p-10 max-w-xl">
          <form onSubmit={handleCreate}>
            <DialogHeader className="mb-10 text-center">
              <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-6 border border-primary/20">
                <Target size={32} />
              </div>
              <DialogTitle className="text-3xl font-bold font-headline">New Opportunity</DialogTitle>
              <DialogDescription className="text-muted-foreground font-medium mt-2">
                Programmatically inject a deal into your LeadConnector V2 flow.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-8">
              <div className="space-y-2">
                <Label className="text-[11px] font-bold uppercase tracking-[0.2em] opacity-60 ml-1">Deal Identity</Label>
                <Input 
                  className="glass h-14 rounded-2xl focus:ring-primary text-base px-6 font-bold" 
                  placeholder="e.g. Enterprise License Expansion" 
                  value={formData.name} 
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} 
                  required 
                />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold uppercase tracking-[0.2em] opacity-60 ml-1">Revenue Value ($)</Label>
                  <Input 
                    className="glass h-14 rounded-2xl font-mono font-bold px-6" 
                    type="number" 
                    value={formData.monetaryValue} 
                    onChange={e => setFormData(prev => ({ ...prev, monetaryValue: Number(e.target.value) }))} 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold uppercase tracking-[0.2em] opacity-60 ml-1">Customer Entity</Label>
                  <Select value={formData.contactId} onValueChange={val => setFormData(prev => ({ ...prev, contactId: val }))}>
                    <SelectTrigger className="glass h-14 rounded-2xl font-bold px-6"><SelectValue placeholder="Link Lead" /></SelectTrigger>
                    <SelectContent className="glass border-white/10 rounded-2xl max-h-60">
                      {contacts.map(c => (
                        <SelectItem key={c.id} value={c.id} className="rounded-xl font-bold">{c.firstName} {c.lastName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold uppercase tracking-[0.2em] opacity-60 ml-1">Registry (Pipeline)</Label>
                  <Select 
                    value={formData.pipelineId} 
                    onValueChange={val => {
                      const pipe = pipelines.find(p => p.id === val);
                      setFormData(prev => ({ ...prev, pipelineId: val, pipelineStageId: pipe?.stages[0]?.id || "" }));
                    }}
                  >
                    <SelectTrigger className="glass h-14 rounded-2xl font-bold px-6"><SelectValue /></SelectTrigger>
                    <SelectContent className="glass border-white/10 rounded-2xl">
                      {pipelines.map(p => (
                        <SelectItem key={p.id} value={p.id} className="rounded-xl font-bold">{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold uppercase tracking-[0.2em] opacity-60 ml-1">Initial Stage</Label>
                  <Select value={formData.pipelineStageId} onValueChange={val => setFormData(prev => ({ ...prev, pipelineStageId: val }))}>
                    <SelectTrigger className="glass h-14 rounded-2xl font-bold px-6"><SelectValue /></SelectTrigger>
                    <SelectContent className="glass border-white/10 rounded-2xl">
                      {pipelines.find(p => p.id === formData.pipelineId)?.stages.map(s => (
                        <SelectItem key={s.id} value={s.id} className="rounded-xl font-bold">{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter className="mt-12">
              <Button type="submit" size="lg" className="w-full h-14 rounded-2xl glow-primary font-bold text-lg active:scale-95 transition-all shadow-2xl" disabled={isActionLoading}>
                {isActionLoading ? <Loader2 className="mr-3 h-5 w-5 animate-spin" /> : <CheckSquare className="mr-3 h-6 w-6" />}
                Commit Deal Flow
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
