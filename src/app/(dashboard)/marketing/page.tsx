"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { DashboardNav } from "@/components/dashboard/nav";
import { getEmailTemplates, getTriggerLinks } from "@/lib/ghl-actions";
import {
  getConnections, saveConnection, removeConnection,
  verifyFacebookToken, verifyInstagramToken,
  postToFacebook, postToInstagram,
  getAllPosts, getAllComments, getAllInsights,
} from "@/lib/social-api";
import type { SocialConnection } from "@/lib/social-api";
import { Card } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  CalendarDays, Mail, Link as LinkIcon, Search, Plus, Settings,
  Filter, BarChart3, Radio, RefreshCw,
  Loader2, CheckCircle2, Facebook, Instagram, Linkedin,
  Twitter, Image as ImageIcon, Video, X, Upload, Link2, PlayCircle,
  TrendingUp, Eye, Heart, Share2, Users, MessageSquare, Trash2,
  AlertCircle, ChevronDown, Clock, ExternalLink,
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

const PLATFORMS = [
  { name: "Facebook", id: "facebook", icon: Facebook, color: "text-blue-500", bg: "bg-blue-600" },
  { name: "Instagram", id: "instagram", icon: Instagram, color: "text-pink-500", bg: "bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600" },
  { name: "LinkedIn", id: "linkedin", icon: Linkedin, color: "text-blue-700", bg: "bg-blue-700" },
  { name: "Twitter / X", id: "twitter", icon: Twitter, color: "text-sky-400", bg: "bg-sky-500" },
];

type MediaType = "none" | "image" | "video";

const LOCAL_POSTS_KEY = "lf_local_social_posts";

function getLocalPosts(): any[] {
  try { return JSON.parse(localStorage.getItem(LOCAL_POSTS_KEY) || "[]"); } catch { return []; }
}

function saveLocalPost(post: any) {
  const posts = getLocalPosts();
  posts.unshift(post);
  localStorage.setItem(LOCAL_POSTS_KEY, JSON.stringify(posts.slice(0, 100)));
}

function updateLocalPost(localId: string, updates: any) {
  const posts = getLocalPosts();
  const idx = posts.findIndex((p: any) => p._localId === localId);
  if (idx > -1) {
    posts[idx] = { ...posts[idx], ...updates };
    localStorage.setItem(LOCAL_POSTS_KEY, JSON.stringify(posts));
  }
}

function PlatformIcon({ id, size = 11 }: { id: string; size?: number }) {
  const p = PLATFORMS.find(c => c.id === id.toLowerCase());
  if (!p) return null;
  const Icon = p.icon;
  return (
    <span className={cn("inline-flex items-center justify-center w-5 h-5 rounded-full text-white flex-shrink-0", p.bg)}>
      <Icon size={size} />
    </span>
  );
}

// ── Connect dialog with token form ────────────────────────────────────────────

interface ConnectDialogProps {
  open: boolean;
  platform: typeof PLATFORMS[0] | null;
  onClose: () => void;
  onConnected: (platform: string, conn: SocialConnection) => void;
}

