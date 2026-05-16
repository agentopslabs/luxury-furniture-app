"use client";

import { useEffect, useState, useCallback } from "react";
import { DashboardNav } from "@/components/dashboard/nav";
import { getPipelines } from "@/lib/ghl-actions";
import { GHLPipeline } from "@/lib/ghl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Layers, CheckCircle2, RefreshCw, Plus, Trash2, Settings, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const [pipelines, setPipelines] = useState<GHLPipeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [addStageOpen, setAddStageOpen] = useState(false);
  const [newStageName, setNewStageName] = useState("");
  const [targetPipeline, setTargetPipeline] = useState<GHLPipeline | null>(null);
  const { toast } = useToast();

  const fetchData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await getPipelines();
      setPipelines(data);
      if (isManual) {
        toast({ title: "Refreshed", description: `Loaded ${data.length} pipelines.` });
      }
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Could not load pipelines." });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  const handleAddStage = () => {
    const trimmed = newStageName.trim();
    if (!trimmed || !targetPipeline) return;
    const updated = {
      ...targetPipeline,
      stages: [...targetPipeline.stages, { id: `local-${Date.now()}`, name: trimmed }],
    };
    setPipelines(prev => prev.map(p => p.id === updated.id ? updated : p));
    setTargetPipeline(updated);
    toast({ title: "Stage Added", description: `"${trimmed}" added to ${targetPipeline.name}.` });
    setAddStageOpen(false);
    setNewStageName("");
  };

  const handleDeleteStage = (pipeline: GHLPipeline, stageId: string, stageName: string) => {
    const updated = { ...pipeline, stages: pipeline.stages.filter(s => s.id !== stageId) };
    setPipelines(prev => prev.map(p => p.id === updated.id ? updated : p));
    if (targetPipeline?.id === pipeline.id) setTargetPipeline(updated);
    toast({ title: "Stage Removed", description: `"${stageName}" has been removed.` });
  };

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <DashboardNav />

      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 shrink-0">
          <div className="flex items-center gap-2">
            <Settings size={18} className="text-primary" />
            <h1 className="text-base font-bold">Settings</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg"
            onClick={() => fetchData(true)}
            disabled={loading || refreshing}
            title="Refresh"
          >
            <RefreshCw size={15} className={cn(refreshing && "animate-spin")} />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar p-6">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2 mb-4">
            <Layers size={11} />
            Pipelines
          </p>

          {loading ? (
            <div className="space-y-2 max-w-2xl">
              {Array(5).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-xl" />
              ))}
            </div>
          ) : pipelines.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 opacity-40">
              <Layers size={32} className="text-muted-foreground" />
              <p className="text-sm font-medium text-muted-foreground">No pipelines found</p>
            </div>
          ) : (
            <div className="space-y-2 max-w-2xl">
              {pipelines.map(pipeline => {
                const isOpen = expandedId === pipeline.id;
                return (
                  <div key={pipeline.id} className="rounded-xl border border-border/50 bg-card overflow-hidden">
                    <button
                      onClick={() => toggleExpand(pipeline.id)}
                      className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-muted/40 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <CheckCircle2 size={15} className={cn("shrink-0 transition-colors", isOpen ? "text-primary" : "text-muted-foreground/30")} />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">{pipeline.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {pipeline.stages.length} stage{pipeline.stages.length !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <Badge className="text-[10px] px-2 py-0.5 rounded-md border-0 bg-muted text-muted-foreground">
                          {pipeline.stages.length}
                        </Badge>
                        {isOpen ? <ChevronUp size={16} className="text-primary" /> : <ChevronDown size={16} className="text-muted-foreground" />}
                      </div>
                    </button>

                    {isOpen && (
                      <div className="border-t border-border/50 px-4 py-3 bg-muted/20 space-y-2">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Stages</p>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-3 text-xs rounded-lg gap-1"
                            onClick={() => { setTargetPipeline(pipeline); setNewStageName(""); setAddStageOpen(true); }}
                          >
                            <Plus size={12} /> Add Stage
                          </Button>
                        </div>
                        {pipeline.stages.length === 0 ? (
                          <p className="text-xs text-muted-foreground text-center py-4 opacity-50">No stages yet</p>
                        ) : (
                          <div className="space-y-1">
                            {pipeline.stages.map((stage, idx) => (
                              <div
                                key={stage.id}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-card border border-border/30 hover:bg-muted/30 transition-colors group"
                              >
                                <div className="w-6 h-6 rounded-md bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">
                                  {idx + 1}
                                </div>
                                <span className="text-sm font-medium flex-1">{stage.name}</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => handleDeleteStage(pipeline, stage.id, stage.name)}
                                >
                                  <Trash2 size={12} />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Dialog open={addStageOpen} onOpenChange={setAddStageOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Stage</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground -mt-2">
            Adding to: <span className="font-medium text-foreground">{targetPipeline?.name}</span>
          </p>
          <Input
            placeholder="Stage name"
            value={newStageName}
            onChange={e => setNewStageName(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") handleAddStage(); }}
            autoFocus
          />
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" size="sm">Cancel</Button>
            </DialogClose>
            <Button size="sm" onClick={handleAddStage} disabled={!newStageName.trim()}>
              <Plus size={14} className="mr-1" /> Add Stage
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
