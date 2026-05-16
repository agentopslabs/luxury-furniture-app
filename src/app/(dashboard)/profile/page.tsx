"use client";

import { useState, useEffect } from "react";
import { DashboardNav } from "@/components/dashboard/nav";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff } from "lucide-react";

const DEFAULTS = {
  firstName: "Alex",
  lastName: "Sterling",
  email: "alex@sterling.io",
  phone: "+1 (555) 012-3456",
  password: "password123",
};

export default function ProfilePage() {
  const { toast } = useToast();

  const [firstName, setFirstName] = useState(DEFAULTS.firstName);
  const [lastName, setLastName] = useState(DEFAULTS.lastName);
  const [email, setEmail] = useState(DEFAULTS.email);
  const [phone, setPhone] = useState(DEFAULTS.phone);
  const [password, setPassword] = useState(DEFAULTS.password);
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedFirst = localStorage.getItem("profile_firstName");
    const savedLast = localStorage.getItem("profile_lastName");
    const savedEmail = localStorage.getItem("profile_email");
    const savedPhone = localStorage.getItem("profile_phone");
    const savedPassword = localStorage.getItem("profile_password");
    if (savedFirst) setFirstName(savedFirst);
    if (savedLast) setLastName(savedLast);
    if (savedEmail) setEmail(savedEmail);
    if (savedPhone) setPhone(savedPhone);
    if (savedPassword) setPassword(savedPassword);
    setMounted(true);
  }, []);

  const initials = `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase() || "LF";

  const handleUpdate = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 800));
    localStorage.setItem("profile_firstName", firstName.trim());
    localStorage.setItem("profile_lastName", lastName.trim());
    localStorage.setItem("profile_email", email.trim());
    localStorage.setItem("profile_phone", phone.trim());
    localStorage.setItem("profile_password", password);
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
    const savedFirst = localStorage.getItem("profile_firstName") || DEFAULTS.firstName;
    const savedLast = localStorage.getItem("profile_lastName") || DEFAULTS.lastName;
    const savedEmail = localStorage.getItem("profile_email") || DEFAULTS.email;
    const savedPhone = localStorage.getItem("profile_phone") || DEFAULTS.phone;
    const savedPassword = localStorage.getItem("profile_password") || DEFAULTS.password;
    setFirstName(savedFirst);
    setLastName(savedLast);
    setEmail(savedEmail);
    setPhone(savedPhone);
    setPassword(savedPassword);
  };

  if (!mounted) return null;

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
            <div className="md:col-span-1">
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
                  <div className="mt-6">
                    <Button size="sm" variant="outline" className="h-8 text-xs">Change Avatar</Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="md:col-span-2">
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="text-xl">Personal Information</CardTitle>
                  <CardDescription>Update your name, email, contact details and password.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
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

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(p => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
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
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
