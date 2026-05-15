
"use client";

import { useState, useEffect, useCallback } from "react";
import { generateContactSummaryAndNotes } from "@/ai/flows/generate-contact-summary-and-notes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, RefreshCcw, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

interface Appointment {
  date: string;
  summary: string;
}

export function AIContactInsight({ 
  contactName, 
  history, 
  className 
}: { 
  contactName: string; 
  history: Appointment[]; 
  className?: string;
}) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async () => {
    if (history.length === 0 || isLoading) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const result = await generateContactSummaryAndNotes({
        contactName,
        appointmentHistory: history
      });
      setData(result);
      setError(null);
    } catch (e: any) {
      const errorMessage = e.message || String(e);
      
      if (
        errorMessage.includes("429") || 
        errorMessage.includes("RESOURCE_EXHAUSTED") || 
        errorMessage.includes("quota") ||
        errorMessage.includes("Too Many Requests")
      ) {
        setError("AI quota exceeded. Please wait about 60 seconds before retrying.");
      } else {
        setError("Intelligence generation failed. Please try again later.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [contactName, history, isLoading]);

  useEffect(() => {
    // Clear data and re-generate if the contact name changes or history changes
    if (history.length > 0) {
      setData(null);
      generate();
    }
  }, [contactName, history.length]);

  return (
    <Card className={cn("overflow-hidden border-primary/20 bg-primary/5", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          AI Prospect Intelligence
        </CardTitle>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => {
            setData(null);
            generate();
          }} 
          disabled={isLoading}
          className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors"
        >
          {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCcw className="h-3 w-3" />}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-3 py-2">
            <div className="h-3 bg-primary/10 animate-pulse rounded w-full" />
            <div className="h-3 bg-primary/10 animate-pulse rounded w-3/4" />
            <div className="h-3 bg-primary/10 animate-pulse rounded w-5/6" />
          </div>
        ) : error ? (
          <div className="space-y-3">
            <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive py-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-[11px] leading-tight ml-1">
                {error}
              </AlertDescription>
            </Alert>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                setError(null);
                generate();
              }} 
              className="w-full h-8 text-[10px] font-bold"
            >
              Manual Retry
            </Button>
          </div>
        ) : data ? (
          <div className="space-y-4 animate-in fade-in duration-700">
            <div>
              <p className="text-[10px] font-bold uppercase text-primary/70 mb-1 tracking-[0.2em]">Executive Summary</p>
              <p className="text-xs leading-relaxed text-foreground/90 font-medium">{data.executiveSummary}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-primary/70 mb-1 tracking-[0.2em]">Suggested CRM Notes</p>
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
            {history.length === 0 
              ? "Awaiting appointment history for analysis..." 
              : "Synchronizing intelligence..."}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
