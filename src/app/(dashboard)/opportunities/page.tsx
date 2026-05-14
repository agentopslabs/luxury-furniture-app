
"use client";

import { useEffect, useState, useCallback } from "react";
import { DashboardNav } from "@/components/dashboard/nav";
import { getOpportunities, updateOpportunityStatus } from "@/lib/ghl-actions";
import { GHLOpportunity } from "@/lib/ghl";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Target, 
  RefreshCw, 
  DollarSign, 
  User, 
  BadgeCheck, 
  MoreVertical,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<GHLOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const fetchData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await getOpportunities();
      setOpportunities(data);
      if (isManual) {
        toast({
          title: "Opportunities Synced",
          description: `Fetched ${data.length} records from LeadConnector.`,
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Sync Error",
        description: "Failed to connect to GHL V2 API.",
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
      await updateOpportunityStatus(id, newStatus);
      setOpportunities(prev => prev.map(o => o.id === id ? { ...o, status: newStatus as any } : o));
      toast({
        title: "Deal Status Updated",
        description: `Opportunity marked as ${newStatus}.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Could not sync status change to GHL.",
      });
    }
  };

  const filtered = opportunities.filter(o => 
    o.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.contact?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardNav />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-8">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-4xl font-bold tracking-tight">Opportunities</h1>
              <p className="text-muted-foreground">Manage deal status and monetary value from GHL V2.</p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => fetchData(true)} 
                disabled={loading || refreshing}
              >
                <RefreshCw className={cn("mr-2 h-4 w-4", refreshing && "animate-spin")} />
                Sync Opportunities
              </Button>
            </div>
          </header>

          <Card className="glass border-border/40">
            <CardHeader className="pb-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" /> 
                  Deal Flow ({filtered.length})
                </CardTitle>
                <div className="relative w-full md:w-72">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search deals or contacts..." 
                    className="pl-9 h-9 text-xs"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {Array(6).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-lg" />
                  ))}
                </div>
              ) : filtered.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {filtered.map((opp) => (
                    <div 
                      key={opp.id} 
                      className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-card/40 hover:bg-card/60 transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                          {opp.name?.[0] || 'O'}
                        </div>
                        <div className="space-y-1">
                          <p className="font-bold text-sm">{opp.name}</p>
                          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <User size={12} className="opacity-50" />
                              {opp.contact?.name || 'Unknown Lead'}
                            </span>
                            <span className="flex items-center gap-1 font-mono">
                              <DollarSign size={12} className="opacity-50 text-emerald-500" />
                              {(opp.monetaryValue || 0).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <Badge 
                          variant={opp.status === 'open' ? 'default' : 'secondary'} 
                          className={cn(
                            "capitalize text-[10px] h-5",
                            opp.status === 'won' && "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
                            opp.status === 'lost' && "bg-destructive/10 text-destructive border-destructive/20"
                          )}
                        >
                          {opp.status}
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
                            <DropdownMenuItem onClick={() => handleStatusUpdate(opp.id, 'won')}>
                              <CheckCircle className="mr-2 h-4 w-4 text-emerald-500" /> Mark as Won
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusUpdate(opp.id, 'lost')}>
                              <XCircle className="mr-2 h-4 w-4 text-destructive" /> Mark as Lost
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusUpdate(opp.id, 'abandoned')}>
                              <AlertCircle className="mr-2 h-4 w-4 text-amber-500" /> Mark as Abandoned
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusUpdate(opp.id, 'open')}>
                              <Target className="mr-2 h-4 w-4" /> Set to Open
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-24 text-center space-y-4 border rounded-xl border-dashed bg-muted/20">
                  <Target className="h-12 w-12 mx-auto text-muted-foreground opacity-20" />
                  <p className="text-sm text-muted-foreground italic">No opportunities found.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
