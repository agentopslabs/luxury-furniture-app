"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { DashboardNav } from "@/components/dashboard/nav";
import { getConversations, sendMessage, getConversationMessages } from "@/lib/ghl-actions";
import { GHLConversation, GHLMessage } from "@/lib/ghl";
import { MessageSquare, Search, RefreshCw, Send, Loader2, Phone, Mail, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<GHLConversation[]>([]);
  const [selectedConvo, setSelectedConvo] = useState<GHLConversation | null>(null);
  const [messages, setMessages] = useState<GHLMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const fetchConversations = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await getConversations();
      setConversations(data);
      if (isManual) {
        toast({ title: "Inbox Refreshed", description: `Loaded ${data.length} conversations.` });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to load conversations. Please try again." });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast]);

  const fetchMessages = useCallback(async (conversationId: string) => {
    setLoadingMessages(true);
    setMessages([]);
    try {
      const data = await getConversationMessages(conversationId);
      const sorted = [...data].sort((a, b) => new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime());
      setMessages(sorted);
    } catch (error) {
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (selectedConvo) {
      fetchMessages(selectedConvo.id);
    }
  }, [selectedConvo, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!selectedConvo || !messageText.trim()) return;
    setSending(true);
    try {
      await sendMessage(selectedConvo.id, messageText);
      toast({ title: "Message Sent", description: "Your reply was synced to GHL." });
      setMessageText("");
      fetchMessages(selectedConvo.id);
      fetchConversations();
    } catch (error) {
      toast({ variant: "destructive", title: "Delivery Failed", description: "Check your GHL sub-account SMS/Email settings." });
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const filtered = conversations.filter(c =>
    c.contactName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.lastMessageBody?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (dateVal: string | number | undefined) => {
    if (!dateVal) return "";
    const d = new Date(typeof dateVal === "number" ? dateVal : dateVal);
    if (isNaN(d.getTime())) return "";
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return d.toLocaleDateString("en-US", { weekday: "short" });
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const formatMessageTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <DashboardNav />

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar: conversation list */}
        <div className={cn(
          "w-80 shrink-0 border-r border-border flex flex-col bg-white",
          selectedConvo ? "hidden md:flex" : "flex"
        )}>
          <div className="p-4 border-b border-border space-y-3">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-bold">Conversations</h1>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => fetchConversations(true)} disabled={refreshing}>
                <RefreshCw className={cn("h-4 w-4 text-muted-foreground", refreshing && "animate-spin")} />
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                className="pl-9 h-9 text-sm bg-muted/40 border-0 focus-visible:ring-1"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar">
            {loading ? (
              Array(8).fill(0).map((_, i) => (
                <div key={i} className="p-4 border-b border-border/50 flex gap-3">
                  <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3.5 w-28" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
              ))
            ) : filtered.length > 0 ? (
              filtered.map((convo) => {
                const isActive = selectedConvo?.id === convo.id;
                const initials = (convo.contactName || "?").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
                return (
                  <div
                    key={convo.id}
                    onClick={() => setSelectedConvo(convo)}
                    className={cn(
                      "flex items-start gap-3 p-4 border-b border-border/40 cursor-pointer transition-colors",
                      isActive ? "bg-primary/5 border-l-2 border-l-primary" : "hover:bg-muted/40"
                    )}
                  >
                    <div className="relative shrink-0">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className={cn("text-sm font-semibold", isActive ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      {(convo.unreadCount ?? 0) > 0 && (
                        <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                          <span className="text-[9px] font-bold text-white">{convo.unreadCount}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className={cn("text-sm font-semibold truncate", isActive && "text-primary")}>
                          {convo.contactName || "Anonymous"}
                        </p>
                        {convo.lastMessageDate && (
                          <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                            {formatTime(convo.lastMessageDate)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate leading-relaxed">
                        {convo.lastMessageBody || "No messages yet"}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-20 opacity-40">
                <MessageSquare className="h-10 w-10 mb-3 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No conversations found</p>
              </div>
            )}
          </div>
        </div>

        {/* Main: message thread */}
        {selectedConvo ? (
          <div className="flex-1 flex flex-col min-w-0 bg-background">
            {/* Header */}
            <div className="h-16 px-4 border-b border-border flex items-center gap-3 bg-white shrink-0">
              <Button variant="ghost" size="icon" className="md:hidden h-8 w-8 mr-1" onClick={() => setSelectedConvo(null)}>
                <ArrowLeft size={18} />
              </Button>
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarFallback className="bg-primary text-white text-sm font-semibold">
                  {(selectedConvo.contactName || "?").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{selectedConvo.contactName || "Anonymous"}</p>
                <p className="text-xs text-muted-foreground truncate">
                  Contact ID: {selectedConvo.contactId?.slice(0, 12)}...
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="outline" className="text-[10px] font-bold px-2 h-6 border-primary/20 text-primary bg-primary/5">
                  GHL V2
                </Badge>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => fetchMessages(selectedConvo.id)}>
                  <RefreshCw className={cn("h-4 w-4 text-muted-foreground", loadingMessages && "animate-spin")} />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3">
              {loadingMessages ? (
                <div className="flex flex-col gap-3">
                  {Array(5).fill(0).map((_, i) => (
                    <div key={i} className={cn("flex", i % 2 === 0 ? "justify-start" : "justify-end")}>
                      <Skeleton className={cn("h-12 rounded-2xl", i % 2 === 0 ? "w-56" : "w-48")} />
                    </div>
                  ))}
                </div>
              ) : messages.length > 0 ? (
                <>
                  {messages.map((msg) => {
                    const isOutbound = msg.direction === "outbound";
                    return (
                      <div key={msg.id} className={cn("flex", isOutbound ? "justify-end" : "justify-start")}>
                        <div className={cn(
                          "max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm",
                          isOutbound
                            ? "bg-primary text-white rounded-br-sm"
                            : "bg-white border border-border text-foreground rounded-bl-sm"
                        )}>
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.body || "(empty)"}</p>
                          <p className={cn("text-[10px] mt-1 text-right", isOutbound ? "text-white/60" : "text-muted-foreground")}>
                            {formatMessageTime(msg.dateAdded)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full opacity-30">
                  <MessageSquare className="h-12 w-12 mb-3 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No messages in this conversation yet</p>
                </div>
              )}
            </div>

            {/* Reply box */}
            <div className="p-4 border-t border-border bg-white shrink-0">
              <div className="flex gap-2 items-end">
                <Textarea
                  placeholder="Type a message... (Enter to send)"
                  className="min-h-[72px] max-h-36 text-sm resize-none rounded-xl flex-1 bg-muted/40 border-0 focus-visible:ring-1 focus-visible:ring-primary"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={sending || !messageText.trim()}
                  className="h-10 w-10 rounded-xl shrink-0 p-0"
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">Press Enter to send · Shift+Enter for new line</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 hidden md:flex items-center justify-center bg-muted/20">
            <div className="text-center opacity-40 space-y-3">
              <MessageSquare className="h-14 w-14 mx-auto text-muted-foreground" />
              <p className="text-sm font-medium text-muted-foreground">Select a conversation to view messages</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
