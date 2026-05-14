"use client";

import { useEffect, useState, useCallback } from "react";
import { DashboardNav } from "@/components/dashboard/nav";
import { ghl, GHLContact } from "@/lib/ghl";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Users, 
  Search, 
  UserPlus,
  Mail,
  Phone,
  MoreVertical,
  Pencil,
  Trash2,
  RefreshCw,
  Loader2,
  CheckCircle2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export default function ContactsPage() {
  const [contacts, setContacts] = useState<GHLContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<GHLContact | null>(null);
  
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [newContact, setNewContact] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: ""
  });

  const { toast } = useToast();

  const fetchContacts = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    
    try {
      const data = await ghl.getContacts(50);
      setContacts(data);
      if (isManual) {
        toast({
          title: "Contacts Synchronized",
          description: "Live GHL V2 contact records refreshed.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Sync Error",
        description: "Failed to fetch records from LeadConnector V2.",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsActionLoading(true);
    try {
      const created = await ghl.createContact(newContact);
      setContacts([created, ...contacts]);
      setIsCreateOpen(false);
      setNewContact({ firstName: "", lastName: "", email: "", phone: "" });
      toast({
        title: "Contact Created",
        description: `${created.firstName} ${created.lastName} added to GHL cloud.`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Creation Failed",
        description: error.message || "Could not push new contact to GHL.",
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContact) return;

    setIsActionLoading(true);
    try {
      const updated = await ghl.updateContact(editingContact.id, {
        firstName: editingContact.firstName,
        lastName: editingContact.lastName,
        email: editingContact.email,
        phone: editingContact.phone,
      });
      
      setContacts(contacts.map(c => c.id === updated.id ? updated : c));
      setIsEditDialogOpen(false);
      toast({
        title: "Contact Updated",
        description: "Metadata synchronized with LeadConnector V2.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Could not push changes to GHL.",
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await ghl.deleteContact(id);
      setContacts(contacts.filter(c => c.id !== id));
      toast({
        title: "Record Purged",
        description: "Contact permanently removed from GHL sub-account.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: "Server rejected the DELETE command.",
      });
    }
  };

  const filteredContacts = contacts.filter(c => {
    const fullName = `${c.firstName || ""} ${c.lastName || ""}`.toLowerCase();
    const email = (c.email || "").toLowerCase();
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) || email.includes(query);
  });

  return (
    <div className="flex min-h-screen bg-background text-foreground overflow-hidden">
      <DashboardNav />
      <main className="flex-1 p-8 overflow-y-auto no-scrollbar relative">
        <div className="absolute top-0 left-0 w-[40%] h-[40%] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="max-w-6xl mx-auto space-y-8 relative z-10">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 animate-in fade-in duration-500">
            <div className="space-y-2">
              <h1 className="text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/40">
                Contacts
              </h1>
              <p className="text-muted-foreground font-medium flex items-center gap-2">
                <Users size={16} className="text-primary" />
                Live contact management • V2 Cloud Sync
              </p>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                size="lg" 
                onClick={() => fetchContacts(true)} 
                disabled={refreshing || loading}
                className="h-12 px-6 rounded-2xl border-white/10 bg-white/[0.03] hover:bg-white/[0.08] backdrop-blur-md font-bold transition-all"
              >
                <RefreshCw className={cn("mr-2 h-4 w-4", refreshing && "animate-spin")} />
                {refreshing ? "Syncing..." : "Sync Contacts"}
              </Button>
              <Button size="lg" className="glow-primary h-12 px-6 rounded-2xl bg-primary hover:bg-primary/90 font-bold transition-all" onClick={() => setIsCreateOpen(true)}>
                <UserPlus className="mr-2 h-5 w-5" /> Add Contact
              </Button>
            </div>
          </header>

          <Card className="glass border-border/40 overflow-hidden group">
            <div className="h-1 w-full bg-gradient-to-r from-primary via-accent to-primary animate-shimmer opacity-20" />
            <CardHeader className="p-8 border-b border-white/5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <CardTitle className="text-2xl font-bold flex items-center gap-3">
                  <CheckCircle2 className="h-6 w-6 text-primary" /> 
                  Global Records ({filteredContacts.length})
                </CardTitle>
                <div className="relative w-full md:w-80">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
                  <Input 
                    placeholder="Search contacts..." 
                    className="glass pl-11 h-11 rounded-xl text-sm border-white/5 focus:ring-primary transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-8 space-y-4">
                  {Array(5).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full rounded-2xl" />
                  ))}
                </div>
              ) : filteredContacts.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-white/5">
                      <TableHead className="px-8 text-[10px] font-bold uppercase tracking-widest opacity-50">Identity</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-widest opacity-50">Communication</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-widest opacity-50">Intelligence</TableHead>
                      <TableHead className="px-8 text-right text-[10px] font-bold uppercase tracking-widest opacity-50">Ops</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredContacts.map((contact, i) => (
                      <TableRow key={contact.id} className="group hover:bg-white/[0.02] border-white/5 transition-all animate-in fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                        <TableCell className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-xs font-bold uppercase border border-primary/20 group-hover:glow-primary transition-all">
                              {(contact.firstName?.[0] || contact.email?.[0] || '?')}{(contact.lastName?.[0] || '')}
                            </div>
                            <div>
                              <p className="font-bold text-sm group-hover:text-primary transition-colors">{contact.firstName || ''} {contact.lastName || ''}</p>
                              <p className="text-[10px] text-muted-foreground font-medium opacity-50">Lead ID: {contact.id.slice(0, 8)}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                              <Mail size={12} className="text-primary/60" />
                              {contact.email}
                            </div>
                            {contact.phone && (
                              <div className="flex items-center gap-2 text-[11px] text-muted-foreground/70">
                                <Phone size={10} className="text-accent/60" />
                                {contact.phone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1.5">
                            {contact.tags?.slice(0, 2).map(tag => (
                              <Badge key={tag} variant="outline" className="text-[9px] py-0 h-5 border-white/10 bg-white/5 uppercase tracking-tighter">{tag}</Badge>
                            ))}
                            {(contact.tags?.length || 0) > 2 && (
                              <span className="text-[10px] text-muted-foreground font-bold">+{contact.tags!.length - 2}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="px-8 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all">
                                <MoreVertical size={18} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 glass border-white/10 rounded-2xl p-2 animate-in slide-in-from-right-2">
                              <DropdownMenuLabel className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest opacity-50">Record Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator className="bg-white/5 mx-2" />
                              <DropdownMenuItem className="rounded-xl px-4 py-2.5 focus:bg-primary/10 cursor-pointer" onClick={() => {
                                setEditingContact({ ...contact });
                                setIsEditDialogOpen(true);
                              }}>
                                <Pencil className="mr-3 h-4 w-4 text-primary" /> Modify record
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="rounded-xl px-4 py-2.5 text-destructive focus:bg-destructive/10 cursor-pointer"
                                onClick={() => handleDelete(contact.id)}
                              >
                                <Trash2 className="mr-3 h-4 w-4" /> Purge from cloud
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="py-40 text-center space-y-6">
                  <div className="w-24 h-24 bg-white/[0.02] border border-white/5 rounded-full flex items-center justify-center mx-auto mb-4 opacity-20">
                    <Users className="h-10 w-10" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-2xl font-bold text-muted-foreground">Reservoir Empty</p>
                    <p className="text-sm text-muted-foreground/60 max-w-[300px] mx-auto leading-relaxed font-medium">No contact records were detected in the GHL synchronicity window.</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Add Contact Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="glass border-white/10 rounded-3xl p-8 max-w-lg">
          <form onSubmit={handleCreate}>
            <DialogHeader className="mb-8">
              <DialogTitle className="text-2xl font-bold">New Contact</DialogTitle>
              <DialogDescription className="text-muted-foreground">Inbound record injection for LeadConnector V2.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold uppercase tracking-widest opacity-60">First Identity</Label>
                  <Input 
                    className="glass h-12 rounded-xl" 
                    placeholder="Alex"
                    value={newContact.firstName} 
                    onChange={(e) => setNewContact({ ...newContact, firstName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold uppercase tracking-widest opacity-60">Last Identity</Label>
                  <Input 
                    className="glass h-12 rounded-xl" 
                    placeholder="Sterling"
                    value={newContact.lastName} 
                    onChange={(e) => setNewContact({ ...newContact, lastName: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] font-bold uppercase tracking-widest opacity-60">Authentication Email</Label>
                <Input 
                  className="glass h-12 rounded-xl" 
                  type="email"
                  placeholder="alex@enterprise.io"
                  value={newContact.email} 
                  onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] font-bold uppercase tracking-widest opacity-60">Signal Number (Phone)</Label>
                <Input 
                  className="glass h-12 rounded-xl" 
                  placeholder="+1 555 000 0000"
                  value={newContact.phone} 
                  onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter className="mt-10">
              <Button type="submit" size="lg" className="w-full h-12 rounded-xl glow-primary font-bold" disabled={isActionLoading}>
                {isActionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BadgeCheck className="mr-2 h-5 w-5" />}
                Commit to Cloud
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Contact Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="glass border-white/10 rounded-3xl p-8 max-w-lg">
          <form onSubmit={handleUpdate}>
            <DialogHeader className="mb-8">
              <DialogTitle className="text-2xl font-bold">Modify Metadata</DialogTitle>
              <DialogDescription className="text-muted-foreground">Override contact record in the GHL V2 repository.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold uppercase tracking-widest opacity-60">First Identity</Label>
                  <Input 
                    className="glass h-12 rounded-xl" 
                    value={editingContact?.firstName || ""} 
                    onChange={(e) => setEditingContact(editingContact ? { ...editingContact, firstName: e.target.value } : null)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold uppercase tracking-widest opacity-60">Last Identity</Label>
                  <Input 
                    className="glass h-12 rounded-xl" 
                    value={editingContact?.lastName || ""} 
                    onChange={(e) => setEditingContact(editingContact ? { ...editingContact, lastName: e.target.value } : null)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] font-bold uppercase tracking-widest opacity-60">Communication Email</Label>
                <Input 
                  className="glass h-12 rounded-xl" 
                  type="email"
                  value={editingContact?.email || ""} 
                  onChange={(e) => setEditingContact(editingContact ? { ...editingContact, email: e.target.value } : null)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] font-bold uppercase tracking-widest opacity-60">Signal Number</Label>
                <Input 
                  className="glass h-12 rounded-xl" 
                  value={editingContact?.phone || ""} 
                  onChange={(e) => setEditingContact(editingContact ? { ...editingContact, phone: e.target.value } : null)}
                />
              </div>
            </div>
            <DialogFooter className="mt-10">
              <Button type="submit" size="lg" className="w-full h-12 rounded-xl glow-primary font-bold" disabled={isActionLoading}>
                {isActionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-5 w-5" />}
                Sync Overwrite
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BadgeCheck({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
