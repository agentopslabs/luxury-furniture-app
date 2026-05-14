"use client";

import { useEffect, useState, useCallback } from "react";
import { DashboardNav } from "@/components/dashboard/nav";
import { 
  getOpportunities, 
  updateOpportunityStatus, 
  deleteOpportunity, 
  createOpportunity, 
  updateOpportunity,
  getPipelines,
  getContacts
} from "@/lib/ghl-actions";
import { GHLOpportunity, GHLPipeline, GHLContact } from "@/lib/ghl";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Target, 
  RefreshCw, 
  DollarSign, 
  User, 
  BadgeCheck, 
  MoreVertical,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Plus,
  Trash2,
  Pencil,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<GHLOpportunity[]>([]);
  const [pipelines, setPipelines] = useState<GHLPipeline[]>([]);
  const [contacts, setContacts] = useState<GHLContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Create/Edit States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [selectedOpp, setSelectedOpp] = useState<GHLOpportunity | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    monetaryValue: 0,
    pipelineId: "",
    pipelineStageId: "",
    contactId: "",
    status: "open" as any
  });

  const { toast } = useToast();

  const fetchData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const [opps, pipes, conts] = await Promise.all([
        getOpportunities(),
        getPipelines(),
        getContacts(100)
      ]);
      setOpportunities(opps);
      setPipelines(pipes);
      setContacts(conts);
      
      if (isManual) {
        toast({
          title: "Data Synchronized",
          description: "Successfully updated records from LeadConnector V2.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Sync Error",
        description: "Could not reach LeadConnector V2 server.",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsActionLoading(true);
    try {
      await createOpportunity(formData);
      setIsCreateOpen(false);
      toast({ title: "Created", description: "Opportunity added to GHL." });
      fetchData(true);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not create record." });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOpp) return;
    setIsActionLoading(true);
    try {
      await updateOpportunity(selectedOpp.id, formData);
      setIsEditOpen(false);
      toast({ title: "Updated", description: "Record synced with GHL." });
      fetchData(true);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Update failed." });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteOpportunity(id);
      setOpportunities(prev => prev.filter(o => o.id !== id));
      toast({ title: "Deleted", description: "Opportunity removed from GHL." });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Delete failed." });
    }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await updateOpportunityStatus(id, status);
      setOpportunities(prev => prev.map(o => o.id === id ? { ...o, status: status as any } : o));
      toast({ title: "Status Changed", description: `Marked as ${status}.` });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Status update failed." });
    }
  };

  const filtered = opportunities.filter(o => 
    o.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.contact?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardNav />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-8">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-4xl font-bold tracking-tight">Opportunities</h1>
              <p className="text-muted-foreground">Full CRUD synchronization with GHL V2 deals.</p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => fetchData(true)} 
                disabled={loading || refreshing}
              >
                <RefreshCw className={cn("mr-2 h-4 w-4", refreshing && "animate-spin")} />
                Sync
              </Button>
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" onClick={() => setFormData({ name: "", monetaryValue: 0, pipelineId: pipelines[0]?.id || "", pipelineStageId: pipelines[0]?.stages[0]?.id || "", contactId: "", status: "open" })}>
                    <Plus className="mr-2 h-4 w-4" /> New Opportunity
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={handleCreate}>
                    <DialogHeader>
                      <DialogTitle>Create Opportunity</DialogTitle>
                      <DialogDescription>Add a new deal to your LeadConnector pipeline.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label>Deal Name</Label>
                        <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Value ($)</Label>
                          <Input type="number" value={formData.monetaryValue} onChange={e => setFormData({ ...formData, monetaryValue: Number(e.target.value) })} />
                        </div>
                        <div className="space-y-2">
                          <Label>Contact</Label>
                          <Select onValueChange={val => setFormData({ ...formData, contactId: val })}>
                            <SelectTrigger><SelectValue placeholder="Select contact" /></SelectTrigger>
                            <SelectContent>
                              {contacts.map(c => <SelectItem key={c.id} value={c.id}>{c.firstName} {c.lastName}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Pipeline</Label>
                        <Select value={formData.pipelineId} onValueChange={val => setFormData({ ...formData, pipelineId: val, pipelineStageId: pipelines.find(p => p.id === val)?.stages[0]?.id || "" })}>
                          <SelectTrigger><SelectValue placeholder="Select pipeline" /></SelectTrigger>
                          <SelectContent>
                            {pipelines.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={isActionLoading}>
                        {isActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create Deal
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </header>

          <Card className="glass border-border/40">
            <CardHeader className="pb-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" /> 
                  Live Deal Flow ({filtered.length})
                </CardTitle>
                <div className="relative w-full md:w-72">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search deals..." 
                    className="pl-9 h-9 text-xs"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
                </div>
              ) : filtered.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {filtered.map((opp) => (
                    <div 
                      key={opp.id} 
                      className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-card/40 hover:bg-card/60 transition-all group animate-in fade-in slide-in-from-bottom-2"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                          {opp.name?.[0] || 'O'}
                        </div>
                        <div className="space-y-1">
                          <p className="font-bold text-sm">{opp.name}</p>
                          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                            <span className="flex items-center gap-1"><User size={12} className="opacity-50" /> {opp.contact?.name || 'Unknown'}</span>
                            <span className="flex items-center gap-1 font-mono text-emerald-500 font-bold"><DollarSign size={12} /> {(opp.monetaryValue || 0).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <Badge variant={opp.status === 'open' ? 'default' : 'secondary'} className={cn("capitalize text-[10px] h-5", opp.status === 'won' && "bg-emerald-500/10 text-emerald-500", opp.status === 'lost' && "bg-destructive/10 text-destructive")}>
                          {opp.status}
                        </Badge>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical size={16} /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => {
                              setSelectedOpp(opp);
                              setFormData({
                                name: opp.name,
                                monetaryValue: opp.monetaryValue || 0,
                                pipelineId: opp.pipelineId,
                                pipelineStageId: opp.pipelineStageId,
                                contactId: opp.contact?.id || "",
                                status: opp.status
                              });
                              setIsEditOpen(true);
                            }}>
                              <Pencil className="mr-2 h-4 w-4" /> Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleStatusUpdate(opp.id, 'won')}><CheckCircle className="mr-2 h-4 w-4 text-emerald-500" /> Mark Won</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusUpdate(opp.id, 'lost')}><XCircle className="mr-2 h-4 w-4 text-destructive" /> Mark Lost</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(opp.id)}><Trash2 className="mr-2 h-4 w-4" /> Delete Opportunity</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-24 text-center space-y-4 border rounded-xl border-dashed bg-muted/20">
                  <Target className="h-12 w-12 mx-auto text-muted-foreground opacity-20" />
                  <p className="text-sm text-muted-foreground">No opportunities found.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <form onSubmit={handleUpdate}>
            <DialogHeader>
              <DialogTitle>Edit Opportunity</DialogTitle>
              <DialogDescription>Sync changes to LeadConnector V2.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Deal Name</Label>
                <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Monetary Value</Label>
                <Input type="number" value={formData.monetaryValue} onChange={e => setFormData({ ...formData, monetaryValue: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={val => setFormData({ ...formData, status: val as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="won">Won</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                    <SelectItem value="abandoned">Abandoned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isActionLoading}>
                {isActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
