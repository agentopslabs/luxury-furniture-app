
"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { DashboardNav } from "@/components/dashboard/nav";
import { getAllAppointments, getCalendars, updateAppointmentStatus, getContacts, createAppointment, getCalendarFreeSlots } from "@/lib/ghl-actions";
import { GHLAppointment, GHLCalendar, GHLContact } from "@/lib/ghl";
import { 
  Card, 
  CardContent, 
} from "@/components/ui/card";
import { 
  Clock, 
  Plus,
  MoreVertical,
  CalendarDays,
  RefreshCw,
  XCircle,
  CheckCircle,
  Loader2,
  Settings,
  ChevronLeft,
  ChevronRight,
  Filter,
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
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

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
  const [calendarView, setCalendarView] = useState("week");

  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => getWeekStart(new Date()));

  const [manageFilter, setManageFilter] = useState("all");
  const [manageCalendarFilter, setManageCalendarFilter] = useState("all");
  const [manageStatusFilter, setManageStatusFilter] = useState("all");

  const [bookingForm, setBookingForm] = useState({
    calendarId: "",
    contactId: "",
    title: "",
    selectedDate: "",
    selectedSlot: ""
  });
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsFetched, setSlotsFetched] = useState(false);
  const [noSlotsOnDate, setNoSlotsOnDate] = useState(false);

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

  const fetchSlotsForDate = useCallback(async (calendarId: string, date: string) => {
    if (!calendarId || !date) {
      setAvailableSlots([]);
      setSlotsFetched(false);
      setNoSlotsOnDate(false);
      return;
    }
    setLoadingSlots(true);
    setAvailableSlots([]);
    setSlotsFetched(false);
    setNoSlotsOnDate(false);
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
      const apiSlots = await getCalendarFreeSlots(calendarId, date, tz);
      if (apiSlots.length > 0) {
        setAvailableSlots(apiSlots);
        setNoSlotsOnDate(false);
      } else {
        setAvailableSlots([]);
        setNoSlotsOnDate(true);
      }
      setSlotsFetched(true);
    } catch (error: any) {
      setAvailableSlots([]);
      setNoSlotsOnDate(true);
      setSlotsFetched(true);
    } finally {
      setLoadingSlots(false);
    }
  }, []);

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingForm.calendarId || !bookingForm.contactId || !bookingForm.selectedDate || !bookingForm.selectedSlot) {
      toast({ variant: "destructive", title: "Missing Details", description: "Please fill in all required fields and select an available slot." });
      return;
    }

    setIsSubmitting(true);
    try {
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
      await createAppointment({
        calendarId: bookingForm.calendarId,
        contactId: bookingForm.contactId,
        title: bookingForm.title || "Interaction Slot",
        startTime: bookingForm.selectedSlot,
        timezone: userTimezone
      });
      setIsBookingOpen(false);
      setBookingForm({ calendarId: "", contactId: "", title: "", selectedDate: "", selectedSlot: "" });
      setAvailableSlots([]);
      setSlotsFetched(false);
      toast({ title: "Appointment Booked", description: "Successfully added to GHL calendar." });
      fetchData(true);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Booking Failed", description: error.message || "Could not commit slot to GHL." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const weekDates = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(currentWeekStart);
      d.setDate(currentWeekStart.getDate() + i);
      return d;
    });
  }, [currentWeekStart]);

  const weekLabel = useMemo(() => {
    const start = weekDates[0];
    const end = weekDates[6];
    const sameMonth = start.getMonth() === end.getMonth();
    if (sameMonth) {
      return `${start.toLocaleString('en-US', { month: 'short' })} ${start.getDate()} – ${end.getDate()}, ${end.getFullYear()}`;
    }
    return `${start.toLocaleString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  }, [weekDates]);

  const goToPrevWeek = () => {
    setCurrentWeekStart(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 7);
      return d;
    });
  };

  const goToNextWeek = () => {
    setCurrentWeekStart(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 7);
      return d;
    });
  };

  const goToToday = () => {
    setCurrentWeekStart(getWeekStart(new Date()));
  };

  const today = new Date();
  const isToday = (date: Date) =>
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();

  const weekDayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const hours = Array.from({ length: 24 }).map((_, i) => i);

  const getAppointmentsForCell = (date: Date, hour: number) => {
    return appointments.filter(appt => {
      const apptDate = new Date(appt.startTime);
      return (
        apptDate.getDate() === date.getDate() &&
        apptDate.getMonth() === date.getMonth() &&
        apptDate.getFullYear() === date.getFullYear() &&
        apptDate.getHours() === hour &&
        (manageFilter === "all" || true) &&
        (manageCalendarFilter === "all" || appt.calendarId === manageCalendarFilter) &&
        (manageStatusFilter === "all" || appt.status === manageStatusFilter)
      );
    });
  };

  const filteredAppointments = useMemo(() => {
    return appointments.filter(appt => {
      const calOk = manageCalendarFilter === "all" || appt.calendarId === manageCalendarFilter;
      const statusOk = manageStatusFilter === "all" || appt.status === manageStatusFilter;
      return calOk && statusOk;
    });
  }, [appointments, manageCalendarFilter, manageStatusFilter]);

  const slotPlaceholder = loadingSlots
    ? "Checking availability..."
    : !bookingForm.calendarId
    ? "Select a calendar first"
    : !bookingForm.selectedDate
    ? "Pick a date first"
    : noSlotsOnDate
    ? "No slots on this date"
    : slotsFetched && availableSlots.length > 0
    ? "Select a time slot"
    : "Select a time slot";

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
                <Button variant="outline" size="sm" className="h-9 px-4 rounded-md font-bold" onClick={goToToday}>Today</Button>
                <div className="flex items-center border rounded-md">
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none border-r" onClick={goToPrevWeek}><ChevronLeft size={16} /></Button>
                  <div className="px-4 py-1 text-sm font-bold min-w-[180px] text-center">{weekLabel}</div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none border-l" onClick={goToNextWeek}><ChevronRight size={16} /></Button>
                </div>
                <Select value={calendarView} onValueChange={setCalendarView}>
                  <SelectTrigger className="w-[130px] h-9 rounded-md font-bold">
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
                <Button variant="outline" size="sm" className={cn("h-9 px-4 rounded-md font-bold", isManageViewOpen && "bg-primary/10 border-primary/40")} onClick={() => setIsManageViewOpen(v => !v)}>
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
                  <div className="grid grid-cols-8 border-b bg-muted/30 sticky top-0 z-10">
                    <div className="p-4 border-r text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-end justify-center">
                      GMT {new Date().toLocaleString('en-US', { timeZoneName: 'short' }).split(' ').pop()?.replace(/[A-Z]+/, m => {
                        const off = new Date().getTimezoneOffset();
                        const h = Math.abs(Math.floor(off / 60));
                        const sign = off <= 0 ? '+' : '-';
                        return `${sign}${String(h).padStart(2, '0')}:00`;
                      }) || '+00:00'}
                    </div>
                    {weekDates.map((date, i) => (
                      <div key={i} className="p-4 border-r last:border-r-0 flex flex-col items-center gap-1">
                        <span className={cn(
                          "text-lg font-bold",
                          isToday(date) ? "text-primary" : i === 0 ? "text-destructive" : ""
                        )}>
                          {date.getDate()} {weekDayNames[i]}
                        </span>
                        {isToday(date) && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                      </div>
                    ))}
                  </div>
                  <div className="flex-1 grid grid-cols-8 relative">
                    <div className="border-r bg-muted/10">
                      {hours.map((h) => (
                        <div key={h} className="h-16 border-b p-2 text-right text-[10px] font-bold text-muted-foreground opacity-50">
                          {h === 0 ? "12 AM" : h < 12 ? `${h} AM` : h === 12 ? "12 PM" : `${h - 12} PM`}
                        </div>
                      ))}
                    </div>
                    {weekDates.map((date, col) => (
                      <div key={col} className="border-r last:border-r-0 relative">
                        {hours.map((h) => {
                          const cellAppts = getAppointmentsForCell(date, h);
                          return (
                            <div
                              key={h}
                              className={cn(
                                "h-16 border-b hover:bg-primary/5 transition-colors cursor-pointer relative",
                                isToday(date) && "bg-primary/[0.02]"
                              )}
                              onClick={() => {
                                const d = new Date(date);
                                d.setHours(h);
                                setBookingForm(f => ({
                                  ...f,
                                  selectedDate: d.toISOString().split('T')[0]
                                }));
                                setIsBookingOpen(true);
                              }}
                            >
                              {cellAppts.map((appt) => (
                                <div
                                  key={appt.id}
                                  className="absolute inset-x-0.5 top-0.5 rounded-md bg-primary/80 text-white text-[10px] font-bold px-1.5 py-0.5 truncate z-10 cursor-default"
                                  onClick={e => e.stopPropagation()}
                                  title={appt.title}
                                >
                                  {appt.title}
                                </div>
                              ))}
                            </div>
                          );
                        })}
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
                    ) : filteredAppointments.length > 0 ? (
                      <div className="grid gap-4">
                        {filteredAppointments.map((appt) => (
                          <Card key={appt.id} className="glass border-border/40 hover:bg-card/60 transition-all group overflow-hidden">
                            <CardContent className="p-5 flex items-center justify-between">
                              <div className="flex items-center gap-5">
                                <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex flex-col items-center justify-center border border-primary/20 group-hover:glow-primary transition-all">
                                  <span className="text-[9px] font-bold uppercase tracking-widest">{new Date(appt.startTime).toLocaleString('en-US', { month: 'short' })}</span>
                                  <span className="text-2xl font-bold leading-none">{new Date(appt.startTime).getDate()}</span>
                                </div>
                                <div className="space-y-1">
                                  <h4 className="font-bold text-sm group-hover:text-primary transition-colors">{appt.title}</h4>
                                  <div className="flex items-center gap-4 text-[11px] text-muted-foreground font-medium">
                                    <span className="flex items-center gap-1.5"><Clock size={12} className="text-primary/60" /> {new Date(appt.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                                    <span className="flex items-center gap-1.5"><User size={12} className="text-accent/60" /> ID: {appt.contactId?.slice(0, 8) || '—'}</span>
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
                        <p className="text-muted-foreground">
                          {appointments.length > 0 ? "No appointments match current filters." : "Registry Empty"}
                        </p>
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
                            <Button variant="outline" className="w-full h-9 text-xs rounded-xl font-bold" onClick={() => {
                              setManageCalendarFilter(cal.id);
                              setActiveTab("list");
                            }}>View Appointments</Button>
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
                <div className="w-80 border-l bg-card/20 backdrop-blur-xl animate-in slide-in-from-right duration-300 shrink-0 overflow-y-auto">
                  <div className="p-6 space-y-8">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-lg">Manage View</h3>
                      <Button variant="ghost" size="icon" onClick={() => setIsManageViewOpen(false)}><X size={18} /></Button>
                    </div>

                    <div className="space-y-4">
                      <p className="text-[11px] font-bold uppercase tracking-widest opacity-60">View by type</p>
                      <RadioGroup value={manageFilter} onValueChange={setManageFilter} className="space-y-2">
                        {[
                          { value: "all", label: "All Events" },
                          { value: "appointments", label: "Appointments Only" },
                          { value: "blocked", label: "Blocked Times" },
                        ].map(opt => (
                          <div key={opt.value} className="flex items-center space-x-3 p-3 rounded-xl border bg-white/[0.02] cursor-pointer hover:bg-white/[0.04] transition-colors">
                            <RadioGroupItem value={opt.value} id={opt.value} />
                            <Label htmlFor={opt.value} className="flex-1 cursor-pointer font-medium">{opt.label}</Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>

                    <div className="space-y-4">
                      <p className="text-[11px] font-bold uppercase tracking-widest opacity-60">Filter by Calendar</p>
                      <RadioGroup value={manageCalendarFilter} onValueChange={setManageCalendarFilter} className="space-y-2">
                        <div className="flex items-center space-x-3 p-3 rounded-xl border bg-white/[0.02] cursor-pointer hover:bg-white/[0.04] transition-colors">
                          <RadioGroupItem value="all" id="cal-all" />
                          <Label htmlFor="cal-all" className="flex-1 cursor-pointer font-medium">All Calendars</Label>
                        </div>
                        {calendars.map(cal => (
                          <div key={cal.id} className="flex items-center space-x-3 p-3 rounded-xl border bg-white/[0.02] cursor-pointer hover:bg-white/[0.04] transition-colors">
                            <RadioGroupItem value={cal.id} id={`cal-${cal.id}`} />
                            <Label htmlFor={`cal-${cal.id}`} className="flex-1 cursor-pointer font-medium truncate">{cal.name}</Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>

                    <div className="space-y-4">
                      <p className="text-[11px] font-bold uppercase tracking-widest opacity-60">Filter by Status</p>
                      <RadioGroup value={manageStatusFilter} onValueChange={setManageStatusFilter} className="space-y-2">
                        {[
                          { value: "all", label: "All Statuses" },
                          { value: "confirmed", label: "Confirmed" },
                          { value: "pending", label: "Pending" },
                          { value: "completed", label: "Completed" },
                          { value: "cancelled", label: "Cancelled" },
                          { value: "noshow", label: "No Show" },
                        ].map(opt => (
                          <div key={opt.value} className="flex items-center space-x-3 p-3 rounded-xl border bg-white/[0.02] cursor-pointer hover:bg-white/[0.04] transition-colors">
                            <RadioGroupItem value={opt.value} id={`st-${opt.value}`} />
                            <Label htmlFor={`st-${opt.value}`} className="flex-1 cursor-pointer font-medium">{opt.label}</Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>

                    <Button
                      variant="outline"
                      className="w-full rounded-xl"
                      onClick={() => {
                        setManageFilter("all");
                        setManageCalendarFilter("all");
                        setManageStatusFilter("all");
                      }}
                    >
                      Reset Filters
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Tabs>
      </main>

      <Dialog open={isBookingOpen} onOpenChange={(open) => {
        setIsBookingOpen(open);
        if (!open) {
          setBookingForm({ calendarId: "", contactId: "", title: "", selectedDate: "", selectedSlot: "" });
          setAvailableSlots([]);
          setSlotsFetched(false);
          setNoSlotsOnDate(false);
        }
      }}>
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
                  <Label className="text-[11px] font-bold uppercase tracking-widest opacity-60">Contact</Label>
                  <Select value={bookingForm.contactId} onValueChange={(val) => setBookingForm({ ...bookingForm, contactId: val })}>
                    <SelectTrigger className="glass h-12 rounded-xl"><SelectValue placeholder="Select Lead" /></SelectTrigger>
                    <SelectContent>
                      {contacts.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.firstName} {c.lastName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold uppercase tracking-widest opacity-60">Calendar</Label>
                  <Select value={bookingForm.calendarId} onValueChange={(val) => {
                    setBookingForm({ ...bookingForm, calendarId: val, selectedDate: "", selectedSlot: "" });
                    setAvailableSlots([]);
                    setSlotsFetched(false);
                  }}>
                    <SelectTrigger className="glass h-12 rounded-xl"><SelectValue placeholder="Select Calendar" /></SelectTrigger>
                    <SelectContent>
                      {calendars.filter(cal => cal.isActive !== false).map((cal) => (
                        <SelectItem key={cal.id} value={cal.id}>{cal.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold uppercase tracking-widest opacity-60">Date</Label>
                  <Input
                    className="glass h-12 rounded-xl"
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={bookingForm.selectedDate}
                    onChange={(e) => {
                      const newDate = e.target.value;
                      setBookingForm({ ...bookingForm, selectedDate: newDate, selectedSlot: "" });
                      if (bookingForm.calendarId) {
                        fetchSlotsForDate(bookingForm.calendarId, newDate);
                      } else {
                        toast({ variant: "destructive", title: "Select Calendar First", description: "Please choose a calendar before picking a date." });
                      }
                    }}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold uppercase tracking-widest opacity-60">
                    Available Slot {loadingSlots && <Loader2 className="inline h-3 w-3 animate-spin ml-1" />}
                  </Label>
                  {noSlotsOnDate ? (
                    <div className="space-y-1">
                      <Input
                        type="time"
                        className="glass h-12 rounded-xl"
                        onChange={(e) => {
                          if (!e.target.value || !bookingForm.selectedDate) return;
                          const [hours, minutes] = e.target.value.split(':');
                          const dt = new Date(`${bookingForm.selectedDate}T${hours}:${minutes}:00`);
                          setBookingForm({ ...bookingForm, selectedSlot: dt.toISOString() });
                        }}
                      />
                      <p className="text-[10px] text-muted-foreground pl-1">No preset slots — pick any time</p>
                    </div>
                  ) : (
                    <Select
                      value={bookingForm.selectedSlot}
                      onValueChange={(val) => setBookingForm({ ...bookingForm, selectedSlot: val })}
                      disabled={loadingSlots || !slotsFetched || availableSlots.length === 0}
                    >
                      <SelectTrigger className="glass h-12 rounded-xl">
                        <SelectValue placeholder={slotPlaceholder} />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {availableSlots.map((slot) => (
                          <SelectItem key={slot} value={slot}>
                            {new Date(slot).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter className="mt-10">
              <Button type="submit" size="lg" className="w-full h-12 rounded-xl glow-primary font-bold" disabled={isSubmitting || !bookingForm.selectedSlot}>
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
