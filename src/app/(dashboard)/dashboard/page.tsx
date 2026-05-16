"use client";

import { useEffect, useState, useMemo } from "react";
import { DashboardNav } from "@/components/dashboard/nav";
import { ghl, GHLAppointment, GHLOpportunity, GHLPipeline } from "@/lib/ghl";
import { getOrders } from "@/lib/ghl-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  Calendar,
  DollarSign,
  Layers,
  Clock,
  ThumbsUp,
  CheckCircle2,
  TrendingUp,
  Users,
  Zap,
  CreditCard,
  PlusCircle,
  ShieldCheck,
} from "lucide-react";

function DonutChart({ percent }: { percent: number }) {
  const radius = 54;
  const stroke = 10;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center w-36 h-36">
      <svg width="144" height="144" viewBox="0 0 144 144" className="-rotate-90">
        <circle
          cx="72" cy="72" r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth={stroke}
        />
        <circle
          cx="72" cy="72" r={radius}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold">{percent}%</span>
        <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest mt-0.5">Win Rate</span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [appts, setAppts] = useState<GHLAppointment[]>([]);
  const [opportunities, setOpportunities] = useState<GHLOpportunity[]>([]);
  const [pipelines, setPipelines] = useState<GHLPipeline[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [contactCount, setContactCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    async function fetchData() {
      try {
        const [contactsData, oppsData, allAppts, pipeData, ordersData] = await Promise.all([
          ghl.getContacts(100),
          ghl.getOpportunities(),
          ghl.getAllAppointments(),
          ghl.getPipelines(),
          getOrders(5),
        ]);
        setContactCount(contactsData.length);
        setOpportunities(oppsData);
        setPipelines(pipeData);
        setOrders(ordersData || []);
        setAppts(allAppts);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const respondedYes = useMemo(
    () => opportunities.filter((o) => o.status === "won"),
    [opportunities]
  );

  const stats = useMemo(() => {
    const pipelineValue = opportunities.reduce((acc, curr) => acc + (curr.monetaryValue || 0), 0);
    const wonDeals = respondedYes.length;
    const orderTotal = orders.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
    return [
      { label: "Pipeline Value", value: `$${(pipelineValue / 1000).toFixed(1)}k`, icon: TrendingUp, color: "text-emerald-500" },
      { label: "Active Leads", value: contactCount.toLocaleString(), icon: Users, color: "text-primary" },
      { label: "Won Deals", value: wonDeals.toString(), icon: Zap, color: "text-amber-500" },
      { label: "Order Volume", value: `$${(orderTotal / 1000).toFixed(1)}k`, icon: CreditCard, color: "text-blue-500" },
    ];
  }, [opportunities, contactCount, orders, respondedYes]);

  const salesOverviewPercent = useMemo(() => {
    if (opportunities.length === 0) return 0;
    return Math.round((respondedYes.length / opportunities.length) * 100);
  }, [opportunities, respondedYes]);

  const todayAppts = useMemo(() => {
    if (!isMounted) return [];
    const today = new Date();
    return appts.filter((a) => {
      const d = new Date(a.startTime);
      return (
        d.getFullYear() === today.getFullYear() &&
        d.getMonth() === today.getMonth() &&
        d.getDate() === today.getDate()
      );
    });
  }, [appts, isMounted]);

  const kanbanData = useMemo(() => {
    if (pipelines.length === 0) return [];
    const mainPipe = pipelines[0];
    return mainPipe.stages.map((stage) => ({
      ...stage,
      opps: opportunities.filter((o) => o.pipelineStageId === stage.id),
    }));
  }, [pipelines, opportunities]);

  const todayLabel = isMounted
    ? new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
    : "";

  if (!isMounted) return null;

  return (
    <div className="flex min-h-screen bg-[#f0f4fb] text-foreground overflow-hidden">
      <DashboardNav />
      <main className="flex-1 p-6 md:p-10 overflow-y-auto no-scrollbar">
        <div className="max-w-6xl mx-auto space-y-8">

          {/* ── HEADER ───────────────────────────────────────────────── */}
          <header className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900">
                Luxury Furniture
              </h1>
              <p className="text-sm text-muted-foreground font-medium flex items-center gap-1.5">
                <ShieldCheck size={13} className="text-primary" />
                Premium Collections Dashboard
              </p>
            </div>
            <Button
              size="lg"
              asChild
              className="h-12 rounded-2xl px-6 bg-primary hover:bg-primary/90 transition-all active:scale-95 shadow-md"
            >
              <Link href="/calendar">
                <PlusCircle className="mr-2 h-5 w-5" /> Book Appointment
              </Link>
            </Button>
          </header>

          {/* ── STAT CARDS ───────────────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {loading
              ? Array(4).fill(0).map((_, i) => (
                  <Skeleton key={i} className="h-28 w-full rounded-2xl" />
                ))
              : stats.map((stat, i) => (
                  <Card
                    key={i}
                    className="bg-white border-0 shadow-sm rounded-2xl p-5 flex flex-col justify-between h-28"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                        {stat.label}
                      </p>
                      <stat.icon className={cn("h-4 w-4", stat.color)} />
                    </div>
                    <div className="flex items-end justify-between">
                      <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
                      <Badge
                        variant="outline"
                        className="text-[9px] text-gray-400 border-gray-200 bg-gray-50"
                      >
                        Live
                      </Badge>
                    </div>
                  </Card>
                ))}
          </div>

          {/* ── SALES PIPELINE ───────────────────────────────────────── */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold text-gray-900">Sales Pipeline</h2>
            </div>

            <ScrollArea className="w-full whitespace-nowrap rounded-2xl border border-gray-200 bg-white/60 p-1">
              <div className="flex w-max gap-4 p-4">

                {/* Responded Yes to Offer column */}
                <div className="w-72 shrink-0 space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <ThumbsUp className="h-3.5 w-3.5 text-emerald-500" />
                      <span className="text-xs font-bold uppercase tracking-widest text-gray-500">
                        Responded Yes to Offer
                      </span>
                    </div>
                    <Badge className="text-[10px] px-1.5 h-4 bg-emerald-100 text-emerald-600 border-0">
                      {loading ? "…" : respondedYes.length}
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    {loading
                      ? Array(3).fill(0).map((_, i) => (
                          <Skeleton key={i} className="h-20 w-full rounded-2xl" />
                        ))
                      : respondedYes.length === 0
                      ? (
                        <div className="flex flex-col items-center justify-center gap-2 py-10 opacity-40">
                          <CheckCircle2 className="h-8 w-8 text-gray-400" />
                          <p className="text-xs text-gray-400">No responses yet</p>
                        </div>
                      )
                      : respondedYes.map((opp) => (
                          <Card
                            key={opp.id}
                            className="bg-white border border-emerald-100 shadow-sm p-4 rounded-2xl cursor-pointer hover:border-emerald-300 transition-all"
                          >
                            <p className="text-sm font-bold text-gray-800 whitespace-normal leading-tight mb-3">
                              {opp.name}
                            </p>
                            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-[10px] font-bold">
                                  {opp.contact?.name?.[0] || "?"}
                                </div>
                                <span className="text-[10px] font-medium text-gray-400 truncate w-24">
                                  {opp.contact?.name || "Unknown"}
                                </span>
                              </div>
                              <div className="text-[10px] font-bold text-emerald-600 flex items-center">
                                <DollarSign size={10} />
                                {opp.monetaryValue?.toLocaleString() || "0"}
                              </div>
                            </div>
                          </Card>
                        ))}
                  </div>
                </div>

                {/* Regular pipeline stages */}
                {loading
                  ? Array(3).fill(0).map((_, i) => (
                      <div key={i} className="w-72 space-y-4">
                        <Skeleton className="h-6 w-40 rounded-lg" />
                        <Skeleton className="h-36 w-full rounded-2xl" />
                      </div>
                    ))
                  : kanbanData.map((stage) => (
                      <div key={stage.id} className="w-72 shrink-0 space-y-4">
                        <div className="flex items-center justify-between px-1">
                          <span className="text-xs font-bold uppercase tracking-widest text-gray-500">
                            {stage.name}
                          </span>
                          <Badge className="text-[10px] px-1.5 h-4 bg-gray-100 text-gray-500 border-0">
                            {stage.opps.length}
                          </Badge>
                        </div>
                        <div className="space-y-3">
                          {stage.opps.length === 0 ? (
                            <div className="flex items-center justify-center py-10 opacity-30">
                              <p className="text-xs text-gray-400">Empty</p>
                            </div>
                          ) : (
                            stage.opps.map((opp) => (
                              <Card
                                key={opp.id}
                                className="bg-white border border-gray-100 shadow-sm p-4 rounded-2xl cursor-pointer hover:border-primary/30 transition-all"
                              >
                                <p className="text-sm font-bold text-gray-800 whitespace-normal leading-tight mb-3">
                                  {opp.name}
                                </p>
                                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
                                      {opp.contact?.name?.[0] || "L"}
                                    </div>
                                    <span className="text-[10px] font-medium text-gray-400 truncate w-24">
                                      {opp.contact?.name || "Lead Anonymous"}
                                    </span>
                                  </div>
                                  <div className="text-[10px] font-bold text-emerald-600 flex items-center">
                                    <DollarSign size={10} />
                                    {opp.monetaryValue?.toLocaleString() || "0"}
                                  </div>
                                </div>
                              </Card>
                            ))
                          )}
                        </div>
                      </div>
                    ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </section>

          {/* ── SALES OVERVIEW + TODAY ────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Sales Overview */}
            <Card className="bg-white border-0 shadow-sm rounded-2xl">
              <CardHeader className="pb-2 px-6 pt-6">
                <CardTitle className="text-base font-bold text-gray-900">Sales Overview</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-6 py-6">
                {loading ? (
                  <Skeleton className="w-36 h-36 rounded-full" />
                ) : (
                  <DonutChart percent={salesOverviewPercent} />
                )}
                <div className="w-full grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-xl bg-gray-50 border border-gray-100 p-3">
                    <p className="text-lg font-bold text-gray-900">
                      {loading ? "…" : opportunities.length}
                    </p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-0.5">Total</p>
                  </div>
                  <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3">
                    <p className="text-lg font-bold text-emerald-600">
                      {loading ? "…" : respondedYes.length}
                    </p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-0.5">Won</p>
                  </div>
                  <div className="rounded-xl bg-amber-50 border border-amber-100 p-3">
                    <p className="text-lg font-bold text-amber-600">
                      {loading ? "…" : opportunities.filter((o) => o.status === "open").length}
                    </p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-0.5">Open</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Today's Appointments */}
            <Card className="bg-white border-0 shadow-sm rounded-2xl">
              <CardHeader className="pb-2 px-6 pt-6">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    Today
                  </CardTitle>
                  <span className="text-[11px] text-gray-400 font-medium">{todayLabel}</span>
                </div>
              </CardHeader>
              <CardContent className="px-6 pb-6 space-y-2">
                {loading ? (
                  Array(3).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full rounded-xl" />
                  ))
                ) : todayAppts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-12 opacity-40">
                    <Calendar className="h-8 w-8 text-gray-400" />
                    <p className="text-sm text-gray-400">No appointments today</p>
                  </div>
                ) : (
                  todayAppts.map((appt) => {
                    const start = new Date(appt.startTime);
                    const statusColor =
                      appt.status === "confirmed" || appt.status === "booked"
                        ? "text-emerald-600 bg-emerald-50 border-emerald-200"
                        : appt.status === "cancelled"
                        ? "text-red-500 bg-red-50 border-red-200"
                        : "text-amber-600 bg-amber-50 border-amber-200";
                    return (
                      <div
                        key={appt.id}
                        className="flex items-center justify-between px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 hover:bg-gray-100 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <Clock size={15} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-800 leading-tight">{appt.title}</p>
                            <p className="text-[11px] text-gray-400 mt-0.5">
                              {start.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn("text-[10px] capitalize border", statusColor)}
                        >
                          {appt.status}
                        </Badge>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

          </div>
        </div>
      </main>
    </div>
  );
}
