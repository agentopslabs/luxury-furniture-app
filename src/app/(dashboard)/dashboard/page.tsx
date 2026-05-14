
"use client";

import { useEffect, useState } from "react";
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
  Calendar as CalendarIcon, 
  Clock, 
  ChevronRight, 
  ExternalLink,
  PlusCircle,
  MessageSquare,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const [profile, setProfile] = useState<GHLContact | null>(null);
  const [appts, setAppts] = useState<GHLAppointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const p = await ghl.getContact("mock_id");
      const a = await ghl.getAppointments(p.id);
      setProfile(p);
      setAppts(a);
      setLoading(false);
    }
    fetchData();
  }, []);

  const historyForAI = appts.map(a => ({
    date: new Date(a.startTime).toLocaleDateString(),
    summary: a.title
  }));

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardNav />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-8">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold tracking-tight mb-1">Intelligence Hub</h1>
              <p className="text-muted-foreground">Welcome back, Alex. Your CRM is synchronized.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <CalendarIcon className="mr-2 h-4 w-4" /> Calendar
              </Button>
              <Button size="sm">
                <PlusCircle className="mr-2 h-4 w-4" /> New Interaction
              </Button>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Upcoming Appointments */}
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="text-xl">Engagement Pipeline</CardTitle>
                  <CardDescription>Recent and upcoming appointments from LeadConnector.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {loading ? (
                    Array(3).fill(0).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full rounded-lg" />
                    ))
                  ) : (
                    appts.map((appt) => (
                      <div 
                        key={appt.id} 
                        className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-card/40 hover:bg-card/60 transition-colors group"
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center",
                            appt.status === 'confirmed' ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground"
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
                          <Badge variant={appt.status === 'confirmed' ? 'default' : 'secondary'} className="capitalize">
                            {appt.status}
                          </Badge>
                          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    ))
                  )}
                  <Button variant="ghost" className="w-full text-sm text-primary">
                    View full schedule <ChevronRight className="ml-1 h-3 w-3" />
                  </Button>
                </CardContent>
              </Card>

              {/* Profile Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="glass">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <User className="h-4 w-4" /> Identity Profile
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <Skeleton className="h-20 w-full" />
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg">
                            {profile?.firstName[0]}{profile?.lastName[0]}
                          </div>
                          <div>
                            <p className="font-bold">{profile?.firstName} {profile?.lastName}</p>
                            <p className="text-xs text-muted-foreground">{profile?.email}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {profile?.tags?.map(tag => (
                            <Badge key={tag} variant="outline" className="text-[10px] py-0">{tag}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="glass">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" /> Quick Note
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <textarea 
                      placeholder="Type a note for CRM..." 
                      className="w-full h-16 bg-muted/50 rounded-lg p-2 text-xs border-none focus:ring-1 focus:ring-primary resize-none outline-none"
                    />
                    <Button size="sm" className="w-full h-8 text-xs">Save Note</Button>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="space-y-8">
              {/* GenAI Insight Component */}
              {!loading && profile && (
                <AIContactInsight contactName={`${profile.firstName} ${profile.lastName}`} history={historyForAI} />
              )}
              
              <Card className="glass bg-gradient-to-br from-accent/5 to-primary/5">
                <CardHeader>
                  <CardTitle className="text-sm">Account Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">GHL Connectivity</span>
                    <span className="text-emerald-500 font-bold flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" /> Active
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Data Syncing</span>
                    <span className="font-medium text-foreground">Real-time</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Last Auth</span>
                    <span className="font-medium text-foreground">6 mins ago</span>
                  </div>
                  <Button variant="outline" className="w-full mt-2 h-9 text-xs">
                    System Health <ExternalLink className="ml-2 h-3 w-3" />
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
