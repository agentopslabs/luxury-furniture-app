
"use client";

import { useState, useEffect, useCallback } from "react";
import { generateContactSummaryAndNotes, type ActivityType } from "@/ai/flows/generate-contact-summary-and-notes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, RefreshCcw, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Activity {
  type: ActivityType;
  date: string;
  description: string;
}

export function AIContactInsight({ 
  contactName, 
  history, 
  className 
}: { 
  contactName: string; 
  history: { date: string; summary: string }[]; 
  className?: string;
}) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedTypes, setSelectedTypes] = useState<ActivityType[]>(['appointment_booked', 'new_lead', 'message_sent']);

  const generate = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const activities: Activity[] = history.map(h => {
        const desc = h.summary.toLowerCase();
        let type: ActivityType = 'message_sent';
        if (desc.includes('booked') || desc.includes('consult') || desc.includes('appt')) type = 'appointment_booked';
        else if (desc.includes('lead') || desc.includes('new lead')) type = 'new_lead';
        
        return {
          type,
          date: h.date,
          description: h.summary
        };
      }).filter(a => selectedTypes.includes(a.type as ActivityType));

      if (activities.length === 0 && history.length > 0 && selectedTypes.length > 0) {
        activities.push({
          type: selectedTypes[0],
          date: new Date().toLocaleDateString(),
          description: `Engagement event for ${contactName}`
        });
      }

      const result = await generateContactSummaryAndNotes({
        contactName,
        activities
      });
      setData(result);
      setError(null);
    } catch (e: any) {
      const errorMessage = e.message || String(e);
      if (errorMessage.includes("quota") || errorMessage.includes("429")) {
        setError("AI quota exceeded. Please wait 60 seconds.");
      } else {
        setError("Intelligence sync failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [contactName, history, selectedTypes]);

  useEffect(() => {
    if (history.length > 0) {
      setData(null);
      generate();
    }
  }, [contactName, history.length, selectedTypes]);

  const toggleType = (type: ActivityType) => {
    setSelectedTypes(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  return (
    <Card className={cn("overflow-hidden border-primary/20 bg-primary/5", className)}>
      <CardHeader className="flex flex-col space-y-4 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Intelligence Matrix
          </CardTitle>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => { setData(null); generate(); }} 
            disabled={isLoading}
            className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors"
          >
            {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCcw className="h-3 w-3" />}
          </Button>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'appointment_booked', label: 'Appointment Booked' },
            { id: 'new_lead', label: 'New Lead' },
            { id: 'message_sent', label: 'Message Sent' }
          ].map((type) => {
            const isActive = selectedTypes.includes(type.id as ActivityType);
            return (
              <Badge 
                key={type.id}
                variant={isActive ? "default" : "outline"}
                onClick={() => toggleType(type.id as ActivityType)}
                className={cn(
                  "cursor-pointer text-[9px] font-bold uppercase tracking-widest px-2 py-1 h-6 transition-all",
                  isActive ? "bg-primary text-white" : "opacity-40 hover:opacity-100"
                )}
              >
                {isActive && <CheckCircle2 size={10} className="mr-1" />}
                {type.label}
              </Badge>
            );
          })}
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        {isLoading ? (
          <div className="space-y-3 py-2">
            <div className="h-3 bg-primary/10 animate-pulse rounded w-full" />
            <div className="h-3 bg-primary/10 animate-pulse rounded w-3/4" />
          </div>
        ) : error ? (
          <div className="space-y-3">
            <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive py-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-[11px] leading-tight ml-1">
                {error}
              </AlertDescription>
            </Alert>
            <Button variant="outline" size="sm" onClick={generate} className="w-full h-8 text-[10px] font-bold">Manual Retry</Button>
          </div>
        ) : data ? (
          <div className="space-y-4 animate-in fade-in duration-700">
            <div>
              <p className="text-[10px] font-bold uppercase text-primary/70 mb-1 tracking-[0.2em]">Matrix Summary</p>
              <p className="text-xs leading-relaxed text-foreground/90 font-medium">{data.executiveSummary}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-primary/70 mb-1 tracking-[0.2em]">Suggested Notes</p>
              <div className="text-[10px] text-muted-foreground space-y-1 font-medium">
                {data.suggestedNotes.split('\n').filter((n: string) => n.trim()).map((note: string, i: number) => (
                  <p key={i} className="flex gap-2">
                    <span className="text-primary opacity-50">•</span>
                    {note.replace(/^[-*•]\s*/, '')}
                  </p>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-[10px] text-muted-foreground italic font-medium opacity-50">
            Select intelligence markers to analyze engagement.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
