"use client";

import { useState } from "react";
import { DashboardNav } from "@/components/dashboard/nav";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ProfilePage() {
  const { toast } = useToast();

  const [firstName, setFirstName] = useState("Alex");
  const [lastName, setLastName] = useState("Sterling");
  const [email, setEmail] = useState("alex@sterling.io");
  const [phone, setPhone] = useState("+1 (555) 012-3456");
  const [saving, setSaving] = useState(false);

  const initials = `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase() || "LF";

  const handleUpdate = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 800));
    setSaving(false);
    toast({
      title: "Profile Updated",
      description: "Your profile information has been saved successfully.",
    });
  };

  const handleCancel = () => {
    setFirstName("Alex");
    setLastName("Sterling");
    setEmail("alex@sterling.io");
    setPhone("+1 (555) 012-3456");
  };

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardNav />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-8">
          <header>
            <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
            <p className="text-muted-foreground">Manage your personal information and account settings.</p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1 space-y-4">
              <Card className="glass overflow-hidden">
                <div className="h-24 bg-gradient-to-r from-primary/20 to-accent/20" />
                <CardContent className="pt-0 -mt-10 flex flex-col items-center text-center">
                  <Avatar className="h-20 w-20 border-4 border-background shadow-xl">
                    <AvatarImage src="https://picsum.photos/seed/luxefurniture-user/200/200" />
                    <AvatarFallback className="text-lg font-bold bg-primary/20 text-primary">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="mt-4">
                    <h3 className="text-lg font-bold">{firstName} {lastName}</h3>
                    <p className="text-xs text-muted-foreground">Store Manager</p>
                  </div>
                  <div className="mt-6 flex flex-wrap justify-center gap-2">
                    <Button size="sm" variant="outline" className="h-8 text-xs">Change Avatar</Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="md:col-span-2 space-y-6">
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="text-xl">Personal Information</CardTitle>
                  <CardDescription>Update your name, email and contact details.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={firstName}
                        onChange={e => setFirstName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={lastName}
                        onChange={e => setLastName(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                    />
                  </div>
                  <Separator />
                  <div className="flex justify-end gap-3">
                    <Button variant="ghost" onClick={handleCancel} disabled={saving}>
                      Cancel
                    </Button>
                    <Button onClick={handleUpdate} disabled={saving}>
                      {saving ? "Saving..." : "Update Profile"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" /> Security & Account
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Two-Factor Authentication</p>
                      <p className="text-xs text-muted-foreground">Add an extra layer of security to your account.</p>
                    </div>
                    <Button variant="outline" size="sm">Enable</Button>
                  </div>
                  <Separator className="bg-primary/10" />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Change Password</p>
                      <p className="text-xs text-muted-foreground">Update your account password regularly for security.</p>
                    </div>
                    <Button variant="ghost" size="sm" className="text-primary hover:text-primary">Update</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
