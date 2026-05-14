
"use client";

import { useState, useEffect } from "react";
import { generateContactSummaryAndNotes } from "@/ai/flows/generate-contact-summary-and-notes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Loader2, RefreshCcw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Appointment {
  date: string;
  summary: string;
}

export function AIContactInsight({ contactName, history }: { contactName: string; history: Appointment[] }) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    if (history.length === 0) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const result = await generateContactSummaryAndNotes({
        contactName,
        appointmentHistory: history
      });
      setData(result);
    } catch (e: any) {
      console.error("AI Insight Error:", e);
      // Handle the 429 Resource Exhausted error specifically
      if (e.message?.includes("429") || e.message?.includes("RESOURCE_EXHAUSTED")) {
        setError("AI quota exceeded. Please wait a minute before retrying.");
      } else {
        setError("Intelligence generation failed. Please try again later.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (history.length > 0 && !data && !isLoading) {
      generate();
    }
  }, [history.length]);

  return (
    <Card className="overflow-hidden border-primary/20 bg-primary/5">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          AI Prospect Intelligence
        </CardTitle>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={generate} 
          disabled={isLoading}
          className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors"
        >
          <RefreshCcw className={isLoading ? "h-3 w-3 animate-spin" : "h-3 w-3"} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-3 py-2">
            <div className="h-3 bg-muted animate-pulse rounded w-full" />
            <div className="h-3 bg-muted animate-pulse rounded w-3/4" />
            <div className="h-3 bg-muted animate-pulse rounded w-5/6" />
          </div>
        ) : error ? (
          <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive text-[11px] py-2">
            <AlertCircle className="h-3 w-3" />
            <AlertDescription className="ml-1">
              {error}
            </AlertDescription>
          </Alert>
        ) : data ? (
          <div className="space-y-4 animate-in fade-in duration-700">
            <div>
              <p className="text-[10px] font-bold uppercase text-primary/70 mb-1 tracking-wider">Executive Summary</p>
              <p className="text-sm leading-relaxed text-foreground/90">{data.executiveSummary}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-primary/70 mb-1 tracking-wider">Suggested CRM Notes</p>
              <div className="text-xs text-muted-foreground space-y-1">
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
          <p className="text-xs text-muted-foreground italic">
            {history.length === 0 
              ? "Awaiting appointment history for analysis..." 
              : "No analysis available. Click refresh to generate insights."}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
