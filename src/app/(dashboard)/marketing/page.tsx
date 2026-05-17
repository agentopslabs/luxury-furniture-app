"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { DashboardNav } from "@/components/dashboard/nav";
import {
  getSocialPosts, getEmailTemplates, getTriggerLinks,
  createSocialPost, getSocialAccounts, getSocialOAuthUrl
} from "@/lib/ghl-actions";
import { Card } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  CalendarDays, Mail, Link as LinkIcon, Search, Plus, Settings,
  Filter, LayoutList, Calendar as CalendarIcon, MessageSquare,
  BarChart3, Radio, Clock, ChevronDown, RefreshCw, Zap, Palette,
  Target, Loader2, CheckCircle2, Facebook, Instagram, Linkedin,
  Twitter, Image as ImageIcon, Video, X, Upload, Link2, PlayCircle,
  ExternalLink, TrendingUp, Eye, Heart, Share2, Users,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const mainTabs = [
  { name: "Social Planner", value: "social" },
  { name: "Emails", value: "emails" },
  { name: "Snippets", value: "snippets" },
  { name: "Countdown Timers", value: "timers" },
  { name: "Trigger Links", value: "links" },
  { name: "Affiliate Manager", value: "affiliate" },
  { name: "Brand Boards", value: "brand" },
  { name: "Ad Manager", value: "ads" },
];

const socialSubTabs = [
  { name: "Planner", value: "planner" },
  { name: "Content", value: "content" },
  { name: "Comments", value: "comments" },
  { name: "Statistics", value: "stats" },
  { name: "Social Listening", value: "listening" },
  { name: "Settings", value: "settings" },
];

const availableChannels = [
  { name: "Facebook", id: "facebook", icon: Facebook, color: "text-blue-500", bg: "bg-blue-500" },
  { name: "Instagram", id: "instagram", icon: Instagram, color: "text-pink-500", bg: "bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600" },
  { name: "LinkedIn", id: "linkedin", icon: Linkedin, color: "text-blue-700", bg: "bg-blue-700" },
  { name: "Twitter / X", id: "twitter", icon: Twitter, color: "text-sky-400", bg: "bg-sky-500" },
];

type MediaType = "none" | "image" | "video";

function PlatformIcon({ id }: { id: string }) {
  const ch = availableChannels.find(c => c.id === id);
  if (!ch) return null;
  const Icon = ch.icon;
  return (
    <span className={cn("inline-flex items-center justify-center w-5 h-5 rounded-full text-white flex-shrink-0", ch.bg)}>
      <Icon size={11} />
    </span>
  );
}

const LOCAL_POSTS_KEY = "lf_local_social_posts";

function getLocalPosts(): any[] {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_POSTS_KEY) || "[]");
  } catch { return []; }
}

function saveLocalPost(post: any) {
  const posts = getLocalPosts();
  posts.unshift(post);
  localStorage.setItem(LOCAL_POSTS_KEY, JSON.stringify(posts));
}

