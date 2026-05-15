"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { DashboardNav } from "@/components/dashboard/nav";
import { getSocialPosts, getEmailTemplates, getTriggerLinks } from "@/lib/ghl-actions";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  CalendarDays, 
  Mail, 
  Link as LinkIcon, 
  Search, 
  Plus, 
  Settings, 
  Filter, 
  LayoutList, 
  Calendar as CalendarIcon, 
  MessageSquare, 
  BarChart3, 
  Radio, 
  Clock, 
  ChevronDown,
  MoreHorizontal,
  RefreshCw,
  Zap,
  Ticket,
  Palette,
  Target
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const mainTabs = [
  { name: "Social Planner", value: "social", icon: CalendarDays },
  { name: "Emails", value: "emails", icon: Mail },
  { name: "Snippets", value: "snippets", icon: Zap },
  { name: "Countdown Timers", value: "timers", icon: Clock },
  { name: "Trigger Links", value: "links", icon: LinkIcon },
  { name: "Affiliate Manager", value: "affiliate", icon: UsersIcon },
  { name: "Brand Boards", value: "brand", icon: Palette },
  { name: "Ad Manager", value: "ads", icon: Target },
];

const socialSubTabs = [
  { name: "Planner", value: "planner", icon: CalendarDays },
  { name: "Content", value: "content", icon: LayoutList },
  { name: "Comments", value: "comments", icon: MessageSquare },
  { name: "Statistics", value: "stats", icon: BarChart3 },
  { name: "Social Listening", value: "listening", icon: Radio },
  { name: "Settings", value: "settings", icon: Settings },
];

