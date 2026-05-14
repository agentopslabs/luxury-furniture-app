
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
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

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
        // In V2 Live, we might search for the user by email first or use a known ID
        // For the demo, we search for the default contact associated with this location/token
        const contacts = await ghl.searchContacts("");
        const p = contacts.length > 0 ? contacts[0] : await ghl.getContact("mock_id");
        
        const a = await ghl.getAppointments(p.id);
        setProfile(p);
        setAppts(a);
        
        if (!isMock) setSyncStatus('synced');
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

  if (!isMounted) {
    return (
      <div className="flex min-h-screen bg-background">
        <DashboardNav />
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto space-y-8">
            <Skeleton className="h-12 w-1/3" />
            <Skeleton className="h-64 w-full" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground selection:bg-primary/20">
      <DashboardNav />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-8">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="animate-in fade-in slide-in-from-left-4 duration-500">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-4xl font-bold tracking-tight">Intelligence Hub</h1>
                {syncStatus === 'synced' ? (
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 gap-1 h-5">
                    <CheckCircle2 size={10} /> V2 Live Connection
                  </Badge>
                ) : syncStatus === 'mock' ? (
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20 gap-1 h-5">
                    <Zap size={10} /> V2 Prototype Mode
                  </Badge>
                ) : syncStatus === 'syncing' ? (
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 gap-1 h-5 animate-pulse">
                    <Activity size={10} /> Syncing V2 Data...
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 gap-1 h-5">
                    <AlertCircle size={10} /> Connection Error
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground">LeadConnector V2 • {process.env.NEXT_PUBLIC_GHL_LOCATION_ID || 'No Location'}</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="shadow-lg shadow-primary/20">
                <PlusCircle className="mr-2 h-4 w-4" /> New Interaction
              </Button>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <Card className="glass border-border/40 overflow-hidden">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl">Engagement Pipeline</CardTitle>
                      <CardDescription>Real-time data from GHL V2 API</CardDescription>
                    </div>
                    <Badge variant="secondary" className="font-mono text-[10px]">{appts.length} Events</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {loading ? (
                    Array(3).fill(0).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full rounded-lg" />
                    ))
                  ) : appts.length > 0 ? (
                    appts.map((appt, i) => (
                      <div 
                        key={appt.id} 
                        className={cn(
                          "flex items-center justify-between p-4 rounded-xl border border-border/50 bg-card/40 hover:bg-card/60 transition-all group animate-in fade-in slide-in-from-bottom-2 duration-500",
                          i === 0 && "border-primary/20 bg-primary/5"
                        )}
                        style={{ animationDelay: `${i * 100}ms` }}
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center transition-transform group-hover:scale-110",
                            appt.status === 'confirmed' ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                          )}>
                            <Clock size={18} />
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{appt.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(appt.startTime).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={appt.status === 'confirmed' ? 'default' : 'secondary'} className="capitalize text-[10px]">
                            {appt.status}
                          </Badge>
                          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-12 text-center text-muted-foreground italic border rounded-lg border-dashed">
                      No recent appointments found for this contact.
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="glass border-border/40">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2 uppercase tracking-wider font-body">
                      <User className="h-4 w-4 text-primary" /> Identity Profile
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <Skeleton className="h-24 w-full" />
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-primary/20 to-accent/20 flex items-center justify-center text-primary font-bold text-xl border border-primary/10">
                            {profile?.firstName?.[0] || 'U'}{profile?.lastName?.[0] || 'S'}
                          </div>
                          <div>
                            <p className="font-bold text-lg">{profile?.firstName} {profile?.lastName}</p>
                            <p className="text-xs text-muted-foreground font-mono">{profile?.email}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {profile?.tags?.map(tag => (
                            <Badge key={tag} variant="outline" className="text-[10px] bg-muted/30 border-border/60">{tag}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="glass border-border/40">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2 uppercase tracking-wider font-body">
                      <MessageSquare className="h-4 w-4 text-primary" /> CRM Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <textarea 
                      placeholder="Add a V2 internal note..." 
                      className="w-full h-20 bg-muted/30 rounded-lg p-3 text-xs border border-border/40 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 resize-none outline-none transition-all"
                    />
                    <Button size="sm" className="w-full h-9 text-xs font-semibold" variant="secondary">
                      Push to Timeline
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="space-y-8">
              {!loading && profile && (
                <div className="animate-in fade-in zoom-in-95 duration-700">
                  <AIContactInsight contactName={`${profile.firstName} ${profile.lastName}`} history={historyForAI} />
                </div>
              )}
              
              <Card className="glass border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-primary via-accent to-primary animate-shimmer" />
                <CardHeader>
                  <CardTitle className="text-sm font-bold uppercase tracking-widest text-primary/80 font-body">System Connection</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">V2 Auth Status</span>
                      {syncStatus === 'synced' ? (
                        <span className="text-emerald-500 font-bold flex items-center gap-1.5">
                          <ShieldCheck size={10} /> Active
                        </span>
                      ) : (
                        <span className="text-blue-500 font-bold flex items-center gap-1.5">
                          <Zap size={10} /> {syncStatus}
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">API Version</span>
                      <span className="font-mono text-[10px] text-foreground/80">2021-07-28</span>
                    </div>
                    <div className="pt-2">
                      <p className="text-[10px] text-muted-foreground truncate uppercase tracking-tighter">Token: {process.env.NEXT_PUBLIC_GHL_ACCESS_TOKEN?.substring(0, 10)}...</p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full h-10 text-xs border-primary/20 hover:bg-primary/5 hover:text-primary transition-all group" asChild>
                    <a href="https://developers.gohighlevel.com/" target="_blank">
                      V2 API Docs <ExternalLink className="ml-2 h-3 w-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
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
