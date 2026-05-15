
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
  Filter, 
  ArrowUpDown, 
  MoreHorizontal, 
  LayoutGrid, 
  List, 
  Download, 
  Phone, 
  MessageSquare, 
  Tag, 
  FileText, 
  CheckSquare, 
  Calendar,
  Loader2,
  ChevronDown,
  UserPlus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function OpportunitiesPage() {
  const [pipelines, setPipelines] = useState<GHLPipeline[]>([]);
  const [opportunities, setOpportunities] = useState<GHLOpportunity[]>([]);
  const [contacts, setContacts] = useState<GHLContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  
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
        toast({ title: "Registry Synced", description: "Real-time GHL deal flow updated." });
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
  }, [fetchData]);

  const activePipeline = useMemo(() => 
    pipelines.find(p => p.id === selectedPipelineId) || pipelines[0]
  , [pipelines, selectedPipelineId]);

  const kanbanData = useMemo(() => {
    if (!activePipeline) return [];
    return activePipeline.stages.map(stage => ({
      ...stage,
      opps: opportunities.filter(o => 
        o.pipelineId === activePipeline.id && 
        o.pipelineStageId === stage.id &&
        (o.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
         o.contact?.name?.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }));
  }, [activePipeline, opportunities, searchQuery]);

  const handleDragStart = (e: React.DragEvent, oppId: string) => {
    e.dataTransfer.setData("oppId", oppId);
  };

  const handleDrop = async (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    const oppId = e.dataTransfer.getData("oppId");
    const opp = opportunities.find(o => o.id === oppId);
    
    if (opp && opp.pipelineStageId !== stageId) {
      // Optimistic UI update
      setOpportunities(prev => prev.map(o => o.id === oppId ? { ...o, pipelineStageId: stageId } : o));
      
      try {
        await updateOpportunity(oppId, { pipelineStageId: stageId });
        toast({ title: "Deal Transitioned", description: `Opportunity moved to new stage.` });
      } catch (error) {
        // Rollback on failure
        fetchData();
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
        {/* Futuristic Background Blur */}
        <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

        {/* Top Header - GHL Tabbed Navigation */}
        <header className="border-b border-white/5 px-8 pt-8 pb-4 shrink-0 bg-background/50 backdrop-blur-md z-10">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold font-headline">Opportunities</h1>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => fetchData(true)} disabled={refreshing}>
                <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
                {refreshing ? "Refreshing..." : "Sync"}
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <MoreHorizontal size={20} />
              </Button>
            </div>
          </div>
          
          <Tabs defaultValue="opportunities" className="w-full">
            <TabsList className="bg-transparent border-b border-white/5 w-full justify-start rounded-none h-auto p-0 gap-8">
              <TabsTrigger value="opportunities" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none border-b-2 border-transparent px-0 py-2 text-sm font-medium transition-all">Opportunities</TabsTrigger>
              <TabsTrigger value="forecast" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none border-b-2 border-transparent px-0 py-2 text-sm font-medium transition-all opacity-50">Forecast</TabsTrigger>
              <TabsTrigger value="pipelines" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none border-b-2 border-transparent px-0 py-2 text-sm font-medium transition-all opacity-50">Pipelines</TabsTrigger>
              <TabsTrigger value="bulk" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none border-b-2 border-transparent px-0 py-2 text-sm font-medium transition-all opacity-50">Bulk Actions</TabsTrigger>
            </TabsList>
          </Tabs>
        </header>

        {/* Filter Bar */}
        <div className="px-8 py-4 border-b border-white/5 bg-background/30 backdrop-blur-sm shrink-0 z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <Select value={selectedPipelineId} onValueChange={setSelectedPipelineId}>
                <SelectTrigger className="w-[240px] h-10 glass border-white/10 rounded-xl font-medium">
                  <SelectValue placeholder="Select Pipeline" />
                </SelectTrigger>
                <SelectContent className="glass border-white/10 rounded-2xl">
                  {pipelines.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 h-10 px-4 rounded-xl text-xs font-bold font-mono">
                {opportunities.length} opportunities
              </Badge>

              <div className="h-6 w-px bg-white/10" />

              <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg bg-white/10 shadow-lg"><LayoutGrid size={16} /></Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg opacity-40"><List size={16} /></Button>
              </div>

              <Button variant="outline" size="sm" className="h-10 rounded-xl border-white/10">
                <Download size={16} className="mr-2" /> Import
              </Button>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
                <Input 
                  placeholder="Search Opportunities" 
                  className="glass pl-10 h-10 rounded-xl text-xs border-white/10 focus:ring-primary"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button className="glow-primary bg-primary hover:bg-primary/90 h-10 px-6 rounded-xl font-bold" onClick={() => {
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
                }
              }}>
                <Plus size={18} className="mr-2" /> Add opportunity
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-4">
            <Button variant="ghost" size="sm" className="h-8 text-[11px] font-bold uppercase tracking-widest text-primary border-b-2 border-primary rounded-none px-0">
              <LayoutGrid size={12} className="mr-2" /> Open opportunities
            </Button>
            <Button variant="ghost" size="sm" className="h-8 text-[11px] font-bold uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity">
              <Plus size={12} className="mr-2" /> List
            </Button>
            
            <div className="ml-auto flex items-center gap-2">
              <Button variant="ghost" size="sm" className="h-8 text-[11px] font-bold text-muted-foreground">
                <Filter size={12} className="mr-2" /> Advanced Filters
              </Button>
              <Button variant="ghost" size="sm" className="h-8 text-[11px] font-bold text-muted-foreground">
                <ArrowUpDown size={12} className="mr-2" /> Sort (1)
              </Button>
            </div>
          </div>
        </div>

        {/* Kanban Area */}
        <div className="flex-1 overflow-x-auto p-8 relative no-scrollbar">
          <div className="flex gap-6 h-full min-w-max pb-4">
            {loading ? (
              Array(4).fill(0).map((_, i) => (
                <div key={i} className="w-80 shrink-0 space-y-4">
                  <Skeleton className="h-10 w-full rounded-xl" />
                  <Skeleton className="h-[500px] w-full rounded-3xl" />
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
                  <div className="flex flex-col mb-4 px-2">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <h3 className="text-sm font-bold truncate">{stage.name}</h3>
                      </div>
                      <ChevronDown size={14} className="text-muted-foreground opacity-50 group-hover/stage:opacity-100 transition-opacity" />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground font-medium opacity-60">
                      <span>{stage.opps.length} Opportunities</span>
                      <span className="font-mono">${stage.opps.reduce((acc, curr) => acc + (curr.monetaryValue || 0), 0).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 rounded-2xl bg-white/[0.01] border border-white/5 p-2 transition-all hover:bg-white/[0.03] min-h-[200px]">
                    {stage.opps.map((opp) => (
                      <div 
                        key={opp.id} 
                        draggable
                        onDragStart={(e) => handleDragStart(e, opp.id)}
                        className="glass glass-hover p-4 rounded-2xl border-white/5 group transition-all cursor-grab active:cursor-grabbing hover:glow-primary animate-in fade-in slide-in-from-bottom-2"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <p className="text-sm font-bold text-foreground leading-tight group-hover:text-primary transition-colors pr-6">
                            {opp.name}
                          </p>
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary border border-primary/20 shrink-0">
                            {opp.contact?.name?.[0] || 'L'}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest opacity-40">Value</span>
                            <span className="text-sm font-mono font-bold text-emerald-400">
                              ${opp.monetaryValue?.toLocaleString() || '0.00'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between pt-3 border-t border-white/5">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1 opacity-30 hover:opacity-100 hover:text-primary transition-all cursor-pointer">
                                <Phone size={12} />
                              </div>
                              <div className="flex items-center gap-1 opacity-30 hover:opacity-100 hover:text-primary transition-all cursor-pointer">
                                <MessageSquare size={12} />
                                {opp.id.length % 3 === 0 && <Badge className="h-3 min-w-3 p-0 px-1 text-[8px] bg-primary rounded-full">2</Badge>}
                              </div>
                              <div className="flex items-center gap-1 opacity-30 hover:opacity-100 hover:text-primary transition-all cursor-pointer">
                                <Tag size={12} />
                                <Badge className="h-3 min-w-3 p-0 px-1 text-[8px] bg-emerald-500 rounded-full">1</Badge>
                              </div>
                              <div className="flex items-center gap-1 opacity-30 hover:opacity-100 hover:text-primary transition-all cursor-pointer">
                                <FileText size={12} />
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                               <CheckSquare size={12} className="opacity-20" />
                               <Calendar size={12} className="opacity-20" />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {stage.opps.length === 0 && (
                      <div className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-2xl opacity-10">
                        <Plus size={24} />
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center space-y-6 opacity-20">
                <LayoutGrid size={64} />
                <p className="text-xl font-bold">No active pipelines found</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Creation Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="glass border-white/10 rounded-3xl p-8 max-w-lg">
          <form onSubmit={handleCreate}>
            <DialogHeader className="mb-8">
              <DialogTitle className="text-2xl font-bold">New Opportunity</DialogTitle>
              <DialogDescription className="text-muted-foreground">Inject deal into your active sales pipeline.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-6">
              <div className="space-y-2">
                <Label className="text-[11px] font-bold uppercase tracking-widest opacity-60">Deal Name</Label>
                <Input 
                  className="glass h-12 rounded-xl focus:ring-primary" 
                  placeholder="e.g. Enterprise Solution" 
                  value={formData.name} 
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} 
                  required 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold uppercase tracking-widest opacity-60">Revenue Value ($)</Label>
                  <Input 
                    className="glass h-12 rounded-xl" 
                    type="number" 
                    value={formData.monetaryValue} 
                    onChange={e => setFormData(prev => ({ ...prev, monetaryValue: Number(e.target.value) }))} 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold uppercase tracking-widest opacity-60">Link Contact</Label>
                  <Select value={formData.contactId} onValueChange={val => setFormData(prev => ({ ...prev, contactId: val }))}>
                    <SelectTrigger className="glass h-12 rounded-xl"><SelectValue placeholder="Select Contact" /></SelectTrigger>
                    <SelectContent className="glass border-white/10 rounded-xl">
                      {contacts.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.firstName} {c.lastName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] font-bold uppercase tracking-widest opacity-60">Pipeline Stage</Label>
                <Select value={formData.pipelineStageId} onValueChange={val => setFormData(prev => ({ ...prev, pipelineStageId: val }))}>
                  <SelectTrigger className="glass h-12 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent className="glass border-white/10 rounded-xl">
                    {activePipeline?.stages.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="mt-10">
              <Button type="submit" size="lg" className="w-full h-12 rounded-xl glow-primary font-bold" disabled={isActionLoading}>
                {isActionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-5 w-5" />}
                Commit Deal
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
