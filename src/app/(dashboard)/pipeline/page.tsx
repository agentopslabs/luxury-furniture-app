"use client";

import { useEffect, useState, useCallback } from "react";
import { DashboardNav } from "@/components/dashboard/nav";
import { ghl, GHLPipeline, GHLOpportunity } from "@/lib/ghl";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Layers, Plus, TrendingUp, DollarSign, Target, ArrowRight, RefreshCw, MoreVertical, LayoutGrid, Kanban, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function PipelinePage() {
  const [pipelines, setPipelines] = useState<GHLPipeline[]>([]);
  const [opportunities, setOpportunities] = useState<GHLOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  const fetchData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const [pData, oData] = await Promise.all([
        ghl.getPipelines(),
        ghl.getOpportunities()
      ]);
      setPipelines(pData);
      setOpportunities(oData);
      
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
              <Button size="lg" className="glow-primary h-12 px-6 rounded-2xl bg-primary hover:bg-primary/90 transition-all font-bold">
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
                  <CardDescription className="text-muted-foreground/80 mt-1">Direct synchronization with Sub-Account nBYJT...T0W4</CardDescription>
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
                    <p className="text-sm text-muted-foreground/60 max-w-[300px] mx-auto leading-relaxed">System is online but no active opportunities were detected in the cloud repository.</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}