
"use client";

import { useEffect, useState } from "react";
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
  CalendarDays
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function CalendarPage() {
  const [appointments, setAppointments] = useState<GHLAppointment[]>([]);
  const [calendars, setCalendars] = useState<GHLCalendar[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [apptsData, calsData] = await Promise.all([
          ghl.getAllAppointments(),
          ghl.getCalendars()
        ]);
        setAppointments(apptsData);
        setCalendars(calsData);
      } catch (error) {
        console.error("Failed to fetch calendar data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardNav />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-8">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-4xl font-bold tracking-tight">Calendar</h1>
              <p className="text-muted-foreground">Schedule and manage your location appointments.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" /> Filter
              </Button>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" /> Book Appointment
              </Button>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1 space-y-6">
              <Card className="glass border-border/40">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">My Calendars</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {loading ? (
                    Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)
                  ) : calendars.length > 0 ? (
                    calendars.map(cal => (
                      <div key={cal.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors group">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <span className="text-sm font-medium truncate">{cal.name}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground italic">No calendars found.</p>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-3 space-y-6">
              <Card className="glass border-border/40">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl">Upcoming Events</CardTitle>
                      <CardDescription>Appointments synced from GHL V2</CardDescription>
                    </div>
                    <Badge variant="outline" className="font-mono text-[10px]">
                      {appointments.length} Total
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {loading ? (
                    Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)
                  ) : appointments.length > 0 ? (
                    appointments.map((appt) => (
                      <div 
                        key={appt.id} 
                        className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-card/40 hover:bg-card/60 transition-all group animate-in fade-in slide-in-from-bottom-2 duration-300"
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-12 h-12 rounded-xl flex flex-col items-center justify-center border transition-all group-hover:border-primary/30",
                            appt.status === 'confirmed' ? "bg-primary/5 text-primary border-primary/10" : "bg-muted text-muted-foreground border-border"
                          )}>
                            <span className="text-[10px] font-bold uppercase">
                              {new Date(appt.startTime).toLocaleString('default', { month: 'short' })}
                            </span>
                            <span className="text-lg font-bold leading-none">
                              {new Date(appt.startTime).getDate()}
                            </span>
                          </div>
                          <div>
                            <p className="font-bold text-sm group-hover:text-primary transition-colors">{appt.title}</p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                              <span className="flex items-center gap-1">
                                <Clock size={12} />
                                {new Date(appt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {appt.status === 'completed' && (
                                <span className="flex items-center gap-1 text-emerald-500">
                                  <CheckCircle2 size={12} /> Finished
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge variant={appt.status === 'confirmed' ? 'default' : 'secondary'} className="capitalize text-[10px] font-medium px-2 py-0">
                            {appt.status}
                          </Badge>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical size={16} />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-24 text-center space-y-4 border rounded-xl border-dashed">
                      <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground opacity-20" />
                      <div className="space-y-1">
                        <p className="font-medium text-muted-foreground">No upcoming appointments</p>
                        <p className="text-xs text-muted-foreground opacity-70">Schedule a new event to see it here.</p>
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
