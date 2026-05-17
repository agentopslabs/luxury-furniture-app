"use client";

import { useEffect, useState, useCallback } from "react";
import { DashboardNav } from "@/components/dashboard/nav";
import { getPipelines } from "@/lib/ghl-actions";
import { GHLPipeline } from "@/lib/ghl";
import {
  verifyFacebookToken,
  saveConnection,
  getConnections,
  removeConnection,
  SocialConnection,
} from "@/lib/social-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Layers,
  CheckCircle2,
  RefreshCw,
  Plus,
  Trash2,
  Settings,
  ChevronUp,
  ChevronRight,
  Facebook,
  Link2,
  Link2Off,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

type SubPage = "menu" | "pipelines" | "facebook";

const FB_FIELDS = [
  {
    key: "pageAccessToken",
    label: "Page Access Token",
    description: "Long-lived access token for your Facebook Page. Required to post and read data.",
    placeholder: "EAAxxxxxxxxxxxxxxx...",
    secret: true,
    required: true,
  },
  {
    key: "pageId",
    label: "Page ID",
    description: "Numeric ID of the Facebook Page you want to connect.",
    placeholder: "123456789012345",
    secret: false,
    required: true,
  },
  {
    key: "appId",
    label: "App ID",
    description: "Your Facebook App ID from the Meta Developer Portal.",
    placeholder: "1234567890",
    secret: false,
    required: false,
  },
  {
    key: "appSecret",
    label: "App Secret",
    description: "Your Facebook App Secret. Used to generate long-lived tokens.",
    placeholder: "a1b2c3d4e5f6...",
    secret: true,
    required: false,
  },
];

