
"use client";

import { DashboardNav } from "@/components/dashboard/nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

export default function ContactsPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <DashboardNav />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-8">
          <header>
            <h1 className="text-4xl font-bold tracking-tight">Contacts</h1>
            <p className="text-muted-foreground">Full directory of your CRM contacts and prospects.</p>
          </header>
          <Card className="glass min-h-[500px] flex items-center justify-center border-dashed">
            <CardContent className="text-center space-y-4">
              <Users className="h-12 w-12 mx-auto text-muted-foreground opacity-20" />
              <p className="text-muted-foreground italic">Contact list view integration pending CRM sync...</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
