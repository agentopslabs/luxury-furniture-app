"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { DashboardNav } from "@/components/dashboard/nav";
import { 
  getOpportunities, 
  getPipelines,
  getContacts,
  createOpportunity,
  updateOpportunity
} from "@/lib/ghl-actions";
import { GHLOpportunity, GHLPipeline, GHLContact } from "@/lib/ghl";
import { 
  Plus, 
  Search, 
  RefreshCw, 
  Loader2, 
  Target,
  TrendingUp,
  Eye,
  Trash2,
  Layers,
  LayoutList,
  Columns
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
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
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

type StatusFilter = 'open' | 'won' | 'lost' | 'abandoned' | 'all';
type ViewMode = 'list' | 'kanban';

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-600",
  "bg-purple-100 text-purple-600",
  "bg-emerald-100 text-emerald-600",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-600",
  "bg-cyan-100 text-cyan-600",
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function OpportunitiesPage() {
  const [pipelines, setPipelines] = useState<GHLPipeline[]>([]);
  const [opportunities, setOpportunities] = useState<GHLOpportunity[]>([]);
  const [contacts, setContacts] = useState<GHLContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('open');
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');

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
        toast({ title: "Deal Flow Synced", description: `Synchronized ${opps.length} records across ${pipes.length} pipelines.` });
      }
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Could not load opportunities. Please try again." });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast, selectedPipelineId]);

  useEffect(() => { fetchData(); }, []);

  const activePipeline = useMemo(() =>
    pipelines.find(p => p.id === selectedPipelineId) || pipelines[0]
  , [pipelines, selectedPipelineId]);

  const kanbanData = useMemo(() => {
    if (!activePipeline) return [];
    return activePipeline.stages.map(stage => ({
      ...stage,
      opps: opportunities.filter(o => o.pipelineStageId === stage.id && o.pipelineId === activePipeline.id)
    }));
  }, [activePipeline, opportunities]);

  const filteredOpps = useMemo(() => {
    return opportunities.filter(o => {
      const matchesSearch = o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           o.contact?.name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
      const matchesPipeline = !selectedPipelineId || o.pipelineId === selectedPipelineId;
      return matchesSearch && matchesStatus && matchesPipeline;
    });
  }, [opportunities, searchQuery, statusFilter, selectedPipelineId]);

  const statsBreakdown = useMemo(() => ({
    counts: {
      open: opportunities.filter(o => o.status === 'open').length,
      won: opportunities.filter(o => o.status === 'won').length,
      lost: opportunities.filter(o => o.status === 'lost').length,
      abandoned: opportunities.filter(o => o.status === 'abandoned').length,
    }
  }), [opportunities]);

  const handleOpenCreate = (stageId?: string) => {
    if (activePipeline) {
      setFormData({
        name: "",
        monetaryValue: 0,
        pipelineId: activePipeline.id,
        pipelineStageId: stageId || activePipeline.stages[0]?.id || "",
        contactId: "",
        status: "open"
      });
      setIsCreateOpen(true);
    } else {
      toast({ variant: "destructive", title: "No Active Pipeline", description: "Please select a pipeline." });
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.contactId) {
      toast({ variant: "destructive", title: "Contact Required", description: "Please select a contact." });
      return;
    }
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

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newStageId = destination.droppableId;
    const oppId = draggableId;

    // Optimistic update in UI
    setOpportunities(prev =>
      prev.map(o => o.id === oppId ? { ...o, pipelineStageId: newStageId } : o)
    );

    try {
      await updateOpportunity(oppId, { pipelineStageId: newStageId });
    } catch {
      toast({ variant: "destructive", title: "Move Failed", description: "Could not update deal stage. Reverting." });
      fetchData();
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f5f6fa] text-foreground overflow-hidden">
      <DashboardNav />
      <main className="flex-1 flex flex-col h-screen relative overflow-hidden">

        {/* Header */}
        <header className="border-b border-border px-8 pt-7 pb-5 shrink-0 bg-white z-10">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Opportunities</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Track and manage your deal pipeline</p>
            </div>
            <div className="flex items-center gap-3">
              {/* View Toggle */}
              <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={cn(
                    "h-7 px-3 rounded-md text-xs font-semibold gap-1.5",
                    viewMode === 'list' ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <LayoutList size={13} /> List
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode('kanban')}
                  className={cn(
                    "h-7 px-3 rounded-md text-xs font-semibold gap-1.5",
                    viewMode === 'kanban' ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Columns size={13} /> Kanban
                </Button>
              </div>

              <Button variant="outline" size="sm" onClick={() => fetchData(true)} disabled={refreshing || loading} className="h-9 px-4 rounded-lg">
                <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
                {refreshing ? "Refreshing..." : "Refresh"}
              </Button>
              <Button className="h-9 px-4 rounded-lg bg-primary text-white hover:bg-primary/90" onClick={() => handleOpenCreate()}>
                <Plus size={16} className="mr-2" /> New Opportunity
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <Select value={selectedPipelineId} onValueChange={setSelectedPipelineId}>
              <SelectTrigger className="w-[220px] h-9 rounded-lg">
                <SelectValue placeholder="Select Pipeline" />
              </SelectTrigger>
              <SelectContent>
                {pipelines.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {viewMode === 'list' && (
              <>
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search opportunities..."
                    className="pl-9 h-9 rounded-lg text-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-1 ml-auto">
                  {(['open','won','lost','abandoned','all'] as const).map((f) => (
                    <Button
                      key={f}
                      variant={statusFilter === f ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setStatusFilter(f)}
                      className={cn(
                        "h-8 px-3 rounded-lg text-xs font-semibold capitalize",
                        statusFilter === f ? "bg-primary text-white" : "text-muted-foreground"
                      )}
                    >
                      {f}
                      <span className={cn(
                        "ml-1.5 text-[10px] font-bold rounded px-1",
                        statusFilter === f ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                      )}>
                        {f === 'all' ? opportunities.length : statsBreakdown.counts[f] || 0}
                      </span>
                    </Button>
                  ))}
                </div>
              </>
            )}
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {viewMode === 'list' ? (
            /* ── LIST VIEW ── */
            <div className="h-full overflow-y-auto p-8">
              {loading ? (
                <div className="space-y-3">
                  {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
                </div>
              ) : (
                <Card className="border-border rounded-xl overflow-hidden bg-white">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow className="border-border hover:bg-transparent">
                        <TableHead className="text-xs font-semibold text-muted-foreground px-6 py-3 w-[30%]">Opportunity</TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground py-3">Contact</TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground py-3 text-right">Value</TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground py-3">Stage</TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground py-3 text-center">Status</TableHead>
                        <TableHead className="text-right text-xs font-semibold text-muted-foreground px-6 py-3">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOpps.length > 0 ? filteredOpps.map((opp) => (
                        <TableRow key={opp.id} className="border-border hover:bg-muted/30 transition-colors">
                          <TableCell className="px-6 py-4">
                            <div>
                              <p className="text-sm font-semibold">{opp.name}</p>
                              <p className="text-[10px] text-muted-foreground font-mono mt-0.5">#{opp.id.slice(0, 12)}</p>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex items-center gap-2.5">
                              <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0", getAvatarColor(opp.contact?.name || 'L'))}>
                                {opp.contact?.name?.[0]?.toUpperCase() || 'L'}
                              </div>
                              <span className="text-sm text-muted-foreground">{opp.contact?.name || '—'}</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-4 text-right">
                            <span className="text-sm font-semibold text-emerald-600">${opp.monetaryValue?.toLocaleString() || '0'}</span>
                          </TableCell>
                          <TableCell className="py-4">
                            <span className="text-xs text-muted-foreground">
                              {activePipeline?.stages.find(s => s.id === opp.pipelineStageId)?.name || '—'}
                            </span>
                          </TableCell>
                          <TableCell className="py-4 text-center">
                            <Badge className={cn(
                              "text-[10px] font-semibold px-2 py-0.5 rounded-md capitalize border",
                              opp.status === 'won' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                              opp.status === 'lost' ? "bg-red-50 text-red-600 border-red-200" :
                              opp.status === 'abandoned' ? "bg-amber-50 text-amber-700 border-amber-200" :
                              "bg-blue-50 text-blue-700 border-blue-200"
                            )}>
                              {opp.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-4 text-right px-6">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-muted"><Eye size={14} /></Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-red-50 hover:text-red-600"><Trash2 size={14} /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )) : (
                        <TableRow>
                          <TableCell colSpan={6} className="h-64 text-center">
                            <div className="flex flex-col items-center justify-center gap-3 opacity-40">
                              <Target size={36} className="text-muted-foreground" />
                              <p className="text-sm font-semibold text-muted-foreground">No opportunities found</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </Card>
              )}
            </div>
          ) : (
            /* ── KANBAN VIEW ── */
            <ScrollArea className="h-full w-full">
              <div className="flex gap-5 p-6 min-w-full items-start">
                {loading ? (
                  Array(4).fill(0).map((_, i) => (
                    <div key={i} className="w-72 shrink-0 space-y-4">
                      <Skeleton className="h-8 w-full rounded-lg" />
                      <Skeleton className="h-40 w-full rounded-xl" />
                      <Skeleton className="h-40 w-full rounded-xl" />
                    </div>
                  ))
                ) : (
                  <DragDropContext onDragEnd={handleDragEnd}>
                    {kanbanData.map((stage) => {
                      const stageTotal = stage.opps.reduce((acc, o) => acc + (o.monetaryValue || 0), 0);
                      return (
                        <div key={stage.id} className="w-72 shrink-0 flex flex-col">
                          {/* Stage header */}
                          <div className="flex items-center justify-between mb-3 px-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                                {stage.name}
                              </span>
                              <span className="text-[11px] font-bold text-muted-foreground">
                                {stage.opps.length}
                              </span>
                            </div>
                            <span className="text-sm font-bold text-emerald-500">
                              ${stageTotal.toLocaleString()}
                            </span>
                          </div>

                          {/* Drop zone */}
                          <Droppable droppableId={stage.id}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className={cn(
                                  "flex-1 min-h-[200px] flex flex-col gap-3 rounded-xl p-2 transition-colors",
                                  snapshot.isDraggingOver ? "bg-primary/5" : "bg-transparent"
                                )}
                              >
                                {stage.opps.map((opp, index) => {
                                  const contactName = opp.contact?.name || 'Anonymous';
                                  const initial = contactName[0]?.toLowerCase() || 'a';
                                  const avatarColor = getAvatarColor(contactName);
                                  return (
                                    <Draggable key={opp.id} draggableId={opp.id} index={index}>
                                      {(provided, snapshot) => (
                                        <div
                                          ref={provided.innerRef}
                                          {...provided.draggableProps}
                                          {...provided.dragHandleProps}
                                          className={cn(
                                            "bg-white rounded-2xl border border-border p-5 select-none transition-shadow",
                                            snapshot.isDragging ? "shadow-xl rotate-1" : "shadow-sm hover:shadow-md"
                                          )}
                                        >
                                          <h4 className="font-bold text-base text-foreground mb-4 leading-snug">
                                            {opp.name}
                                          </h4>
                                          <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                              <div className={cn(
                                                "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                                                avatarColor
                                              )}>
                                                {initial}
                                              </div>
                                              <span className="text-sm text-muted-foreground">{contactName}</span>
                                            </div>
                                            <span className="text-sm font-bold text-emerald-500">
                                              ${opp.monetaryValue?.toLocaleString() || '0'}
                                            </span>
                                          </div>
                                        </div>
                                      )}
                                    </Draggable>
                                  );
                                })}

                                {provided.placeholder}

                                {stage.opps.length === 0 && !snapshot.isDraggingOver && (
                                  <div className="h-24 border border-dashed border-border rounded-xl flex items-center justify-center opacity-30">
                                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Empty</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </Droppable>

                          {/* Add deal */}
                          <Button
                            variant="ghost"
                            onClick={() => handleOpenCreate(stage.id)}
                            className="mt-2 w-full h-9 rounded-xl border border-dashed border-border text-muted-foreground hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all group text-xs font-semibold"
                          >
                            <Plus size={13} className="mr-1.5" /> Add Deal
                          </Button>
                        </div>
                      );
                    })}

                    {kanbanData.length === 0 && (
                      <div className="flex-1 flex flex-col items-center justify-center gap-4 py-32 opacity-30">
                        <Layers className="h-14 w-14 text-muted-foreground" />
                        <p className="text-sm font-medium text-muted-foreground">No active deal flows detected.</p>
                      </div>
                    )}
                  </DragDropContext>
                )}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          )}
        </div>
      </main>

      {/* New Opportunity Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <form onSubmit={handleCreate}>
            <DialogHeader className="mb-6">
              <DialogTitle className="text-xl font-bold">New Opportunity</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">Add a deal to your GHL pipeline.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Deal Name</Label>
                <Input placeholder="e.g. Enterprise Package" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className="h-10 rounded-lg" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Value ($)</Label>
                  <Input type="number" placeholder="0" value={formData.monetaryValue || ""} onChange={(e) => setFormData({ ...formData, monetaryValue: parseFloat(e.target.value) || 0 })} className="h-10 rounded-lg" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</Label>
                  <Select value={formData.status} onValueChange={(v: any) => setFormData({ ...formData, status: v })}>
                    <SelectTrigger className="h-10 rounded-lg"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="won">Won</SelectItem>
                      <SelectItem value="lost">Lost</SelectItem>
                      <SelectItem value="abandoned">Abandoned</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Contact</Label>
                <Select value={formData.contactId} onValueChange={(v) => setFormData({ ...formData, contactId: v })}>
                  <SelectTrigger className="h-10 rounded-lg"><SelectValue placeholder="Select a contact" /></SelectTrigger>
                  <SelectContent>
                    {contacts.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.firstName} {c.lastName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Pipeline</Label>
                <Select value={formData.pipelineId} onValueChange={(v) => {
                  const pipe = pipelines.find(p => p.id === v);
                  setFormData({ ...formData, pipelineId: v, pipelineStageId: pipe?.stages[0]?.id || "" });
                }}>
                  <SelectTrigger className="h-10 rounded-lg"><SelectValue placeholder="Select pipeline" /></SelectTrigger>
                  <SelectContent>
                    {pipelines.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {formData.pipelineId && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Stage</Label>
                  <Select value={formData.pipelineStageId} onValueChange={(v) => setFormData({ ...formData, pipelineStageId: v })}>
                    <SelectTrigger className="h-10 rounded-lg"><SelectValue placeholder="Select stage" /></SelectTrigger>
                    <SelectContent>
                      {pipelines.find(p => p.id === formData.pipelineId)?.stages.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} className="rounded-lg">Cancel</Button>
              <Button type="submit" disabled={isActionLoading} className="rounded-lg bg-primary text-white hover:bg-primary/90">
                {isActionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <TrendingUp size={15} className="mr-2" />}
                Create Opportunity
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
