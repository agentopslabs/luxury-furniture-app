"use client";

import { useEffect, useState, useCallback } from "react";
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
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function CalendarPage() {
  const [appointments, setAppointments] = useState<GHLAppointment[]>([]);
  const [calendars, setCalendars] = useState<GHLCalendar[]>([]);
  const [contacts, setContacts] = useState<GHLContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
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
          title: "Schedule Synchronized",
          description: `Loaded ${apptsData.length} events from GHL.`,
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
      // GHL V2 expects ISO format for creation
      const startTimeISO = new Date(bookingForm.startTime).toISOString();
      await createAppointment({
        ...bookingForm,
        startTime: startTimeISO
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
        description: error.message || "Could not sync appointment.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <DashboardNav />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-8">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-4xl font-bold tracking-tight">Calendar</h1>
              <p className="text-muted-foreground">Real-time schedule management via GHL V2 API.</p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => fetchData(true)} 
                disabled={loading || refreshing}
                className="bg-card"
              >
                <RefreshCw className={cn("mr-2 h-4 w-4", refreshing && "animate-spin")} />
                {refreshing ? "Syncing..." : "Sync Schedule"}
              </Button>
              <Button size="sm" onClick={() => setIsBookingOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Book Appointment
              </Button>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1 space-y-6">
              <Card className="glass border-border/40">
                <CardHeader>
                  <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground font-body">Sub-Account Calendars</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {loading ? (
                    Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)
                  ) : calendars.length > 0 ? (
                    calendars.map(cal => (
                      <div key={cal.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors group">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <span className="text-xs font-medium truncate">{cal.name}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground italic">No active calendars.</p>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-3 space-y-6">
              <Card className="glass border-border/40 min-h-[400px]">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl font-headline">Live Events Feed</CardTitle>
                      <CardDescription>Location ID: nBYJTjYbHTIsJGiqT0W4</CardDescription>
                    </div>
                    <Badge variant="outline" className="font-mono text-[10px]">
                      {appointments.length} Total
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {loading ? (
                    Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)
                  ) : appointments.length > 0 ? (
                    appointments.map((appt) => {
                      const date = new Date(appt.startTime);
                      return (
                        <div 
                          key={appt.id} 
                          className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-card/40 hover:bg-card/60 transition-all group animate-in fade-in slide-in-from-bottom-2"
                        >
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "w-14 h-14 rounded-xl flex flex-col items-center justify-center border",
                              appt.status === 'confirmed' || appt.status === 'booked' 
                                ? "bg-primary/5 text-primary border-primary/10" 
                                : "bg-muted text-muted-foreground border-border"
                            )}>
                              <span className="text-[10px] font-bold uppercase opacity-70">
                                {date.toLocaleString('default', { month: 'short' })}
                              </span>
                              <span className="text-xl font-bold leading-none">
                                {date.getDate()}
                              </span>
                            </div>
                            <div className="space-y-1">
                              <p className="font-bold text-sm">{appt.title}</p>
                              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                                <span className="flex items-center gap-1.5">
                                  <Clock size={12} className="text-primary/60" />
                                  {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                {appt.status === 'completed' && (
                                  <span className="flex items-center gap-1 text-emerald-500 font-medium">
                                    <CheckCircle size={12} /> Completed
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <Badge variant={appt.status === 'confirmed' || appt.status === 'booked' ? 'default' : 'secondary'} className="capitalize text-[10px]">
                              {appt.status}
                            </Badge>
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical size={16} />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuLabel>Update Status</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleStatusUpdate(appt.id, 'completed')}>
                                  <CheckCircle className="mr-2 h-4 w-4 text-emerald-500" /> Mark Completed
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusUpdate(appt.id, 'noshow')}>
                                  <AlertCircle className="mr-2 h-4 w-4 text-amber-500" /> Mark No-Show
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusUpdate(appt.id, 'cancelled')} className="text-destructive">
                                  <XCircle className="mr-2 h-4 w-4" /> Cancel Event
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-24 text-center space-y-4 border rounded-xl border-dashed bg-muted/20">
                      <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground opacity-20" />
                      <p className="font-medium text-muted-foreground">No upcoming events found</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Book Appointment Dialog */}
      <Dialog open={isBookingOpen} onOpenChange={setIsBookingOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleBookingSubmit}>
            <DialogHeader>
              <DialogTitle>Book Appointment</DialogTitle>
              <DialogDescription>
                Schedule a new meeting. This will be synced to GHL immediately.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Appointment Title</Label>
                <Input 
                  id="title" 
                  placeholder="e.g. Consultation Call"
                  value={bookingForm.title} 
                  onChange={(e) => setBookingForm({ ...bookingForm, title: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Contact</Label>
                <Select 
                  value={bookingForm.contactId} 
                  onValueChange={(val) => setBookingForm({ ...bookingForm, contactId: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a contact" />
                  </SelectTrigger>
                  <SelectContent>
                    {contacts.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.firstName} {c.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Calendar</Label>
                <Select 
                  value={bookingForm.calendarId} 
                  onValueChange={(val) => setBookingForm({ ...bookingForm, calendarId: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a calendar" />
                  </SelectTrigger>
                  <SelectContent>
                    {calendars.map((cal) => (
                      <SelectItem key={cal.id} value={cal.id}>
                        {cal.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input 
                  id="startTime" 
                  type="datetime-local" 
                  value={bookingForm.startTime}
                  onChange={(e) => setBookingForm({ ...bookingForm, startTime: e.target.value })}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsBookingOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm Booking
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
