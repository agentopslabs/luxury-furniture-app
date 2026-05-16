"use client";

import { useEffect, useState, useCallback } from "react";
import { DashboardNav } from "@/components/dashboard/nav";
import { GHLPipeline } from "@/lib/ghl";
import { getPipelines } from "@/lib/ghl-actions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, Layers, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function PipelinePage() {
  const [pipelines, setPipelines] = useState<GHLPipeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>("");
  const { toast } = useToast();

  const fetchData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const pData = await getPipelines();
      setPipelines(pData);
      if (pData.length > 0 && !selectedPipelineId) {
        setSelectedPipelineId(pData[0].id);
      }
      if (isManual) {
        toast({ title: "Refreshed", description: `Loaded ${pData.length} pipelines.` });
      }
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Could not load pipelines." });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast, selectedPipelineId]);

  useEffect(() => { fetchData(); }, []);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <DashboardNav />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-2xl mx-auto space-y-8">

          <header className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Pipelines</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Select a pipeline to view</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchData(true)}
              disabled={loading || refreshing}
              className="h-9 px-4 rounded-lg"
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
              {refreshing ? "Refreshing..." : "Refresh"}
            </Button>
          </header>

          <Card className="border-border rounded-xl overflow-hidden">
            {loading ? (
              <div className="divide-y divide-border">
                {Array(4).fill(0).map((_, i) => (
                  <div key={i} className="px-5 py-4">
                    <Skeleton className="h-5 w-48 rounded-lg" />
                  </div>
                ))}
              </div>
            ) : pipelines.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-20 opacity-40">
                <Layers size={36} className="text-muted-foreground" />
                <p className="text-sm font-medium text-muted-foreground">No pipelines found</p>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {pipelines.map((pipeline) => {
                  const isSelected = selectedPipelineId === pipeline.id;
                  return (
                    <li key={pipeline.id}>
                      <button
                        onClick={() => setSelectedPipelineId(pipeline.id)}
                        className={cn(
                          "w-full flex items-center justify-between px-5 py-4 text-left transition-colors",
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted/50 text-foreground"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          {isSelected && (
                            <CheckCircle2 size={16} className="shrink-0 text-primary-foreground" />
                          )}
                          <span className={cn(
                            "text-sm font-medium",
                            isSelected ? "text-primary-foreground" : "text-foreground"
                          )}>
                            {pipeline.name}
                          </span>
                        </div>
                        <Badge
                          className={cn(
                            "text-[10px] font-semibold rounded-md px-2 py-0.5 border-0",
                            isSelected
                              ? "bg-white/20 text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {pipeline.stages.length} stage{pipeline.stages.length !== 1 ? "s" : ""}
                        </Badge>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          {/* Selected pipeline stages */}
          {!loading && selectedPipelineId && (() => {
            const active = pipelines.find(p => p.id === selectedPipelineId);
            if (!active) return null;
            return (
              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest px-1">
                  Stages — {active.name}
                </h2>
                <Card className="border-border rounded-xl overflow-hidden">
                  <ul className="divide-y divide-border">
                    {active.stages.map((stage, idx) => (
                      <li key={stage.id} className="flex items-center gap-4 px-5 py-3">
                        <span className="text-xs font-bold text-muted-foreground w-5 text-right shrink-0">
                          {idx + 1}
                        </span>
                        <span className="text-sm font-medium">{stage.name}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>
            );
          })()}

        </div>
      </main>
    </div>
  );
}