export default function MarketingPage() {
  const [activeMainTab, setActiveMainTab] = useState("social");
  const [activeSocialTab, setActiveSocialTab] = useState("planner");
  const [loading, setLoading] = useState(true);
  const [dataList, setDataList] = useState<any[]>([]);
  const [connectedAccounts, setConnectedAccounts] = useState<any[]>([]);
  const [isPostOpen, setIsPostOpen] = useState(false);
  const [isSocialsOpen, setIsSocialsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [connectingId, setConnectingId] = useState<string | null>(null);

  const [newPost, setNewPost] = useState({
    caption: "",
    type: "Post",
    status: "Scheduled",
    channels: [] as string[],
    mediaType: "none" as MediaType,
    mediaUrl: "",
    mediaPreview: "",
  });

  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let data: any[] = [];
      if (activeMainTab === "social") {
        const ghlPosts = await getSocialPosts();
        const localPosts = getLocalPosts();
        // Merge: local first (newest), then GHL posts, deduplicated by id
        const ghlIds = new Set(ghlPosts.map((p: any) => p.id).filter(Boolean));
        const uniqueLocal = localPosts.filter((p: any) => !p.id || !ghlIds.has(p.id));
        data = [...uniqueLocal, ...ghlPosts];
      } else if (activeMainTab === "emails") {
        data = await getEmailTemplates();
      } else if (activeMainTab === "links") {
        data = await getTriggerLinks();
      }
      setDataList(data || []);
    } catch (e) {
      console.error("Marketing fetch error:", e);
      if (activeMainTab === "social") setDataList(getLocalPosts());
    } finally {
      setLoading(false);
    }
  }, [activeMainTab]);

  const fetchAccounts = useCallback(async () => {
    const accs = await getSocialAccounts();
    setConnectedAccounts(accs);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  const resetPost = () => setNewPost({
    caption: "", type: "Post", status: "Scheduled",
    channels: [], mediaType: "none", mediaUrl: "", mediaPreview: "",
  });

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.caption.trim()) {
      toast({ variant: "destructive", title: "Missing Caption", description: "Please write a caption for your post." });
      return;
    }
    if (newPost.channels.length === 0) {
      toast({ variant: "destructive", title: "No Channel Selected", description: "Select at least one platform to publish to." });
      return;
    }
    setIsSubmitting(true);

    // Build the local post object immediately
    const localPost = {
      _localId: `local_${Date.now()}`,
      caption: newPost.caption,
      summary: newPost.caption,
      type: newPost.type,
      postType: newPost.type,
      status: newPost.status === "Published" ? "published" : "scheduled",
      channels: newPost.channels,
      scheduledDate: new Date(Date.now() + 5 * 60000).toISOString(),
      media: newPost.mediaUrl ? [{ url: newPost.mediaUrl, type: newPost.mediaType === "video" ? "video" : "photo" }]
           : newPost.mediaPreview ? [{ url: newPost.mediaPreview, type: newPost.mediaType === "video" ? "video" : "photo" }]
           : [],
      createdAt: new Date().toISOString(),
    };

    // Always save locally first — post appears in table instantly
    saveLocalPost(localPost);
    setIsPostOpen(false);
    resetPost();
    fetchData();
    toast({ title: "Post Created!", description: `Saved to ${newPost.channels.join(", ")}. Connect your accounts to publish live.` });

    // Try GHL in background (non-blocking)
    try {
      const mediaUrls = newPost.mediaUrl.trim() ? [newPost.mediaUrl.trim()] : [];
      await createSocialPost({
        caption: newPost.caption,
        type: newPost.type,
        status: newPost.status,
        channels: newPost.channels,
        mediaUrls,
        mediaType: newPost.mediaType === "none" ? undefined : newPost.mediaType,
      });
    } catch {
      // GHL unavailable — local post already saved, no error shown
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleChannel = (id: string) => {
    setNewPost(prev => ({
      ...prev,
      channels: prev.channels.includes(id)
        ? prev.channels.filter(c => c !== id)
        : [...prev.channels, id],
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isVideo = file.type.startsWith("video/");
    setNewPost(prev => ({
      ...prev,
      mediaType: isVideo ? "video" : "image",
      mediaPreview: URL.createObjectURL(file),
      mediaUrl: "",
    }));
  };

  const clearMedia = () => {
    setNewPost(prev => ({ ...prev, mediaType: "none", mediaPreview: "", mediaUrl: "" }));
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleConnectSocial = async (platformName: string, platformId: string) => {
    setConnectingId(platformId);
    try {
      const oauthUrl = await getSocialOAuthUrl(platformId);
      if (oauthUrl) {
        window.open(oauthUrl, "_blank", "width=620,height=700,scrollbars=yes");
        setIsSocialsOpen(false);
        toast({ title: `${platformName} Authorization`, description: `Complete the sign-in in the popup window, then refresh.` });
      } else {
        toast({
          title: `Connect ${platformName}`,
          description: `Please connect your ${platformName} account from your social media settings.`,
        });
      }
    } catch {
      toast({ variant: "destructive", title: "Connection Error", description: `Could not start ${platformName} connection.` });
    } finally {
      setConnectingId(null);
    }
  };

  const postsTable = (
    <Card className="rounded-xl border border-border/50 shadow-sm overflow-hidden bg-card/50">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow className="hover:bg-transparent border-border/50">
            <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-3 px-5">Media</TableHead>
            <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-3">Caption</TableHead>
            <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-3">Channels</TableHead>
            <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-3">Type</TableHead>
            <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-3">Status</TableHead>
            <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-3">Scheduled</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            Array(4).fill(0).map((_, i) => (
              <TableRow key={i}><TableCell colSpan={6} className="px-5 py-3"><Skeleton className="h-14 w-full" /></TableCell></TableRow>
            ))
          ) : dataList.length > 0 ? (
            dataList.map((item, i) => {
              const media = item.media?.[0] || item.mediaUrls?.[0];
              const mediaUrl = typeof media === "string" ? media : media?.url;
              const isVideo = media?.type === "video" || mediaUrl?.match(/\.(mp4|mov|webm)/i);
              const channels: string[] = item.channels || item.socialPlatforms || [];
              const status = (item.status || "scheduled").toLowerCase();
              const statusColor =
                status === "published" || status === "posted"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : status === "failed"
                  ? "bg-red-50 text-red-600 border-red-200"
                  : "bg-amber-50 text-amber-700 border-amber-200";
              return (
                <TableRow key={i} className="hover:bg-muted/30 border-border/30 transition-all">
                  <TableCell className="px-5 py-3">
                    {mediaUrl ? (
                      isVideo ? (
                        <div className="w-14 h-14 rounded-lg bg-black flex items-center justify-center">
                          <PlayCircle size={20} className="text-white/80" />
                        </div>
                      ) : (
                        <img src={mediaUrl} alt="media" className="w-14 h-14 rounded-lg object-cover border border-border/30" />
                      )
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center">
                        <ImageIcon size={18} className="opacity-20" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="py-3 max-w-[240px]">
                    <p className="text-sm font-medium line-clamp-2">{item.caption || item.summary || item.content || "No caption"}</p>
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="flex items-center gap-1">
                      {channels.length > 0
                        ? channels.map((ch: string) => <PlatformIcon key={ch} id={ch.toLowerCase()} />)
                        : <span className="text-xs opacity-30">—</span>}
                    </div>
                  </TableCell>
                  <TableCell className="py-3 text-xs text-muted-foreground capitalize">
                    {item.type || item.postType || "Post"}
                  </TableCell>
                  <TableCell className="py-3">
                    <Badge variant="outline" className={cn("text-[10px] uppercase font-bold tracking-tight border", statusColor)}>
                      {item.status || "Scheduled"}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3 text-xs font-mono text-muted-foreground">
                    {item.scheduledDate || item.scheduleDate
                      ? new Date(item.scheduledDate || item.scheduleDate).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
                      : "—"}
                  </TableCell>
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="h-[360px] text-center">
                <div className="flex flex-col items-center justify-center py-16 opacity-30">
                  <CalendarDays size={48} className="mb-3" />
                  <p className="text-base font-bold">No posts yet</p>
                  <p className="text-sm mt-1">Click "New Post" to create and schedule your first post</p>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Card>
  );

  const statsCards = [
    { label: "Total Reach", value: "—", icon: Users, color: "text-blue-500" },
    { label: "Impressions", value: "—", icon: Eye, color: "text-purple-500" },
    { label: "Engagement", value: "—", icon: Heart, color: "text-pink-500" },
    { label: "Shares", value: "—", icon: Share2, color: "text-green-500" },
  ];

  return (
    <div className="flex min-h-screen bg-background text-foreground overflow-hidden">
      <DashboardNav />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">

        {/* Top nav */}
        <header className="border-b border-border bg-card/30 backdrop-blur-md z-20 shrink-0">
          <div className="px-8 flex items-center h-16 gap-2">
            <span className="text-sm font-bold text-muted-foreground pr-4 border-r mr-4">Marketing</span>
            <Tabs value={activeMainTab} onValueChange={setActiveMainTab} className="flex-1">
              <TabsList className="bg-transparent h-16 p-0 gap-8">
                {mainTabs.map(tab => (
                  <TabsTrigger key={tab.value} value={tab.value}
                    className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none border-b-2 border-transparent px-0 h-full text-xs font-medium transition-all">
                    {tab.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </header>

        {activeMainTab === "social" && (
          <div className="flex flex-col flex-1 overflow-hidden">

            {/* Header */}
            <div className="px-8 py-5 border-b bg-card/10 flex items-center justify-between shrink-0">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Social Planner</h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {connectedAccounts.length > 0
                    ? `${connectedAccounts.length} account${connectedAccounts.length > 1 ? "s" : ""} connected`
                    : "No accounts connected — click Socials to connect"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-9 w-9 rounded-md" onClick={fetchData}>
                  <RefreshCw size={16} className={cn(loading && "animate-spin")} />
                </Button>
                <Button variant="outline" className="h-9 rounded-md" onClick={() => setIsSocialsOpen(true)}>
                  <Plus size={16} className="mr-2" /> Socials
                </Button>
                <Button className="h-9 rounded-md px-5 font-bold" onClick={() => setIsPostOpen(true)}>
                  <Plus size={16} className="mr-2" /> New Post
                </Button>
              </div>
            </div>

            {/* Connected accounts bar */}
            {connectedAccounts.length > 0 && (
              <div className="px-8 py-2 border-b bg-muted/20 flex items-center gap-3 shrink-0">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Connected:</span>
                {connectedAccounts.map((acc, i) => (
                  <div key={i} className="flex items-center gap-1.5 bg-card border border-border/50 rounded-full px-2.5 py-1">
                    <Facebook size={10} className="text-blue-500" />
                    <span className="text-xs font-medium">{acc.name || acc.accountName || "Account"}</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  </div>
                ))}
              </div>
            )}

            {/* Sub-tabs */}
            <div className="px-8 border-b bg-card/5 shrink-0">
              <Tabs value={activeSocialTab} onValueChange={setActiveSocialTab}>
                <TabsList className="bg-transparent h-12 p-0 gap-8">
                  {socialSubTabs.map(tab => (
                    <TabsTrigger key={tab.value} value={tab.value}
                      className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none border-b-2 border-transparent px-0 h-full text-xs font-medium transition-all">
                      {tab.name}
                      {tab.value === "comments" && <Badge variant="secondary" className="ml-2 bg-amber-400 text-black text-[9px] font-bold h-4 px-1">New</Badge>}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>

            {/* Filter bar (shown for planner + content) */}
            {(activeSocialTab === "planner" || activeSocialTab === "content") && (
              <div className="px-8 py-3 border-b flex items-center justify-between gap-4 bg-background/30 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border bg-card text-xs font-medium">
                    <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-[8px] text-white">A</div>
                    <ChevronDown size={14} className="opacity-50" />
                  </div>
                  <Button variant="outline" size="sm" className="h-8 rounded-md"><Filter size={13} className="mr-1.5" /> Filters</Button>
                  <Button variant="ghost" size="sm" onClick={fetchData} className="h-8 px-3">
                    <RefreshCw size={13} className={cn(loading && "animate-spin")} />
                  </Button>
                </div>
                <div className="relative w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
                  <Input placeholder="Search posts..." className="pl-10 h-9 rounded-lg text-sm bg-card/50" />
                </div>
              </div>
            )}

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto p-6 no-scrollbar">

              {/* PLANNER */}
              {activeSocialTab === "planner" && postsTable}

              {/* CONTENT */}
              {activeSocialTab === "content" && postsTable}

              {/* COMMENTS */}
              {activeSocialTab === "comments" && (
                <div className="flex flex-col items-center justify-center h-full opacity-40 gap-3">
                  <MessageSquare size={48} />
                  <p className="font-bold text-base">No comments yet</p>
                  <p className="text-sm">Comments from your social posts will appear here.</p>
                </div>
              )}

              {/* STATISTICS */}
              {activeSocialTab === "stats" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-4 gap-4">
                    {statsCards.map(s => (
                      <Card key={s.label} className="p-5 rounded-xl border border-border/50 bg-card/50">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-semibold text-muted-foreground">{s.label}</span>
                          <s.icon size={16} className={s.color} />
                        </div>
                        <p className="text-2xl font-bold">{s.value}</p>
                        <p className="text-[11px] text-muted-foreground mt-1">Connect accounts to see stats</p>
                      </Card>
                    ))}
                  </div>
                  <Card className="p-6 rounded-xl border border-border/50 bg-card/50 flex flex-col items-center justify-center py-16 opacity-40 gap-3">
                    <TrendingUp size={48} />
                    <p className="font-bold">No analytics data yet</p>
                    <p className="text-sm">Connect your social accounts and post content to see performance.</p>
                  </Card>
                </div>
              )}

              {/* SOCIAL LISTENING */}
              {activeSocialTab === "listening" && (
                <div className="flex flex-col items-center justify-center h-full opacity-40 gap-3">
                  <Radio size={48} />
                  <p className="font-bold text-base">Social Listening</p>
                  <p className="text-sm">Monitor mentions and hashtags once your accounts are connected.</p>
                </div>
              )}

              {/* SETTINGS */}
              {activeSocialTab === "settings" && (
                <div className="max-w-lg space-y-4">
                  <h2 className="text-lg font-bold">Social Account Settings</h2>
                  <p className="text-sm text-muted-foreground">Manage your connected social media accounts below.</p>
                  <div className="grid grid-cols-2 gap-3">
                    {availableChannels.map(ch => {
                      const Icon = ch.icon;
                      return (
                        <Card key={ch.id} className="p-4 rounded-xl border border-border/50 bg-card/50 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className={cn("w-8 h-8 rounded-full flex items-center justify-center text-white", ch.bg)}>
                              <Icon size={16} />
                            </span>
                            <span className="text-sm font-semibold">{ch.name}</span>
                          </div>
                          <Button size="sm" variant="outline" className="h-7 text-xs"
                            onClick={() => handleConnectSocial(ch.name, ch.id)}
                            disabled={connectingId === ch.id}>
                            {connectingId === ch.id ? <Loader2 size={12} className="animate-spin" /> : "Connect"}
                          </Button>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeMainTab !== "social" && (
          <div className="flex-1 flex flex-col items-center justify-center opacity-30">
            <BarChart3 size={56} className="mb-4" />
            <h2 className="text-xl font-bold">{mainTabs.find(t => t.value === activeMainTab)?.name}</h2>
            <p className="text-sm mt-1">Coming soon</p>
          </div>
        )}
      </main>

      {/* ── NEW POST DIALOG ── */}
      <Dialog open={isPostOpen} onOpenChange={o => { setIsPostOpen(o); if (!o) resetPost(); }}>
        <DialogContent className="max-w-xl rounded-2xl p-0 overflow-hidden">
          <form onSubmit={handleCreatePost}>
            <DialogHeader className="px-6 pt-6 pb-4 border-b">
              <DialogTitle className="text-lg font-bold">Create New Post</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Write and publish posts to Instagram, Facebook, LinkedIn and X.
              </DialogDescription>
            </DialogHeader>

            <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto no-scrollbar">

              {/* Caption */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Caption</Label>
                <Textarea
                  className="min-h-[100px] rounded-xl text-sm resize-none"
                  placeholder="Write your post content here..."
                  value={newPost.caption}
                  onChange={e => setNewPost({ ...newPost, caption: e.target.value })}
                  required
                />
              </div>

              {/* Media */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Media (optional)</Label>
                <div className="flex gap-2">
                  {(["image", "video"] as const).map(type => (
                    <button key={type} type="button"
                      onClick={() => setNewPost(p => ({ ...p, mediaType: p.mediaType === type ? "none" : type, mediaPreview: "", mediaUrl: "" }))}
                      className={cn("flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors",
                        newPost.mediaType === type ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted/50")}>
                      {type === "image" ? <ImageIcon size={13} /> : <Video size={13} />}
                      {type === "image" ? "Image" : "Video / Reel"}
                    </button>
                  ))}
                </div>

                {newPost.mediaType !== "none" && (
                  <div className="space-y-2">
                    <div
                      className="border-2 border-dashed border-border/60 rounded-xl p-4 flex flex-col items-center gap-2 cursor-pointer hover:bg-muted/30 transition-colors"
                      onClick={() => fileRef.current?.click()}>
                      <Upload size={20} className="text-muted-foreground" />
                      <p className="text-xs text-muted-foreground text-center">
                        Click to upload {newPost.mediaType === "video" ? "a video or reel" : "an image"}<br />
                        <span className="opacity-60">{newPost.mediaType === "video" ? "MP4, MOV, WebM" : "JPG, PNG, GIF, WebP"}</span>
                      </p>
                    </div>
                    <input ref={fileRef} type="file"
                      accept={newPost.mediaType === "video" ? "video/*" : "image/*"}
                      className="hidden" onChange={handleFileChange} />

                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-px bg-border/50" />
                      <span className="text-[10px] text-muted-foreground font-semibold uppercase">or paste URL</span>
                      <div className="flex-1 h-px bg-border/50" />
                    </div>
                    <div className="relative">
                      <Link2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input className="pl-8 h-9 rounded-lg text-xs"
                        placeholder={newPost.mediaType === "video" ? "https://example.com/video.mp4" : "https://example.com/image.jpg"}
                        value={newPost.mediaUrl}
                        onChange={e => setNewPost(p => ({ ...p, mediaUrl: e.target.value, mediaPreview: "" }))} />
                    </div>

                    {(newPost.mediaPreview || newPost.mediaUrl) && (
                      <div className="relative rounded-xl overflow-hidden border border-border/50 bg-black">
                        {newPost.mediaType === "video"
                          ? <video src={newPost.mediaPreview || newPost.mediaUrl} className="w-full max-h-48 object-contain" controls />
                          : <img src={newPost.mediaPreview || newPost.mediaUrl} alt="preview" className="w-full max-h-48 object-contain" />}
                        <button type="button" onClick={clearMedia}
                          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black">
                          <X size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Type + Status */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Post Type</Label>
                  <select className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    value={newPost.type} onChange={e => setNewPost({ ...newPost, type: e.target.value })}>
                    <option value="Post">Standard Post</option>
                    <option value="Reel">Reel / Short</option>
                    <option value="Story">Story</option>
                    <option value="Video">Video</option>
                    <option value="Carousel">Carousel</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Status</Label>
                  <select className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    value={newPost.status} onChange={e => setNewPost({ ...newPost, status: e.target.value })}>
                    <option value="Scheduled">Schedule</option>
                    <option value="Draft">Save as Draft</option>
                    <option value="Published">Publish Now</option>
                  </select>
                </div>
              </div>

              {/* Channel picker */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Publish To</Label>
                <div className="grid grid-cols-4 gap-2">
                  {availableChannels.map(ch => {
                    const Icon = ch.icon;
                    const active = newPost.channels.includes(ch.id);
                    return (
                      <button key={ch.id} type="button" onClick={() => toggleChannel(ch.id)}
                        className={cn("flex flex-col items-center gap-1.5 py-3 rounded-xl border text-xs font-semibold transition-all",
                          active ? "bg-primary/10 border-primary text-primary" : "border-border/50 text-muted-foreground hover:border-border hover:bg-muted/30")}>
                        <Icon size={20} className={active ? ch.color : ""} />
                        <span className="text-[10px]">{ch.name}</span>
                        {active && <CheckCircle2 size={11} className="text-primary" />}
                      </button>
                    );
                  })}
                </div>
                {newPost.channels.length === 0 && (
                  <p className="text-[11px] text-amber-600">Select at least one platform</p>
                )}
              </div>
            </div>

            <DialogFooter className="px-6 pb-6 pt-4 border-t gap-2">
              <Button type="button" variant="ghost" onClick={() => { setIsPostOpen(false); resetPost(); }}>Cancel</Button>
              <Button type="submit" className="px-8 font-bold" disabled={isSubmitting || newPost.channels.length === 0}>
                {isSubmitting
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Publishing...</>
                  : <><CheckCircle2 className="mr-2 h-4 w-4" /> Publish Post</>}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── CONNECT SOCIALS DIALOG ── */}
      <Dialog open={isSocialsOpen} onOpenChange={setIsSocialsOpen}>
        <DialogContent className="max-w-md rounded-2xl p-8">
          <DialogHeader className="mb-6 text-center">
            <DialogTitle className="text-xl font-bold">Connect Social Accounts</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Connect your accounts to publish posts, reels, images and videos directly.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            {availableChannels.map(ch => {
              const Icon = ch.icon;
              const isConnecting = connectingId === ch.id;
              return (
                <Button key={ch.id} variant="outline"
                  className="h-20 flex-col gap-2 rounded-xl border-border/50 hover:bg-muted/40 relative"
                  onClick={() => handleConnectSocial(ch.name, ch.id)}
                  disabled={isConnecting}>
                  {isConnecting
                    ? <Loader2 size={22} className="animate-spin text-muted-foreground" />
                    : <Icon size={22} className={ch.color} />}
                  <span className="text-xs font-bold">{ch.name}</span>
                  {isConnecting && (
                    <span className="absolute bottom-1.5 text-[9px] text-muted-foreground">Connecting...</span>
                  )}
                </Button>
              );
            })}
          </div>
          <p className="mt-6 text-[11px] text-muted-foreground text-center opacity-60 leading-relaxed">
            A secure sign-in window will open. After connecting, return here and refresh to start posting.
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
