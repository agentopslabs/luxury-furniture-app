"use client";

import { useEffect, useState, useMemo } from "react";
import { DashboardNav } from "@/components/dashboard/nav";
import { ghl, GHLAppointment, GHLOpportunity, GHLPipeline } from "@/lib/ghl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  Calendar,
  DollarSign,
  CheckCircle2,
  Layers,
  Clock,
  ThumbsUp,
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
          cx="72"
          cy="72"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth={stroke}
        />
        <circle
          cx="72"
          cy="72"
          r={radius}
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
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    async function fetchData() {
      try {
        const [oppsData, allAppts, pipeData] = await Promise.all([
          ghl.getOpportunities(),
          ghl.getAllAppointments(),
          ghl.getPipelines(),
        ]);
        setOpportunities(oppsData);
        setPipelines(pipeData);
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
    ? new Date().toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      })
    : "";

  if (!isMounted) return null;

  return (
    <div className="flex min-h-screen bg-background text-foreground overflow-hidden">
      <DashboardNav />
      <main className="flex-1 p-4 md:p-8 overflow-y-auto no-scrollbar">
        <div className="max-w-6xl mx-auto space-y-8">

          {/* Header */}
          <header className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              {isMounted
                ? new Date().toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : ""}
            </p>
          </header>

          {/* ── SALES PIPELINE ───────────────────────────────────────── */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold">Sales Pipeline</h2>
            </div>

            <ScrollArea className="w-full whitespace-nowrap rounded-2xl border border-white/5 bg-white/[0.01] p-1">
              <div className="flex w-max gap-4 p-4">
                {/* ── Responded Yes to Offer column ── */}
                <div className="w-72 shrink-0 space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <ThumbsUp className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        Responded Yes to Offer
                      </span>
                    </div>
                    <Badge
                      variant="secondary"
                      className="text-[10px] px-1.5 h-4 bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    >
                      {loading ? "…" : respondedYes.length}
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    {loading
                      ? Array(3)
                          .fill(0)
                          .map((_, i) => (
                            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
                          ))
                      : respondedYes.length === 0
                      ? (
                        <div className="flex flex-col items-center justify-center gap-2 py-10 opacity-40">
                          <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">No responses yet</p>
                        </div>
                      )
                      : respondedYes.map((opp) => (
                          <Card
                            key={opp.id}
                            className="glass glass-hover border-emerald-500/10 bg-emerald-500/[0.03] p-4 rounded-2xl group transition-all cursor-pointer"
                          >
                            <p className="text-sm font-bold text-foreground group-hover:text-emerald-400 transition-colors whitespace-normal leading-tight mb-3">
                              {opp.name}
                            </p>
                            <div className="flex items-center justify-between pt-3 border-t border-white/5">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold">
                                  {opp.contact?.name?.[0] || "?"}
                                </div>
                                <span className="text-[10px] font-medium text-muted-foreground truncate w-24">
                                  {opp.contact?.name || "Unknown"}
                                </span>
                              </div>
                              <div className="text-[10px] font-bold text-emerald-400 flex items-center">
                                <DollarSign size={10} />
                                {opp.monetaryValue?.toLocaleString() || "0"}
                              </div>
                            </div>
                          </Card>
                        ))}
                  </div>
                </div>

                {/* ── Regular pipeline stages ── */}
                {loading
                  ? Array(3)
                      .fill(0)
                      .map((_, i) => (
                        <div key={i} className="w-72 space-y-4">
                          <Skeleton className="h-6 w-40 rounded-lg" />
                          <Skeleton className="h-36 w-full rounded-2xl" />
                        </div>
                      ))
                  : kanbanData.map((stage) => (
                      <div key={stage.id} className="w-72 shrink-0 space-y-4">
                        <div className="flex items-center justify-between px-1">
                          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                            {stage.name}
                          </span>
                          <Badge
                            variant="secondary"
                            className="text-[10px] px-1.5 h-4 bg-white/5 border-white/5"
                          >
                            {stage.opps.length}
                          </Badge>
                        </div>
                        <div className="space-y-3">
                          {stage.opps.length === 0 ? (
                            <div className="flex items-center justify-center py-10 opacity-30">
                              <p className="text-xs text-muted-foreground">Empty</p>
                            </div>
                          ) : (
                            stage.opps.map((opp) => (
                              <Card
                                key={opp.id}
                                className="glass glass-hover border-white/5 p-4 rounded-2xl group transition-all cursor-pointer"
                              >
                                <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors whitespace-normal leading-tight mb-3">
                                  {opp.name}
                                </p>
                                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold">
                                      {opp.contact?.name?.[0] || "L"}
                                    </div>
                                    <span className="text-[10px] font-medium text-muted-foreground truncate w-24">
                                      {opp.contact?.name || "Lead Anonymous"}
                                    </span>
                                  </div>
                                  <div className="text-[10px] font-bold text-emerald-400 flex items-center">
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
            <Card className="glass border-border/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  Sales Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-6 py-6">
                {loading ? (
                  <Skeleton className="w-36 h-36 rounded-full" />
                ) : (
                  <DonutChart percent={salesOverviewPercent} />
                )}
                <div className="w-full grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-xl bg-white/[0.04] border border-white/5 p-3">
                    <p className="text-lg font-bold">
                      {loading ? "…" : opportunities.length}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">
                      Total
                    </p>
                  </div>
                  <div className="rounded-xl bg-emerald-500/[0.06] border border-emerald-500/20 p-3">
                    <p className="text-lg font-bold text-emerald-400">
                      {loading ? "…" : respondedYes.length}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">
                      Won
                    </p>
                  </div>
                  <div className="rounded-xl bg-white/[0.04] border border-white/5 p-3">
                    <p className="text-lg font-bold text-amber-400">
                      {loading
                        ? "…"
                        : opportunities.filter((o) => o.status === "open").length}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">
                      Open
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Today's Appointments */}
            <Card className="glass border-border/40">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    Today
                  </CardTitle>
                  <span className="text-[11px] text-muted-foreground font-medium">{todayLabel}</span>
                </div>
              </CardHeader>
              <CardContent className="py-3 space-y-2">
                {loading ? (
                  Array(3)
                    .fill(0)
                    .map((_, i) => (
                      <Skeleton key={i} className="h-14 w-full rounded-xl" />
                    ))
                ) : todayAppts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-12 opacity-40">
                    <Calendar className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No appointments today</p>
                  </div>
                ) : (
                  todayAppts.map((appt) => {
                    const start = new Date(appt.startTime);
                    const statusColor =
                      appt.status === "confirmed" || appt.status === "booked"
                        ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                        : appt.status === "cancelled"
                        ? "text-red-400 bg-red-500/10 border-red-500/20"
                        : "text-amber-400 bg-amber-500/10 border-amber-500/20";
                    return (
                      <div
                        key={appt.id}
                        className="flex items-center justify-between px-4 py-3 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0">
                            <Clock size={15} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold leading-tight">{appt.title}</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              {start.toLocaleTimeString("en-US", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
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
