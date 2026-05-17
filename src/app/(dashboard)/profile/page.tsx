"use client";

import { useState, useEffect, useRef } from "react";
import { DashboardNav } from "@/components/dashboard/nav";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Camera, X, ZoomIn } from "lucide-react";

export default function ProfilePage() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [avatarSrc, setAvatarSrc] = useState<string>("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetch("/api/profile")
      .then(r => r.json())
      .then(data => {
        setFirstName(data.firstName || "");
        setLastName(data.lastName || "");
        setEmail(data.email || "");
        setPhone(data.phone || "");
        setPassword(data.password || "");
      })
      .catch(() => {
        toast({ variant: "destructive", title: "Error", description: "Could not load profile." });
      })
      .finally(() => setLoading(false));

    const saved = localStorage.getItem("profile_avatar");
    if (saved) setAvatarSrc(saved);
  }, []);

  const initials = `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase() || "LF";

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ variant: "destructive", title: "Invalid file", description: "Please select an image file." });
      return;
    }

    setAvatarUploading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setAvatarSrc(dataUrl);
      localStorage.setItem("profile_avatar", dataUrl);
      window.dispatchEvent(new CustomEvent("profileUpdated", { detail: { avatar: dataUrl } }));
      setAvatarUploading(false);
      toast({ title: "Avatar Updated", description: "Your profile photo has been changed." });
    };
    reader.onerror = () => {
      setAvatarUploading(false);
      toast({ variant: "destructive", title: "Error", description: "Could not read the image file." });
    };
    reader.readAsDataURL(file);

    e.target.value = "";
  };

  const handleUpdate = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email, phone, password }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Save failed");

      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
      localStorage.setItem("profile_name", fullName);
      window.dispatchEvent(new Event("profileUpdated"));

      toast({
        title: "Profile Updated",
        description: "Your profile information has been saved successfully.",
      });
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: e.message || "Could not save profile.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setLoading(true);
    fetch("/api/profile")
      .then(r => r.json())
      .then(data => {
        setFirstName(data.firstName || "");
        setLastName(data.lastName || "");
        setEmail(data.email || "");
        setPhone(data.phone || "");
        setPassword(data.password || "");
      })
      .finally(() => setLoading(false));
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
            <div className="md:col-span-1">
              <Card className="glass overflow-hidden">
                <div className="h-24 bg-gradient-to-r from-primary/20 to-accent/20" />
                <CardContent className="pt-0 -mt-10 flex flex-col items-center text-center">
                  {/* Avatar — click to preview if photo exists */}
                  <div
                    className={`relative group ${avatarSrc ? "cursor-zoom-in" : "cursor-default"}`}
                    onClick={() => avatarSrc && setShowPreview(true)}
                  >
                    <Avatar className="h-20 w-20 border-4 border-background shadow-xl">
                      <AvatarImage src={avatarSrc || undefined} />
                      <AvatarFallback className="text-lg font-bold bg-primary/20 text-primary">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    {avatarSrc && (
                      <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <ZoomIn size={18} className="text-white" />
                      </div>
                    )}
                    {avatarUploading && (
                      <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>

                  <div className="mt-4">
                    {loading ? (
                      <>
                        <Skeleton className="h-5 w-28 mx-auto" />
                        <Skeleton className="h-3 w-20 mx-auto mt-1" />
                      </>
                    ) : (
                      <>
                        <h3 className="text-lg font-bold">{firstName} {lastName}</h3>
                        <p className="text-xs text-muted-foreground">Store Manager</p>
                      </>
                    )}
                  </div>

                  <div className="mt-6">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs gap-1.5"
                      onClick={handleAvatarClick}
                      disabled={avatarUploading}
                    >
                      <Camera size={12} />
                      {avatarUploading ? "Uploading..." : "Change Avatar"}
                    </Button>
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
                  {loading ? (
                    <div className="space-y-4">
                      {Array(4).fill(0).map((_, i) => (
                        <Skeleton key={i} className="h-10 w-full rounded-lg" />
                      ))}
                    </div>
                  ) : (
                    <>
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
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Hidden file input — opens gallery */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Full-size avatar preview modal */}
      {showPreview && avatarSrc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setShowPreview(false)}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            onClick={() => setShowPreview(false)}
          >
            <X size={20} className="text-white" />
          </button>
          <img
            src={avatarSrc}
            alt="Profile photo"
            className="max-w-[90vw] max-h-[90vh] rounded-2xl shadow-2xl object-contain"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