export default function SettingsPage() {
  const [subPage, setSubPage] = useState<SubPage>("menu");

  // ── Pipelines state ──────────────────────────────────────────────────────────
  const [pipelines, setPipelines] = useState<GHLPipeline[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addStageOpen, setAddStageOpen] = useState(false);
  const [newStageName, setNewStageName] = useState("");
  const [targetPipeline, setTargetPipeline] = useState<GHLPipeline | null>(null);

  // ── Facebook state ───────────────────────────────────────────────────────────
  const [fbFields, setFbFields] = useState({
    pageAccessToken: "",
    pageId: "",
    appId: "",
    appSecret: "",
  });
  const [fbReveal, setFbReveal] = useState<Record<string, boolean>>({});
  const [fbVerifying, setFbVerifying] = useState(false);
  const [fbConnection, setFbConnection] = useState<SocialConnection | null>(null);

  const { toast } = useToast();

  // ── Load saved Facebook connection from localStorage ─────────────────────────
  useEffect(() => {
    if (subPage === "facebook") {
      const conns = getConnections();
      if (conns.facebook) {
        setFbConnection(conns.facebook);
        setFbFields(prev => ({
          ...prev,
          pageAccessToken: conns.facebook.token || "",
          pageId: conns.facebook.pageId || "",
        }));
      }
    }
  }, [subPage]);

  // ── Pipeline helpers ─────────────────────────────────────────────────────────
  const fetchData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await getPipelines();
      setPipelines(data);
      if (data.length > 0 && !selectedId) setSelectedId(data[0].id);
      if (isManual) toast({ title: "Refreshed", description: `Loaded ${data.length} pipelines.` });
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Could not load pipelines." });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast, selectedId]);

  const handleOpenPipelines = () => {
    setSubPage("pipelines");
    if (pipelines.length === 0) fetchData();
  };

  const handleAddStage = () => {
    const trimmed = newStageName.trim();
    if (!trimmed || !targetPipeline) return;
    const updated = {
      ...targetPipeline,
      stages: [...targetPipeline.stages, { id: `local-${Date.now()}`, name: trimmed }],
    };
    setPipelines(prev => prev.map(p => p.id === updated.id ? updated : p));
    setTargetPipeline(updated);
    toast({ title: "Stage Added", description: `"${trimmed}" added to ${targetPipeline.name}.` });
    setAddStageOpen(false);
    setNewStageName("");
  };

  const handleDeleteStage = (pipeline: GHLPipeline, stageId: string, stageName: string) => {
    const updated = { ...pipeline, stages: pipeline.stages.filter(s => s.id !== stageId) };
    setPipelines(prev => prev.map(p => p.id === updated.id ? updated : p));
    if (targetPipeline?.id === pipeline.id) setTargetPipeline(updated);
    toast({ title: "Stage Removed", description: `"${stageName}" has been removed.` });
  };

  const selectedPipeline = pipelines.find(p => p.id === selectedId) || null;

  // ── Facebook helpers ─────────────────────────────────────────────────────────
  const handleFbVerify = async () => {
    if (!fbFields.pageAccessToken.trim() || !fbFields.pageId.trim()) {
      toast({ variant: "destructive", title: "Missing fields", description: "Page Access Token and Page ID are required." });
      return;
    }
    setFbVerifying(true);
    try {
      const info = await verifyFacebookToken(fbFields.pageAccessToken.trim(), fbFields.pageId.trim());
      const conn: SocialConnection = {
        platform: "facebook",
        token: fbFields.pageAccessToken.trim(),
        pageId: fbFields.pageId.trim(),
        name: info.name,
        picture: info.picture?.data?.url,
      };
      saveConnection("facebook", conn);
      setFbConnection(conn);
      toast({ title: "Connected!", description: `Linked to Facebook page "${info.name}".` });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Verification failed", description: e.message || "Invalid credentials." });
    } finally {
      setFbVerifying(false);
    }
  };

  const handleFbDisconnect = () => {
    removeConnection("facebook");
    setFbConnection(null);
    setFbFields({ pageAccessToken: "", pageId: "", appId: "", appSecret: "" });
    toast({ title: "Disconnected", description: "Facebook connection removed." });
  };

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <DashboardNav />

      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 shrink-0">
          <div className="flex items-center gap-2">
            <Settings size={18} className="text-primary" />
            <h1 className="text-base font-bold">Settings</h1>
          </div>
          {subPage === "pipelines" && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full border border-border/60"
              onClick={() => fetchData(true)}
              disabled={loading || refreshing}
              title="Refresh"
            >
              <RefreshCw size={15} className={cn(refreshing && "animate-spin")} />
            </Button>
          )}
        </div>

        {/* ── MENU VIEW ── */}
        {subPage === "menu" && (
          <div className="flex-1 overflow-y-auto p-6">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-4">Sections</p>
            <div className="space-y-2 max-w-sm">
              <button
                onClick={handleOpenPipelines}
                className="w-full flex items-center justify-between px-5 py-4 rounded-xl border border-border/50 bg-card hover:bg-muted/40 transition-colors group text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Layers size={15} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Pipelines</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Manage pipeline stages</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-muted-foreground group-hover:text-foreground transition-colors" />
              </button>

              <button
                onClick={() => setSubPage("facebook")}
                className="w-full flex items-center justify-between px-5 py-4 rounded-xl border border-border/50 bg-card hover:bg-muted/40 transition-colors group text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Facebook size={15} className="text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Facebook API</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Connect your Facebook Page</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-muted-foreground group-hover:text-foreground transition-colors" />
              </button>
            </div>
          </div>
        )}

        {/* ── PIPELINES SPLIT VIEW ── */}
        {subPage === "pipelines" && (
          <div className="flex flex-1 overflow-hidden divide-x divide-border/50">
            {/* Left — pipeline list */}
            <div className="w-72 shrink-0 flex flex-col overflow-hidden">
              <div className="px-5 pt-4 pb-3 shrink-0 flex items-center justify-between">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                  <Layers size={11} />
                  Pipelines
                </p>
                <button
                  onClick={() => setSubPage("menu")}
                  title="Back to Settings"
                  className="h-7 w-7 flex items-center justify-center rounded-full border border-border/60 hover:bg-muted/60 transition-colors text-muted-foreground hover:text-foreground"
                >
                  <ChevronUp size={13} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-4">
                {loading ? (
                  <div className="space-y-2">
                    {Array(4).fill(0).map((_, i) => (
                      <Skeleton key={i} className="h-[72px] w-full rounded-xl" />
                    ))}
                  </div>
                ) : pipelines.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-20 opacity-40">
                    <Layers size={28} className="text-muted-foreground" />
                    <p className="text-sm font-medium text-muted-foreground">No pipelines found</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {pipelines.map(pipeline => {
                      const isSelected = selectedId === pipeline.id;
                      return (
                        <button
                          key={pipeline.id}
                          onClick={() => setSelectedId(pipeline.id)}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors",
                            isSelected
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-muted/50 border border-border/40 bg-card"
                          )}
                        >
                          <CheckCircle2 size={15} className={cn(
                            "shrink-0 transition-colors",
                            isSelected ? "text-primary-foreground" : "text-muted-foreground/30"
                          )} />
                          <div className="flex-1 min-w-0">
                            <p className={cn(
                              "text-sm font-semibold truncate",
                              isSelected ? "text-primary-foreground" : "text-foreground"
                            )}>
                              {pipeline.name}
                            </p>
                            <p className={cn(
                              "text-xs mt-0.5",
                              isSelected ? "text-primary-foreground/70" : "text-muted-foreground"
                            )}>
                              {pipeline.stages.length} stage{pipeline.stages.length !== 1 ? "s" : ""}
                            </p>
                          </div>
                          <Badge className={cn(
                            "text-[10px] px-2 py-0.5 rounded-md border-0 shrink-0",
                            isSelected
                              ? "bg-white/20 text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          )}>
                            {pipeline.stages.length}
                          </Badge>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right — stage details */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {selectedPipeline ? (
                <>
                  <div className="px-6 py-4 border-b border-border/50 shrink-0 flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-bold">{selectedPipeline.name}</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {selectedPipeline.stages.length} stage{selectedPipeline.stages.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 px-3 text-xs rounded-lg gap-1"
                      onClick={() => {
                        setTargetPipeline(selectedPipeline);
                        setNewStageName("");
                        setAddStageOpen(true);
                      }}
                    >
                      <Plus size={12} /> Add Stage
                    </Button>
                  </div>

                  <div className="flex-1 overflow-y-auto no-scrollbar p-6">
                    {selectedPipeline.stages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center gap-3 py-20 opacity-40">
                        <Layers size={28} className="text-muted-foreground" />
                        <p className="text-sm font-medium text-muted-foreground">No stages yet</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-w-xl">
                        {selectedPipeline.stages.map((stage, idx) => (
                          <div
                            key={stage.id}
                            className="flex items-center gap-4 px-4 py-3.5 rounded-xl bg-card border border-border/50 hover:bg-muted/30 transition-colors group"
                          >
                            <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                              {idx + 1}
                            </div>
                            <span className="text-sm font-medium flex-1">{stage.name}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleDeleteStage(selectedPipeline, stage.id, stage.name)}
                            >
                              <Trash2 size={13} />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 opacity-30">
                  <Layers size={32} className="text-muted-foreground" />
                  <p className="text-sm font-medium text-muted-foreground">Select a pipeline</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── FACEBOOK API VIEW ── */}
        {subPage === "facebook" && (
          <div className="flex flex-1 overflow-hidden divide-x divide-border/50">
            {/* Left — info panel */}
            <div className="w-72 shrink-0 flex flex-col overflow-hidden border-r border-border/50">
              <div className="px-5 pt-4 pb-3 shrink-0 flex items-center justify-between">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                  <Facebook size={11} />
                  Facebook API
                </p>
                <button
                  onClick={() => setSubPage("menu")}
                  title="Back to Settings"
                  className="h-7 w-7 flex items-center justify-center rounded-full border border-border/60 hover:bg-muted/60 transition-colors text-muted-foreground hover:text-foreground"
                >
                  <ChevronUp size={13} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-4 space-y-3">
                {/* Connection status card */}
                <div className={cn(
                  "rounded-xl border px-4 py-3.5 flex items-center gap-3",
                  fbConnection
                    ? "border-green-500/30 bg-green-500/5"
                    : "border-border/50 bg-card"
                )}>
                  {fbConnection ? (
                    <>
                      <div className="w-8 h-8 rounded-full bg-green-500/15 flex items-center justify-center shrink-0">
                        <ShieldCheck size={15} className="text-green-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-green-600 dark:text-green-400">Connected</p>
                        <p className="text-[11px] text-muted-foreground truncate">{fbConnection.name || fbConnection.pageId}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <AlertCircle size={15} className="text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold">Not connected</p>
                        <p className="text-[11px] text-muted-foreground">Fill in the fields to connect</p>
                      </div>
                    </>
                  )}
                </div>

                {/* Required fields legend */}
                <div className="rounded-xl border border-border/50 bg-card px-4 py-3.5 space-y-2.5">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em]">Required fields</p>
                  {FB_FIELDS.filter(f => f.required).map(f => (
                    <div key={f.key} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                      <div>
                        <p className="text-xs font-medium">{f.label}</p>
                        <p className="text-[11px] text-muted-foreground leading-snug">{f.description}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Optional fields legend */}
                <div className="rounded-xl border border-border/50 bg-card px-4 py-3.5 space-y-2.5">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em]">Optional fields</p>
                  {FB_FIELDS.filter(f => !f.required).map(f => (
                    <div key={f.key} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 mt-1.5 shrink-0" />
                      <div>
                        <p className="text-xs font-medium">{f.label}</p>
                        <p className="text-[11px] text-muted-foreground leading-snug">{f.description}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Where to get credentials */}
                <div className="rounded-xl border border-border/50 bg-card px-4 py-3.5 space-y-1.5">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em]">Where to find these</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Go to <span className="font-semibold text-foreground">developers.facebook.com</span>, open your App → Graph API Explorer to generate a Page Access Token. Your Page ID is found in your Facebook Page settings under &quot;About&quot;.
                  </p>
                </div>
              </div>
            </div>

            {/* Right — form */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="px-6 py-4 border-b border-border/50 shrink-0 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold flex items-center gap-2">
                    <Facebook size={14} className="text-blue-500" />
                    Facebook API Configuration
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Enter your credentials to connect your Facebook Page
                  </p>
                </div>
                {fbConnection && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-3 text-xs rounded-lg gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                    onClick={handleFbDisconnect}
                  >
                    <Link2Off size={12} /> Disconnect
                  </Button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar p-6">
                <div className="max-w-lg space-y-5">
                  {FB_FIELDS.map(field => (
                    <div key={field.key} className="space-y-1.5">
                      <Label htmlFor={field.key} className="text-xs font-semibold flex items-center gap-1.5">
                        {field.label}
                        {field.required ? (
                          <span className="text-blue-500 text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/10">Required</span>
                        ) : (
                          <span className="text-muted-foreground text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted">Optional</span>
                        )}
                      </Label>
                      <p className="text-[11px] text-muted-foreground">{field.description}</p>
                      <div className="relative">
                        <Input
                          id={field.key}
                          type={field.secret && !fbReveal[field.key] ? "password" : "text"}
                          placeholder={field.placeholder}
                          value={fbFields[field.key as keyof typeof fbFields]}
                          onChange={e => setFbFields(prev => ({ ...prev, [field.key]: e.target.value }))}
                          className="pr-10 text-sm font-mono h-9 rounded-lg"
                        />
                        {field.secret && (
                          <button
                            type="button"
                            tabIndex={-1}
                            onClick={() => setFbReveal(prev => ({ ...prev, [field.key]: !prev[field.key] }))}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {fbReveal[field.key] ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  <div className="pt-2">
                    <Button
                      onClick={handleFbVerify}
                      disabled={fbVerifying || !fbFields.pageAccessToken.trim() || !fbFields.pageId.trim()}
                      className="gap-2 rounded-lg"
                    >
                      {fbVerifying ? (
                        <RefreshCw size={14} className="animate-spin" />
                      ) : fbConnection ? (
                        <ShieldCheck size={14} />
                      ) : (
                        <Link2 size={14} />
                      )}
                      {fbVerifying ? "Verifying..." : fbConnection ? "Re-verify Connection" : "Verify & Connect"}
                    </Button>
                  </div>

                  {fbConnection && (
                    <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-green-500/5 border border-green-500/20">
                      <CheckCircle2 size={14} className="text-green-500 shrink-0" />
                      <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                        Successfully connected to <span className="font-bold">{fbConnection.name || fbConnection.pageId}</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <Dialog open={addStageOpen} onOpenChange={setAddStageOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Stage</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground -mt-2">
            Adding to: <span className="font-medium text-foreground">{targetPipeline?.name}</span>
          </p>
          <Input
            placeholder="Stage name"
            value={newStageName}
            onChange={e => setNewStageName(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") handleAddStage(); }}
            autoFocus
          />
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" size="sm">Cancel</Button>
            </DialogClose>
            <Button size="sm" onClick={handleAddStage} disabled={!newStageName.trim()}>
              <Plus size={14} className="mr-1" /> Add Stage
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
