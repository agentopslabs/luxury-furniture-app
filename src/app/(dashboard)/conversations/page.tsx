
"use client";

import { useEffect, useState } from "react";
import { DashboardNav } from "@/components/dashboard/nav";
import { ghl, GHLConversation } from "@/lib/ghl";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MessageSquare, User, Clock, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<GHLConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchConversations() {
      try {
        const data = await ghl.getConversations();
        setConversations(data);
      } catch (error) {
        console.error("Failed to fetch conversations:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchConversations();
  }, []);

  const filtered = conversations.filter(c => 
    c.contactName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.lastMessageBody?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardNav />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-8">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-4xl font-bold tracking-tight">Conversations</h1>
              <p className="text-muted-foreground">Unified messaging across all channels (V2 API).</p>
            </div>
            <div className="flex gap-2">
              <div className="relative w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search messages..." 
                  className="pl-9 h-10" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" /> Filter
              </Button>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-4">
              <Card className="glass border-border/40 min-h-[600px] flex flex-col">
                <CardHeader className="border-b border-border/40 pb-4">
                  <CardTitle className="text-lg">Inbox</CardTitle>
                  <CardDescription>Recent message threads</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 p-0 overflow-y-auto max-h-[500px]">
                  {loading ? (
                    Array(6).fill(0).map((_, i) => (
                      <div key={i} className="p-4 space-y-2 border-b">
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-3 w-3/4" />
                      </div>
                    ))
                  ) : filtered.length > 0 ? (
                    filtered.map((convo) => (
                      <div 
                        key={convo.id} 
                        className={cn(
                          "p-4 border-b border-border/40 cursor-pointer transition-all hover:bg-muted/50 group",
                          convo.unreadCount && convo.unreadCount > 0 && "bg-primary/5"
                        )}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <p className="font-bold text-sm truncate group-hover:text-primary transition-colors">
                            {convo.contactName || 'Anonymous Contact'}
                          </p>
                          {convo.lastMessageDate && (
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(convo.lastMessageDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {convo.lastMessageBody || 'No messages yet.'}
                        </p>
                        {convo.unreadCount && convo.unreadCount > 0 && (
                          <Badge className="mt-2 h-4 px-1.5 text-[9px]">{convo.unreadCount} new</Badge>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="py-20 text-center space-y-3 opacity-40">
                      <MessageSquare className="h-10 w-10 mx-auto" />
                      <p className="text-sm italic">No conversations found.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2 space-y-4">
              <Card className="glass border-border/40 min-h-[600px] flex flex-col items-center justify-center border-dashed">
                <CardContent className="text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                    <MessageSquare className="h-8 w-8 text-muted-foreground opacity-50" />
                  </div>
                  <div>
                    <p className="font-bold text-lg">Select a conversation</p>
                    <p className="text-sm text-muted-foreground">Select a contact from the inbox to start messaging.</p>
                  </div>
                  <Button variant="secondary" size="sm">
                    New Message
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
