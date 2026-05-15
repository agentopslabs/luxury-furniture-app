"use client";

import { useEffect, useState, useCallback } from "react";
import { DashboardNav } from "@/components/dashboard/nav";
import { getSocialPosts, getEmailTemplates, getTriggerLinks, createSocialPost } from "@/lib/ghl-actions";
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
  CalendarDays, 
  Mail, 
  Link as LinkIcon, 
  Search, 
  Plus, 
  Settings, 
  Filter, 
  LayoutList, 
  Calendar as CalendarIcon, 
  MessageSquare, 
  BarChart3, 
  Radio, 
  Clock, 
  ChevronDown,
  RefreshCw,
  Zap,
  Palette,
  Target,
  Loader2,
  CheckCircle2,
  Facebook,
  Instagram,
  Linkedin,
  Twitter
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const mainTabs = [
  { name: "Social Planner", value: "social", icon: CalendarDays },
  { name: "Emails", value: "emails", icon: Mail },
  { name: "Snippets", value: "snippets", icon: Zap },
  { name: "Countdown Timers", value: "timers", icon: Clock },
  { name: "Trigger Links", value: "links", icon: LinkIcon },
  { name: "Affiliate Manager", value: "affiliate", icon: Target },
  { name: "Brand Boards", value: "brand", icon: Palette },
  { name: "Ad Manager", value: "ads", icon: Target },
];

const socialSubTabs = [
  { name: "Planner", value: "planner", icon: CalendarDays },
  { name: "Content", value: "content", icon: LayoutList },
  { name: "Comments", value: "comments", icon: MessageSquare },
  { name: "Statistics", value: "stats", icon: BarChart3 },
  { name: "Social Listening", value: "listening", icon: Radio },
  { name: "Settings", value: "settings", icon: Settings },
];

const availableChannels = [
  { name: "Facebook", id: "facebook", icon: Facebook, color: "text-blue-500" },
  { name: "Instagram", id: "instagram", icon: Instagram, color: "text-pink-500" },
  { name: "LinkedIn", id: "linkedin", icon: Linkedin, color: "text-blue-700" },
  { name: "Twitter", id: "twitter", icon: Twitter, color: "text-sky-400" },
];

