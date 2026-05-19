
"use client";

import { useEffect, useState, useCallback } from "react";
import { DashboardNav } from "@/components/dashboard/nav";
import { ghl, GHLContact } from "@/lib/ghl";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Users, Search, UserPlus, Mail, Phone, MoreVertical, Pencil, Trash2,
  RefreshCw, Loader2, CheckCircle2, MessageSquare, Send, Star,
  Download, ChevronDown, X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function ContactsPage() {
  const [contacts, setContacts] = useState<GHLContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [editContact, setEditContact] = useState<GHLContact | null>(null);
  const [editFields, setEditFields] = useState({ firstName: "", lastName: "", email: "", phone: "", tags: "" });
  const [editSaving, setEditSaving] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [addFields, setAddFields] = useState({ firstName: "", lastName: "", email: "", phone: "" });
  const [addSaving, setAddSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<GHLContact | null>(null);
  const [deleteConfirming, setDeleteConfirming] = useState(false);

  const { toast } = useToast();

  const fetchContacts = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await ghl.getContacts(50);
      setContacts(data);
      if (isManual) toast({ title: "Contacts refreshed" });
    } catch {
      toast({ variant: "destructive", title: "Failed to load contacts" });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast]);

  useEffect(() => { fetchContacts(); }, [fetchContacts]);

  const filteredContacts = contacts.filter(c => {
    const q = searchQuery.toLowerCase();
    return (
      `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
      (c.email || "").toLowerCase().includes(q) ||
      (c.phone || "").toLowerCase().includes(q)
    );
  });

  const openEdit = (c: GHLContact) => {
    setEditContact(c);
    setEditFields({
      firstName: c.firstName || "",
      lastName: c.lastName || "",
      email: c.email || "",
      phone: c.phone || "",
      tags: (c.tags || []).join(", "),
    });
  };

  const handleEditSave = async () => {
    if (!editContact) return;
    setEditSaving(true);
    try {
      const tags = editFields.tags.split(",").map(t => t.trim()).filter(Boolean);
      const updated = await ghl.updateContact(editContact.id, {
        firstName: editFields.firstName,
        lastName: editFields.lastName,
        email: editFields.email,
        phone: editFields.phone,
        tags,
      });
      setContacts(cs => cs.map(c => c.id === updated.id ? updated : c));
      setEditContact(null);
      toast({ title: "Contact updated" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Update failed", description: err.message });
    } finally {
      setEditSaving(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddSaving(true);
    try {
      const created = await ghl.createContact(addFields);
      setContacts(cs => [created, ...cs]);
      setAddOpen(false);
      setAddFields({ firstName: "", lastName: "", email: "", phone: "" });
      toast({ title: "Contact added" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Failed to add contact", description: err.message });
    } finally {
      setAddSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteConfirming(true);
    try {
      await ghl.deleteContact(deleteTarget.id);
      setContacts(cs => cs.filter(c => c.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast({ title: "Contact deleted" });
    } catch {
      toast({ variant: "destructive", title: "Delete failed" });
    } finally {
      setDeleteConfirming(false);
    }
  };

  const exportCSV = () => {
    const rows = [["Name", "Email", "Phone", "Tags"]];
    filteredContacts.forEach(c => {
      rows.push([
        `${c.firstName || ""} ${c.lastName || ""}`.trim(),
        c.email || "",
        c.phone || "",
        (c.tags || []).join("; "),
      ]);
    });
    const csv = rows.map(r => r.map(v => `"${v.replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    a.download = "contacts.csv";
    a.click();
  };

  const avatarLetters = (c: GHLContact) =>
    `${c.firstName?.[0] || ""}${c.lastName?.[0] || ""}`.toUpperCase() || c.email?.[0]?.toUpperCase() || "?";

  return (
    <div className="flex min-h-screen bg-background text-foreground overflow-hidden">
      <DashboardNav />
      <main className="flex-1 overflow-y-auto no-scrollbar">

        {/* Header */}
        <div className="px-8 pt-8 pb-4 border-b border-border flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Contacts</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{contacts.length} contacts</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => fetchContacts(true)} disabled={refreshing || loading} className="h-9 rounded-lg">
              <RefreshCw size={14} className={cn("mr-1.5", refreshing && "animate-spin")} />
              {refreshing ? "Refreshing…" : "Refresh"}
            </Button>
            <Button size="sm" className="h-9 rounded-lg bg-primary hover:bg-primary/90" onClick={() => setAddOpen(true)}>
              <UserPlus size={14} className="mr-1.5" /> Add Contact
            </Button>
          </div>
        </div>

        <div className="px-8 py-6 space-y-4">

          {/* Search + Toolbar */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search contacts…"
                className="pl-9 h-9 rounded-lg text-sm"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Export */}
            <Button variant="outline" size="sm" className="h-9 rounded-lg gap-1.5" onClick={exportCSV}>
              <Download size={14} /> Export
            </Button>

            {/* More dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 rounded-lg gap-1">
                  More <ChevronDown size={13} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-44 rounded-xl shadow-xl">
                <DropdownMenuItem className="gap-2 text-sm cursor-pointer" onClick={() => toast({ title: "Send SMS", description: "Select a contact to send SMS." })}>
                  <MessageSquare size={13} className="text-muted-foreground" /> Send SMS
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 text-sm cursor-pointer" onClick={() => toast({ title: "Send Email", description: "Select a contact to send email." })}>
                  <Mail size={13} className="text-muted-foreground" /> Send Email
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 text-sm cursor-pointer" onClick={() => toast({ title: "Send WhatsApp", description: "Select a contact to send WhatsApp." })}>
                  <Send size={13} className="text-muted-foreground" /> Send WhatsApp
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="gap-2 text-sm cursor-pointer" onClick={() => toast({ title: "Request Review", description: "Select a contact to request a review." })}>
                  <Star size={13} className="text-muted-foreground" /> Request Review
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Table */}
          <div className="rounded-xl border border-border overflow-hidden bg-card">
            {loading ? (
              <div className="p-6 space-y-3">
                {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
              </div>
            ) : filteredContacts.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border">
                    <TableHead className="pl-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Contact Name</TableHead>
                    <TableHead className="py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Email</TableHead>
                    <TableHead className="py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Phone</TableHead>
                    <TableHead className="py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Tags</TableHead>
                    <TableHead className="py-3 pr-4 w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContacts.map((c, i) => (
                    <TableRow key={c.id} className="group border-border hover:bg-muted/40 transition-colors" style={{ animationDelay: `${i * 30}ms` }}>

                      {/* Contact Name */}
                      <TableCell className="pl-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {avatarLetters(c)}
                          </div>
                          <span className="text-sm font-medium">
                            {[c.firstName, c.lastName].filter(Boolean).join(" ") || <span className="text-muted-foreground">—</span>}
                          </span>
                        </div>
                      </TableCell>

                      {/* Email */}
                      <TableCell className="py-3">
                        {c.email ? (
                          <span className="text-sm text-muted-foreground">{c.email}</span>
                        ) : (
                          <span className="text-muted-foreground/40 text-sm">—</span>
                        )}
                      </TableCell>

                      {/* Phone */}
                      <TableCell className="py-3">
                        {c.phone ? (
                          <span className="text-sm text-muted-foreground">{c.phone}</span>
                        ) : (
                          <span className="text-muted-foreground/40 text-sm">—</span>
                        )}
                      </TableCell>

                      {/* Tags */}
                      <TableCell className="py-3">
                        <div className="flex flex-wrap gap-1">
                          {c.tags?.slice(0, 2).map(tag => (
                            <Badge key={tag} variant="secondary" className="text-[10px] h-5 px-1.5 rounded-md">{tag}</Badge>
                          ))}
                          {(c.tags?.length || 0) > 2 && (
                            <span className="text-[11px] text-muted-foreground">+{c.tags!.length - 2}</span>
                          )}
                          {(!c.tags || c.tags.length === 0) && (
                            <span className="text-muted-foreground/40 text-sm">—</span>
                          )}
                        </div>
                      </TableCell>

                      {/* 3-dot menu */}
                      <TableCell className="py-3 pr-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                              <MoreVertical size={15} />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-36 rounded-xl shadow-xl">
                            <DropdownMenuItem
                              className="gap-2 text-sm cursor-pointer"
                              onClick={() => openEdit(c)}
                            >
                              <Pencil size={13} className="text-muted-foreground" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="gap-2 text-sm cursor-pointer text-destructive focus:text-destructive"
                              onClick={() => setDeleteTarget(c)}
                            >
                              <Trash2 size={13} /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-24 text-center">
                <Users className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No contacts found</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ── Edit Contact Modal ── */}
      {editContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !editSaving && setEditContact(null)} />
          <div className="relative bg-background rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <span className="text-sm font-bold">Edit Contact</span>
              <button onClick={() => setEditContact(null)} disabled={editSaving} className="text-muted-foreground hover:text-foreground">
                <X size={16} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">First Name</label>
                  <Input value={editFields.firstName} onChange={e => setEditFields(f => ({ ...f, firstName: e.target.value }))} className="h-9 rounded-lg" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Last Name</label>
                  <Input value={editFields.lastName} onChange={e => setEditFields(f => ({ ...f, lastName: e.target.value }))} className="h-9 rounded-lg" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Email</label>
                <Input type="email" value={editFields.email} onChange={e => setEditFields(f => ({ ...f, email: e.target.value }))} className="h-9 rounded-lg" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Phone</label>
                <Input value={editFields.phone} onChange={e => setEditFields(f => ({ ...f, phone: e.target.value }))} className="h-9 rounded-lg" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tags <span className="normal-case font-normal">(comma separated)</span></label>
                <Input value={editFields.tags} onChange={e => setEditFields(f => ({ ...f, tags: e.target.value }))} placeholder="new-lead, vip, follow-up" className="h-9 rounded-lg" />
              </div>
            </div>
            <div className="flex gap-2 px-5 pb-5">
              <button onClick={() => setEditContact(null)} disabled={editSaving} className="flex-1 h-9 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors">
                Cancel
              </button>
              <button onClick={handleEditSave} disabled={editSaving} className="flex-1 h-9 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
                {editSaving && <Loader2 size={13} className="animate-spin" />}
                {editSaving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Contact Modal ── */}
      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !addSaving && setAddOpen(false)} />
          <div className="relative bg-background rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <span className="text-sm font-bold">Add Contact</span>
              <button onClick={() => setAddOpen(false)} disabled={addSaving} className="text-muted-foreground hover:text-foreground">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleAdd}>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">First Name</label>
                    <Input required value={addFields.firstName} onChange={e => setAddFields(f => ({ ...f, firstName: e.target.value }))} className="h-9 rounded-lg" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Last Name</label>
                    <Input required value={addFields.lastName} onChange={e => setAddFields(f => ({ ...f, lastName: e.target.value }))} className="h-9 rounded-lg" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Email</label>
                  <Input type="email" required value={addFields.email} onChange={e => setAddFields(f => ({ ...f, email: e.target.value }))} className="h-9 rounded-lg" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Phone</label>
                  <Input value={addFields.phone} onChange={e => setAddFields(f => ({ ...f, phone: e.target.value }))} className="h-9 rounded-lg" />
                </div>
              </div>
              <div className="flex gap-2 px-5 pb-5">
                <button type="button" onClick={() => setAddOpen(false)} disabled={addSaving} className="flex-1 h-9 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={addSaving} className="flex-1 h-9 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
                  {addSaving && <Loader2 size={13} className="animate-spin" />}
                  {addSaving ? "Adding…" : "Add Contact"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !deleteConfirming && setDeleteTarget(null)} />
          <div className="relative bg-background rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                <Trash2 size={20} className="text-destructive" />
              </div>
              <h3 className="text-base font-bold mb-1">Delete contact?</h3>
              <p className="text-sm text-muted-foreground mb-6">
                {[deleteTarget.firstName, deleteTarget.lastName].filter(Boolean).join(" ") || deleteTarget.email} will be permanently removed.
              </p>
              <div className="flex gap-2">
                <button onClick={() => setDeleteTarget(null)} disabled={deleteConfirming} className="flex-1 h-9 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors">
                  Cancel
                </button>
                <button onClick={handleDelete} disabled={deleteConfirming} className="flex-1 h-9 rounded-xl bg-destructive text-destructive-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
                  {deleteConfirming && <Loader2 size={13} className="animate-spin" />}
                  {deleteConfirming ? "Deleting…" : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
