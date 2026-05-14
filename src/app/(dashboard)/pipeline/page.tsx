"use client";

import { useEffect, useState, useCallback } from "react";
import { DashboardNav } from "@/components/dashboard/nav";
import { ghl, GHLPipeline, GHLOpportunity } from "@/lib/ghl";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Layers, Plus, TrendingUp, DollarSign, Target, ArrowRight, RefreshCw } from "lucide-react";
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
          title: "Pipeline Updated",
          description: `Synchronized ${oData.length} opportunities from LeadConnector.`,
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Sync Error",
        description: "Failed to fetch pipeline data from GHL V2.",
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
    <div className="flex min-h-screen bg-background">
      <DashboardNav />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-8">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-4xl font-bold tracking-tight">Pipeline</h1>
              <p className="text-muted-foreground">Sales opportunities and deal flow tracking (V2 API).</p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => fetchData(true)} 
                disabled={loading || refreshing}
              >
                <RefreshCw className={cn("mr-2 h-4 w-4", refreshing && "animate-spin")} />
                Sync Deals
              </Button>
              <Button size="sm" className="shadow-lg shadow-primary/20">
                <Plus className="mr-2 h-4 w-4" /> Create Opportunity
              </Button>
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="glass border-border/40">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                    <TrendingUp size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Pipeline Value</p>
                    <p className="text-2xl font-bold">${totalValue.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="glass border-border/40">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <Target size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Active Deals</p>
                    <p className="text-2xl font-bold">{opportunities.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="glass border-border/40">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                    <Layers size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Pipelines</p>
                    <p className="text-2xl font-bold">{pipelines.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="glass border-border/40">
            <CardHeader>
              <CardTitle>Recent Opportunities</CardTitle>
              <CardDescription>Latest deals across all active pipelines in Location: nBYJTjYbHTIsJGiqT0W4</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {Array(4).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-lg" />
                  ))}
                </div>
              ) : opportunities.length > 0 ? (
                <div className="space-y-4">
                  {opportunities.map((opp) => (
                    <div 
                      key={opp.id} 
                      className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-card/40 hover:bg-card/60 transition-all group cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold uppercase">
                          {opp.name?.[0] || 'O'}
                        </div>
                        <div>
                          <p className="font-bold text-sm group-hover:text-primary transition-colors">{opp.name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                            <span className="capitalize">{opp.contact?.name || 'Contact Missing'}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1 font-mono">
                              <DollarSign size={10} />
                              {opp.monetaryValue?.toLocaleString() || 0}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant={opp.status === 'open' ? 'default' : 'secondary'} className="capitalize text-[10px] h-5 px-2">
                          {opp.status}
                        </Badge>
                        <ArrowRight size={16} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-24 text-center space-y-4 border rounded-xl border-dashed bg-muted/20">
                  <Layers className="h-12 w-12 mx-auto text-muted-foreground opacity-20" />
                  <div className="space-y-1">
                    <p className="font-medium text-muted-foreground">No active opportunities found</p>
                    <p className="text-xs text-muted-foreground opacity-70">Start adding deals in LeadConnector to track them here.</p>
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