function ConnectDialog({ open, platform, onClose, onConnected }: ConnectDialogProps) {
  const [token, setToken] = useState("");
  const [accountId, setAccountId] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (!open) { setToken(""); setAccountId(""); setError(""); }
  }, [open]);

  if (!platform) return null;
  const Icon = platform.icon;
  const isInstagram = platform.id === "instagram";
  const isFacebook = platform.id === "facebook";
  const canVerify = isFacebook || isInstagram;

  const handleConnect = async () => {
    if (!token.trim() || !accountId.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    setVerifying(true);
    setError("");
    try {
      let info: any;
      if (isFacebook) {
        info = await verifyFacebookToken(token.trim(), accountId.trim());
        const conn: SocialConnection = { token: token.trim(), pageId: accountId.trim(), name: info.name, picture: info.picture?.data?.url, platform: "facebook" };
        saveConnection("facebook", conn);
        onConnected("facebook", conn);
        toast({ title: "Facebook Connected!", description: `Connected to "${info.name}" successfully.` });
        onClose();
      } else if (isInstagram) {
        info = await verifyInstagramToken(token.trim(), accountId.trim());
        const conn: SocialConnection = { token: token.trim(), igUserId: accountId.trim(), name: info.name || info.username, picture: info.profile_picture_url, platform: "instagram" };
        saveConnection("instagram", conn);
        onConnected("instagram", conn);
        toast({ title: "Instagram Connected!", description: `Connected to @${info.username || info.name} successfully.` });
        onClose();
      }
    } catch (e: any) {
      setError(e.message || "Could not verify credentials. Check your token and ID.");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg rounded-2xl p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center gap-3 mb-1">
            <span className={cn("w-9 h-9 rounded-xl flex items-center justify-center text-white", platform.bg)}>
              <Icon size={20} />
            </span>
            <DialogTitle className="text-lg font-bold">Connect {platform.name}</DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Enter your access token and account ID to link your {platform.name} account.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-5 space-y-5">

          {/* How to get token */}
          {(isFacebook || isInstagram) && (
            <div className="rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-4 space-y-2">
              <p className="text-xs font-bold text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                <AlertCircle size={13} /> How to get your access token
              </p>
              <ol className="text-xs text-blue-700 dark:text-blue-300 space-y-1 list-decimal list-inside leading-relaxed">
                <li>Go to <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noreferrer" className="underline font-semibold">Meta Graph API Explorer <ExternalLink size={10} className="inline" /></a></li>
                <li>Sign in with your Facebook account</li>
                <li>Click <strong>Generate Access Token</strong> and grant all permissions</li>
                <li>Copy the token and your {isInstagram ? "Instagram Business Account ID" : "Facebook Page ID"} below</li>
              </ol>
              <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-1 mt-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">
                Open Graph API Explorer <ExternalLink size={11} />
              </a>
            </div>
          )}

          {!canVerify && (
            <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 p-4">
              <p className="text-xs text-amber-700 dark:text-amber-400">
                {platform.name} direct API is coming soon. For now, use Meta (Facebook/Instagram) accounts to publish.
              </p>
            </div>
          )}

          {canVerify && (
            <>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Access Token</Label>
                <Textarea
                  className="min-h-[80px] rounded-xl text-xs font-mono resize-none"
                  placeholder="Paste your Page Access Token here..."
                  value={token}
                  onChange={e => setToken(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  {isInstagram ? "Instagram Business Account ID" : "Facebook Page ID"}
                </Label>
                <Input
                  className="rounded-xl text-sm font-mono"
                  placeholder={isInstagram ? "e.g. 17841400000000000" : "e.g. 123456789012345"}
                  value={accountId}
                  onChange={e => setAccountId(e.target.value)}
                />
                <p className="text-[10px] text-muted-foreground">
                  {isInstagram
                    ? "Found in Meta Business Suite → Instagram Account → About"
                    : "Found in your Facebook Page → About → Page ID"}
                </p>
              </div>

              {error && (
                <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 dark:bg-red-950/30 rounded-lg p-3 border border-red-200">
                  <AlertCircle size={13} className="mt-0.5 shrink-0" /> {error}
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter className="px-6 pb-6 pt-3 border-t gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          {canVerify && (
            <Button onClick={handleConnect} disabled={verifying || !token.trim() || !accountId.trim()} className="px-6 font-bold">
              {verifying
                ? <><Loader2 size={14} className="mr-2 animate-spin" /> Verifying...</>
                : <><CheckCircle2 size={14} className="mr-2" /> Verify & Connect</>}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function MarketingPage() {
  const [activeMainTab, setActiveMainTab] = useState("social");
  const [activeSocialTab, setActiveSocialTab] = useState("planner");
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [insights, setInsights] = useState<{ facebook: any; instagram: any } | null>(null);
  const [connections, setConnections] = useState<Record<string, SocialConnection>>({});
  const [connectPlatform, setConnectPlatform] = useState<typeof PLATFORMS[0] | null>(null);
  const [isPostOpen, setIsPostOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailData, setEmailData] = useState<any[]>([]);
  const [linkData, setLinkData] = useState<any[]>([]);
  const [commentCount, setCommentCount] = useState(0);

  const [newPost, setNewPost] = useState({
    caption: "", type: "Post", status: "Published",
    channels: [] as string[],
    mediaType: "none" as MediaType,
    mediaUrl: "", mediaPreview: "",
  });

  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const loadConnections = useCallback(() => {
    setConnections(getConnections());
  }, []);

  const connectedPlatforms = Object.keys(connections);
  const isConnected = (id: string) => !!connections[id];

  const fetchSocialData = useCallback(async (conns: Record<string, SocialConnection>) => {
    setLoading(true);
    try {
      const [apiPosts, apiComments, apiInsights] = await Promise.all([
        getAllPosts(conns).catch(() => []),
        getAllComments(conns).catch(() => []),
        getAllInsights(conns).catch(() => null),
      ]);
      const localPosts = getLocalPosts();
      const apiIds = new Set(apiPosts.map((p: any) => p.id).filter(Boolean));
      const uniqueLocal = localPosts.filter((p: any) => !p.id || !apiIds.has(p.id));
      const merged = [...uniqueLocal, ...apiPosts].sort((a, b) =>
        new Date(b.scheduledDate || b.createdAt || 0).getTime() -
        new Date(a.scheduledDate || a.createdAt || 0).getTime()
      );
      setPosts(merged);
      setComments(apiComments);
      setCommentCount(apiComments.length);
      setInsights(apiInsights);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConnections();
  }, [loadConnections]);

  useEffect(() => {
    fetchSocialData(connections);
  }, [connections, fetchSocialData]);

  const resetPost = () => setNewPost({
    caption: "", type: "Post", status: "Published",
    channels: [], mediaType: "none", mediaUrl: "", mediaPreview: "",
  });

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.caption.trim()) {
      toast({ variant: "destructive", title: "Missing Caption", description: "Please write a caption for your post." });
      return;
    }
    if (newPost.channels.length === 0) {
      toast({ variant: "destructive", title: "No Channel Selected", description: "Select at least one platform." });
      return;
    }
    setIsSubmitting(true);

    const localId = `local_${Date.now()}`;
    const mediaUrl = newPost.mediaUrl.trim() || newPost.mediaPreview || "";
    const localPost: any = {
      _localId: localId,
      caption: newPost.caption,
      type: newPost.type,
      status: "publishing",
      channels: newPost.channels,
      scheduledDate: new Date().toISOString(),
      media: mediaUrl ? [{ url: mediaUrl, type: newPost.mediaType === "video" ? "video" : "photo" }] : [],
      createdAt: new Date().toISOString(),
      platformResults: {} as Record<string, string>,
    };

    saveLocalPost(localPost);
    setIsPostOpen(false);
    resetPost();
    setPosts(prev => [localPost, ...prev]);
    toast({ title: "Publishing...", description: `Posting to ${newPost.channels.join(", ")}...` });

    const results: Record<string, string> = {};
    let anySuccess = false;

    await Promise.all(newPost.channels.map(async (ch) => {
      const conn = connections[ch];
      if (!conn) {
        results[ch] = "not_connected";
        return;
      }
      try {
        if (ch === "facebook" && conn.pageId) {
          await postToFacebook(conn.token, conn.pageId, newPost.caption, mediaUrl || undefined);
          results[ch] = "published";
          anySuccess = true;
        } else if (ch === "instagram" && conn.igUserId) {
          const isReel = newPost.type === "Reel";
          const isVideo = newPost.mediaType === "video" || isReel;
          await postToInstagram(conn.token, conn.igUserId, newPost.caption,
            isVideo ? undefined : (mediaUrl || undefined),
            isVideo ? (mediaUrl || undefined) : undefined,
            isReel
          );
          results[ch] = "published";
          anySuccess = true;
        } else {
          results[ch] = "not_connected";
        }
      } catch (err: any) {
        results[ch] = "failed";
        console.error(`${ch} post error:`, err.message);
      }
    }));

    const finalStatus = anySuccess ? "published" : Object.values(results).every(r => r === "not_connected") ? "scheduled" : "failed";
    updateLocalPost(localId, { status: finalStatus, platformResults: results });
    setPosts(prev => prev.map(p => p._localId === localId ? { ...p, status: finalStatus, platformResults: results } : p));

    const connectedOnes = newPost.channels.filter(c => connections[c]);
    const unconnectedOnes = newPost.channels.filter(c => !connections[c]);

    if (anySuccess) {
      toast({ title: "Posted Successfully!", description: `Published to: ${connectedOnes.filter(c => results[c] === "published").join(", ")}` });
    } else if (unconnectedOnes.length === newPost.channels.length) {
      toast({ title: "Post Saved", description: "Connect your accounts in Settings to publish live." });
    } else {
      toast({ variant: "destructive", title: "Some Posts Failed", description: "Check account permissions and try again." });
    }

    setIsSubmitting(false);
    await fetchSocialData(connections);
  };

  const toggleChannel = (id: string) => setNewPost(prev => ({
    ...prev,
    channels: prev.channels.includes(id) ? prev.channels.filter(c => c !== id) : [...prev.channels, id],
  }));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isVideo = file.type.startsWith("video/");
    setNewPost(prev => ({ ...prev, mediaType: isVideo ? "video" : "image", mediaPreview: URL.createObjectURL(file), mediaUrl: "" }));
  };

  const clearMedia = () => {
    setNewPost(prev => ({ ...prev, mediaType: "none", mediaPreview: "", mediaUrl: "" }));
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleDisconnect = (platformId: string) => {
    removeConnection(platformId);
    setConnections(getConnections());
    toast({ title: "Account Disconnected", description: `${PLATFORMS.find(p => p.id === platformId)?.name} has been disconnected.` });
  };

  const onConnected = (platform: string, conn: SocialConnection) => {
    setConnections(prev => ({ ...prev, [platform]: conn }));
  };

  // ── Stat helpers ─────────────────────────────────────────────────────────────

  const totalLikes = posts.reduce((s, p) => s + (p.likes || 0), 0);
  const totalComments = posts.reduce((s, p) => s + (p.comments || 0), 0);
  const totalShares = posts.reduce((s, p) => s + (p.shares || 0), 0);
  const fbInsights = insights?.facebook;
  const igInsights = insights?.instagram;

  const statsCards = [
    { label: "Total Reach", value: fbInsights?.page_reach ?? igInsights?.reach ?? "—", icon: Users, color: "text-blue-500" },
    { label: "Impressions", value: fbInsights?.page_impressions ?? igInsights?.impressions ?? "—", icon: Eye, color: "text-purple-500" },
    { label: "Followers", value: fbInsights?.page_fans ?? igInsights?.follower_count ?? "—", icon: Users, color: "text-green-500" },
    { label: "Engagement", value: fbInsights?.page_engaged_users ?? (totalLikes + totalComments), icon: Heart, color: "text-pink-500" },
    { label: "Total Likes", value: totalLikes || "—", icon: Heart, color: "text-red-500" },
    { label: "Total Comments", value: totalComments || "—", icon: MessageSquare, color: "text-amber-500" },
    { label: "Total Shares", value: totalShares || "—", icon: Share2, color: "text-teal-500" },
    { label: "Total Posts", value: posts.length || "—", icon: BarChart3, color: "text-indigo-500" },
  ];

  // ── Post table ───────────────────────────────────────────────────────────────

  const postsTable = (showEngagement = false) => (
    <Card className="rounded-xl border border-border/50 shadow-sm overflow-hidden bg-card/50">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow className="hover:bg-transparent border-border/50">
            <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-3 px-5">Media</TableHead>
            <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-3">Caption</TableHead>
            <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-3">Channels</TableHead>
            <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-3">Type</TableHead>
            <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-3">Status</TableHead>
            {showEngagement && <>
              <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-3">Likes</TableHead>
              <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-3">Comments</TableHead>
            </>}
            <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-3">Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            Array(4).fill(0).map((_, i) => (
              <TableRow key={i}><TableCell colSpan={showEngagement ? 8 : 6} className="px-5 py-3"><Skeleton className="h-14 w-full" /></TableCell></TableRow>
            ))
          ) : posts.length > 0 ? (
            posts.map((item, i) => {
              const media = item.media?.[0] || item.mediaUrls?.[0];
              const mediaUrl = typeof media === "string" ? media : media?.url;
              const isVideo = media?.type === "video" || String(mediaUrl).match(/\.(mp4|mov|webm)/i);
              const channels: string[] = item.channels || item.socialPlatforms || [];
              const status = (item.status || "scheduled").toLowerCase();
              const statusColor = status === "published" || status === "posted"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : status === "failed" ? "bg-red-50 text-red-600 border-red-200"
                : status === "publishing" ? "bg-blue-50 text-blue-600 border-blue-200"
                : "bg-amber-50 text-amber-700 border-amber-200";
              return (
                <TableRow key={i} className="hover:bg-muted/30 border-border/30 transition-all">
                  <TableCell className="px-5 py-3">
                    {mediaUrl ? (
                      isVideo
                        ? <div className="w-14 h-14 rounded-lg bg-black flex items-center justify-center"><PlayCircle size={20} className="text-white/80" /></div>
                        : <img src={mediaUrl} alt="media" className="w-14 h-14 rounded-lg object-cover border border-border/30" />
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center"><ImageIcon size={18} className="opacity-20" /></div>
                    )}
                  </TableCell>
                  <TableCell className="py-3 max-w-[240px]">
                    <p className="text-sm font-medium line-clamp-2">{item.caption || item.summary || "No caption"}</p>
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="flex items-center gap-1">
                      {channels.length > 0 ? channels.map((ch: string) => <PlatformIcon key={ch} id={ch.toLowerCase()} />) : <span className="text-xs opacity-30">—</span>}
                    </div>
                  </TableCell>
                  <TableCell className="py-3 text-xs text-muted-foreground capitalize">{item.type || "Post"}</TableCell>
                  <TableCell className="py-3">
                    <Badge variant="outline" className={cn("text-[10px] uppercase font-bold tracking-tight border", statusColor)}>
                      {status === "publishing" ? <><Loader2 size={9} className="mr-1 animate-spin" />Publishing</> : item.status || "Scheduled"}
                    </Badge>
                  </TableCell>
                  {showEngagement && <>
                    <TableCell className="py-3 text-xs font-semibold text-muted-foreground">{item.likes ?? "—"}</TableCell>
                    <TableCell className="py-3 text-xs font-semibold text-muted-foreground">{item.comments ?? "—"}</TableCell>
                  </>}
                  <TableCell className="py-3 text-xs font-mono text-muted-foreground">
                    {item.scheduledDate ? new Date(item.scheduledDate).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—"}
                  </TableCell>
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={showEngagement ? 8 : 6} className="h-[360px] text-center">
                <div className="flex flex-col items-center justify-center py-16 opacity-30">
                  <CalendarDays size={48} className="mb-3" />
                  <p className="text-base font-bold">No posts yet</p>
                  <p className="text-sm mt-1">Click "New Post" to create and publish your first post</p>
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

        {activeMainTab === "social" && (
          <div className="flex flex-col flex-1 overflow-hidden">

            {/* Header */}
            <div className="px-8 py-5 border-b bg-card/10 flex items-center justify-between shrink-0">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Social Planner</h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {connectedPlatforms.length > 0
                    ? `${connectedPlatforms.length} account${connectedPlatforms.length > 1 ? "s" : ""} connected — posts publish live`
                    : "No accounts connected — go to Settings to connect"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-9 w-9 rounded-md" onClick={() => fetchSocialData(connections)}>
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

            {/* Connected accounts bar */}
            {connectedPlatforms.length > 0 && (
              <div className="px-8 py-2 border-b bg-muted/20 flex items-center gap-3 shrink-0">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Live:</span>
                {connectedPlatforms.map(pid => {
                  const conn = connections[pid];
                  const plat = PLATFORMS.find(p => p.id === pid);
                  if (!plat) return null;
                  const Icon = plat.icon;
                  return (
                    <div key={pid} className="flex items-center gap-1.5 bg-card border border-border/50 rounded-full px-2.5 py-1">
                      {conn.picture
                        ? <img src={conn.picture} className="w-4 h-4 rounded-full" alt="" />
                        : <Icon size={11} className={plat.color} />}
                      <span className="text-xs font-medium">{conn.name || plat.name}</span>
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
                      {tab.value === "comments" && commentCount > 0 && (
                        <Badge className="ml-2 bg-amber-400 text-black text-[9px] font-bold h-4 px-1.5">{commentCount}</Badge>
                      )}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>

            {/* Filter bar */}
            {(activeSocialTab === "planner" || activeSocialTab === "content") && (
              <div className="px-8 py-3 border-b flex items-center justify-between gap-4 bg-background/30 shrink-0">
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="sm" className="h-8 rounded-md">All Platforms <ChevronDown size={13} className="ml-1" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => fetchSocialData(connections)} className="h-8 px-3">
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

              {activeSocialTab === "planner" && postsTable(false)}

              {activeSocialTab === "content" && postsTable(true)}

              {/* COMMENTS */}
              {activeSocialTab === "comments" && (
                <div className="space-y-4">
                  {loading ? (
                    Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)
                  ) : comments.length > 0 ? (
                    comments.map((c, i) => (
                      <Card key={i} className="p-4 rounded-xl border border-border/50 bg-card/50">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-bold text-xs shrink-0">
                            {(c.from?.name || c.username || "?")[0]?.toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-semibold">{c.from?.name || c.username || "Unknown"}</span>
                              <PlatformIcon id={c.platform || "facebook"} size={9} />
                              {c.created_time || c.timestamp ? (
                                <span className="text-[10px] text-muted-foreground ml-auto">
                                  {new Date(c.created_time || c.timestamp).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}
                                </span>
                              ) : null}
                            </div>
                            <p className="text-sm text-muted-foreground">{c.message || c.text}</p>
                            {c.postCaption && (
                              <p className="text-[10px] text-muted-foreground/50 mt-1 truncate">On: {c.postCaption}</p>
                            )}
                          </div>
                          {(c.like_count ?? 0) > 0 && (
                            <div className="flex items-center gap-1 text-[11px] text-muted-foreground shrink-0">
                              <Heart size={11} className="text-red-400" /> {c.like_count}
                            </div>
                          )}
                        </div>
                      </Card>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center h-64 opacity-40 gap-3">
                      <MessageSquare size={48} />
                      <p className="font-bold text-base">No comments yet</p>
                      <p className="text-sm text-center">Comments from your connected social accounts will appear here automatically.</p>
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
                        <p className="text-[11px] text-muted-foreground mt-1">
                          {connectedPlatforms.length > 0 ? "From connected accounts" : "Connect accounts to see stats"}
                        </p>
                      </Card>
                    ))}
                  </div>
                  {connectedPlatforms.length === 0 && (
                    <Card className="p-6 rounded-xl border border-border/50 bg-card/50 flex flex-col items-center justify-center py-12 opacity-40 gap-3">
                      <TrendingUp size={48} />
                      <p className="font-bold">No analytics data yet</p>
                      <p className="text-sm">Connect your social accounts in Settings and post content to see performance.</p>
                    </Card>
                  )}
                  {/* Per-platform breakdown */}
                  {connectedPlatforms.length > 0 && (
                    <div className="grid grid-cols-2 gap-4">
                      {connectedPlatforms.map(pid => {
                        const plat = PLATFORMS.find(p => p.id === pid);
                        const conn = connections[pid];
                        if (!plat) return null;
                        const Icon = plat.icon;
                        const platPosts = posts.filter(p => (p.channels || []).includes(pid));
                        return (
                          <Card key={pid} className="p-5 rounded-xl border border-border/50 bg-card/50">
                            <div className="flex items-center gap-3 mb-4">
                              <span className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-white", plat.bg)}>
                                <Icon size={16} />
                              </span>
                              <div>
                                <p className="text-sm font-bold">{plat.name}</p>
                                <p className="text-[11px] text-muted-foreground">{conn.name}</p>
                              </div>
                              <div className="ml-auto w-2 h-2 rounded-full bg-emerald-400" />
                            </div>
                            <div className="grid grid-cols-3 gap-3 text-center">
                              <div>
                                <p className="text-lg font-bold">{platPosts.length}</p>
                                <p className="text-[10px] text-muted-foreground">Posts</p>
                              </div>
                              <div>
                                <p className="text-lg font-bold">{platPosts.reduce((s, p) => s + (p.likes || 0), 0)}</p>
                                <p className="text-[10px] text-muted-foreground">Likes</p>
                              </div>
                              <div>
                                <p className="text-lg font-bold">{platPosts.reduce((s, p) => s + (p.comments || 0), 0)}</p>
                                <p className="text-[10px] text-muted-foreground">Comments</p>
                              </div>
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
                  {connectedPlatforms.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 opacity-40 gap-3">
                      <Radio size={48} />
                      <p className="font-bold text-base">Social Listening</p>
                      <p className="text-sm text-center">Connect your accounts to monitor mentions and hashtags.</p>
                    </div>
                  ) : (
                    <>
                      <div>
                        <h3 className="text-sm font-bold mb-3">Recent Mentions</h3>
                        <div className="space-y-3">
                          {comments.filter(c => c.message?.includes("@")).slice(0, 5).length > 0
                            ? comments.filter(c => c.message?.includes("@")).slice(0, 5).map((c, i) => (
                              <Card key={i} className="p-4 rounded-xl border border-border/50 bg-card/50">
                                <div className="flex items-center gap-3">
                                  <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                                    {(c.from?.name || c.username || "?")[0]?.toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="text-xs font-semibold">{c.from?.name || c.username}</p>
                                    <p className="text-xs text-muted-foreground">{c.message || c.text}</p>
                                  </div>
                                  <PlatformIcon id={c.platform || "facebook"} />
                                </div>
                              </Card>
                            ))
                            : <Card className="p-6 rounded-xl border border-border/50 text-center opacity-40">
                                <p className="text-sm">No mentions found in recent posts.</p>
                              </Card>
                          }
                        </div>
                      </div>
                      <div>
                        <h3 className="text-sm font-bold mb-3">Top Hashtags in Your Posts</h3>
                        <div className="flex flex-wrap gap-2">
                          {Array.from(new Set(
                            posts.flatMap(p => (p.caption || "").match(/#\w+/g) || [])
                          )).slice(0, 20).map((tag: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-xs font-mono rounded-full">{tag}</Badge>
                          ))}
                          {posts.flatMap(p => (p.caption || "").match(/#\w+/g) || []).length === 0 && (
                            <p className="text-sm text-muted-foreground opacity-50">No hashtags found in your posts yet.</p>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* SETTINGS */}
              {activeSocialTab === "settings" && (
                <div className="max-w-2xl space-y-5">
                  <div>
                    <h2 className="text-lg font-bold">Social Account Settings</h2>
                    <p className="text-sm text-muted-foreground mt-1">Connect your accounts to enable live publishing and real-time analytics.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {PLATFORMS.map(plat => {
                      const Icon = plat.icon;
                      const conn = connections[plat.id];
                      const connected = !!conn;
                      return (
                        <Card key={plat.id} className={cn("p-4 rounded-xl border bg-card/50 transition-all", connected ? "border-emerald-300 dark:border-emerald-800" : "border-border/50")}>
                          <div className="flex items-center gap-3 mb-3">
                            <span className={cn("w-9 h-9 rounded-xl flex items-center justify-center text-white", plat.bg)}>
                              <Icon size={18} />
                            </span>
                            <div className="flex-1">
                              <p className="text-sm font-bold">{plat.name}</p>
                              {connected && <p className="text-[11px] text-muted-foreground truncate">{conn.name}</p>}
                            </div>
                            {connected && <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" title="Connected" />}
                          </div>
                          {connected ? (
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" className="flex-1 h-7 text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                                disabled>
                                <CheckCircle2 size={11} className="mr-1" /> Connected
                              </Button>
                              <Button size="sm" variant="outline" className="h-7 text-xs text-destructive hover:bg-destructive/10"
                                onClick={() => handleDisconnect(plat.id)}>
                                <Trash2 size={11} />
                              </Button>
                            </div>
                          ) : (
                            <Button size="sm" className="w-full h-8 text-xs font-bold"
                              onClick={() => setConnectPlatform(plat)}>
                              Connect {plat.name}
                            </Button>
                          )}
                        </Card>
                      );
                    })}
                  </div>
                  <Card className="p-4 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30">
                    <p className="text-xs font-bold text-blue-700 dark:text-blue-400 mb-1 flex items-center gap-1.5"><AlertCircle size={13} /> How connecting works</p>
                    <p className="text-xs text-blue-600 dark:text-blue-300 leading-relaxed">
                      Click Connect, enter your Facebook Page Access Token and Page/Account ID from the Meta Graph API Explorer. Posts you create will be published directly to your connected accounts in real time.
                    </p>
                  </Card>
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
                  placeholder="Write your post content here... Use #hashtags and @mentions"
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
                    <div className="border-2 border-dashed border-border/60 rounded-xl p-4 flex flex-col items-center gap-2 cursor-pointer hover:bg-muted/30 transition-colors"
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
                      <span className="text-[10px] text-muted-foreground font-semibold uppercase">or paste public URL</span>
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
                    <option value="Published">Publish Now</option>
                    <option value="Scheduled">Schedule</option>
                    <option value="Draft">Save as Draft</option>
                  </select>
                </div>
              </div>

              {/* Channel picker */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Publish To</Label>
                <div className="grid grid-cols-4 gap-2">
                  {PLATFORMS.map(plat => {
                    const Icon = plat.icon;
                    const active = newPost.channels.includes(plat.id);
                    const conn = connections[plat.id];
                    return (
                      <button key={plat.id} type="button" onClick={() => toggleChannel(plat.id)}
                        className={cn("flex flex-col items-center gap-1.5 py-3 rounded-xl border text-xs font-semibold transition-all relative",
                          active ? "bg-primary/10 border-primary text-primary" : "border-border/50 text-muted-foreground hover:border-border hover:bg-muted/30")}>
                        <Icon size={20} className={active ? plat.color : ""} />
                        <span className="text-[10px]">{plat.name}</span>
                        {active && <CheckCircle2 size={11} className="text-primary" />}
                        {conn && (
                          <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400" title="Connected" />
                        )}
                      </button>
                    );
                  })}
                </div>
                {newPost.channels.length === 0 && (
                  <p className="text-[11px] text-amber-600">Select at least one platform to publish to</p>
                )}
                {newPost.channels.some(c => !connections[c]) && newPost.channels.length > 0 && (
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <AlertCircle size={11} />
                    {newPost.channels.filter(c => !connections[c]).map(c => PLATFORMS.find(p => p.id === c)?.name).join(", ")} not connected — post will be saved locally only.
                  </p>
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

      {/* ── CONNECT DIALOG ── */}
      <ConnectDialog
        open={!!connectPlatform}
        platform={connectPlatform}
        onClose={() => setConnectPlatform(null)}
        onConnected={onConnected}
      />
    </div>
  );
}
