"use client";

import { useEffect, useState, useMemo } from "react";
import { DashboardNav } from "@/components/dashboard/nav";
import { ghl, GHLAppointment, GHLOpportunity, GHLPipeline } from "@/lib/ghl";
import { getOrders } from "@/lib/ghl-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  Calendar,
  Layers,
  Clock,
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

type ChartGroup = { name: string; total: number; won: number };

function PipelineBarGraph({ loading, groups }: { loading: boolean; groups: ChartGroup[] }) {
  const chartH = 300;
  const padT = 20;
  const padB = 40;
  const padL = 40;
  const padR = 20;
  const svgW = 700;
  const plotH = chartH - padT - padB;
  const plotW = svgW - padL - padR;

  const rawMax = groups.length > 0 ? Math.max(...groups.map((g) => g.total)) : 0;
  const step = rawMax <= 5 ? 1 : rawMax <= 20 ? 5 : 10;
  const axisMax = Math.max(Math.ceil((rawMax + 1) / step) * step, 5);
  const yTicks = Array.from({ length: axisMax / step + 1 }, (_, i) => i * step);

  const groupCount = groups.length;
  const groupW = groupCount > 0 ? plotW / groupCount : 60;
  const barW = Math.min(32, groupW * 0.45);

  const yPos = (val: number) => padT + plotH - (val / axisMax) * plotH;

  return (
    <Card className="bg-white border-0 shadow-sm rounded-2xl">
      <CardContent className="px-6 pt-5 pb-4">
        {loading ? (
          <div className="space-y-3 pt-2">
            <div className="flex justify-between">
              <Skeleton className="h-5 w-32 rounded" />
              <Skeleton className="h-5 w-24 rounded" />
            </div>
            <Skeleton className="h-52 w-full rounded-xl" />
          </div>
        ) : groups.length === 0 ? (
          <div className="flex items-center justify-center h-52 opacity-40">
            <p className="text-sm text-gray-400">No pipeline data</p>
          </div>
        ) : (
          <div>
            {/* Legend */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-gray-800">Sales Pipeline</span>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#7dd3fc]" />
                <span className="text-xs text-gray-500">Opportunities</span>
              </div>
            </div>

            {/* Chart */}
            <div className="w-full">
              <svg
                width="100%"
                height={chartH}
                viewBox={`0 0 ${svgW} ${chartH}`}
                preserveAspectRatio="xMidYMid meet"
              >
                <defs>
                  <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7dd3fc" />
                    <stop offset="100%" stopColor="#38bdf8" />
                  </linearGradient>
                  <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#3730a3" />
                  </linearGradient>
                </defs>

                {/* Y-axis gridlines & labels */}
                {yTicks.map((tick, ti) => {
                  const y = yPos(tick);
                  return (
                    <g key={`tick-${ti}`}>
                      <line
                        x1={padL} y1={y}
                        x2={svgW - padR} y2={y}
                        stroke="#e5e7eb" strokeWidth={1}
                      />
                      <text
                        x={padL - 8} y={y + 4}
                        textAnchor="end"
                        fontSize={10}
                        fill="#9ca3af"
                      >
                        {tick}
                      </text>
                    </g>
                  );
                })}

                {/* Bars */}
                {groups.map((g, i) => {
                  const centerX = padL + (i + 0.5) * groupW;
                  const x = centerX - barW / 2;
                  const totalH = (g.total / axisMax) * plotH;
                  const labelX = centerX;
                  const labelY = padT + plotH + 24;

                  return (
                    <g key={i}>
                      {/* Total bar (light blue) */}
                      <rect
                        x={x}
                        y={yPos(g.total)}
                        width={barW}
                        height={Math.max(totalH, 2)}
                        rx={4} ry={4}
                        fill="url(#blueGrad)"
                      />
                      {/* X-axis label */}
                      <text
                        x={labelX}
                        y={labelY}
                        textAnchor="middle"
                        fontSize={9}
                        fill="#6b7280"
                        fontWeight="500"
                      >
                        {g.name.length > 10 ? g.name.slice(0, 9) + "…" : g.name}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
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
      const [contactsRes, oppsRes, apptsRes, pipeRes, ordersRes] = await Promise.allSettled([
        ghl.getContacts(100),
        ghl.getOpportunities(),
        ghl.getAllAppointments(),
        ghl.getPipelines(),
        getOrders(5),
      ]);
      if (contactsRes.status === "fulfilled") setContactCount(contactsRes.value.length);
      if (oppsRes.status === "fulfilled") setOpportunities(oppsRes.value);
      if (apptsRes.status === "fulfilled") setAppts(apptsRes.value);
      if (pipeRes.status === "fulfilled") setPipelines(pipeRes.value);
      if (ordersRes.status === "fulfilled") setOrders(ordersRes.value || []);
      setLoading(false);
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
      { label: "Pipeline Value", value: `₹${(pipelineValue / 1000).toFixed(1)}k`, icon: TrendingUp, color: "text-emerald-500" },
      { label: "Active Leads", value: contactCount.toLocaleString(), icon: Users, color: "text-primary" },
      { label: "Won Deals", value: wonDeals.toString(), icon: Zap, color: "text-amber-500" },
      { label: "Order Volume", value: `₹${(orderTotal / 1000).toFixed(1)}k`, icon: CreditCard, color: "text-blue-500" },
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

  const chartGroups = useMemo<ChartGroup[]>(() => {
    if (pipelines.length === 0) return [];
    const wonOpps = opportunities.filter((o) => o.status === "won");
    const stages = pipelines[0].stages.map((stage) => {
      const stageOpps = opportunities.filter((o) => o.pipelineStageId === stage.id);
      const stageWon = stageOpps.filter((o) => o.status === "won").length;
      return { name: stage.name, total: stageOpps.length, won: stageWon };
    });
    return [
      { name: "Responded Yes", total: wonOpps.length, won: wonOpps.length },
      ...stages,
    ];
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

          {/* ── SALES PIPELINE BAR GRAPH ─────────────────────────────── */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold text-gray-900">Sales Pipeline</h2>
            </div>

            <PipelineBarGraph loading={loading} groups={chartGroups} />
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
