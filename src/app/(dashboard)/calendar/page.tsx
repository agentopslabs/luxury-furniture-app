
"use client";

import { useEffect, useState, useCallback } from "react";
import { DashboardNav } from "@/components/dashboard/nav";
import { ghl, GHLAppointment, GHLCalendar } from "@/lib/ghl";
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
  Plus,
  Filter,
  MoreVertical,
  CheckCircle2,
  CalendarDays,
  RefreshCw,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function CalendarPage() {
  const [appointments, setAppointments] = useState<GHLAppointment[]>([]);
  const [calendars, setCalendars] = useState<GHLCalendar[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  const fetchData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [apptsData, calsData] = await Promise.all([
        ghl.getAllAppointments(),
        ghl.getCalendars()
      ]);
      
      setAppointments(apptsData);
      setCalendars(calsData);
      
      if (isManualRefresh) {
        toast({
          title: "Calendar Updated",
          description: `Successfully synchronized ${apptsData.length} appointments.`,
        });
      }
    } catch (error) {
      console.error("Failed to fetch calendar data:", error);
      toast({
        variant: "destructive",
        title: "Sync Error",
        description: "The GHL API could not be reached. Please check your token.",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    fetchData(true);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardNav />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-8">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-4xl font-bold tracking-tight">Calendar</h1>
              <p className="text-muted-foreground">Manage sub-account appointments via GHL V2 API.</p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh} 
                disabled={loading || refreshing}
                className="transition-all active:scale-95 bg-card"
              >
                <RefreshCw className={cn("mr-2 h-4 w-4", refreshing && "animate-spin")} />
                {refreshing ? "Syncing..." : "Refresh Sync"}
              </Button>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" /> Filter
              </Button>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" /> Book
              </Button>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1 space-y-6">
              <Card className="glass border-border/40">
                <CardHeader>
                  <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Available Calendars</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {loading ? (
                    Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)
                  ) : calendars.length > 0 ? (
                    calendars.map(cal => (
                      <div key={cal.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors group">
                        <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
                        <span className="text-xs font-medium truncate">{cal.name}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground italic flex items-center gap-2">
                      <AlertCircle size={12} /> No calendars found.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-3 space-y-6">
              <Card className="glass border-border/40 min-h-[400px]">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl">Upcoming Events</CardTitle>
                      <CardDescription>Real-time data from services.leadconnectorhq.com</CardDescription>
                    </div>
                    <Badge variant="outline" className="font-mono text-[10px] bg-primary/5 border-primary/20">
                      {appointments.length} Total
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {loading ? (
                    Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)
                  ) : appointments.length > 0 ? (
                    appointments.map((appt) => (
                      <div 
                        key={appt.id} 
                        className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-card/40 hover:bg-card/60 transition-all group animate-in fade-in slide-in-from-bottom-2 duration-300"
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-14 h-14 rounded-xl flex flex-col items-center justify-center border transition-all group-hover:border-primary/30",
                            appt.status === 'confirmed' || appt.status === 'booked' 
                              ? "bg-primary/5 text-primary border-primary/10 shadow-inner" 
                              : "bg-muted text-muted-foreground border-border"
                          )}>
                            <span className="text-[10px] font-bold uppercase opacity-70">
                              {new Date(appt.startTime).toLocaleString('default', { month: 'short' })}
                            </span>
                            <span className="text-xl font-bold leading-none">
                              {new Date(appt.startTime).getDate()}
                            </span>
                          </div>
                          <div className="space-y-1">
                            <p className="font-bold text-sm group-hover:text-primary transition-colors">{appt.title}</p>
                            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                              <span className="flex items-center gap-1.5">
                                <Clock size={12} className="text-primary/60" />
                                {new Date(appt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(appt.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {appt.status === 'completed' && (
                                <span className="flex items-center gap-1 text-emerald-500 font-medium">
                                  <CheckCircle2 size={12} /> Finished
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge variant={appt.status === 'confirmed' || appt.status === 'booked' ? 'default' : 'secondary'} className="capitalize text-[10px] font-bold px-2.5 py-0.5">
                            {appt.status}
                          </Badge>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical size={16} />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-24 text-center space-y-4 border rounded-xl border-dashed bg-muted/20">
                      <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground opacity-20" />
                      <div className="space-y-1">
                        <p className="font-medium text-muted-foreground">No appointments found</p>
                        <p className="text-xs text-muted-foreground opacity-70 max-w-[200px] mx-auto">Try clicking refresh or check your GHL sub-account for upcoming events.</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
