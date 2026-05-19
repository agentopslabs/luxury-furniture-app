"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { DashboardNav } from "@/components/dashboard/nav";
import {
  fetchMarketingData,
  createSocialPlannerPost,
} from "@/lib/ghl-actions";
import { Card } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  CalendarDays, Mail, Link as LinkIcon, Search, Plus, Settings,
  BarChart3, Radio, RefreshCw,
  Loader2, CheckCircle2, Facebook, Instagram, Linkedin,
  Twitter, Image as ImageIcon, Video, X, Upload, Link2, PlayCircle,
  TrendingUp, Eye, Heart, Share2, Users, MessageSquare, Trash2,
  AlertCircle, ChevronDown, Clock, ExternalLink, Globe,
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

const POST_TYPES = ["Post", "Reel", "Story", "Video"];

const PLATFORM_META: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  facebook: { icon: Facebook, color: "text-blue-500", bg: "bg-blue-600", label: "Facebook" },
  instagram: { icon: Instagram, color: "text-pink-500", bg: "bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600", label: "Instagram" },
  linkedin: { icon: Linkedin, color: "text-blue-700", bg: "bg-blue-700", label: "LinkedIn" },
  twitter: { icon: Twitter, color: "text-sky-400", bg: "bg-sky-500", label: "X / Twitter" },
  tiktok: { icon: Video, color: "text-white", bg: "bg-black", label: "TikTok" },
  youtube: { icon: PlayCircle, color: "text-red-500", bg: "bg-red-600", label: "YouTube" },
  google: { icon: Globe, color: "text-green-600", bg: "bg-green-600", label: "Google" },
};

function getPlatformMeta(platform: string) {
  return PLATFORM_META[platform?.toLowerCase()] || { icon: Globe, color: "text-muted-foreground", bg: "bg-muted", label: platform || "Unknown" };
}

function AccountBadge({ account }: { account: any }) {
  const platform = (account.platform || account.type || "").toLowerCase();
  const meta = getPlatformMeta(platform);
  const Icon = meta.icon;
  const name = account.name || account.displayName || account.accountName || meta.label;
  const pic = account.picture || account.profilePicture || account.avatar;

  return (
    <div className="flex items-center gap-1.5 relative">
      <div className="relative">
        {pic ? (
          <img src={pic} className="w-6 h-6 rounded-full border border-border/30" alt={name} />
        ) : (
          <span className={cn("w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px]", meta.bg)}>
            <Icon size={11} />
          </span>
        )}
        <span className={cn("absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border border-background flex items-center justify-center text-white", meta.bg)}>
          <Icon size={7} />
        </span>
      </div>
    </div>
  );
}

function normalizeStatus(raw: string): string {
  const s = (raw || "").toLowerCase();
  if (s === "published" || s === "posted" || s === "post_published") return "Published";
  if (s === "scheduled") return "Scheduled";
  if (s === "draft") return "Draft";
  if (s === "failed") return "Failed";
  if (s === "now") return "Published";
  return raw || "Unknown";
}

function statusBadge(status: string) {
  const norm = normalizeStatus(status);
  const styles: Record<string, string> = {
    Published: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800",
    Scheduled: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800",
    Draft: "bg-gray-100 text-gray-600 border-gray-200",
    Failed: "bg-red-50 text-red-600 border-red-200",
  };
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border", styles[norm] || "bg-muted text-muted-foreground border-border")}>
      {norm === "Published" && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />}
      {norm === "Scheduled" && <Clock size={10} />}
      {norm}
    </span>
  );
}

