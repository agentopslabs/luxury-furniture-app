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
import { Layers, CheckCircle2, RefreshCw, Plus, Trash2, Settings, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const [pipelines, setPipelines] = useState<GHLPipeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [splitView, setSplitView] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
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

  const handleToggleSplitView = () => {
    setSplitView(prev => {
      if (!prev) {
        setSelectedId(pipelines[0]?.id || null);
        setExpandedId(null);
      }
      return !prev;
    });
  };

  const visiblePipelines = splitView ? pipelines.slice(0, 4) : pipelines;
  const selectedPipeline = pipelines.find(p => p.id === selectedId) || null;

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <DashboardNav />

      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top bar */}
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

        {/* Main content area */}
        <div className={cn("flex flex-1 overflow-hidden", splitView && "divide-x divide-border/50")}>

          {/* Left Panel - Pipeline List */}
          <div className={cn("flex flex-col overflow-hidden", splitView ? "w-72 shrink-0" : "flex-1")}>
            <div className="px-6 pt-5 pb-3 shrink-0 flex items-center justify-between">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                <Layers size={11} />
                Pipelines
              </p>
              <button
                onClick={handleToggleSplitView}
                title={splitView ? "Expand view" : "Collapse to split view"}
                className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-muted/60 transition-colors text-muted-foreground hover:text-foreground"
              >
                {splitView ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-6">
              {loading ? (
                <div className="space-y-2">
                  {Array(5).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full rounded-xl" />
                  ))}
                </div>
              ) : pipelines.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-20 opacity-40">
                  <Layers size={32} className="text-muted-foreground" />
                  <p className="text-sm font-medium text-muted-foreground">No pipelines found</p>
                </div>
              ) : splitView ? (
                /* Split view — compact clickable list (max 4) */
                <div className="space-y-1.5">
                  {visiblePipelines.map(pipeline => {
                    const isSelected = selectedId === pipeline.id;
                    return (
                      <button
                        key={pipeline.id}
                        onClick={() => setSelectedId(pipeline.id)}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors",
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted/50 border border-border/40 bg-card"
                        )}
                      >
                        <CheckCircle2 size={15} className={cn("shrink-0", isSelected ? "text-primary-foreground" : "text-muted-foreground/30")} />
                        <div className="flex-1 min-w-0">
                          <p className={cn("text-sm font-semibold truncate", isSelected ? "text-primary-foreground" : "text-foreground")}>
                            {pipeline.name}
                          </p>
                          <p className={cn("text-xs mt-0.5", isSelected ? "text-primary-foreground/70" : "text-muted-foreground")}>
                            {pipeline.stages.length} stage{pipeline.stages.length !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <Badge className={cn(
                          "text-[10px] px-2 py-0.5 rounded-md border-0 shrink-0",
                          isSelected ? "bg-white/20 text-primary-foreground" : "bg-muted text-muted-foreground"
                        )}>
                          {pipeline.stages.length}
                        </Badge>
                      </button>
                    );
                  })}
                </div>
              ) : (
                /* Accordion view (default) */
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

          {/* Right Panel - Stage Details (split view only) */}
          {splitView && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {selectedPipeline ? (
                <>
                  <div className="px-6 py-4 border-b border-border/50 shrink-0 flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-bold">{selectedPipeline.name}</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {selectedPipeline.stages.length} stage{selectedPipeline.stages.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-3 text-xs rounded-lg gap-1"
                      onClick={() => { setTargetPipeline(selectedPipeline); setNewStageName(""); setAddStageOpen(true); }}
                    >
                      <Plus size={12} /> Add Stage
                    </Button>
                  </div>

                  <div className="flex-1 overflow-y-auto no-scrollbar p-6">
                    {selectedPipeline.stages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center gap-3 py-20 opacity-40">
                        <Layers size={28} className="text-muted-foreground" />
                        <p className="text-sm font-medium text-muted-foreground">No stages yet</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {selectedPipeline.stages.map((stage, idx) => (
                          <div
                            key={stage.id}
                            className="flex items-center gap-4 px-4 py-3.5 rounded-xl bg-card border border-border/50 hover:bg-muted/30 transition-colors group"
                          >
                            <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                              {idx + 1}
                            </div>
                            <span className="text-sm font-medium flex-1">{stage.name}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleDeleteStage(selectedPipeline, stage.id, stage.name)}
                            >
                              <Trash2 size={13} />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 opacity-30">
                  <Layers size={32} className="text-muted-foreground" />
                  <p className="text-sm font-medium text-muted-foreground">Select a pipeline</p>
                </div>
              )}
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
