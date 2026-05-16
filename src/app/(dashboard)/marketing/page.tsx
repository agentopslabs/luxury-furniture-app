"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { DashboardNav } from "@/components/dashboard/nav";
import { getSocialPosts, getEmailTemplates, getTriggerLinks, createSocialPost, getSocialAccounts } from "@/lib/ghl-actions";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
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
  Twitter,
  Image as ImageIcon,
  Video,
  X,
  Upload,
  Link2,
  PlayCircle,
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
  { name: "Facebook", id: "facebook", icon: Facebook, color: "text-blue-500", bg: "bg-blue-500" },
  { name: "Instagram", id: "instagram", icon: Instagram, color: "text-pink-500", bg: "bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600" },
  { name: "LinkedIn", id: "linkedin", icon: Linkedin, color: "text-blue-700", bg: "bg-blue-700" },
  { name: "Twitter", id: "twitter", icon: Twitter, color: "text-sky-400", bg: "bg-sky-500" },
];

type MediaType = "none" | "image" | "video";

function PlatformIcon({ id, size = 14 }: { id: string; size?: number }) {
  const ch = availableChannels.find(c => c.id === id);
  if (!ch) return null;
  const Icon = ch.icon;
  return (
    <span className={cn("inline-flex items-center justify-center w-5 h-5 rounded-full text-white", ch.bg)}>
      <Icon size={size - 2} />
    </span>
  );
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

  const fetchAccounts = useCallback(async () => {
    const accounts = await getSocialAccounts();
    setConnectedAccounts(accounts);
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
      toast({ variant: "destructive", title: "Missing Content", description: "Please write a caption for your post." });
      return;
    }
    if (newPost.channels.length === 0) {
      toast({ variant: "destructive", title: "No Channels Selected", description: "Select at least one social channel." });
      return;
    }
    setIsSubmitting(true);
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
      toast({ title: "Post Published!", description: `Your post has been sent to ${newPost.channels.join(", ")}.` });
      setIsPostOpen(false);
      resetPost();
      fetchData();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Post Failed", description: error.message || "Could not publish. Check your connected accounts." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleChannel = (channelId: string) => {
    setNewPost(prev => ({
      ...prev,
      channels: prev.channels.includes(channelId)
        ? prev.channels.filter(id => id !== channelId)
        : [...prev.channels, channelId],
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isVideo = file.type.startsWith("video/");
    const preview = URL.createObjectURL(file);
    setNewPost(prev => ({
      ...prev,
      mediaType: isVideo ? "video" : "image",
      mediaPreview: preview,
      mediaUrl: "",
    }));
  };

  const clearMedia = () => {
    setNewPost(prev => ({ ...prev, mediaType: "none", mediaPreview: "", mediaUrl: "" }));
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleConnectSocial = (platform: string) => {
    toast({ title: `${platform} Connection`, description: `Redirecting to connect your ${platform} account via GHL...` });
    setIsSocialsOpen(false);
  };

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

            {/* Social header */}
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
                <Button className="h-9 rounded-md bg-primary hover:bg-primary/90 px-5 font-bold" onClick={() => setIsPostOpen(true)}>
                  <Plus size={16} className="mr-2" /> New Post
                </Button>
              </div>
            </div>

            {/* Connected accounts bar */}
            {connectedAccounts.length > 0 && (
              <div className="px-8 py-2.5 border-b bg-muted/20 flex items-center gap-3 shrink-0">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Connected:</span>
                {connectedAccounts.map((acc, i) => (
                  <div key={i} className="flex items-center gap-1.5 bg-card border border-border/50 rounded-full px-2.5 py-1">
                    <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                      <Facebook size={10} className="text-white" />
                    </div>
                    <span className="text-xs font-medium">{acc.name || acc.accountName || "Account"}</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  </div>
                ))}
              </div>
            )}

            {/* Sub tabs */}
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

            {/* Filter bar */}
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
              <div className="relative w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
                <Input placeholder="Search posts..." className="pl-10 h-9 rounded-lg text-sm border-border bg-card/50" />
              </div>
            </div>

            {/* Posts table */}
            <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
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
                      Array(5).fill(0).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell colSpan={6} className="px-5 py-3"><Skeleton className="h-14 w-full" /></TableCell>
                        </TableRow>
                      ))
                    ) : dataList.length > 0 ? (
                      dataList.map((item, i) => {
                        const media = item.media?.[0] || item.mediaUrls?.[0];
                        const mediaUrl = typeof media === "string" ? media : media?.url;
                        const isVideo = media?.type === "video" || mediaUrl?.match(/\.(mp4|mov|webm)/i);
                        const channels: string[] = item.channels || item.socialPlatforms || [];
                        const statusColor =
                          item.status === "published" || item.status === "Posted"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : item.status === "failed"
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
                                  <img src={mediaUrl} alt="post media" className="w-14 h-14 rounded-lg object-cover border border-border/30" />
                                )
                              ) : (
                                <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center">
                                  <ImageIcon size={18} className="text-muted-foreground opacity-30" />
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="py-3 max-w-[260px]">
                              <p className="text-sm font-medium line-clamp-2">{item.caption || item.summary || item.content || "No caption"}</p>
                            </TableCell>
                            <TableCell className="py-3">
                              <div className="flex items-center gap-1">
                                {channels.length > 0
                                  ? channels.map((ch: string) => <PlatformIcon key={ch} id={ch.toLowerCase()} />)
                                  : <span className="text-xs text-muted-foreground opacity-40">—</span>}
                              </div>
                            </TableCell>
                            <TableCell className="py-3">
                              <span className="text-xs text-muted-foreground capitalize">{item.type || item.postType || "Post"}</span>
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
                        <TableCell colSpan={6} className="h-[380px] text-center">
                          <div className="flex flex-col items-center justify-center py-16 opacity-30">
                            <CalendarDays size={52} className="mb-4" />
                            <p className="text-lg font-bold">No posts yet</p>
                            <p className="text-sm mt-1">Click "New Post" to create and publish your first post</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Card>
            </div>
          </div>
        )}

        {activeMainTab !== "social" && (
          <div className="flex-1 flex flex-col items-center justify-center opacity-30">
            <BarChart3 size={56} className="mb-4" />
            <h2 className="text-xl font-bold">{mainTabs.find(t => t.value === activeMainTab)?.name} Module</h2>
            <p className="text-sm mt-1">Coming soon</p>
          </div>
        )}
      </main>

      {/* ── NEW POST DIALOG ── */}
      <Dialog open={isPostOpen} onOpenChange={(o) => { setIsPostOpen(o); if (!o) resetPost(); }}>
        <DialogContent className="max-w-xl rounded-2xl p-0 overflow-hidden">
          <form onSubmit={handleCreatePost}>
            <DialogHeader className="px-6 pt-6 pb-4 border-b">
              <DialogTitle className="text-lg font-bold">Create New Post</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">Write your post and publish to Instagram, Facebook and more via GHL.</DialogDescription>
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

              {/* Media section */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Media (optional)</Label>

                {/* Media type tabs */}
                <div className="flex gap-2">
                  <button type="button" onClick={() => setNewPost(p => ({ ...p, mediaType: p.mediaType === "image" ? "none" : "image", mediaPreview: "", mediaUrl: "" }))}
                    className={cn("flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors",
                      newPost.mediaType === "image" ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted/50")}>
                    <ImageIcon size={13} /> Image
                  </button>
                  <button type="button" onClick={() => setNewPost(p => ({ ...p, mediaType: p.mediaType === "video" ? "none" : "video", mediaPreview: "", mediaUrl: "" }))}
                    className={cn("flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors",
                      newPost.mediaType === "video" ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted/50")}>
                    <Video size={13} /> Video
                  </button>
                </div>

                {/* Media input */}
                {newPost.mediaType !== "none" && (
                  <div className="space-y-2">
                    {/* File picker */}
                    <div
                      className="border-2 border-dashed border-border/60 rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted/30 transition-colors"
                      onClick={() => fileRef.current?.click()}
                    >
                      <Upload size={20} className="text-muted-foreground" />
                      <p className="text-xs text-muted-foreground text-center">
                        Click to upload {newPost.mediaType === "video" ? "a video" : "an image"}<br />
                        <span className="opacity-60">{newPost.mediaType === "video" ? "MP4, MOV, WebM" : "JPG, PNG, GIF, WebP"}</span>
                      </p>
                    </div>
                    <input
                      ref={fileRef}
                      type="file"
                      accept={newPost.mediaType === "video" ? "video/*" : "image/*"}
                      className="hidden"
                      onChange={handleFileChange}
                    />

                    {/* OR URL */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-px bg-border/50" />
                      <span className="text-[10px] text-muted-foreground font-semibold uppercase">or paste URL</span>
                      <div className="flex-1 h-px bg-border/50" />
                    </div>
                    <div className="relative">
                      <Link2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        className="pl-8 h-9 rounded-lg text-xs"
                        placeholder={newPost.mediaType === "video" ? "https://example.com/video.mp4" : "https://example.com/image.jpg"}
                        value={newPost.mediaUrl}
                        onChange={e => setNewPost(p => ({ ...p, mediaUrl: e.target.value, mediaPreview: "" }))}
                      />
                    </div>

                    {/* Preview */}
                    {(newPost.mediaPreview || newPost.mediaUrl) && (
                      <div className="relative rounded-xl overflow-hidden border border-border/50 bg-black">
                        {newPost.mediaType === "video" ? (
                          <video
                            src={newPost.mediaPreview || newPost.mediaUrl}
                            className="w-full max-h-48 object-contain"
                            controls
                          />
                        ) : (
                          <img
                            src={newPost.mediaPreview || newPost.mediaUrl}
                            alt="preview"
                            className="w-full max-h-48 object-contain"
                          />
                        )}
                        <button
                          type="button"
                          onClick={clearMedia}
                          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Post type + Schedule */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Post Type</Label>
                  <select
                    className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
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
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Status</Label>
                  <select
                    className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    value={newPost.status}
                    onChange={e => setNewPost({ ...newPost, status: e.target.value })}
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="Draft">Draft</option>
                    <option value="Published">Publish Now</option>
                  </select>
                </div>
              </div>

              {/* Channel selector */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Publish To</Label>
                <div className="grid grid-cols-4 gap-2">
                  {availableChannels.map(channel => {
                    const Icon = channel.icon;
                    const isActive = newPost.channels.includes(channel.id);
                    return (
                      <button
                        key={channel.id}
                        type="button"
                        onClick={() => toggleChannel(channel.id)}
                        className={cn(
                          "flex flex-col items-center gap-1.5 py-3 rounded-xl border text-xs font-semibold transition-all",
                          isActive
                            ? "bg-primary/10 border-primary text-primary"
                            : "border-border/50 text-muted-foreground hover:border-border hover:bg-muted/30"
                        )}
                      >
                        <Icon size={20} className={isActive ? channel.color : ""} />
                        {channel.name}
                        {isActive && <CheckCircle2 size={12} className="text-primary" />}
                      </button>
                    );
                  })}
                </div>
                {newPost.channels.length === 0 && (
                  <p className="text-[11px] text-amber-600">Select at least one channel to publish</p>
                )}
              </div>
            </div>

            <DialogFooter className="px-6 pb-6 pt-4 border-t">
              <Button type="button" variant="ghost" onClick={() => { setIsPostOpen(false); resetPost(); }}>Cancel</Button>
              <Button type="submit" className="px-8 font-bold" disabled={isSubmitting || newPost.channels.length === 0}>
                {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Publishing...</> : <><CheckCircle2 className="mr-2 h-4 w-4" /> Publish Post</>}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── CONNECT SOCIALS DIALOG ── */}
      <Dialog open={isSocialsOpen} onOpenChange={setIsSocialsOpen}>
        <DialogContent className="max-w-md rounded-2xl p-8">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-xl font-bold text-center">Connect Social Accounts</DialogTitle>
            <DialogDescription className="text-center text-sm text-muted-foreground">
              Connect your accounts through GHL to start publishing directly.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            {availableChannels.map(channel => {
              const Icon = channel.icon;
              return (
                <Button
                  key={channel.id}
                  variant="outline"
                  className="h-20 flex-col gap-2 rounded-xl border-border/50 hover:bg-muted/40"
                  onClick={() => handleConnectSocial(channel.name)}
                >
                  <Icon size={22} className={channel.color} />
                  <span className="text-xs font-bold">{channel.name}</span>
                </Button>
              );
            })}
          </div>
          <p className="mt-6 text-[11px] text-muted-foreground text-center opacity-60 leading-relaxed">
            By connecting, you authorize GHL to publish content on your behalf across selected social channels.
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