export default function MarketingPage() {
  const [activeMainTab, setActiveMainTab] = useState("social");
  const [activeSocialTab, setActiveSocialTab] = useState("planner");
  const [loading, setLoading] = useState(true);
  const [dataList, setDataList] = useState<any[]>([]);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let data = [];
      if (activeMainTab === "social") {
        data = await getSocialPosts();
      } else if (activeMainTab === "emails") {
        data = await getEmailTemplates();
      } else if (activeMainTab === "links") {
        data = await getTriggerLinks();
      }
      setDataList(data || []);
    } catch (error) {
      console.error("Marketing fetch error:", error);
    } finally {
      setLoading(false);
    }
  }, [activeMainTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="flex min-h-screen bg-background text-foreground overflow-hidden">
      <DashboardNav />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Hub Navigation (from screenshot) */}
        <header className="border-b border-border bg-card/30 backdrop-blur-md z-20 shrink-0">
          <div className="px-8 flex items-center h-16 gap-2">
            <span className="text-sm font-bold text-muted-foreground pr-4 border-r mr-4">Marketing</span>
            <Tabs value={activeMainTab} onValueChange={setActiveMainTab} className="flex-1">
              <TabsList className="bg-transparent h-16 p-0 gap-8">
                {mainTabs.map((tab) => (
                  <TabsTrigger 
                    key={tab.value} 
                    value={tab.value}
                    className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none border-b-2 border-transparent px-0 h-full text-xs font-medium transition-all"
                  >
                    {tab.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </header>

        {/* Social Planner Content */}
        {activeMainTab === "social" && (
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="px-8 py-6 border-b bg-card/10 flex items-center justify-between shrink-0">
              <h1 className="text-3xl font-bold font-headline tracking-tight">Social Planner</h1>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-9 w-9 rounded-md"><MessageSquare size={18} /></Button>
                <Button variant="outline" size="icon" className="h-9 w-9 rounded-md"><Settings size={18} /></Button>
                <Button variant="outline" className="h-9 rounded-md border-border bg-card">
                  <Plus size={18} className="mr-2" /> Socials
                </Button>
                <Button className="h-9 rounded-md bg-primary hover:bg-primary/90 px-6 font-bold shadow-lg">
                  <Plus size={18} className="mr-2" /> New Post
                </Button>
              </div>
            </div>

            {/* Social Planner Sub-Tabs */}
            <div className="px-8 border-b bg-card/5 shrink-0">
              <Tabs value={activeSocialTab} onValueChange={setActiveSocialTab}>
                <TabsList className="bg-transparent h-12 p-0 gap-8">
                  {socialSubTabs.map((tab) => (
                    <TabsTrigger 
                      key={tab.value} 
                      value={tab.value}
                      className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none border-b-2 border-transparent px-0 h-full text-xs font-medium transition-all"
                    >
                      {tab.name}
                      {tab.value === "comments" && <Badge variant="secondary" className="ml-2 bg-amber-400 text-black text-[9px] font-bold h-4 px-1">New</Badge>}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>

            {/* Planner Filters and Controls */}
            <div className="px-8 py-4 border-b flex flex-col md:flex-row md:items-center justify-between gap-4 bg-background/30 shrink-0">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border bg-card text-xs font-medium">
                  <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-[8px] text-white">A</div>
                  <ChevronDown size={14} className="opacity-50" />
                </div>
                <div className="flex items-center gap-2 px-4 py-1.5 rounded-md border bg-card text-xs font-medium min-w-[280px]">
                  <span>2025-12-15</span>
                  <ArrowRightIcon className="mx-2 opacity-30" />
                  <span>2026-06-15</span>
                  <CalendarIcon size={14} className="ml-auto opacity-50" />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="h-9 rounded-md"><Filter size={14} className="mr-2" /> Filters</Button>
                <div className="h-9 w-px bg-border mx-1" />
                <div className="flex items-center gap-1 bg-white/5 p-1 rounded-md border">
                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-sm"><LayoutList size={14} /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-sm bg-card shadow-sm"><CalendarIcon size={14} /></Button>
                </div>
              </div>
            </div>

            {/* Search and Main Data Area */}
            <div className="flex-1 overflow-y-auto p-8 no-scrollbar bg-card/5">
              <div className="max-w-[1600px] mx-auto space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" className="h-10 px-4 rounded-lg font-bold">Actions <ChevronDown size={14} className="ml-2 opacity-50" /></Button>
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                      Filter Views: <Button variant="ghost" size="sm" className="text-primary font-bold h-8 px-2">All <ChevronDown size={14} className="ml-1" /></Button>
                    </div>
                  </div>
                  <div className="relative w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
                    <Input 
                      placeholder="Search by caption (min 3 chars)" 
                      className="pl-10 h-10 rounded-lg text-sm border-border bg-card/50"
                    />
                  </div>
                </div>

                <Card className="rounded-xl border border-border/50 shadow-sm overflow-hidden bg-card/50">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow className="hover:bg-transparent border-border/50">
                        <TableHead className="w-[50px] px-6 text-center"><Input type="checkbox" className="h-4 w-4" /></TableHead>
                        <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-4">Caption</TableHead>
                        <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-4">Media</TableHead>
                        <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-4">Status</TableHead>
                        <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-4">Type</TableHead>
                        <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-4">Date</TableHead>
                        <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-4">Social</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        Array(5).fill(0).map((_, i) => (
                          <TableRow key={i}><TableCell colSpan={7} className="px-6 py-4"><Skeleton className="h-12 w-full" /></TableCell></TableRow>
                        ))
                      ) : dataList.length > 0 ? (
                        dataList.map((item, i) => (
                          <TableRow key={i} className="hover:bg-muted/30 border-border/30 transition-all">
                            <TableCell className="px-6 text-center"><Input type="checkbox" className="h-4 w-4" /></TableCell>
                            <TableCell className="font-medium text-sm">{item.caption || 'No caption'}</TableCell>
                            <TableCell><div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center"><CalendarDays size={18} className="opacity-20" /></div></TableCell>
                            <TableCell><Badge variant="outline" className="text-[10px] uppercase font-bold tracking-tighter">{item.status || 'Scheduled'}</Badge></TableCell>
                            <TableCell className="text-xs text-muted-foreground">{item.type || 'Post'}</TableCell>
                            <TableCell className="text-xs font-mono">{new Date().toLocaleDateString()}</TableCell>
                            <TableCell><div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-[8px] text-white">f</div></TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} className="h-[400px] text-center">
                            <div className="flex flex-col items-center justify-center py-20 opacity-30">
                              <CalendarDays size={64} className="mb-4" />
                              <p className="text-xl font-bold">No social posts found</p>
                              <p className="text-sm">Start scheduling by clicking 'New Post'</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* Placeholder Content for other tabs */}
        {activeMainTab !== "social" && (
          <div className="flex-1 flex flex-col items-center justify-center opacity-30">
            <BarChart3 size={64} className="mb-4" />
            <h2 className="text-2xl font-bold">{mainTabs.find(t => t.value === activeMainTab)?.name} Module</h2>
            <p className="text-sm">Synchronizing live records from GHL cloud...</p>
          </div>
        )}
      </main>
    </div>
  );
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
