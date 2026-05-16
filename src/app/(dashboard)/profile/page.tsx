"use client";

import { useState } from "react";
import { DashboardNav } from "@/components/dashboard/nav";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

export default function ProfilePage() {
  const { toast } = useToast();

  const [firstName, setFirstName] = useState("Alex");
  const [lastName, setLastName] = useState("Sterling");
  const [email, setEmail] = useState("alex@sterling.io");
  const [phone, setPhone] = useState("+1 (555) 012-3456");
  const [saving, setSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const initials = `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase() || "LF";

  const handleUpdate = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 800));
    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
    localStorage.setItem("profile_name", fullName);
    window.dispatchEvent(new Event("profileUpdated"));
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

  const handleUpdatePassword = async () => {
    if (!currentPassword) {
      toast({ variant: "destructive", title: "Missing Field", description: "Please enter your current password." });
      return;
    }
    if (newPassword.length < 6) {
      toast({ variant: "destructive", title: "Weak Password", description: "New password must be at least 6 characters." });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ variant: "destructive", title: "Mismatch", description: "New passwords do not match." });
      return;
    }
    setSavingPassword(true);
    await new Promise(r => setTimeout(r, 800));
    setSavingPassword(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    toast({ title: "Password Updated", description: "Your password has been changed successfully." });
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

              <Card className="glass">
                <CardHeader>
                  <CardTitle className="text-xl">Update Password</CardTitle>
                  <CardDescription>Change your account password regularly for security.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      placeholder="Enter current password"
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                    />
                  </div>
                  <Separator />
                  <div className="flex justify-end">
                    <Button onClick={handleUpdatePassword} disabled={savingPassword}>
                      {savingPassword ? "Updating..." : "Update Password"}
                    </Button>
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
