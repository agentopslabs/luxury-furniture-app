
"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { DashboardNav } from "@/components/dashboard/nav";
import { ghl, GHLPipeline, GHLOpportunity, GHLContact } from "@/lib/ghl";
import { createOpportunity, getPipelines, getContacts, getOpportunities } from "@/lib/ghl-actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Layers, 
  Plus, 
  TrendingUp, 
  DollarSign, 
  Target, 
  RefreshCw, 
  MoreVertical, 
  LayoutGrid, 
  Kanban, 
  Sparkles, 
  Loader2, 
  CheckCircle2,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function PipelinePage() {
  const [pipelines, setPipelines] = useState<GHLPipeline[]>([]);
  const [opportunities, setOpportunities] = useState<GHLOpportunity[]>([]);
  const [contacts, setContacts] = useState<GHLContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
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
      const [pData, oData, cData] = await Promise.all([
        getPipelines(),
        getOpportunities(),
        getContacts(100)
      ]);
      setPipelines(pData);
      setOpportunities(oData);
      setContacts(cData);
      
      if (isManual) {
        toast({
          title: "Synchronization Complete",
          description: `Loaded ${oData.length} opportunities from LeadConnector.`,
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Sync Failure",
        description: "Communication with GHL V2 server was interrupted.",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenCreate = () => {
    const defaultPipe = pipelines[0];
    setFormData({ 
      name: "", 
      monetaryValue: 0, 
      pipelineId: defaultPipe?.id || "", 
      pipelineStageId: defaultPipe?.stages[0]?.id || "", 
      contactId: "", 
      status: "open" 
    });
    setIsCreateOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.pipelineId || !formData.pipelineStageId) {
      toast({ variant: "destructive", title: "Missing Data", description: "Please complete all fields." });
      return;
    }

    setIsActionLoading(true);
    try {
      await createOpportunity(formData);
      setIsCreateOpen(false);
      toast({ title: "Opportunity Created", description: "Successfully pushed to GHL deal flow." });
      fetchData(true);
    } catch (error) {
      toast({ variant: "destructive", title: "Sync Failure", description: "Could not create opportunity." });
    } finally {
      setIsActionLoading(false);
    }
  };

  const kanbanData = useMemo(() => {
    if (pipelines.length === 0) return [];
    const activePipe = pipelines[0]; // For MVP, we use the first pipeline
    return activePipe.stages.map(stage => ({
      ...stage,
      opps: opportunities.filter(o => o.pipelineStageId === stage.id)
    }));
  }, [pipelines, opportunities]);

  const totalValue = opportunities.reduce((acc, curr) => acc + (curr.monetaryValue || 0), 0);

  return (
    <div className="flex min-h-screen bg-background text-foreground overflow-hidden">
      <DashboardNav />
      <main className="flex-1 p-8 overflow-y-auto no-scrollbar relative flex flex-col">
        <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="max-w-[1400px] mx-auto w-full space-y-10 relative z-10 flex-1 flex flex-col">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 animate-in fade-in slide-in-from-top-4 duration-500 shrink-0">
            <div className="space-y-2">
              <h1 className="text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/40">
                Sales Pipeline
              </h1>
              <p className="text-muted-foreground font-medium flex items-center gap-2">
                <Kanban size={16} className="text-primary" />
                Live visual deal flow tracking
              </p>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                size="lg" 
                onClick={() => fetchData(true)} 
                disabled={loading || refreshing}
                className="h-12 px-6 rounded-2xl border-white/10 bg-white/[0.03] hover:bg-white/[0.08] backdrop-blur-md transition-all font-bold"
              >
                <RefreshCw className={cn("mr-2 h-4 w-4", refreshing && "animate-spin")} />
                {refreshing ? "Refreshing..." : "Refresh Board"}
              </Button>
              <Button 
                size="lg" 
                className="glow-primary h-12 px-6 rounded-2xl bg-primary hover:bg-primary/90 transition-all font-bold active:scale-95"
                onClick={handleOpenCreate}
              >
                <Plus className="mr-2 h-5 w-5" /> Create Opportunity
              </Button>
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-700 shrink-0">
            {[
              { label: "Pipeline Value", value: `$${totalValue.toLocaleString()}`, icon: TrendingUp, color: "text-emerald-400" },
              { label: "Active Deals", value: opportunities.length, icon: Target, color: "text-primary" },
              { label: "Lead Inflow", value: "+12.4%", icon: Sparkles, color: "text-amber-400" }
            ].map((stat, i) => (
              <Card key={i} className="glass glass-hover border-border/40 p-8 flex flex-col justify-between group">
                <div className="flex items-center justify-between mb-4">
                  <div className={cn("w-12 h-12 rounded-2xl bg-white/[0.03] flex items-center justify-center transition-all group-hover:scale-110", stat.color)}>
                    <stat.icon size={24} />
                  </div>
                  <Badge variant="outline" className="text-[10px] bg-white/5 border-white/10 uppercase tracking-widest font-bold">LIVE</Badge>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold font-headline">{stat.value}</p>
                </div>
              </Card>
            ))}
          </div>

          <div className="flex-1 min-h-0 relative">
            <ScrollArea className="h-full w-full rounded-3xl border border-white/5 bg-white/[0.01]">
              <div className="flex gap-6 p-6 min-w-full">
                {loading ? (
                  Array(5).fill(0).map((_, i) => (
                    <div key={i} className="w-80 shrink-0 space-y-6">
                      <Skeleton className="h-10 w-3/4 rounded-xl" />
                      <Skeleton className="h-[400px] w-full rounded-3xl" />
                    </div>
                  ))
                ) : kanbanData.length > 0 ? (
                  kanbanData.map((stage) => (
                    <div key={stage.id} className="w-80 shrink-0 flex flex-col space-y-6">
                      <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-3">
                          <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">{stage.name}</h3>
                          <Badge variant="secondary" className="text-[10px] h-5 px-2 bg-white/5 border-white/5">{stage.opps.length}</Badge>
                        </div>
                        <span className="text-[11px] font-mono text-emerald-400 font-bold bg-emerald-500/5 px-2 py-0.5 rounded-lg border border-emerald-500/10">
                          ${stage.opps.reduce((acc, curr) => acc + (curr.monetaryValue || 0), 0).toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="flex-1 space-y-4 min-h-[500px] p-2 rounded-3xl bg-white/[0.01] border border-white/5">
                        {stage.opps.map((opp) => (
                          <Card key={opp.id} className="glass glass-hover border-white/5 p-5 rounded-2xl group transition-all cursor-move active:scale-95">
                            <div className="flex justify-between items-start mb-4">
                              <Badge variant="outline" className="text-[8px] uppercase font-bold tracking-tighter opacity-50">
                                {opp.id.slice(0, 8)}
                              </Badge>
                              <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreVertical size={14} />
                              </Button>
                            </div>
                            
                            <h4 className="font-bold text-base group-hover:text-primary transition-colors mb-4 line-clamp-2 leading-tight">
                              {opp.name}
                            </h4>
                            
                            <div className="flex items-center justify-between pt-4 border-t border-white/5">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold border border-primary/20">
                                  {opp.contact?.name?.[0] || 'L'}
                                </div>
                                <div className="overflow-hidden">
                                  <p className="text-[10px] font-bold text-foreground truncate w-24">{opp.contact?.name || 'Lead Anonymous'}</p>
                                  <p className="text-[9px] text-muted-foreground opacity-50 uppercase tracking-widest">Client</p>
                                </div>
                              </div>
                              <div className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                                <DollarSign size={12} />
                                {opp.monetaryValue?.toLocaleString() || 0}
                              </div>
                            </div>
                          </Card>
                        ))}
                        
                        {stage.opps.length === 0 && (
                          <div className="h-32 border border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center opacity-10 gap-2">
                            <Layers size={24} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Empty Stage</span>
                          </div>
                        )}
                        
                        <Button variant="ghost" onClick={handleOpenCreate} className="w-full h-12 rounded-2xl border border-dashed border-white/5 text-muted-foreground hover:text-primary hover:border-primary/20 hover:bg-primary/5 group transition-all">
                          <Plus size={16} className="mr-2 group-hover:scale-110 transition-transform" />
                          <span className="text-[10px] font-bold uppercase tracking-widest">New Deal</span>
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="w-full h-[400px] flex flex-col items-center justify-center space-y-4">
                    <Layers className="h-16 w-16 text-muted-foreground opacity-10" />
                    <p className="text-muted-foreground font-medium">No active deal flows detected.</p>
                  </div>
                )}
              </div>
              <ScrollBar orientation="horizontal" className="bg-white/5" />
            </ScrollArea>
          </div>
        </div>
      </main>

      {/* Creation Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="glass border-white/10 rounded-3xl p-8 max-w-lg">
          <form onSubmit={handleCreate}>
            <DialogHeader className="mb-8">
              <DialogTitle className="text-2xl font-bold">New Opportunity</DialogTitle>
              <DialogDescription className="text-muted-foreground">Inject deal into LeadConnector V2 flow.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-6">
              <div className="space-y-2">
                <Label className="text-[11px] font-bold uppercase tracking-widest opacity-60">Deal Name</Label>
                <Input 
                  className="glass h-12 rounded-xl focus:ring-primary" 
                  placeholder="e.g. Enterprise License Alpha" 
                  value={formData.name} 
                  onChange={e => setFormData({ ...formData, name: e.target.value })} 
                  required 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold uppercase tracking-widest opacity-60">Revenue Value ($)</Label>
                  <Input 
                    className="glass h-12 rounded-xl" 
                    type="number" 
                    placeholder="0" 
                    value={formData.monetaryValue} 
                    onChange={e => setFormData({ ...formData, monetaryValue: Number(e.target.value) })} 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold uppercase tracking-widest opacity-60">Identity Link (Contact)</Label>
                  <Select value={formData.contactId} onValueChange={val => setFormData({ ...formData, contactId: val })}>
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
              <div className="space-y-2">
                <Label className="text-[11px] font-bold uppercase tracking-widest opacity-60">Active Pipeline</Label>
                <Select 
                  value={formData.pipelineId} 
                  onValueChange={val => {
                    const pipe = pipelines.find(p => p.id === val);
                    setFormData({ 
                      ...formData, 
                      pipelineId: val, 
                      pipelineStageId: pipe?.stages[0]?.id || "" 
                    });
                  }}
                >
                  <SelectTrigger className="glass h-12 rounded-xl focus:ring-primary">
                    <SelectValue placeholder="Select Pipeline" />
                  </SelectTrigger>
                  <SelectContent className="glass border-white/10 rounded-xl">
                    {pipelines.map(p => (
                      <SelectItem key={p.id} value={p.id} className="rounded-lg">
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {formData.pipelineId && (
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold uppercase tracking-widest opacity-60">Deal Stage</Label>
                  <Select 
                    value={formData.pipelineStageId} 
                    onValueChange={val => setFormData({ ...formData, pipelineStageId: val })}
                  >
                    <SelectTrigger className="glass h-12 rounded-xl focus:ring-primary">
                      <SelectValue placeholder="Select Stage" />
                    </SelectTrigger>
                    <SelectContent className="glass border-white/10 rounded-xl">
                      {pipelines.find(p => p.id === formData.pipelineId)?.stages.map(s => (
                        <SelectItem key={s.id} value={s.id} className="rounded-lg">
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter className="mt-10">
              <Button type="submit" size="lg" className="w-full h-12 rounded-xl glow-primary font-bold" disabled={isActionLoading}>
                {isActionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-5 w-5" />}
                Commit Record
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