function normalizePost(p: any): any {
  const platform = (
    p.platform ||
    p.socialMediaAccount?.platform ||
    p.account?.platform ||
    (p.channels?.[0]) ||
    ""
  ).toLowerCase();

  // GHL real API: accounts is an array under socialMediaAccounts or built from accountId
  const accounts: any[] = p.socialMediaAccounts || (p.socialMediaAccount ? [p.socialMediaAccount] : []) || [];

  // GHL real API: media is an array of objects with url/mediaUrl fields
  const mediaUrls: string[] = p.mediaUrls
    || (Array.isArray(p.media) ? p.media.map((m: any) => m.url || m.mediaUrl || m).filter(Boolean) : [])
    || [];
  const firstMedia = mediaUrls[0] || "";
  const isVideo = /\.(mp4|mov|webm)/i.test(firstMedia) || p.type?.toLowerCase() === "reel" || p.type?.toLowerCase() === "video";

  // GHL real API: engagement lives under insights
  const insights = p.insights || {};

  // GHL real API: date is publishedAt (published), displayDate (scheduled), or scheduleDateTime
  const date = p.publishedAt || p.displayDate || p.scheduleDateTime || p.scheduledDate || p.scheduledAt || p.createdAt || "";

  return {
    id: p._id || p.id,
    caption: p.summary || p.caption || p.content || "No caption",
    status: normalizeStatus(p.status || ""),
    type: p.type ? (p.type.charAt(0).toUpperCase() + p.type.slice(1)) : "Post",
    date,
    accounts,
    platform,
    accountId: p.accountId || "",
    mediaUrls,
    firstMedia,
    isVideo,
    likes: insights.like ?? p.likes ?? p.likesCount ?? 0,
    comments: insights.comment ?? p.commentsCount ?? p.comments ?? 0,
    shares: insights.share ?? p.shares ?? 0,
  };
}