export default function MarketingPage() {
  const [activeMainTab, setActiveMainTab] = useState("social");
  const [activeSocialTab, setActiveSocialTab] = useState("planner");
  const [loading, setLoading] = useState(true);
  const [dataList, setDataList] = useState<any[]>([]);
  const [isPostOpen, setIsPostOpen] = useState(false);
  const [isSocialsOpen, setIsSocialsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [newPost, setNewPost] = useState({ 
    caption: "", 
    type: "Post", 
    status: "Scheduled",
    channels: [] as string[]
  });
  
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let data = [];
      if (activeMainTab === "social") {
        data = await getSocialPosts();
      } else if (activeMainTab === "emails") {
        data = await getEmailTemplates();
      } else if (activeMainTab === "links") {
        data = await getTriggerLinks();
      }
      setDataList(data || []);
    } catch (error) {
      console.error("Marketing fetch error:", error);
    } finally {
      setLoading(false);
    }
  }, [activeMainTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.caption.trim()) {
      toast({ variant: "destructive", title: "Missing Content", description: "Caption is required for social sync." });
      return;
    }
    if (newPost.channels.length === 0) {
      toast({ variant: "destructive", title: "No Channels", description: "Please select at least one channel for the post." });
      return;
    }

    setIsSubmitting(true);
    try {
      await createSocialPost(newPost);
      toast({ title: "Post Synchronized", description: "Successfully pushed to GHL Social Planner." });
      setIsPostOpen(false);
      setNewPost({ caption: "", type: "Post", status: "Scheduled", channels: [] });
      fetchData();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Sync Failure", description: error.message || "Could not push post to cloud." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConnectSocial = (platform: string) => {
    toast({
      title: `${platform} Connection`,
      description: `Initiating OAuth flow for ${platform}. Redirecting to GHL secure portal...`,
    });
    setIsSocialsOpen(false);
  };

  const toggleChannel = (channelId: string) => {
    setNewPost(prev => {
      const exists = prev.channels.includes(channelId);
      if (exists) {
        return { ...prev, channels: prev.channels.filter(id => id !== channelId) };
      }
      return { ...prev, channels: [...prev.channels, channelId] };
    });
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground overflow-hidden">
      <DashboardNav />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="border-b border-border bg-card/30 backdrop-blur-md z-20 shrink-0">
          <div className="px-8 flex items-center h-16 gap-2">
            <span className="text-sm font-bold text-muted-foreground pr-4 border-r mr-4">Marketing</span>
            <Tabs value={activeMainTab} onValueChange={setActiveMainTab} className="flex-1">
              <TabsList className="bg-transparent h-16 p-0 gap-8">
                {mainTabs.map((tab) => (
                  <TabsTrigger 
                    key={tab.value} 
                    value={tab.value}
                    className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none border-b-2 border-transparent px-0 h-full text-xs font-medium transition-all"
                  >
                    {tab.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </header>

        {activeMainTab === "social" && (
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="px-8 py-6 border-b bg-card/10 flex items-center justify-between shrink-0">
              <h1 className="text-3xl font-bold font-headline tracking-tight">Social Planner</h1>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-9 w-9 rounded-md"><MessageSquare size={18} /></Button>
                <Button variant="outline" size="icon" className="h-9 w-9 rounded-md"><Settings size={18} /></Button>
                <Button variant="outline" className="h-9 rounded-md border-border bg-card" onClick={() => setIsSocialsOpen(true)}>
                  <Plus size={18} className="mr-2" /> Socials
                </Button>
                <Button className="h-9 rounded-md bg-primary hover:bg-primary/90 px-6 font-bold shadow-lg" onClick={() => setIsPostOpen(true)}>
                  <Plus size={18} className="mr-2" /> New Post
                </Button>
              </div>
            </div>

            <div className="px-8 border-b bg-card/5 shrink-0">
              <Tabs value={activeSocialTab} onValueChange={setActiveSocialTab}>
                <TabsList className="bg-transparent h-12 p-0 gap-8">
                  {socialSubTabs.map((tab) => (
                    <TabsTrigger 
                      key={tab.value} 
                      value={tab.value}
                      className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none border-b-2 border-transparent px-0 h-full text-xs font-medium transition-all"
                    >
                      {tab.name}
                      {tab.value === "comments" && <Badge variant="secondary" className="ml-2 bg-amber-400 text-black text-[9px] font-bold h-4 px-1">New</Badge>}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>

            <div className="px-8 py-4 border-b flex flex-col md:flex-row md:items-center justify-between gap-4 bg-background/30 shrink-0">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border bg-card text-xs font-medium">
                  <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-[8px] text-white">A</div>
                  <ChevronDown size={14} className="opacity-50" />
                </div>
                <div className="flex items-center gap-2 px-4 py-1.5 rounded-md border bg-card text-xs font-medium min-w-[280px]">
                  <span>2025-01-01</span>
                  <div className="mx-2 opacity-30">→</div>
                  <span>2025-12-31</span>
                  <CalendarIcon size={14} className="ml-auto opacity-50" />
                </div>
                <Button variant="ghost" size="sm" onClick={fetchData} className="h-9 px-3">
                  <RefreshCw size={14} className={cn(loading && "animate-spin")} />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="h-9 rounded-md"><Filter size={14} className="mr-2" /> Filters</Button>
                <div className="h-9 w-px bg-border mx-1" />
                <div className="flex items-center gap-1 bg-white/5 p-1 rounded-md border">
                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-sm"><LayoutList size={14} /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-sm bg-card shadow-sm"><CalendarIcon size={14} /></Button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 no-scrollbar bg-card/5">
              <div className="max-w-[1600px] mx-auto space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" className="h-10 px-4 rounded-lg font-bold">Actions <ChevronDown size={14} className="ml-2 opacity-50" /></Button>
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                      Filter Views: <Button variant="ghost" size="sm" className="text-primary font-bold h-8 px-2">All <ChevronDown size={14} className="ml-1" /></Button>
                    </div>
                  </div>
                  <div className="relative w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
                    <Input 
                      placeholder="Search by caption (min 3 chars)" 
                      className="pl-10 h-10 rounded-lg text-sm border-border bg-card/50"
                    />
                  </div>
                </div>

                <Card className="rounded-xl border border-border/50 shadow-sm overflow-hidden bg-card/50">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow className="hover:bg-transparent border-border/50">
                        <TableHead className="w-[50px] px-6 text-center"><Input type="checkbox" className="h-4 w-4" /></TableHead>
                        <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-4">Caption</TableHead>
                        <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-4">Media</TableHead>
                        <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-4">Status</TableHead>
                        <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-4">Type</TableHead>
                        <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-4">Date</TableHead>
                        <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-4">Social</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        Array(5).fill(0).map((_, i) => (
                          <TableRow key={i}><TableCell colSpan={7} className="px-6 py-4"><Skeleton className="h-12 w-full" /></TableCell></TableRow>
                        ))
                      ) : dataList.length > 0 ? (
                        dataList.map((item, i) => (
                          <TableRow key={i} className="hover:bg-muted/30 border-border/30 transition-all">
                            <TableCell className="px-6 text-center"><Input type="checkbox" className="h-4 w-4" /></TableCell>
                            <TableCell className="font-medium text-sm">{item.caption || 'No caption'}</TableCell>
                            <TableCell><div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center"><CalendarDays size={18} className="opacity-20" /></div></TableCell>
                            <TableCell><Badge variant="outline" className="text-[10px] uppercase font-bold tracking-tighter">{item.status || 'Scheduled'}</Badge></TableCell>
                            <TableCell className="text-xs text-muted-foreground">{item.type || 'Post'}</TableCell>
                            <TableCell className="text-xs font-mono">{new Date(item.scheduledDate || Date.now()).toLocaleDateString()}</TableCell>
                            <TableCell><div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-[8px] text-white">f</div></TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} className="h-[400px] text-center">
                            <div className="flex flex-col items-center justify-center py-20 opacity-30">
                              <CalendarDays size={64} className="mb-4" />
                              <p className="text-xl font-bold">No social posts found</p>
                              <p className="text-sm">Start scheduling by clicking 'New Post'</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </Card>
              </div>
            </div>
          </div>
        )}

        {activeMainTab !== "social" && (
          <div className="flex-1 flex flex-col items-center justify-center opacity-30">
            <BarChart3 size={64} className="mb-4" />
            <h2 className="text-2xl font-bold">{mainTabs.find(t => t.value === activeMainTab)?.name} Module</h2>
            <p className="text-sm">Synchronizing live records from GHL cloud...</p>
          </div>
        )}
      </main>

      {/* New Post Dialog */}
      <Dialog open={isPostOpen} onOpenChange={setIsPostOpen}>
        <DialogContent className="glass border-white/10 rounded-3xl p-8 max-w-lg">
          <form onSubmit={handleCreatePost}>
            <DialogHeader className="mb-8">
              <DialogTitle className="text-2xl font-bold">Craft Social Post</DialogTitle>
              <DialogDescription className="text-muted-foreground">Synchronizing multi-channel outreach to GHL Social Planner.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-6">
              <div className="space-y-2">
                <Label className="text-[11px] font-bold uppercase tracking-widest opacity-60">Caption & Content</Label>
                <Textarea 
                  className="glass min-h-[120px] rounded-xl focus:ring-primary" 
                  placeholder="What's happening in your enterprise today?" 
                  value={newPost.caption} 
                  onChange={e => setNewPost({ ...newPost, caption: e.target.value })}
                  required 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold uppercase tracking-widest opacity-60">Post Type</Label>
                  <select 
                    className="flex h-12 w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    value={newPost.type}
                    onChange={e => setNewPost({ ...newPost, type: e.target.value })}
                  >
                    <option value="Post">Standard Post</option>
                    <option value="Reel">Reel / Short</option>
                    <option value="Story">Story</option>
                    <option value="Video">Video</option>
                    <option value="Carousel">Carousel</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold uppercase tracking-widest opacity-60">Channel Selection</Label>
                  <div className="flex gap-2 h-12 items-center">
                    {availableChannels.map(channel => {
                      const Icon = channel.icon;
                      const isActive = newPost.channels.includes(channel.id);
                      return (
                        <button
                          key={channel.id}
                          type="button"
                          onClick={() => toggleChannel(channel.id)}
                          className={cn(
                            "w-10 h-10 rounded-xl border flex items-center justify-center transition-all",
                            isActive 
                              ? "bg-white/10 border-primary shadow-[0_0_10px_rgba(168,85,247,0.3)]" 
                              : "border-white/5 opacity-40 hover:opacity-100"
                          )}
                          title={channel.name}
                        >
                          <Icon size={18} className={channel.color} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter className="mt-10">
              <Button type="submit" size="lg" className="w-full h-12 rounded-xl glow-primary font-bold" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-5 w-5" />}
                Sync to Planner
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Social Accounts Dialog */}
      <Dialog open={isSocialsOpen} onOpenChange={setIsSocialsOpen}>
        <DialogContent className="glass border-white/10 rounded-3xl p-8 max-w-md text-center">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-bold">Connect Accounts</DialogTitle>
            <DialogDescription className="text-muted-foreground text-center">Authenticate your brand profiles via GHL OAuth.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" className="h-20 flex-col gap-2 rounded-2xl border-white/5 bg-white/5 hover:bg-white/10" onClick={() => handleConnectSocial('Facebook')}>
              <Facebook className="text-blue-500" />
              <span className="text-[10px] font-bold uppercase">Facebook</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2 rounded-2xl border-white/5 bg-white/5 hover:bg-white/10" onClick={() => handleConnectSocial('Instagram')}>
              <Instagram className="text-pink-500" />
              <span className="text-[10px] font-bold uppercase">Instagram</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2 rounded-2xl border-white/5 bg-white/5 hover:bg-white/10" onClick={() => handleConnectSocial('LinkedIn')}>
              <Linkedin className="text-blue-700" />
              <span className="text-[10px] font-bold uppercase">LinkedIn</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2 rounded-2xl border-white/5 bg-white/5 hover:bg-white/10" onClick={() => handleConnectSocial('Twitter')}>
              <Twitter className="text-sky-400" />
              <span className="text-[10px] font-bold uppercase">X (Twitter)</span>
            </Button>
          </div>
          <p className="mt-8 text-[10px] text-muted-foreground opacity-40 leading-relaxed">By connecting, you authorize GHL to manage and publish content on your behalf across selected enterprise channels.</p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
