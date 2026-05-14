
"use client";

import { useEffect, useState } from "react";
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
  Loader2, 
  UserPlus,
  Mail,
  Phone,
  Tag as TagIcon
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function ContactsPage() {
  const [contacts, setContacts] = useState<GHLContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchContacts() {
      try {
        const data = await ghl.getContacts(50);
        setContacts(data);
      } catch (error) {
        console.error("Failed to fetch contacts:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchContacts();
  }, []);

  const filteredContacts = contacts.filter(c => 
    `${c.firstName} ${c.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardNav />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-8">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-4xl font-bold tracking-tight">Contacts</h1>
              <p className="text-muted-foreground">Manage your LeadConnector sub-account directory.</p>
            </div>
            <Button className="shadow-lg shadow-primary/20">
              <UserPlus className="mr-2 h-4 w-4" /> Add Contact
            </Button>
          </header>

          <Card className="glass border-border/40">
            <CardHeader className="pb-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" /> 
                  Directory ({filteredContacts.length})
                </CardTitle>
                <div className="relative w-full md:w-72">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search by name or email..." 
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
                  {Array(5).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : filteredContacts.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Contact</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Tags</TableHead>
                      <TableHead className="text-right">Type</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredContacts.map((contact) => (
                      <TableRow key={contact.id} className="group cursor-pointer">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                              {contact.firstName[0]}{contact.lastName[0]}
                            </div>
                            <span>{contact.firstName} {contact.lastName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          <div className="flex items-center gap-2">
                            <Mail size={12} className="opacity-50" />
                            {contact.email}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {contact.phone ? (
                            <div className="flex items-center gap-2">
                              <Phone size={12} className="opacity-50" />
                              {contact.phone}
                            </div>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {contact.tags?.slice(0, 2).map(tag => (
                              <Badge key={tag} variant="outline" className="text-[10px] py-0 h-4">{tag}</Badge>
                            ))}
                            {(contact.tags?.length || 0) > 2 && (
                              <span className="text-[10px] text-muted-foreground">+{contact.tags!.length - 2}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="secondary" className="capitalize text-[10px]">
                            {contact.type || 'lead'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="py-20 text-center space-y-3">
                  <Search className="h-10 w-10 mx-auto text-muted-foreground opacity-20" />
                  <p className="text-muted-foreground italic">No contacts found matching your criteria.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
