
"use client";

import { useEffect, useState, useCallback } from "react";
import { DashboardNav } from "@/components/dashboard/nav";
import { getConversations, sendMessage } from "@/lib/ghl-actions";
import { GHLConversation } from "@/lib/ghl";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MessageSquare, Search, RefreshCw, Send, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<GHLConversation[]>([]);
  const [selectedConvo, setSelectedConvo] = useState<GHLConversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const fetchConversations = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await getConversations();
      setConversations(data);
      if (isManual) {
        toast({
          title: "Inbox Refreshed",
          description: `Loaded ${data.length} live threads from GHL.`,
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Sync Error",
        description: "Failed to connect to GHL messaging hub.",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const handleSendMessage = async () => {
    if (!selectedConvo || !messageText.trim()) return;

    setSending(true);
    try {
      await sendMessage(selectedConvo.id, messageText);
      toast({
        title: "Message Sent",
        description: "Your response was synchronized to the GHL contact.",
      });
      setMessageText("");
      fetchConversations(true);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Delivery Failed",
        description: "Check your GHL sub-account SMS/Email settings.",
      });
    } finally {
      setSending(false);
    }
  };

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
              <p className="text-muted-foreground">Live multi-channel messaging (V2 API).</p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => fetchConversations(true)} 
                disabled={loading || refreshing}
              >
                <RefreshCw className={cn("mr-2 h-4 w-4", refreshing && "animate-spin")} />
                {refreshing ? "Refreshing..." : "Refresh Inbox"}
              </Button>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-4">
              <Card className="glass border-border/40 h-[calc(100vh-250px)] flex flex-col overflow-hidden">
                <CardHeader className="border-b border-border/40 pb-4">
                  <div className="relative w-full">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search messages..." 
                      className="pl-9 h-9 text-xs" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </CardHeader>
                <CardContent className="flex-1 p-0 overflow-y-auto no-scrollbar">
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
                        onClick={() => setSelectedConvo(convo)}
                        className={cn(
                          "p-4 border-b border-border/40 cursor-pointer transition-all hover:bg-muted/50 group",
                          selectedConvo?.id === convo.id && "bg-primary/10 border-l-2 border-l-primary"
                        )}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <p className="font-bold text-sm truncate">
                            {convo.contactName || 'Anonymous'}
                          </p>
                          {convo.lastMessageDate && (
                            <span className="text-[9px] text-muted-foreground font-mono">
                              {new Date(convo.lastMessageDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1 opacity-70">
                          {convo.lastMessageBody || 'No messages.'}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="py-20 text-center opacity-40">
                      <MessageSquare className="h-10 w-10 mx-auto mb-2" />
                      <p className="text-xs italic">Inbox empty.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2">
              {selectedConvo ? (
                <Card className="glass border-border/40 h-[calc(100vh-250px)] flex flex-col overflow-hidden">
                  <CardHeader className="border-b border-border/40">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                        {selectedConvo.contactName?.[0] || '?'}
                      </div>
                      <div>
                        <CardTitle className="text-sm font-bold">{selectedConvo.contactName}</CardTitle>
                        <CardDescription className="text-[10px]">LeadConnector V2 Thread</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 p-6 overflow-y-auto space-y-4 no-scrollbar">
                    <div className="bg-muted/30 p-4 rounded-xl text-sm border border-border/20 self-start max-w-[80%]">
                      {selectedConvo.lastMessageBody}
                      <p className="text-[9px] mt-2 opacity-50 font-mono">Received via GHL</p>
                    </div>
                  </CardContent>
                  <div className="p-4 border-t bg-card/20 space-y-3">
                    <Textarea 
                      placeholder="Type a message..." 
                      className="min-h-[80px] text-xs resize-none"
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                    />
                    <div className="flex justify-end gap-2">
                      <Button 
                        size="sm" 
                        onClick={handleSendMessage} 
                        disabled={sending || !messageText.trim()}
                        className="h-9 px-4 font-bold"
                      >
                        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                        Sync Reply
                      </Button>
                    </div>
                  </div>
                </Card>
              ) : (
                <Card className="glass border-border/40 h-[calc(100vh-250px)] flex flex-col items-center justify-center border-dashed">
                  <CardContent className="text-center space-y-4">
                    <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground opacity-20" />
                    <p className="text-sm text-muted-foreground">Select a contact to view and sync messages.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
