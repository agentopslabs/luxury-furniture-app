"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { DashboardNav } from "@/components/dashboard/nav";
import { getCampaigns, getWorkflows, getEmailTemplates } from "@/lib/ghl-actions";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
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
  Megaphone, 
  Zap, 
  Mail, 
  Search, 
  RefreshCw, 
  Plus,
  MoreVertical,
  Activity,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Filter
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function MarketingPage() {
  const [activeTab, setActiveTab] = useState("campaigns");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);

  const { toast } = useToast();

  const fetchData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const [campData, workData, tempData] = await Promise.all([
        getCampaigns(),
        getWorkflows(),
        getEmailTemplates()
      ]);
      
      setCampaigns(campData);
      setWorkflows(workData);
      setTemplates(tempData);
      
      if (isManual) {
        toast({
          title: "Registry Synced",
          description: "Marketing automation repository updated from GHL cloud.",
        });
      }
    } catch (error) {
      console.error("Marketing fetch error:", error);
      toast({
        variant: "destructive",
        title: "Sync Error",
        description: "Failed to pull automation data from LeadConnector.",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredData = useMemo(() => {
    const list = activeTab === 'campaigns' ? campaigns : 
                 activeTab === 'workflows' ? workflows : templates;
    
    return list.filter(item => {
      const name = (item.name || item.title || item.subject || "").toLowerCase();
      return name.includes(searchQuery.toLowerCase());
    });
  }, [activeTab, campaigns, workflows, templates, searchQuery]);

  return (
    <div className="flex min-h-screen bg-background text-foreground overflow-hidden">
      <DashboardNav />
      <main className="flex-1 flex flex-col h-screen relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
        
        <header className="border-b border-white/5 bg-background/50 backdrop-blur-md z-10 shrink-0">
          <div className="px-8 pt-8 pb-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
              <div className="space-y-1">
                <h1 className="text-4xl font-bold font-headline flex items-center gap-3">
                  <Megaphone className="text-primary h-8 w-8" />
                  Marketing Intelligence
                </h1>
                <p className="text-muted-foreground font-medium flex items-center gap-2">
                  <Activity size={14} className="text-primary" />
                  V2 Automation Sync • nBYJTjYbHTIsJGiqT0W4
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => fetchData(true)}
                  disabled={loading || refreshing}
                  className="h-11 rounded-xl border-white/10 bg-white/[0.03] hover:bg-white/[0.08] transition-all font-bold"
                >
                  <RefreshCw className={cn("mr-2 h-4 w-4", refreshing && "animate-spin")} />
                  {refreshing ? "Refreshing..." : "Sync Cloud"}
                </Button>
                <Button className="glow-primary bg-primary hover:bg-primary/90 h-11 px-6 rounded-xl font-bold transition-all active:scale-95">
                  <Plus className="mr-2 h-5 w-5" /> New Automation
                </Button>
              </div>
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="bg-transparent border-b border-white/5 w-full justify-start rounded-none h-auto p-0 gap-10">
                <TabsTrigger 
                  value="campaigns" 
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none border-b-2 border-transparent px-0 py-3 text-sm font-bold uppercase tracking-widest opacity-60 data-[state=active]:opacity-100 transition-all flex items-center gap-2"
                >
                  <Megaphone size={16} /> Campaigns
                  <Badge variant="secondary" className="ml-2 text-[10px] bg-white/5 h-4 px-1.5">{campaigns.length}</Badge>
                </TabsTrigger>
                <TabsTrigger 
                  value="workflows" 
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none border-b-2 border-transparent px-0 py-3 text-sm font-bold uppercase tracking-widest opacity-60 data-[state=active]:opacity-100 transition-all flex items-center gap-2"
                >
                  <Zap size={16} /> Workflows
                  <Badge variant="secondary" className="ml-2 text-[10px] bg-white/5 h-4 px-1.5">{workflows.length}</Badge>
                </TabsTrigger>
                <TabsTrigger 
                  value="templates" 
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none border-b-2 border-transparent px-0 py-3 text-sm font-bold uppercase tracking-widest opacity-60 data-[state=active]:opacity-100 transition-all flex items-center gap-2"
                >
                  <Mail size={16} /> Templates
                  <Badge variant="secondary" className="ml-2 text-[10px] bg-white/5 h-4 px-1.5">{templates.length}</Badge>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto no-scrollbar relative z-10 p-8">
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
                <Input 
                  placeholder={`Search in ${activeTab}...`}
                  className="glass pl-11 h-12 rounded-xl text-sm border-white/5 focus:ring-primary transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" className="h-10 text-[11px] font-bold uppercase tracking-widest text-muted-foreground opacity-60 hover:opacity-100">
                  <Filter size={14} className="mr-2" /> Advanced filters
                </Button>
                <Button variant="ghost" size="sm" className="h-10 text-[11px] font-bold uppercase tracking-widest text-muted-foreground opacity-60 hover:opacity-100">
                  <Activity size={14} className="mr-2" /> Show analytics
                </Button>
              </div>
            </div>

            <Card className="glass border-white/5 rounded-3xl overflow-hidden group">
              <div className="h-1 w-full bg-gradient-to-r from-primary via-accent to-primary animate-shimmer opacity-20" />
              <Table>
                <TableHeader className="bg-white/[0.02]">
                  <TableRow className="hover:bg-transparent border-white/5">
                    <TableHead className="px-8 text-[10px] font-bold uppercase tracking-widest opacity-50 h-14">Definition</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest opacity-50 h-14">Identity</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest opacity-50 h-14">State</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest opacity-50 h-14">Updated</TableHead>
                    <TableHead className="px-8 text-right text-[10px] font-bold uppercase tracking-widest opacity-50 h-14">Ops</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array(6).fill(0).map((_, i) => (
                      <TableRow key={i} className="border-white/5">
                        <TableCell colSpan={5} className="px-8 py-4"><Skeleton className="h-12 w-full rounded-xl" /></TableCell>
                      </TableRow>
                    ))
                  ) : filteredData.length > 0 ? (
                    filteredData.map((item, i) => (
                      <TableRow key={item.id || i} className="group hover:bg-white/[0.02] border-white/5 transition-all animate-in fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                        <TableCell className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold border",
                              activeTab === 'campaigns' ? "bg-primary/10 text-primary border-primary/20" :
                              activeTab === 'workflows' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                              "bg-blue-500/10 text-blue-500 border-blue-500/20"
                            )}>
                              {activeTab === 'campaigns' ? <Megaphone size={18} /> : 
                               activeTab === 'workflows' ? <Zap size={18} /> : <Mail size={18} />}
                            </div>
                            <div>
                              <p className="font-bold text-sm group-hover:text-primary transition-colors">{item.name || item.title || item.subject || 'Untitled Automation'}</p>
                              <p className="text-[10px] text-muted-foreground font-medium opacity-50">Ref ID: {(item.id || 'N/A').slice(0, 8)}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[9px] uppercase font-bold tracking-widest bg-white/5 border-white/10 px-2 py-0.5">
                            {item.status || item.type || (activeTab === 'templates' ? 'Static' : 'Active')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {item.status === 'published' || item.status === 'active' ? (
                              <CheckCircle2 size={14} className="text-emerald-400" />
                            ) : (
                              <Clock size={14} className="text-amber-400" />
                            )}
                            <span className="text-[10px] font-bold uppercase text-muted-foreground/70">{item.status || 'Draft'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs font-medium text-muted-foreground opacity-50">
                          {new Date(item.dateUpdated || item.updatedAt || Date.now()).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="px-8 text-right">
                          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all">
                            <ArrowUpRight size={18} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-[400px] text-center">
                        <div className="py-20 flex flex-col items-center justify-center space-y-6">
                          <div className="w-24 h-24 bg-white/[0.02] border border-white/5 rounded-full flex items-center justify-center mb-4 opacity-20">
                            <Megaphone className="h-10 w-10" />
                          </div>
                          <div className="space-y-2">
                            <p className="text-2xl font-bold text-muted-foreground">Reservoir Empty</p>
                            <p className="text-sm text-muted-foreground/60 max-w-[350px] mx-auto leading-relaxed font-medium">
                              No automation records were detected in the GHL synchronicity window for {activeTab}.
                            </p>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
