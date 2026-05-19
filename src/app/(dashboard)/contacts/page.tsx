
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { DashboardNav } from "@/components/dashboard/nav";
import { ghl, GHLContact } from "@/lib/ghl";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Users, Search, UserPlus, Pencil, Trash2,
  Loader2, MessageSquare, Send, Star,
  Download, ChevronDown, X, Upload, Mail,
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
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Edit modal
  const [editContact, setEditContact] = useState<GHLContact | null>(null);
  const [editFields, setEditFields] = useState({ firstName: "", lastName: "", email: "", phone: "", tags: "" });
  const [editSaving, setEditSaving] = useState(false);

  // Add modal
  const [addOpen, setAddOpen] = useState(false);
  const [addFields, setAddFields] = useState({ firstName: "", lastName: "", email: "", phone: "" });
  const [addSaving, setAddSaving] = useState(false);

  // Delete confirm modal
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirming, setDeleteConfirming] = useState(false);

  // Import
  const importRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  const { toast } = useToast();

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await ghl.getContacts(50);
      setContacts(data);
    } catch {
      toast({ variant: "destructive", title: "Failed to load contacts" });
    } finally {
      setLoading(false);
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

  // --- Selection helpers ---
  const allSelected = filteredContacts.length > 0 && filteredContacts.every(c => selectedIds.has(c.id));
  const someSelected = filteredContacts.some(c => selectedIds.has(c.id));
  const selectedContacts = filteredContacts.filter(c => selectedIds.has(c.id));

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        filteredContacts.forEach(c => next.delete(c.id));
        return next;
      });
    } else {
      setSelectedIds(prev => {
        const next = new Set(prev);
        filteredContacts.forEach(c => next.add(c.id));
        return next;
      });
    }
  };

  const toggleOne = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // --- Edit ---
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

  const openEditSelected = () => {
    if (selectedContacts.length === 1) openEdit(selectedContacts[0]);
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

  // --- Add ---
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

  // --- Delete (bulk) ---
  const handleDelete = async () => {
    setDeleteConfirming(true);
    const ids = Array.from(selectedIds);
    try {
      await Promise.all(ids.map(id => ghl.deleteContact(id)));
      setContacts(cs => cs.filter(c => !selectedIds.has(c.id)));
      setSelectedIds(new Set());
      setDeleteOpen(false);
      toast({ title: `${ids.length} contact${ids.length > 1 ? "s" : ""} deleted` });
    } catch {
      toast({ variant: "destructive", title: "Delete failed" });
    } finally {
      setDeleteConfirming(false);
    }
  };

  // --- Export selected ---
  const exportCSV = () => {
    const rows = [["Name", "Email", "Phone", "Tags"]];
    const list = selectedContacts.length > 0 ? selectedContacts : filteredContacts;
    list.forEach(c => {
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

  // --- Import CSV ---
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setImporting(true);
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter(l => l.trim());
      if (lines.length < 2) {
        toast({ variant: "destructive", title: "CSV is empty or has no data rows" });
        return;
      }
      const header = lines[0].split(",").map(h => h.replace(/^"|"$/g, "").trim().toLowerCase());

      const idx = (names: string[]) => names.reduce((found: number, n) => found !== -1 ? found : header.indexOf(n), -1);
      const firstIdx = idx(["first name", "firstname", "first_name"]);
      const lastIdx  = idx(["last name", "lastname", "last_name"]);
      const emailIdx = idx(["email", "e-mail"]);
      const phoneIdx = idx(["phone", "phone number", "mobile"]);
      const nameIdx  = idx(["name", "contact name", "full name"]);

      const parseRow = (line: string) => {
        const cols: string[] = [];
        let cur = "", inQ = false;
        for (const ch of line) {
          if (ch === '"') { inQ = !inQ; }
          else if (ch === "," && !inQ) { cols.push(cur.trim()); cur = ""; }
          else cur += ch;
        }
        cols.push(cur.trim());
        return cols;
      };

      const rows = lines.slice(1).map(parseRow);
      const toCreate = rows.map(cols => {
        let firstName = firstIdx !== -1 ? cols[firstIdx] || "" : "";
        let lastName  = lastIdx  !== -1 ? cols[lastIdx]  || "" : "";
        if (!firstName && nameIdx !== -1) {
          const parts = (cols[nameIdx] || "").split(" ");
          firstName = parts[0] || "";
          lastName  = parts.slice(1).join(" ");
        }
        return {
          firstName,
          lastName,
          email: emailIdx !== -1 ? cols[emailIdx] || "" : "",
          phone: phoneIdx !== -1 ? cols[phoneIdx] || "" : "",
        };
      }).filter(r => r.firstName || r.email);

      if (toCreate.length === 0) {
        toast({ variant: "destructive", title: "No valid rows found", description: "CSV must have First Name or Email columns." });
        return;
      }

      let created = 0;
      const newContacts: GHLContact[] = [];
      for (const row of toCreate) {
        try {
          const c = await ghl.createContact(row);
          newContacts.push(c);
          created++;
        } catch {}
      }
      setContacts(cs => [...newContacts, ...cs]);
      toast({ title: `Imported ${created} of ${toCreate.length} contacts` });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Import failed", description: err.message });
    } finally {
      setImporting(false);
    }
  };

  const avatarLetters = (c: GHLContact) =>
    `${c.firstName?.[0] || ""}${c.lastName?.[0] || ""}`.toUpperCase() || c.email?.[0]?.toUpperCase() || "?";

  const selectionMode = selectedIds.size > 0;

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
            {/* Import */}
            <input ref={importRef} type="file" accept=".csv" className="hidden" onChange={handleImportFile} />
            <Button variant="outline" size="sm" className="h-9 rounded-lg gap-1.5" onClick={() => importRef.current?.click()} disabled={importing}>
              {importing ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              {importing ? "Importing…" : "Import"}
            </Button>
            <Button size="sm" className="h-9 rounded-lg bg-primary hover:bg-primary/90" onClick={() => setAddOpen(true)}>
              <UserPlus size={14} className="mr-1.5" /> Add Contact
            </Button>
          </div>
        </div>

        <div className="px-8 py-6 space-y-4">

          {/* Toolbar — changes based on selection */}
          <div className="flex items-center gap-3 flex-wrap min-h-[36px]">
            {selectionMode ? (
              <>
                {/* Selection count */}
                <span className="text-sm font-semibold text-foreground bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20">
                  {selectedIds.size} selected
                </span>

                {/* Select all visible */}
                <button
                  onClick={toggleAll}
                  className="text-sm text-primary font-medium hover:underline"
                >
                  {allSelected ? "Deselect all" : `Select all ${filteredContacts.length}`}
                </button>

                <div className="flex-1" />

                {/* Export selected */}
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
                  <DropdownMenuContent align="end" className="w-44 rounded-xl shadow-xl">
                    <DropdownMenuItem className="gap-2 text-sm cursor-pointer" onClick={() => toast({ title: "Send SMS", description: `Sending to ${selectedIds.size} contact(s)…` })}>
                      <MessageSquare size={13} className="text-muted-foreground" /> Send SMS
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2 text-sm cursor-pointer" onClick={() => toast({ title: "Send Email", description: `Sending to ${selectedIds.size} contact(s)…` })}>
                      <Mail size={13} className="text-muted-foreground" /> Send Email
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2 text-sm cursor-pointer" onClick={() => toast({ title: "Send WhatsApp", description: `Sending to ${selectedIds.size} contact(s)…` })}>
                      <Send size={13} className="text-muted-foreground" /> Send WhatsApp
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2 text-sm cursor-pointer" onClick={() => toast({ title: "Request Review", description: `Requesting from ${selectedIds.size} contact(s)…` })}>
                      <Star size={13} className="text-muted-foreground" /> Request Review
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="gap-2 text-sm cursor-pointer"
                      onClick={openEditSelected}
                      disabled={selectedContacts.length !== 1}
                    >
                      <Pencil size={13} className="text-muted-foreground" />
                      Edit{selectedContacts.length !== 1 ? " (select 1)" : ""}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="gap-2 text-sm cursor-pointer text-destructive focus:text-destructive"
                      onClick={() => setDeleteOpen(true)}
                    >
                      <Trash2 size={13} /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Clear selection */}
                <button onClick={() => setSelectedIds(new Set())} className="h-9 w-9 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors">
                  <X size={15} />
                </button>
              </>
            ) : (
              <>
                <div className="relative flex-1 min-w-[200px] max-w-xs">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search contacts…"
                    className="pl-9 h-9 rounded-lg text-sm"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button variant="outline" size="sm" className="h-9 rounded-lg gap-1.5" onClick={exportCSV}>
                  <Download size={14} /> Export
                </Button>
              </>
            )}
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
                    {/* Select-all checkbox */}
                    <TableHead className="pl-4 pr-2 w-10 py-3">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        ref={el => { if (el) el.indeterminate = someSelected && !allSelected; }}
                        onChange={toggleAll}
                        className="w-4 h-4 rounded border-border accent-primary cursor-pointer"
                      />
                    </TableHead>
                    <TableHead className="py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Contact Name</TableHead>
                    <TableHead className="py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Email</TableHead>
                    <TableHead className="py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Phone</TableHead>
                    <TableHead className="py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Tags</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContacts.map((c, i) => {
                    const isSelected = selectedIds.has(c.id);
                    return (
                      <TableRow
                        key={c.id}
                        className={cn(
                          "border-border transition-colors cursor-pointer",
                          isSelected ? "bg-primary/5 hover:bg-primary/8" : "hover:bg-muted/40"
                        )}
                        style={{ animationDelay: `${i * 30}ms` }}
                        onClick={() => toggleOne(c.id)}
                      >
                        {/* Checkbox */}
                        <TableCell className="pl-4 pr-2 py-3" onClick={e => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleOne(c.id)}
                            className="w-4 h-4 rounded border-border accent-primary cursor-pointer"
                          />
                        </TableCell>

                        {/* Contact Name */}
                        <TableCell className="py-3">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors",
                              isSelected ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
                            )}>
                              {avatarLetters(c)}
                            </div>
                            <span className="text-sm font-medium">
                              {[c.firstName, c.lastName].filter(Boolean).join(" ") || <span className="text-muted-foreground">—</span>}
                            </span>
                          </div>
                        </TableCell>

                        {/* Email */}
                        <TableCell className="py-3">
                          <span className="text-sm text-muted-foreground">{c.email || "—"}</span>
                        </TableCell>

                        {/* Phone */}
                        <TableCell className="py-3">
                          <span className="text-sm text-muted-foreground">{c.phone || "—"}</span>
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
                      </TableRow>
                    );
                  })}
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
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Tags <span className="normal-case font-normal">(comma separated)</span>
                </label>
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
      {deleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !deleteConfirming && setDeleteOpen(false)} />
          <div className="relative bg-background rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                <Trash2 size={20} className="text-destructive" />
              </div>
              <h3 className="text-base font-bold mb-1">
                Delete {selectedIds.size} contact{selectedIds.size > 1 ? "s" : ""}?
              </h3>
              <p className="text-sm text-muted-foreground mb-6">This cannot be undone.</p>
              <div className="flex gap-2">
                <button onClick={() => setDeleteOpen(false)} disabled={deleteConfirming} className="flex-1 h-9 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors">
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
