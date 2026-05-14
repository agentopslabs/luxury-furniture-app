"use client";

import { useEffect, useState, useCallback } from "react";
import { DashboardNav } from "@/components/dashboard/nav";
import { ghl, GHLPipeline, GHLOpportunity, GHLContact } from "@/lib/ghl";
import { createOpportunity, getPipelines, getContacts, getOpportunities } from "@/lib/ghl-actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Layers, Plus, TrendingUp, DollarSign, Target, RefreshCw, MoreVertical, LayoutGrid, Kanban, Sparkles, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
    setFormData({ 
      name: "", 
      monetaryValue: 0, 
      pipelineId: pipelines[0]?.id || "", 
      pipelineStageId: pipelines[0]?.stages[0]?.id || "", 
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

  const totalValue = opportunities.reduce((acc, curr) => acc + (curr.monetaryValue || 0), 0);

  return (
    <div className="flex min-h-screen bg-background text-foreground overflow-hidden">
      <DashboardNav />
      <main className="flex-1 p-8 overflow-y-auto no-scrollbar relative">
        <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="max-w-6xl mx-auto space-y-10 relative z-10">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="space-y-2">
              <h1 className="text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/40">
                Sales Pipeline
              </h1>
              <p className="text-muted-foreground font-medium flex items-center gap-2">
                <Kanban size={16} className="text-primary" />
                Multi-stage visual deal flow tracking
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
                {refreshing ? "Synchronizing..." : "Sync Deals"}
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-700">
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

          <Card className="glass border-border/40 overflow-hidden group">
            <div className="h-1 w-full bg-gradient-to-r from-primary via-accent to-primary animate-shimmer opacity-20" />
            <CardHeader className="p-8 border-b border-white/5">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-bold">Opportunity Feed</CardTitle>
                  <CardDescription className="text-muted-foreground/80 mt-1">Direct synchronization with Sub-Account</CardDescription>
                </div>
                <div className="flex gap-2">
                   <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary"><LayoutGrid size={20} /></Button>
                   <Button variant="ghost" size="icon" className="text-primary bg-primary/10"><Kanban size={20} /></Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-8 space-y-4">
                  {Array(4).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full rounded-2xl" />
                  ))}
                </div>
              ) : opportunities.length > 0 ? (
                <div className="divide-y divide-white/5">
                  {opportunities.map((opp, i) => (
                    <div 
                      key={opp.id} 
                      className="flex items-center justify-between p-6 hover:bg-white/[0.02] transition-all group cursor-pointer animate-in fade-in duration-500"
                      style={{ animationDelay: `${i * 50}ms` }}
                    >
                      <div className="flex items-center gap-6">
                        <div className="relative">
                          <div className="absolute inset-0 bg-primary/10 blur-md rounded-full group-hover:bg-primary/30 transition-all" />
                          <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/5 text-primary flex items-center justify-center font-bold text-xl uppercase relative z-10 transition-transform group-hover:scale-105">
                            {opp.name?.[0] || 'O'}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="font-bold text-lg group-hover:text-primary transition-colors">{opp.name}</p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium opacity-80">
                            <span className="capitalize bg-white/5 px-2 py-0.5 rounded-md border border-white/5">{opp.contact?.name || 'Lead Anonymous'}</span>
                            <span className="flex items-center gap-1 text-emerald-400 font-bold font-mono">
                              <DollarSign size={12} />
                              {opp.monetaryValue?.toLocaleString() || 0}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <Badge variant={opp.status === 'open' ? 'default' : 'secondary'} className={cn(
                          "capitalize text-[10px] h-7 px-4 rounded-xl font-bold tracking-widest",
                          opp.status === 'open' ? "bg-primary text-white glow-primary" : "bg-white/5 text-muted-foreground"
                        )}>
                          {opp.status}
                        </Badge>
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-all">
                          <MoreVertical size={20} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-32 text-center space-y-6 animate-in fade-in duration-1000">
                  <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5 group-hover:glow-primary transition-all">
                    <Layers className="h-10 w-10 text-muted-foreground opacity-20" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-xl font-bold text-muted-foreground">Empty Pipeline Registry</p>
                    <p className="text-sm text-muted-foreground/60 max-w-[300px] mx-auto leading-relaxed">System is online but no active opportunities were detected.</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

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
                    <SelectContent className="glass border-white/10 rounded-xl">
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
