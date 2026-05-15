"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  User, 
  Settings, 
  LogOut, 
  Calendar,
  Users,
  MessageSquare,
  Layers,
  Target,
  Sparkles,
  CreditCard
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth-context";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Conversations", href: "/conversations", icon: MessageSquare },
  { name: "Pipeline", href: "/pipeline", icon: Layers },
  { name: "Opportunities", href: "/opportunities", icon: Target },
  { name: "Payments", href: "/payments", icon: CreditCard },
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "Contacts", href: "/contacts", icon: Users },
  { name: "Profile", href: "/profile", icon: User },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function DashboardNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  return (
    <div className="flex h-screen w-72 flex-col border-r border-white/5 bg-black/40 backdrop-blur-3xl relative z-50">
      {/* Brand Section */}
      <div className="flex h-24 items-center px-8">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-primary transition-transform group-hover:scale-105 active:scale-95">
            <span className="text-white font-bold text-lg font-headline">K</span>
          </div>
          <div className="flex flex-col">
            <span className="font-headline font-bold text-xl tracking-tight text-foreground group-hover:text-primary transition-colors">KoreAuth</span>
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em] -mt-1 opacity-50">Enterprise Intelligence</span>
          </div>
        </Link>
      </div>

      {/* Navigation Section */}
      <div className="flex-1 px-4 py-8 space-y-10 overflow-y-auto no-scrollbar">
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em] px-4 mb-4 opacity-40">
            Intelligence Engine
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-4 rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-300 relative group",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/[0.03]"
                )}
              >
                {isActive && (
                  <div className="absolute left-[-16px] top-1/2 -translate-y-1/2 w-1.5 h-8 bg-primary rounded-r-full shadow-[0_0_15px_rgba(168,85,247,0.8)]" />
                )}
                <Icon size={20} className={cn(
                  "transition-all duration-300",
                  isActive ? "text-primary scale-110 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]" : "group-hover:text-primary group-hover:scale-110"
                )} />
                <span className="relative z-10">{item.name}</span>
                {isActive && (
                   <div className="absolute inset-0 bg-primary/5 rounded-2xl" />
                )}
              </Link>
            );
          })}
        </div>

        {/* AI Pulse Indicator */}
        <div className="px-4">
          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3 group hover:border-primary/30 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">AI Pipeline</span>
              <Sparkles size={14} className="text-primary animate-pulse" />
            </div>
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-primary w-3/4 animate-shimmer" />
            </div>
            <p className="text-[9px] text-muted-foreground/60 leading-relaxed font-medium">Processing real-time lead intelligence from GHL V2 events.</p>
          </div>
        </div>
      </div>

      {/* User Footer Section */}
      <div className="p-6 border-t border-white/5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start gap-4 h-16 px-4 rounded-2xl hover:bg-white/[0.03] border border-transparent hover:border-white/5 transition-all group">
              <div className="relative">
                <Avatar className="h-10 w-10 border-2 border-primary/20 group-hover:border-primary/50 transition-all">
                  <AvatarImage src="https://picsum.photos/seed/koreauth-user/100/100" />
                  <AvatarFallback className="bg-primary/20 text-primary font-bold">AS</AvatarFallback>
                </Avatar>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-background rounded-full" />
              </div>
              <div className="flex flex-col items-start overflow-hidden">
                <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate w-full">Alex Sterling</span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-50">Enterprise Agent</span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-64 glass border-white/10 rounded-2xl p-2 mb-2 animate-in slide-in-from-bottom-2 duration-300">
            <DropdownMenuLabel className="px-4 py-3">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Authenticated via</p>
              <p className="text-sm font-bold text-foreground truncate">pit-fde7a...ec78</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/5 mx-2" />
            <DropdownMenuItem onClick={() => router.push("/profile")} className="rounded-xl px-4 py-3 focus:bg-primary/10 cursor-pointer">
              <User className="mr-3 h-4 w-4 text-primary" /> Profile Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/settings")} className="rounded-xl px-4 py-3 focus:bg-primary/10 cursor-pointer">
              <Settings className="mr-3 h-4 w-4 text-primary" /> System Config
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/5 mx-2" />
            <DropdownMenuItem onClick={logout} className="rounded-xl px-4 py-3 text-destructive focus:bg-destructive/10 cursor-pointer">
              <LogOut className="mr-3 h-4 w-4" /> Terminate Session
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
