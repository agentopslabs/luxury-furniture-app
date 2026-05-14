
"use client";

import { DashboardNav } from "@/components/dashboard/nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarIcon } from "lucide-react";

export default function CalendarPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <DashboardNav />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-8">
          <header>
            <h1 className="text-4xl font-bold tracking-tight">Calendar</h1>
            <p className="text-muted-foreground">Manage your upcoming appointments and schedules.</p>
          </header>
          <Card className="glass min-h-[500px] flex items-center justify-center border-dashed">
            <CardContent className="text-center space-y-4">
              <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground opacity-20" />
              <p className="text-muted-foreground italic">Calendar interface integration pending CRM sync...</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
