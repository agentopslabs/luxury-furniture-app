
"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { DashboardNav } from "@/components/dashboard/nav";
import { getAllAppointments, getCalendars, updateAppointmentStatus, getContacts, createAppointment } from "@/lib/ghl-actions";
import { GHLAppointment, GHLCalendar, GHLContact } from "@/lib/ghl";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { 
  Clock, 
  Plus,
  MoreVertical,
  CalendarDays,
  RefreshCw,
  AlertCircle,
  XCircle,
  CheckCircle,
  Loader2,
  Settings,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  LayoutList,
  Calendar as CalendarIcon,
  X,
  Trello,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function CalendarPage() {
  const [activeTab, setActiveTab] = useState("view");
  const [appointments, setAppointments] = useState<GHLAppointment[]>([]);
  const [calendars, setCalendars] = useState<GHLCalendar[]>([]);
  const [contacts, setContacts] = useState<GHLContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isManageViewOpen, setIsManageViewOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [bookingForm, setBookingForm] = useState({
    calendarId: "",
    contactId: "",
    title: "",
    startTime: ""
  });

  const { toast } = useToast();

  const fetchData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [apptsData, calsData, contsData] = await Promise.all([
        getAllAppointments(),
        getCalendars(),
        getContacts(100)
      ]);
      
      setAppointments(apptsData);
      setCalendars(calsData);
      setContacts(contsData);
      
      if (isManualRefresh) {
        toast({
          title: "Schedule Refreshed",
          description: `Loaded ${apptsData.length} events from GHL cloud.`,
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Sync Error",
        description: "Could not reach GHL servers.",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      await updateAppointmentStatus(id, newStatus);
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: newStatus as any } : a));
      toast({
        title: "Status Updated",
        description: `Appointment marked as ${newStatus}.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Could not sync status change to GHL.",
      });
    }
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingForm.calendarId || !bookingForm.contactId || !bookingForm.startTime) {
      toast({ variant: "destructive", title: "Missing Details", description: "Please fill in all required fields." });
      return;
    }

    setIsSubmitting(true);
    try {
      const startTimeISO = new Date(bookingForm.startTime).toISOString();
      const endTimeISO = new Date(new Date(bookingForm.startTime).getTime() + 30 * 60000).toISOString();
      
      await createAppointment({
        calendarId: bookingForm.calendarId,
        contactId: bookingForm.contactId,
        title: bookingForm.title || "Meeting",
        startTime: startTimeISO,
        endTime: endTimeISO
      });
      
      setIsBookingOpen(false);
      setBookingForm({ calendarId: "", contactId: "", title: "", startTime: "" });
      toast({
        title: "Appointment Booked",
        description: "Successfully added to GHL calendar.",
      });
      fetchData(true);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Booking Failed",
        description: error.message || "The slot you have selected is no longer available.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const currentWeek = [10, 11, 12, 13, 14, 15, 16]; 

  return (
    <div className="flex min-h-screen bg-background text-foreground overflow-hidden">
      <DashboardNav />
      <main className="flex-1 flex flex-col h-screen relative overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <header className="border-b border-border bg-card/30 backdrop-blur-md z-20 shrink-0">
            <div className="px-8 flex items-center h-16 gap-2">
              <TabsList className="bg-transparent h-16 p-0 gap-8">
                <TabsTrigger value="calendars" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none border-b-2 border-transparent px-0 h-full text-xs font-bold transition-all opacity-60 data-[state=active]:opacity-100">Calendars</TabsTrigger>
                <TabsTrigger value="view" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none border-b-2 border-transparent px-0 h-full text-xs font-bold transition-all opacity-60 data-[state=active]:opacity-100">Calendar View</TabsTrigger>
                <TabsTrigger value="list" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none border-b-2 border-transparent px-0 h-full text-xs font-bold transition-all opacity-60 data-[state=active]:opacity-100">Appointment List View</TabsTrigger>
                <TabsTrigger value="settings" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none border-b-2 border-transparent px-0 h-full text-xs font-bold transition-all opacity-60 data-[state=active]:opacity-100 flex items-center gap-2"><Settings size={14} /> Calendar Settings</TabsTrigger>
              </TabsList>
            </div>
          </header>

          <div className="flex-1 flex flex-col overflow-hidden bg-background">
            <div className="px-8 py-4 border-b flex items-center justify-between bg-card/5 shrink-0">
              <div className="flex items-center gap-4">
                <Button variant="outline" size="sm" className="h-9 px-4 rounded-md font-bold">Today</Button>
                <div className="flex items-center border rounded-md">
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none border-r"><ChevronLeft size={16} /></Button>
                  <div className="px-4 py-1 text-sm font-bold min-w-[150px] text-center">May 10 – 16, 2026</div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none border-l"><ChevronRight size={16} /></Button>
                </div>
                <Select defaultValue="week">
                  <SelectTrigger className="w-[120px] h-9 rounded-md font-bold">
                    <SelectValue placeholder="View" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Day View</SelectItem>
                    <SelectItem value="week">Week View</SelectItem>
                    <SelectItem value="month">Month View</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" className="h-9 px-4 rounded-md font-bold" onClick={() => setIsManageViewOpen(true)}>
                  <Filter size={16} className="mr-2" /> Manage View
                </Button>
                <Button size="sm" className="h-9 px-6 rounded-md bg-primary hover:bg-primary/90 font-bold shadow-lg" onClick={() => setIsBookingOpen(true)}>
                  <Plus size={16} className="mr-2" /> New
                </Button>
                <Button variant="ghost" size="icon" onClick={() => fetchData(true)} className="h-9 w-9">
                  <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
                </Button>
              </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
              <div className="flex-1 overflow-y-auto no-scrollbar p-0 bg-white/[0.01]">
                <TabsContent value="view" className="m-0 h-full flex flex-col">
                  <div className="grid grid-cols-8 border-b bg-muted/30">
                    <div className="p-4 border-r text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-end justify-center">
                      GMT +05:30
                    </div>
                    {weekDays.map((day, i) => (
                      <div key={day} className="p-4 border-r last:border-r-0 flex flex-col items-center gap-1">
                        <span className={cn("text-lg font-bold", i === 0 && "text-destructive")}>{currentWeek[i]} {day}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex-1 grid grid-cols-8 relative h-[800px]">
                    <div className="border-r bg-muted/10">
                      {Array.from({ length: 12 }).map((_, i) => (
                        <div key={i} className="h-20 border-b p-2 text-right text-[10px] font-bold text-muted-foreground opacity-50">
                          {i + 12} PM
                        </div>
                      ))}
                    </div>
                    {Array.from({ length: 7 }).map((_, col) => (
                      <div key={col} className="border-r last:border-r-0 relative">
                        {Array.from({ length: 12 }).map((_, row) => (
                          <div key={row} className="h-20 border-b hover:bg-primary/5 transition-colors cursor-pointer" />
                        ))}
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="list" className="m-0 p-8">
                  <div className="max-w-4xl mx-auto space-y-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xl font-bold">Appointment Registry</h3>
                      <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">V2 Live Sync</Badge>
                    </div>
                    
                    {loading ? (
                      Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)
                    ) : appointments.length > 0 ? (
                      <div className="grid gap-4">
                        {appointments.map((appt) => (
                          <Card key={appt.id} className="glass border-border/40 hover:bg-card/60 transition-all group overflow-hidden">
                            <CardContent className="p-5 flex items-center justify-between">
                              <div className="flex items-center gap-5">
                                <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex flex-col items-center justify-center border border-primary/20 group-hover:glow-primary transition-all">
                                  <span className="text-[9px] font-bold uppercase tracking-widest">{new Date(appt.startTime).toLocaleString('default', { month: 'short' })}</span>
                                  <span className="text-2xl font-bold leading-none">{new Date(appt.startTime).getDate()}</span>
                                </div>
                                <div className="space-y-1">
                                  <h4 className="font-bold text-sm group-hover:text-primary transition-colors">{appt.title}</h4>
                                  <div className="flex items-center gap-4 text-[11px] text-muted-foreground font-medium">
                                    <span className="flex items-center gap-1.5"><Clock size={12} className="text-primary/60" /> {new Date(appt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    <span className="flex items-center gap-1.5"><User size={12} className="text-accent/60" /> ID: {appt.contactId.slice(0, 8)}</span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-4">
                                <Badge variant="outline" className="text-[9px] py-0 h-5 uppercase font-bold tracking-widest px-2">{appt.status}</Badge>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all">
                                      <MoreVertical size={16} />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="glass border-white/10 rounded-xl p-2">
                                    <DropdownMenuItem className="rounded-lg focus:bg-primary/10 cursor-pointer" onClick={() => handleStatusUpdate(appt.id, 'completed')}>
                                      <CheckCircle className="mr-2 h-4 w-4 text-emerald-500" /> Mark Completed
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="rounded-lg focus:bg-destructive/10 text-destructive cursor-pointer" onClick={() => handleStatusUpdate(appt.id, 'cancelled')}>
                                      <XCircle className="mr-2 h-4 w-4" /> Cancel Slot
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="py-40 text-center">
                        <LayoutList className="h-10 w-10 mx-auto mb-4 opacity-20" />
                        <p className="text-muted-foreground">Registry Empty</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="calendars" className="m-0 p-8">
                  <div className="max-w-6xl mx-auto">
                    {loading ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-2xl" />)}
                      </div>
                    ) : calendars.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {calendars.map(cal => (
                          <Card key={cal.id} className="glass glass-hover border-border/40 p-6 flex flex-col gap-4">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">{cal.name[0]}</div>
                            <div>
                              <h3 className="font-bold">{cal.name}</h3>
                              <p className="text-xs text-muted-foreground mt-1">{cal.description || 'Enterprise Calendar'}</p>
                            </div>
                            <Button variant="outline" className="w-full h-9 text-xs rounded-xl font-bold">View Availability</Button>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="py-40 text-center opacity-30">
                        <Trello size={64} className="mx-auto mb-4" />
                        <p className="text-xl font-bold">No calendars detected</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="settings" className="m-0 p-8">
                  <div className="max-w-2xl mx-auto py-20 text-center opacity-30">
                    <Settings size={64} className="mx-auto mb-4" />
                    <p className="text-xl font-bold">Calendar Settings</p>
                  </div>
                </TabsContent>
              </div>

              {isManageViewOpen && (
                <div className="w-80 border-l bg-card/20 backdrop-blur-xl animate-in slide-in-from-right duration-300">
                  <div className="p-6 space-y-8">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-lg">Manage View</h3>
                      <Button variant="ghost" size="icon" onClick={() => setIsManageViewOpen(false)}><X size={18} /></Button>
                    </div>
                    <div className="space-y-4">
                      <p className="text-[11px] font-bold uppercase tracking-widest opacity-60">View by type</p>
                      <RadioGroup defaultValue="all" className="space-y-3">
                        <div className="flex items-center space-x-3 p-3 rounded-xl border bg-white/[0.02] cursor-pointer">
                          <RadioGroupItem value="all" id="all" />
                          <Label htmlFor="all" className="flex-1 cursor-pointer font-medium">All</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Tabs>
      </main>

      <Dialog open={isBookingOpen} onOpenChange={setIsBookingOpen}>
        <DialogContent className="glass border-white/10 rounded-3xl p-8 max-w-lg">
          <form onSubmit={handleBookingSubmit}>
            <DialogHeader className="mb-8">
              <DialogTitle className="text-2xl font-bold">Book Appointment</DialogTitle>
              <DialogDescription className="text-muted-foreground">Schedule a new interaction. Synchronized to GHL V2 cloud.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-6">
              <div className="space-y-2">
                <Label className="text-[11px] font-bold uppercase tracking-widest opacity-60">Title</Label>
                <Input 
                  className="glass h-12 rounded-xl" 
                  placeholder="e.g. Discovery Call"
                  value={bookingForm.title} 
                  onChange={(e) => setBookingForm({ ...bookingForm, title: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold uppercase tracking-widest opacity-60">Identity</Label>
                  <Select value={bookingForm.contactId} onValueChange={(val) => setBookingForm({ ...bookingForm, contactId: val })}>
                    <SelectTrigger className="glass h-12 rounded-xl"><SelectValue placeholder="Lead" /></SelectTrigger>
                    <SelectContent>
                      {contacts.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.firstName} {c.lastName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold uppercase tracking-widest opacity-60">Calendar</Label>
                  <Select value={bookingForm.calendarId} onValueChange={(val) => setBookingForm({ ...bookingForm, calendarId: val })}>
                    <SelectTrigger className="glass h-12 rounded-xl"><SelectValue placeholder="Registry" /></SelectTrigger>
                    <SelectContent>
                      {calendars.map((cal) => (
                        <SelectItem key={cal.id} value={cal.id}>{cal.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] font-bold uppercase tracking-widest opacity-60">Signal Date & Time</Label>
                <Input 
                  className="glass h-12 rounded-xl" 
                  type="datetime-local" 
                  value={bookingForm.startTime}
                  onChange={(e) => setBookingForm({ ...bookingForm, startTime: e.target.value })}
                  required
                />
              </div>
            </div>
            <DialogFooter className="mt-10">
              <Button type="submit" size="lg" className="w-full h-12 rounded-xl glow-primary font-bold" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-5 w-5" />}
                Commit Booking
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
