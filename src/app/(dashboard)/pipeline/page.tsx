"use client";

import { useEffect, useState, useCallback } from "react";
import { DashboardNav } from "@/components/dashboard/nav";
import { GHLPipeline } from "@/lib/ghl";
import { getPipelines } from "@/lib/ghl-actions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { RefreshCw, Layers, CheckCircle2, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function PipelinePage() {
  const [pipelines, setPipelines] = useState<GHLPipeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>("");
  const { toast } = useToast();

  // Add Stage dialog state
  const [addStageOpen, setAddStageOpen] = useState(false);
  const [addStagePipelineId, setAddStagePipelineId] = useState<string>("");
  const [newStageName, setNewStageName] = useState("");

  // Delete Stage dialog state
  const [deleteStageOpen, setDeleteStageOpen] = useState(false);
  const [deleteStagePipelineId, setDeleteStagePipelineId] = useState<string>("");

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

  const openAddStage = (pipelineId: string) => {
    setAddStagePipelineId(pipelineId);
    setNewStageName("");
    setAddStageOpen(true);
  };

  const handleAddStage = () => {
    const trimmed = newStageName.trim();
    if (!trimmed) return;
    setPipelines(prev =>
      prev.map(p =>
        p.id === addStagePipelineId
          ? { ...p, stages: [...p.stages, { id: `local-${Date.now()}`, name: trimmed }] }
          : p
      )
    );
    toast({ title: "Stage added", description: `"${trimmed}" has been added.` });
    setAddStageOpen(false);
    setNewStageName("");
  };

  const openDeleteStage = (pipelineId: string) => {
    setDeleteStagePipelineId(pipelineId);
    setDeleteStageOpen(true);
  };

  const handleDeleteStage = (pipelineId: string, stageId: string, stageName: string) => {
    setPipelines(prev =>
      prev.map(p =>
        p.id === pipelineId
          ? { ...p, stages: p.stages.filter(s => s.id !== stageId) }
          : p
      )
    );
    toast({ title: "Stage removed", description: `"${stageName}" has been removed.` });
  };

  const addPipeline = pipelines.find(p => p.id === addStagePipelineId);
  const deletePipeline = pipelines.find(p => p.id === deleteStagePipelineId);

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
                    <li
                      key={pipeline.id}
                      className={cn(
                        "flex items-center transition-colors",
                        isSelected ? "bg-primary" : "hover:bg-muted/50"
                      )}
                    >
                      {/* Pipeline select button */}
                      <button
                        onClick={() => setSelectedPipelineId(pipeline.id)}
                        className="flex-1 flex items-center justify-between px-5 py-4 text-left min-w-0"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {isSelected && (
                            <CheckCircle2 size={16} className="shrink-0 text-primary-foreground" />
                          )}
                          <span className={cn(
                            "text-sm font-medium truncate",
                            isSelected ? "text-primary-foreground" : "text-foreground"
                          )}>
                            {pipeline.name}
                          </span>
                        </div>
                        <Badge
                          className={cn(
                            "text-[10px] font-semibold rounded-md px-2 py-0.5 border-0 ml-3 shrink-0",
                            isSelected
                              ? "bg-white/20 text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {pipeline.stages.length} stage{pipeline.stages.length !== 1 ? "s" : ""}
                        </Badge>
                      </button>

                      {/* 3-dot menu — sits next to the row button, never overlapping */}
                      <div className="pr-3 shrink-0">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className={cn(
                                "h-7 w-7 rounded-md",
                                isSelected
                                  ? "text-primary-foreground hover:bg-white/20 hover:text-primary-foreground"
                                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
                              )}
                            >
                              <MoreHorizontal size={15} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem
                              onClick={() => openAddStage(pipeline.id)}
                              className="gap-2 cursor-pointer"
                            >
                              <Plus size={14} />
                              Add Stage
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => openDeleteStage(pipeline.id)}
                              className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                              disabled={pipeline.stages.length === 0}
                            >
                              <Trash2 size={14} />
                              Delete Stage
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
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
                  {active.stages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-2 py-10 opacity-40">
                      <p className="text-sm font-medium text-muted-foreground">No stages yet</p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-border">
                      {active.stages.map((stage, idx) => (
                        <li key={stage.id} className="flex items-center gap-4 px-5 py-3">
                          <span className="text-xs font-bold text-muted-foreground w-5 text-right shrink-0">
                            {idx + 1}
                          </span>
                          <span className="text-sm font-medium flex-1">{stage.name}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              </div>
            );
          })()}

        </div>
      </main>

      {/* Add Stage Dialog */}
      <Dialog open={addStageOpen} onOpenChange={setAddStageOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Stage</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground -mt-2">
            Adding to: <span className="font-medium text-foreground">{addPipeline?.name}</span>
          </p>
          <div className="space-y-2 pt-1">
            <Input
              placeholder="Stage name"
              value={newStageName}
              onChange={e => setNewStageName(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleAddStage(); }}
              autoFocus
            />
          </div>
          <DialogFooter className="mt-2">
            <DialogClose asChild>
              <Button variant="outline" size="sm">Cancel</Button>
            </DialogClose>
            <Button size="sm" onClick={handleAddStage} disabled={!newStageName.trim()}>
              <Plus size={14} className="mr-1" />
              Add Stage
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
            From: <span className="font-medium text-foreground">{deletePipeline?.name}</span>
          </p>
          <div className="space-y-1 max-h-64 overflow-y-auto pt-1">
            {deletePipeline?.stages.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No stages to delete</p>
            ) : (
              deletePipeline?.stages.map((stage, idx) => (
                <div
                  key={stage.id}
                  className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-muted/60 group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-muted-foreground w-4 text-right">{idx + 1}</span>
                    <span className="text-sm font-medium">{stage.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleDeleteStage(deleteStagePipelineId, stage.id, stage.name)}
                  >
                    <Trash2 size={13} />
                  </Button>
                </div>
              ))
            )}
          </div>
          <DialogFooter className="mt-2">
            <DialogClose asChild>
              <Button variant="outline" size="sm">Done</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
