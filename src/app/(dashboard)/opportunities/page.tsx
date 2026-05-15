"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { DashboardNav } from "@/components/dashboard/nav";
import { 
  getOpportunities, 
  updateOpportunity,
  getPipelines,
  getContacts,
  createOpportunity
} from "@/lib/ghl-actions";
import { GHLOpportunity, GHLPipeline, GHLContact } from "@/lib/ghl";
import { 
  Plus, 
  Search, 
  RefreshCw, 
  MoreHorizontal, 
  Loader2, 
  Target,
  TrendingUp,
  Eye,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

type StatusFilter = 'open' | 'won' | 'lost' | 'abandoned' | 'all';

export default function OpportunitiesPage() {
  const [pipelines, setPipelines] = useState<GHLPipeline[]>([]);
  const [opportunities, setOpportunities] = useState<GHLOpportunity[]>([]);
  const [contacts, setContacts] = useState<GHLContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('open');
  
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
    } catch (error) {
      toast({ variant: "destructive", title: "Sync Error", description: "Could not reach LeadConnector cloud." });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast, selectedPipelineId]);

  useEffect(() => {
    fetchData();
  }, []);

  const activePipeline = useMemo(() => 
    pipelines.find(p => p.id === selectedPipelineId) || pipelines[0]
  , [pipelines, selectedPipelineId]);

  const filteredOpps = useMemo(() => {
    return opportunities.filter(o => {
      const matchesSearch = o.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           o.contact?.name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
      const matchesPipeline = !selectedPipelineId || o.pipelineId === selectedPipelineId;
      return matchesSearch && matchesStatus && matchesPipeline;
    });
  }, [opportunities, searchQuery, statusFilter, selectedPipelineId]);

  const statsBreakdown = useMemo(() => {
    const counts = {
      open: opportunities.filter(o => o.status === 'open').length,
      won: opportunities.filter(o => o.status === 'won').length,
      lost: opportunities.filter(o => o.status === 'lost').length,
      abandoned: opportunities.filter(o => o.status === 'abandoned').length,
    };
    return { counts };
  }, [opportunities]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.contactId) {
      toast({ variant: "destructive", title: "Contact Required", description: "GHL requires every opportunity to be linked to a contact. Please select one." });
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

  return (
    <div className="flex min-h-screen bg-background text-foreground overflow-hidden">
      <DashboardNav />
      <main className="flex-1 flex flex-col h-screen relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

        {/* Header */}
        <header className="border-b border-border px-8 pt-8 pb-6 shrink-0 bg-white z-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Opportunities</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Track and manage your deal pipeline</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => fetchData(true)} disabled={refreshing || loading} className="h-9 px-4 rounded-lg">
                <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
                {refreshing ? "Refreshing..." : "Refresh"}
              </Button>
              <Button className="h-9 px-4 rounded-lg bg-primary text-white hover:bg-primary/90" onClick={() => {
                if (activePipeline) {
                  setFormData({
                    name: "",
                    monetaryValue: 0,
                    pipelineId: activePipeline.id,
                    pipelineStageId: activePipeline.stages[0]?.id || "",
                    contactId: "",
                    status: "open"
                  });
                  setIsCreateOpen(true);
                } else {
                  toast({ variant: "destructive", title: "No Active Pipeline", description: "Please select a pipeline before adding opportunities." });
                }
              }}>
                <Plus size={16} className="mr-2" /> New Opportunity
              </Button>
            </div>
          </div>

          {/* Filters bar */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <Select value={selectedPipelineId} onValueChange={setSelectedPipelineId}>
              <SelectTrigger className="w-[240px] h-9 rounded-lg">
                <SelectValue placeholder="Select Pipeline" />
              </SelectTrigger>
              <SelectContent>
                {pipelines.length > 0 ? pipelines.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                )) : (
                  <div className="p-4 text-center text-xs text-muted-foreground">No pipelines detected</div>
                )}
              </SelectContent>
            </Select>

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
              {[
                { id: 'open', label: 'Open' },
                { id: 'won', label: 'Won' },
                { id: 'lost', label: 'Lost' },
                { id: 'abandoned', label: 'Abandoned' },
                { id: 'all', label: 'All' }
              ].map((f) => (
                <Button
                  key={f.id}
                  variant={statusFilter === f.id ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setStatusFilter(f.id as StatusFilter)}
                  className={cn(
                    "h-8 px-3 rounded-lg text-xs font-semibold",
                    statusFilter === f.id ? "bg-primary text-white" : "text-muted-foreground"
                  )}
                >
                  {f.label}
                  <span className={cn(
                    "ml-1.5 text-[10px] font-bold rounded px-1",
                    statusFilter === f.id ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                  )}>
                    {f.id === 'all' ? opportunities.length : statsBreakdown.counts[f.id as keyof typeof statsBreakdown.counts] || 0}
                  </span>
                </Button>
              ))}
            </div>
          </div>
        </header>

        {/* Table */}
        <div className="flex-1 overflow-y-auto p-8">
          {loading ? (
            <div className="space-y-3">
              {Array(6).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : (
            <Card className="border-border rounded-xl overflow-hidden">
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
                  {filteredOpps.length > 0 ? (
                    filteredOpps.map((opp) => (
                      <TableRow key={opp.id} className="border-border hover:bg-muted/30 transition-colors">
                        <TableCell className="px-6 py-4">
                          <div>
                            <p className="text-sm font-semibold">{opp.name}</p>
                            <p className="text-[10px] text-muted-foreground font-mono mt-0.5">#{opp.id.slice(0, 12)}</p>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[11px] font-bold shrink-0">
                              {opp.contact?.name?.[0]?.toUpperCase() || 'L'}
                            </div>
                            <span className="text-sm text-muted-foreground">{opp.contact?.name || '—'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 text-right">
                          <span className="text-sm font-semibold text-emerald-600">
                            ${opp.monetaryValue?.toLocaleString() || '0'}
                          </span>
                        </TableCell>
                        <TableCell className="py-4">
                          <span className="text-xs text-muted-foreground">
                            {activePipeline?.stages.find(s => s.id === opp.pipelineStageId)?.name || '—'}
                          </span>
                        </TableCell>
                        <TableCell className="py-4 text-center">
                          <Badge 
                            className={cn(
                              "text-[10px] font-semibold px-2 py-0.5 rounded-md capitalize border",
                              opp.status === 'won' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                              opp.status === 'lost' ? "bg-red-50 text-red-600 border-red-200" :
                              opp.status === 'abandoned' ? "bg-amber-50 text-amber-700 border-amber-200" :
                              "bg-blue-50 text-blue-700 border-blue-200"
                            )}
                          >
                            {opp.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-4 text-right px-6">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-muted">
                              <Eye size={14} />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-red-50 hover:text-red-600">
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-64 text-center">
                        <div className="flex flex-col items-center justify-center gap-3 opacity-40">
                          <Target size={36} className="text-muted-foreground" />
                          <div>
                            <p className="text-sm font-semibold text-muted-foreground">No opportunities found</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Try changing the pipeline or status filter</p>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          )}
        </div>
      </main>

      {/* New Opportunity Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <form onSubmit={handleCreate}>
            <DialogHeader className="mb-6">
              <DialogTitle className="text-xl font-bold">New Opportunity</DialogTitle>
              <DialogDescription className="text-muted-foreground text-sm">
                Add a deal to your GHL pipeline.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Deal Name</Label>
                <Input 
                  placeholder="e.g. Enterprise Package"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="h-10 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Value ($)</Label>
                  <Input 
                    type="number"
                    placeholder="0"
                    value={formData.monetaryValue || ""}
                    onChange={(e) => setFormData({ ...formData, monetaryValue: parseFloat(e.target.value) || 0 })}
                    className="h-10 rounded-lg"
                  />
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
                    {pipelines.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
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