export default function MarketingPage() {
  const [activeMainTab, setActiveMainTab] = useState("social");
  const [activeSocialTab, setActiveSocialTab] = useState("planner");
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<any[]>([]);
  const [ghlAccounts, setGhlAccounts] = useState<any[]>([]);
  const [emailData, setEmailData] = useState<any[]>([]);
  const [linkData, setLinkData] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const [isPostOpen, setIsPostOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newPost, setNewPost] = useState({
    summary: "",
    type: "Post",
    accountIds: [] as string[],
    mediaUrl: "",
    mediaPreview: "",
    mediaType: "none" as "none" | "image" | "video",
  });

  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchMarketingData();
      setPosts((data.posts || []).map(normalizePost));
      setGhlAccounts(data.accounts || []);
      setEmailData(data.emails || []);
      setLinkData(data.links || []);
    } catch {
      // silent — keep previous state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const resetPost = () => setNewPost({ summary: "", type: "Post", accountIds: [], mediaUrl: "", mediaPreview: "", mediaType: "none" });

  const toggleAccount = (id: string) => setNewPost(prev => ({
    ...prev,
    accountIds: prev.accountIds.includes(id) ? prev.accountIds.filter(a => a !== id) : [...prev.accountIds, id],
  }));

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.summary.trim()) {
      toast({ variant: "destructive", title: "Missing Caption", description: "Write a caption for your post." });
      return;
    }
    if (newPost.accountIds.length === 0) {
      toast({ variant: "destructive", title: "No Account Selected", description: "Select at least one social account." });
      return;
    }
    setIsSubmitting(true);
    try {
      const mediaUrls = (newPost.mediaUrl.trim() || newPost.mediaPreview) ? [newPost.mediaUrl.trim() || newPost.mediaPreview] : undefined;
      await createSocialPlannerPost({
        accountIds: newPost.accountIds,
        summary: newPost.summary,
        type: newPost.type.toLowerCase(),
        mediaUrls,
      });
      toast({ title: "Post Published!", description: "Your post has been sent to GHL Social Planner." });
      setIsPostOpen(false);
      resetPost();
      await fetchAll();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Post Failed", description: err.message || "Could not create post." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isVideo = file.type.startsWith("video/");
    setNewPost(prev => ({ ...prev, mediaType: isVideo ? "video" : "image", mediaPreview: URL.createObjectURL(file), mediaUrl: "" }));
  };

  const filteredPosts = posts.filter(p => {
    const matchSearch = !searchQuery || p.caption.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = filterStatus === "all" || p.status.toLowerCase() === filterStatus.toLowerCase();
    return matchSearch && matchStatus;
  });

  const totalLikes = posts.reduce((s, p) => s + (p.likes || 0), 0);
  const totalComments = posts.reduce((s, p) => s + (p.comments || 0), 0);
  const totalShares = posts.reduce((s, p) => s + (p.shares || 0), 0);

  const statsCards = [
    { label: "Total Posts", value: posts.length, icon: BarChart3, color: "text-indigo-500" },
    { label: "Published", value: posts.filter(p => p.status === "Published").length, icon: CheckCircle2, color: "text-emerald-500" },
    { label: "Scheduled", value: posts.filter(p => p.status === "Scheduled").length, icon: Clock, color: "text-amber-500" },
    { label: "Total Likes", value: totalLikes || "—", icon: Heart, color: "text-red-500" },
    { label: "Total Comments", value: totalComments || "—", icon: MessageSquare, color: "text-amber-500" },
    { label: "Total Shares", value: totalShares || "—", icon: Share2, color: "text-teal-500" },
    { label: "Accounts", value: ghlAccounts.length, icon: Users, color: "text-blue-500" },
    { label: "Draft Posts", value: posts.filter(p => p.status === "Draft").length, icon: Eye, color: "text-purple-500" },
  ];

  const postsTable = (showEngagement = false) => (
    <Card className="rounded-xl border border-border/50 shadow-sm overflow-hidden bg-card/50">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow className="hover:bg-transparent border-border/50">
            <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-3 px-4 w-16">Media</TableHead>
            <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-3">Caption</TableHead>
            <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-3 w-28">Status</TableHead>
            <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-3 w-36">Type</TableHead>
            {showEngagement && (
              <>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-3 w-20">Likes</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-3 w-20">Comments</TableHead>
              </>
            )}
            <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-3 w-44">Date</TableHead>
            <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-3 w-20">Social</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            Array(5).fill(0).map((_, i) => (
              <TableRow key={i}>
                <TableCell colSpan={showEngagement ? 8 : 6} className="px-4 py-3">
                  <Skeleton className="h-14 w-full rounded-lg" />
                </TableCell>
              </TableRow>
            ))
          ) : filteredPosts.length > 0 ? (
            filteredPosts.map((item, i) => (
              <TableRow key={item.id || i} className="hover:bg-muted/30 border-border/30 transition-all">
                <TableCell className="px-4 py-3">
                  {item.firstMedia ? (
                    item.isVideo
                      ? <div className="w-14 h-14 rounded-lg bg-black flex items-center justify-center"><PlayCircle size={20} className="text-white/80" /></div>
                      : <img src={item.firstMedia} alt="media" className="w-14 h-14 rounded-lg object-cover border border-border/30" />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center">
                      <ImageIcon size={18} className="opacity-20" />
                    </div>
                  )}
                </TableCell>
                <TableCell className="py-3 max-w-[260px]">
                  <p className="text-sm font-medium line-clamp-2">{item.caption}</p>
                </TableCell>
                <TableCell className="py-3">{statusBadge(item.status)}</TableCell>
                <TableCell className="py-3">
                  <span className="text-xs text-muted-foreground bg-muted/50 border border-border/40 px-2 py-0.5 rounded-md font-medium">
                    {item.type}
                  </span>
                </TableCell>
                {showEngagement && (
                  <>
                    <TableCell className="py-3 text-sm">{item.likes > 0 ? item.likes : "—"}</TableCell>
                    <TableCell className="py-3 text-sm">{item.comments > 0 ? item.comments : "—"}</TableCell>
                  </>
                )}
                <TableCell className="py-3 text-xs text-muted-foreground">
                  {item.date ? (
                    <>
                      <div>{new Date(item.date).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}</div>
                      <div className="opacity-60">{new Date(item.date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</div>
                    </>
                  ) : "—"}
                </TableCell>
                <TableCell className="py-3">
                  <div className="flex items-center gap-1">
                    {item.accounts.length > 0
                      ? item.accounts.map((acc: any, ai: number) => <AccountBadge key={ai} account={acc} />)
                      : item.platform
                        ? <AccountBadge account={{ platform: item.platform }} />
                        : <span className="text-xs opacity-30">—</span>
                    }
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={showEngagement ? 8 : 6} className="py-20 text-center text-muted-foreground">
                <div className="flex flex-col items-center gap-3 opacity-40">
                  <CalendarDays size={40} />
                  <p className="text-sm font-semibold">
                    {searchQuery || filterStatus !== "all" ? "No posts match your filter" : "No posts found in GHL Social Planner"}
                  </p>
                  <p className="text-xs">Click "New Post" to create your first post</p>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Card>
  );

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

        {/* SOCIAL PLANNER */}
        {activeMainTab === "social" && (
          <div className="flex flex-col flex-1 overflow-hidden">

            {/* Header */}
            <div className="px-8 py-5 border-b bg-card/10 flex items-center justify-between shrink-0">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Social Planner</h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {ghlAccounts.length > 0
                    ? `${ghlAccounts.length} account${ghlAccounts.length > 1 ? "s" : ""} connected via GHL`
                    : "Connect social accounts in GHL to enable live publishing"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-9 w-9 rounded-md" onClick={fetchAll}>
                  <RefreshCw size={16} className={cn(loading && "animate-spin")} />
                </Button>
                <Button variant="outline" className="h-9 rounded-md" onClick={() => setActiveSocialTab("settings")}>
                  <Plus size={16} className="mr-2" /> Socials
                </Button>
                <Button className="h-9 rounded-md px-5 font-bold" onClick={() => setIsPostOpen(true)}>
                  <Plus size={16} className="mr-2" /> New Post
                </Button>
              </div>
            </div>

            {/* Connected accounts bar from GHL */}
            {ghlAccounts.length > 0 && (
              <div className="px-8 py-2 border-b bg-muted/20 flex items-center gap-3 flex-wrap shrink-0">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">GHL Accounts:</span>
                {ghlAccounts.map((acc, i) => {
                  const platform = (acc.platform || acc.type || "").toLowerCase();
                  const meta = getPlatformMeta(platform);
                  const Icon = meta.icon;
                  const name = acc.name || acc.displayName || meta.label;
                  const pic = acc.picture || acc.profilePicture;
                  return (
                    <div key={acc._id || acc.id || i} className="flex items-center gap-1.5 bg-card border border-border/50 rounded-full px-2.5 py-1">
                      {pic
                        ? <img src={pic} className="w-4 h-4 rounded-full" alt={name} />
                        : <Icon size={11} className={meta.color} />}
                      <span className="text-xs font-medium">{name}</span>
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    </div>
                  );
                })}
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
                      {tab.value === "comments" && posts.reduce((s, p) => s + (p.comments || 0), 0) > 0 && (
                        <Badge className="ml-2 bg-amber-400 text-black text-[9px] font-bold h-4 px-1.5">
                          {posts.reduce((s, p) => s + (p.comments || 0), 0)}
                        </Badge>
                      )}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>

            {/* Filter bar */}
            {(activeSocialTab === "planner" || activeSocialTab === "content") && (
              <div className="px-8 py-3 border-b flex items-center justify-between gap-4 bg-background/30 shrink-0">
                <div className="flex items-center gap-2">
                  {["all", "Published", "Scheduled", "Draft"].map(s => (
                    <Button
                      key={s}
                      variant={filterStatus === s ? "default" : "outline"}
                      size="sm"
                      className="h-8 rounded-md text-xs"
                      onClick={() => setFilterStatus(s)}
                    >
                      {s === "all" ? "All" : s}
                    </Button>
                  ))}
                  <Button variant="ghost" size="sm" onClick={fetchAll} className="h-8 px-3">
                    <RefreshCw size={13} className={cn(loading && "animate-spin")} />
                  </Button>
                </div>
                <div className="relative w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
                  <Input
                    placeholder="Search by caption (min 3 chars)"
                    className="pl-10 h-9 rounded-lg text-sm bg-card/50"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto p-6 no-scrollbar">

              {activeSocialTab === "planner" && postsTable(false)}
              {activeSocialTab === "content" && postsTable(true)}

              {/* COMMENTS */}
              {activeSocialTab === "comments" && (
                <div className="space-y-4">
                  {loading ? (
                    Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)
                  ) : (
                    <div className="flex flex-col items-center justify-center h-64 opacity-40 gap-3">
                      <MessageSquare size={48} />
                      <p className="font-bold text-base">Comments</p>
                      <p className="text-sm text-center">Comments are managed directly in GHL. View them in your GHL backend under Marketing → Social Planner → Comments.</p>
                    </div>
                  )}
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
                        <p className="text-2xl font-bold">{typeof s.value === "number" ? s.value.toLocaleString("en-IN") : s.value}</p>
                        <p className="text-[11px] text-muted-foreground mt-1">From GHL Social Planner</p>
                      </Card>
                    ))}
                  </div>

                  {/* Per-account breakdown */}
                  {ghlAccounts.length > 0 && (
                    <div className="grid grid-cols-2 gap-4">
                      {ghlAccounts.map((acc, i) => {
                        const platform = (acc.platform || acc.type || "").toLowerCase();
                        const meta = getPlatformMeta(platform);
                        const Icon = meta.icon;
                        const name = acc.name || acc.displayName || meta.label;
                        const accId = acc._id || acc.id;
                        const accPosts = posts.filter(p => p.accounts?.some((a: any) => (a._id || a.id) === accId));
                        return (
                          <Card key={i} className="p-5 rounded-xl border border-border/50 bg-card/50">
                            <div className="flex items-center gap-3 mb-4">
                              <span className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-white", meta.bg)}>
                                <Icon size={16} />
                              </span>
                              <div>
                                <p className="text-sm font-bold">{name}</p>
                                <p className="text-[11px] text-muted-foreground capitalize">{platform}</p>
                              </div>
                              <div className="ml-auto w-2 h-2 rounded-full bg-emerald-400" />
                            </div>
                            <div className="grid grid-cols-3 gap-3 text-center">
                              <div><p className="text-lg font-bold">{accPosts.length || posts.length}</p><p className="text-[10px] text-muted-foreground">Posts</p></div>
                              <div><p className="text-lg font-bold">{accPosts.reduce((s, p) => s + (p.likes || 0), 0) || totalLikes || "—"}</p><p className="text-[10px] text-muted-foreground">Likes</p></div>
                              <div><p className="text-lg font-bold">{accPosts.reduce((s, p) => s + (p.comments || 0), 0) || totalComments || "—"}</p><p className="text-[10px] text-muted-foreground">Comments</p></div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* SOCIAL LISTENING */}
              {activeSocialTab === "listening" && (
                <div className="space-y-6">
                  <div className="flex flex-col items-center justify-center h-64 opacity-40 gap-3">
                    <Radio size={48} />
                    <p className="font-bold text-base">Social Listening</p>
                    <p className="text-sm text-center">Monitor mentions and hashtags via GHL's Social Listening feature.</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold mb-3">Top Hashtags in Your Posts</h3>
                    <div className="flex flex-wrap gap-2">
                      {Array.from(new Set(posts.flatMap(p => (p.caption || "").match(/#\w+/g) || []))).slice(0, 20).map((tag: string, i) => (
                        <Badge key={i} variant="outline" className="text-xs font-mono rounded-full">{tag}</Badge>
                      ))}
                      {posts.flatMap(p => (p.caption || "").match(/#\w+/g) || []).length === 0 && (
                        <p className="text-sm text-muted-foreground opacity-50">No hashtags found in your posts yet.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* SETTINGS */}
              {activeSocialTab === "settings" && (
                <div className="max-w-2xl space-y-5">
                  <div>
                    <h2 className="text-lg font-bold">Connected Social Accounts</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      These accounts are connected in your GHL backend. Manage connections directly in GHL under Marketing → Social Planner → Settings.
                    </p>
                  </div>

                  {loading ? (
                    Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)
                  ) : ghlAccounts.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                      {ghlAccounts.map((acc, i) => {
                        const platform = (acc.platform || acc.type || "").toLowerCase();
                        const meta = getPlatformMeta(platform);
                        const Icon = meta.icon;
                        const name = acc.name || acc.displayName || meta.label;
                        const pic = acc.picture || acc.profilePicture;
                        return (
                          <Card key={i} className="p-4 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-card/50 transition-all">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="relative">
                                {pic
                                  ? <img src={pic} className="w-9 h-9 rounded-full border border-border/30" alt={name} />
                                  : <span className={cn("w-9 h-9 rounded-xl flex items-center justify-center text-white", meta.bg)}><Icon size={18} /></span>
                                }
                                <span className={cn("absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background flex items-center justify-center text-white", meta.bg)}>
                                  <Icon size={8} />
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold truncate">{name}</p>
                                <p className="text-[11px] text-muted-foreground capitalize">{platform}</p>
                              </div>
                              <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" title="Connected" />
                            </div>
                            <div className="flex items-center gap-1.5">
                              <CheckCircle2 size={12} className="text-emerald-500" />
                              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">Connected via GHL</span>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  ) : (
                    <Card className="p-8 rounded-xl border border-border/50 bg-card/50 flex flex-col items-center gap-3 text-center opacity-60">
                      <Users size={40} />
                      <p className="font-bold">No accounts connected yet</p>
                      <p className="text-sm text-muted-foreground">Connect your social accounts in GHL under Marketing → Social Planner → Socials button</p>
                    </Card>
                  )}

                  <Card className="p-4 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30">
                    <p className="text-xs font-bold text-blue-700 dark:text-blue-400 mb-1 flex items-center gap-1.5">
                      <AlertCircle size={13} /> Managing Social Accounts
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-300 leading-relaxed">
                      Social account connections are managed directly in your GHL backend. Go to Marketing → Social Planner → click the "+ Socials" button to connect Facebook, Instagram, LinkedIn, TikTok, and more.
                    </p>
                  </Card>
                </div>
              )}
            </div>
          </div>
        )}

        {/* EMAILS TAB */}
        {activeMainTab === "emails" && (
          <div className="flex-1 p-8 overflow-y-auto">
            <h1 className="text-2xl font-bold mb-1">Email Templates</h1>
            <p className="text-sm text-muted-foreground mb-6">Email templates from your GHL account</p>
            {loading ? (
              <div className="space-y-3">{Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
            ) : emailData.length > 0 ? (
              <div className="space-y-3">
                {emailData.map((email, i) => (
                  <Card key={i} className="p-4 rounded-xl border border-border/50 bg-card/50 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <Mail size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{email.name || email.title || "Untitled Template"}</p>
                      <p className="text-xs text-muted-foreground">{email.subject || email.type || "Email Template"}</p>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 opacity-30 gap-3">
                <Mail size={48} />
                <p className="font-bold">No email templates found</p>
                <p className="text-sm">Create email templates in your GHL backend</p>
              </div>
            )}
          </div>
        )}

        {/* TRIGGER LINKS TAB */}
        {activeMainTab === "links" && (
          <div className="flex-1 p-8 overflow-y-auto">
            <h1 className="text-2xl font-bold mb-1">Trigger Links</h1>
            <p className="text-sm text-muted-foreground mb-6">Trigger links from your GHL account</p>
            {loading ? (
              <div className="space-y-3">{Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
            ) : linkData.length > 0 ? (
              <div className="space-y-3">
                {linkData.map((link, i) => (
                  <Card key={i} className="p-4 rounded-xl border border-border/50 bg-card/50 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <LinkIcon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{link.name || link.title || "Trigger Link"}</p>
                      <p className="text-xs text-muted-foreground truncate">{link.url || link.redirectURL || "—"}</p>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 opacity-30 gap-3">
                <LinkIcon size={48} />
                <p className="font-bold">No trigger links found</p>
              </div>
            )}
          </div>
        )}

        {/* OTHER TABS */}
        {!["social", "emails", "links"].includes(activeMainTab) && (
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
              <DialogTitle className="text-lg font-bold">New Social Post</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Create and publish a post to your GHL-connected social accounts.
              </DialogDescription>
            </DialogHeader>

            <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto no-scrollbar">

              {/* Post to — GHL accounts */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Post to</Label>
                {ghlAccounts.length === 0 ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/30 p-4 text-xs text-amber-700 dark:text-amber-400">
                    No social accounts connected. Connect accounts in GHL under Marketing → Social Planner → Socials.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {ghlAccounts.map((acc, i) => {
                      const id = acc._id || acc.id || String(i);
                      const platform = (acc.platform || acc.type || "").toLowerCase();
                      const meta = getPlatformMeta(platform);
                      const Icon = meta.icon;
                      const name = acc.name || acc.displayName || meta.label;
                      const pic = acc.picture || acc.profilePicture;
                      const selected = newPost.accountIds.includes(id);
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => toggleAccount(id)}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all",
                            selected ? "border-primary bg-primary/5" : "border-border hover:bg-muted/30"
                          )}
                        >
                          <div className="relative">
                            {pic
                              ? <img src={pic} className="w-8 h-8 rounded-full" alt={name} />
                              : <span className={cn("w-8 h-8 rounded-full flex items-center justify-center text-white", meta.bg)}><Icon size={14} /></span>
                            }
                            <span className={cn("absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-background flex items-center justify-center text-white", meta.bg)}>
                              <Icon size={8} />
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold">{name}</p>
                            <p className="text-[11px] text-muted-foreground capitalize">{platform}</p>
                          </div>
                          {selected && <CheckCircle2 size={16} className="text-primary shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Post type */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Post Type</Label>
                <div className="flex gap-2 flex-wrap">
                  {POST_TYPES.map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setNewPost(p => ({ ...p, type: t }))}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors",
                        newPost.type === t ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted/50"
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Caption */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Caption</Label>
                <Textarea
                  className="min-h-[100px] rounded-xl text-sm resize-none"
                  placeholder="Write your post content here... Use #hashtags and @mentions"
                  value={newPost.summary}
                  onChange={e => setNewPost({ ...newPost, summary: e.target.value })}
                  required
                />
              </div>

              {/* Media */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Media URL (optional)</Label>
                <div className="relative">
                  <Link2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-8 h-9 rounded-lg text-xs"
                    placeholder="https://example.com/image.jpg"
                    value={newPost.mediaUrl}
                    onChange={e => setNewPost(p => ({ ...p, mediaUrl: e.target.value, mediaPreview: "" }))}
                  />
                </div>
                {newPost.mediaUrl && (
                  <div className="relative inline-block">
                    <img src={newPost.mediaUrl} alt="preview" className="w-24 h-24 rounded-lg object-cover border border-border/50" />
                    <button type="button" onClick={() => setNewPost(p => ({ ...p, mediaUrl: "", mediaPreview: "" }))}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-black/70 rounded-full flex items-center justify-center text-white">
                      <X size={10} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="px-6 pb-6 pt-4 border-t gap-2">
              <Button type="button" variant="ghost" onClick={() => { setIsPostOpen(false); resetPost(); }}>Cancel</Button>
              <Button type="submit" className="px-8 font-bold" disabled={isSubmitting || newPost.accountIds.length === 0 || ghlAccounts.length === 0}>
                {isSubmitting
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Publishing...</>
                  : <><CheckCircle2 className="mr-2 h-4 w-4" /> Post</>}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
