
"use client";

import { DashboardNav } from "@/components/dashboard/nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Layers } from "lucide-react";

export default function PipelinePage() {
  return (
    <div className="flex min-h-screen bg-background">
      <DashboardNav />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-8">
          <header>
            <h1 className="text-4xl font-bold tracking-tight">Pipeline</h1>
            <p className="text-muted-foreground">Track and manage your sales opportunities and deal flow.</p>
          </header>
          <Card className="glass min-h-[500px] flex items-center justify-center border-dashed">
            <CardContent className="text-center space-y-4">
              <Layers className="h-12 w-12 mx-auto text-muted-foreground opacity-20" />
              <p className="text-muted-foreground italic">Pipeline kanban integration pending CRM sync...</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
