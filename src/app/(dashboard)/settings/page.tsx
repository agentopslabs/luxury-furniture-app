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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Layers, CheckCircle2, RefreshCw, Plus, Trash2, MoreHorizontal, Settings, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const [pipelines, setPipelines] = useState<GHLPipeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPipeline, setSelectedPipeline] = useState<GHLPipeline | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const { toast } = useToast();

  const [addStageOpen, setAddStageOpen] = useState(false);
  const [newStageName, setNewStageName] = useState("");
  const [deleteStageOpen, setDeleteStageOpen] = useState(false);

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

  const handleSelectPipeline = (pipeline: GHLPipeline) => {
    setSelectedPipeline(pipeline);
    setShowDetail(true);
  };

  const handleAddStage = () => {
    const trimmed = newStageName.trim();
    if (!trimmed || !selectedPipeline) return;
    const updated = {
      ...selectedPipeline,
      stages: [...selectedPipeline.stages, { id: `local-${Date.now()}`, name: trimmed }],
    };
    setPipelines(prev => prev.map(p => p.id === updated.id ? updated : p));
    setSelectedPipeline(updated);
    toast({ title: "Stage Added", description: `"${trimmed}" added to ${selectedPipeline.name}.` });
    setAddStageOpen(false);
    setNewStageName("");
  };

  const handleDeleteStage = (stageId: string, stageName: string) => {
    if (!selectedPipeline) return;
    const updated = {
      ...selectedPipeline,
      stages: selectedPipeline.stages.filter(s => s.id !== stageId),
    };
    setPipelines(prev => prev.map(p => p.id === updated.id ? updated : p));
    setSelectedPipeline(updated);
    toast({ title: "Stage Removed", description: `"${stageName}" has been removed.` });
  };

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <DashboardNav />

      <div className="flex flex-1 overflow-hidden">
        {/* ── LEFT PANEL: Pipeline list ── */}
        <div className={cn(
          "flex flex-col border-r border-border/50 bg-background shrink-0",
          "w-full md:w-80",
          showDetail ? "hidden md:flex" : "flex"
        )}>
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/50 shrink-0">
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

          {/* Section label */}
          <div className="px-5 pt-4 pb-2 shrink-0">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
              <Layers size={11} />
              Pipelines
            </p>
          </div>

          {/* Pipeline list */}
          <div className="flex-1 overflow-y-auto no-scrollbar">
            {loading ? (
              <div className="px-3 space-y-1">
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
              <div className="px-3 space-y-0.5 py-1">
                {pipelines.map((pipeline) => {
                  const isActive = selectedPipeline?.id === pipeline.id;
                  return (
                    <button
                      key={pipeline.id}
                      onClick={() => handleSelectPipeline(pipeline)}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-3.5 rounded-xl text-left transition-all duration-150 group",
                        isActive
                          ? "bg-primary text-white"
                          : "hover:bg-muted/60 text-foreground"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {isActive && <CheckCircle2 size={15} className="shrink-0 text-white" />}
                        <div className="min-w-0">
                          <p className={cn(
                            "text-sm font-semibold truncate",
                            isActive ? "text-white" : "text-foreground"
                          )}>
                            {pipeline.name}
                          </p>
                          <p className={cn(
                            "text-xs mt-0.5",
                            isActive ? "text-white/60" : "text-muted-foreground"
                          )}>
                            {pipeline.stages.length} stage{pipeline.stages.length !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                      <Badge
                        className={cn(
                          "text-[10px] px-2 py-0.5 rounded-md border-0 shrink-0 ml-2",
                          isActive ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                        )}
                      >
                        {pipeline.stages.length}
                      </Badge>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT PANEL: Pipeline detail ── */}
        <div className={cn(
          "flex flex-col flex-1 overflow-hidden",
          !showDetail ? "hidden md:flex" : "flex"
        )}>
          {selectedPipeline ? (
            <>
              {/* Detail header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 shrink-0">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 md:hidden"
                    onClick={() => setShowDetail(false)}
                  >
                    <ArrowLeft size={16} />
                  </Button>
                  <div>
                    <h2 className="font-bold text-base">{selectedPipeline.name}</h2>
                    <p className="text-xs text-muted-foreground">
                      {selectedPipeline.stages.length} stage{selectedPipeline.stages.length !== 1 ? "s" : ""} in this pipeline
                    </p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 px-3 rounded-lg gap-1.5 text-xs">
                      <MoreHorizontal size={14} /> Actions
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem
                      onClick={() => { setNewStageName(""); setAddStageOpen(true); }}
                      className="gap-2 cursor-pointer text-sm"
                    >
                      <Plus size={13} /> Add Stage
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setDeleteStageOpen(true)}
                      className="gap-2 cursor-pointer text-sm text-destructive focus:text-destructive"
                      disabled={selectedPipeline.stages.length === 0}
                    >
                      <Trash2 size={13} /> Delete Stage
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Stages list */}
              <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-4">
                {selectedPipeline.stages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-4 py-24 opacity-40">
                    <Layers size={40} className="text-muted-foreground" />
                    <div className="text-center space-y-1">
                      <p className="text-sm font-semibold text-muted-foreground">No stages yet</p>
                      <p className="text-xs text-muted-foreground">Use Actions → Add Stage to create one</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 max-w-lg">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">
                      Stages — {selectedPipeline.name}
                    </p>
                    {selectedPipeline.stages.map((stage, idx) => (
                      <div
                        key={stage.id}
                        className="flex items-center gap-4 px-4 py-4 rounded-xl border border-border/50 bg-card hover:bg-muted/40 transition-colors group"
                      >
                        <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                          {idx + 1}
                        </div>
                        <span className="text-sm font-medium flex-1">{stage.name}</span>
                        <Badge variant="outline" className="text-[10px] hidden group-hover:flex">
                          Stage {idx + 1}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Empty state */
            <div className="flex flex-col items-center justify-center flex-1 gap-4 opacity-40">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                <Layers size={28} className="text-muted-foreground" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-base font-semibold text-muted-foreground">Select a pipeline</p>
                <p className="text-sm text-muted-foreground">Choose a pipeline from the left to view its stages</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Stage Dialog */}
      <Dialog open={addStageOpen} onOpenChange={setAddStageOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Stage</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground -mt-2">
            Adding to: <span className="font-medium text-foreground">{selectedPipeline?.name}</span>
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

      {/* Delete Stage Dialog */}
      <Dialog open={deleteStageOpen} onOpenChange={setDeleteStageOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Stage</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground -mt-2">
            From: <span className="font-medium text-foreground">{selectedPipeline?.name}</span>
          </p>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {selectedPipeline?.stages.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No stages to delete</p>
            ) : (
              selectedPipeline?.stages.map((stage, idx) => (
                <div
                  key={stage.id}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-muted/60 group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-muted-foreground w-5 text-right">{idx + 1}</span>
                    <span className="text-sm font-medium">{stage.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleDeleteStage(stage.id, stage.name)}
                  >
                    <Trash2 size={13} />
                  </Button>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" size="sm">Done</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
