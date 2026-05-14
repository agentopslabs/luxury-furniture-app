"use client";

import { useEffect, useState, useMemo } from "react";
import { DashboardNav } from "@/components/dashboard/nav";
import { AIContactInsight } from "@/components/dashboard/ai-insight";
import { ghl, GHLContact, GHLAppointment } from "@/lib/ghl";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { 
  Clock, 
  ChevronRight, 
  ExternalLink,
  PlusCircle,
  MessageSquare,
  User,
  Activity,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Zap,
  ArrowUpRight,
  TrendingUp,
  Users,
  MousePointer2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function DashboardPage() {
  const [profile, setProfile] = useState<GHLContact | null>(null);
  const [appts, setAppts] = useState<GHLAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error' | 'mock'>('syncing');

  useEffect(() => {
    setIsMounted(true);
    async function fetchData() {
      const isMock = ghl.isMockMode();
      setSyncStatus(isMock ? 'mock' : 'syncing');
      
      try {
        const contacts = await ghl.getContacts(10);
        const p = contacts.length > 0 ? contacts[0] : await ghl.getContact("mock_id");
        
        if (p) {
          const a = await ghl.getAppointments(p.id);
          setProfile(p);
          setAppts(a);
        }
        
        setSyncStatus('synced');
      } catch (error) {
        console.error("Dashboard sync error:", error);
        setSyncStatus('error');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const historyForAI = useMemo(() => {
    return appts.map(a => ({
      date: isMounted ? new Date(a.startTime).toLocaleDateString() : "",
      summary: a.title
    }));
  }, [appts, isMounted]);

  if (!isMounted) return null;

  return (
    <div className="flex min-h-screen bg-background text-foreground overflow-hidden">
      <DashboardNav />
      <main className="flex-1 p-4 md:p-8 overflow-y-auto no-scrollbar relative">
        {/* Futuristic Background Glows */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-6xl mx-auto space-y-8 relative z-10">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/50">
                  Intelligence Hub
                </h1>
                <div className="flex items-center">
                  {syncStatus === 'synced' ? (
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 gap-1.5 h-6 animate-in fade-in zoom-in-95 duration-500">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Live Sync Active
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 gap-1.5 h-6 animate-pulse">
                      <Activity size={10} className="animate-spin" />
                      Syncing GHL...
                    </Badge>
                  )}
                </div>
              </div>
              <p className="text-muted-foreground font-medium flex items-center gap-2">
                <ShieldCheck size={14} className="text-primary" />
                V2 Backend • nBYJTjYbHTIsJGiqT0W4
              </p>
            </div>
            <div className="flex gap-3">
              <Button size="lg" asChild className="glow-primary h-12 rounded-2xl px-6 bg-primary hover:bg-primary/90 transition-all active:scale-95">
                <Link href="/calendar">
                  <PlusCircle className="mr-2 h-5 w-5" /> Book Appointment
                </Link>
              </Button>
            </div>
          </header>

          {/* Top Analytics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: "Pipeline Value", value: "$42.5k", icon: TrendingUp, color: "text-emerald-400" },
              { label: "Active Leads", value: "1,284", icon: Users, color: "text-primary" },
              { label: "Conversion", value: "12.4%", icon: Zap, color: "text-amber-400" },
              { label: "Response Time", value: "1.2m", icon: Clock, color: "text-blue-400" }
            ].map((stat, i) => (
              <Card key={i} className="glass glass-hover border-border/40 p-6 flex flex-col justify-between h-32 animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${i * 100}ms` }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{stat.label}</p>
                  <stat.icon className={cn("h-4 w-4", stat.color)} />
                </div>
                <div className="flex items-end justify-between">
                  <h3 className="text-2xl font-bold font-headline">{stat.value}</h3>
                  <Badge variant="outline" className="text-[9px] bg-white/5 border-white/10">+4.2%</Badge>
                </div>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <Card className="glass border-border/40 overflow-hidden group">
                <div className="h-1 w-full bg-gradient-to-r from-primary via-accent to-primary animate-shimmer opacity-30 group-hover:opacity-100 transition-opacity" />
                <CardHeader className="p-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl font-bold flex items-center gap-2">
                        Engagement Pipeline
                      </CardTitle>
                      <CardDescription className="text-muted-foreground/80 mt-1">Real-time interaction stream from LeadConnector</CardDescription>
                    </div>
                    <Badge variant="secondary" className="font-mono text-[10px] bg-primary/10 text-primary border-primary/20">{appts.length} Live Threads</Badge>
                  </div>
                </CardHeader>
                <CardContent className="px-8 pb-8 space-y-4">
                  {loading ? (
                    Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)
                  ) : appts.length > 0 ? (
                    appts.map((appt, i) => (
                      <div 
                        key={appt.id} 
                        className={cn(
                          "flex items-center justify-between p-5 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all group animate-in fade-in slide-in-from-bottom-2 duration-500 cursor-pointer",
                          i === 0 && "border-primary/30 bg-primary/5 ring-1 ring-primary/20"
                        )}
                        style={{ animationDelay: `${i * 100}ms` }}
                      >
                        <div className="flex items-center gap-5">
                          <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 group-hover:glow-primary",
                            appt.status === 'confirmed' || appt.status === 'booked' ? "bg-primary/20 text-primary shadow-lg shadow-primary/10" : "bg-white/5 text-muted-foreground"
                          )}>
                            <Clock size={20} />
                          </div>
                          <div>
                            <p className="font-bold text-sm group-hover:text-primary transition-colors">{appt.title}</p>
                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-1 font-medium">
                              <Calendar size={12} className="opacity-60" />
                              {new Date(appt.startTime).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge variant={appt.status === 'confirmed' || appt.status === 'booked' ? 'default' : 'secondary'} className="capitalize text-[10px] h-6 px-3 rounded-lg font-bold">
                            {appt.status}
                          </Badge>
                          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform opacity-0 group-hover:opacity-100" />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-20 text-center space-y-6 border-2 border-dashed border-white/5 rounded-3xl bg-white/[0.01]">
                      <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Activity className="h-8 w-8 text-muted-foreground opacity-20" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-bold text-muted-foreground">Awaiting Live Signals</p>
                        <p className="text-xs text-muted-foreground/60 max-w-[200px] mx-auto">Active interactions from GHL will populate here automatically.</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="glass glass-hover border-border/40 p-8">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-primary/80 flex items-center gap-2">
                      <User className="h-4 w-4" /> Identity Intelligence
                    </h3>
                    <Badge variant="outline" className="border-white/10 text-[9px] uppercase tracking-tighter">Verified V2</Badge>
                  </div>
                  {loading ? (
                    <Skeleton className="h-32 w-full rounded-2xl" />
                  ) : (
                    <div className="space-y-6">
                      <div className="flex items-center gap-6">
                        <div className="relative group">
                          <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full group-hover:bg-primary/40 transition-all" />
                          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white font-bold text-2xl border-4 border-background relative z-10 uppercase">
                            {profile?.firstName?.[0] || '?'}{profile?.lastName?.[0] || ''}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="font-bold text-xl">{profile?.firstName || 'Unknown'} {profile?.lastName || ''}</p>
                          <p className="text-xs text-muted-foreground font-medium opacity-70 truncate max-w-[150px]">{profile?.email}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {profile?.tags?.slice(0, 4).map(tag => (
                          <Badge key={tag} variant="outline" className="text-[10px] bg-white/5 border-white/10 py-1 h-6 hover:bg-white/10 transition-colors">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>

                <Card className="glass glass-hover border-border/40 p-8 flex flex-col justify-between">
                   <div className="mb-6">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-primary/80 flex items-center gap-2 mb-6">
                      <Zap className="h-4 w-4" /> Quick Actions
                    </h3>
                    <div className="space-y-3">
                      <Button variant="outline" size="sm" className="w-full justify-between h-10 border-white/5 bg-white/[0.02] hover:bg-white/10 hover:border-primary/30 transition-all rounded-xl text-xs font-bold" asChild>
                        <Link href="/conversations">
                          AI Inbox <ArrowUpRight className="h-3 w-3 text-primary" />
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" className="w-full justify-between h-10 border-white/5 bg-white/[0.02] hover:bg-white/10 hover:border-primary/30 transition-all rounded-xl text-xs font-bold" asChild>
                        <Link href="/contacts">
                          Directory <ArrowUpRight className="h-3 w-3 text-primary" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-white/5">
                    <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest opacity-50 mb-2">System Status</p>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" />
                      <span className="text-[10px] font-mono text-emerald-500/80">API LINKED</span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            <div className="space-y-8">
              {!loading && profile && (
                <div className="animate-in fade-in zoom-in-95 duration-700">
                  <AIContactInsight contactName={`${profile.firstName || ''} ${profile.lastName || ''}`} history={historyForAI} />
                </div>
              )}
              
              <Card className="glass border-primary/20 bg-gradient-to-br from-primary/[0.05] to-accent/[0.05] overflow-hidden relative group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary animate-shimmer" />
                <CardHeader className="p-8 pb-4">
                  <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] text-primary/80 flex items-center gap-2">
                    <ShieldCheck size={14} /> GHL System Link
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 pt-0 space-y-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-white/5">
                      <span className="text-[11px] text-muted-foreground font-medium">Auth Core</span>
                      <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1.5">
                        <CheckCircle2 size={12} /> PIT_ACTIVE
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-white/5">
                      <span className="text-[11px] text-muted-foreground font-medium">V2 Proxy</span>
                      <span className="text-[11px] font-mono text-foreground/80">SECURE_TUNNEL</span>
                    </div>
                    <div className="pt-4">
                      <div className="p-4 rounded-xl bg-black/40 border border-white/5 font-mono text-[9px] text-muted-foreground leading-relaxed break-all opacity-70 group-hover:opacity-100 transition-opacity">
                        LOC_ID: nBYJT...T0W4<br/>
                        TIMESTAMP: {new Date().getTime()}
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full h-12 text-xs border-primary/20 bg-primary/5 hover:bg-primary/20 hover:text-white transition-all group rounded-2xl font-bold" asChild>
                    <a href="https://app.gohighlevel.com/" target="_blank">
                      Launch GHL Dashboard <ExternalLink className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </a>
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