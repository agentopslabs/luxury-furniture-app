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
  CreditCard,
  Megaphone
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
  { name: "Marketing", href: "/marketing", icon: Megaphone },
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
    <div className="flex h-screen w-64 flex-col border-r border-white/[0.06] bg-[#0F1117] relative z-50 shrink-0">
      <div className="flex h-20 items-center px-6 border-b border-white/[0.06]">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-lg transition-transform group-hover:scale-105 active:scale-95">
            <span className="text-white font-bold text-base font-headline">L</span>
          </div>
          <div className="flex flex-col">
            <span className="font-headline font-bold text-lg tracking-tight text-white">Luxury Furniture</span>
            <span className="text-[9px] font-semibold text-white/30 uppercase tracking-[0.2em] -mt-0.5">Premium Collections</span>
          </div>
        </Link>
      </div>

      <div className="flex-1 px-3 py-5 space-y-1 overflow-y-auto no-scrollbar">
        <p className="text-[10px] font-bold text-white/25 uppercase tracking-[0.25em] px-3 mb-3">
          Main Menu
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 relative group",
                isActive
                  ? "bg-primary text-white shadow-sm"
                  : "text-white/50 hover:text-white hover:bg-white/[0.06]"
              )}
            >
              <Icon size={18} className={cn(
                "shrink-0 transition-all duration-200",
                isActive ? "text-white" : "group-hover:text-white"
              )} />
              <span>{item.name}</span>
            </Link>
          );
        })}

        <div className="pt-4 px-3">
          <div className="p-4 rounded-xl bg-white/[0.04] border border-white/[0.06] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">Collections</span>
              <Sparkles size={12} className="text-primary animate-pulse" />
            </div>
            <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-primary w-3/4 animate-shimmer" />
            </div>
            <p className="text-[9px] text-white/25 leading-relaxed font-medium">Premium furniture management platform.</p>
          </div>
        </div>
      </div>

      <div className="p-3 border-t border-white/[0.06]">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start gap-3 h-14 px-3 rounded-xl hover:bg-white/[0.06] border border-transparent transition-all group">
              <div className="relative shrink-0">
                <Avatar className="h-8 w-8 border border-white/20">
                  <AvatarImage src="https://picsum.photos/seed/luxefurniture-user/100/100" />
                  <AvatarFallback className="bg-primary/20 text-primary font-bold text-xs">LF</AvatarFallback>
                </Avatar>
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-[#0F1117] rounded-full" />
              </div>
              <div className="flex flex-col items-start overflow-hidden">
                <span className="text-sm font-semibold text-white truncate w-full">Alex Sterling</span>
                <span className="text-[10px] text-white/30 font-medium">Store Manager</span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-56 rounded-xl p-1.5 mb-2 bg-[#1a1d27] border border-white/10">
            <DropdownMenuSeparator className="bg-white/10 mx-1" />
            <DropdownMenuItem onClick={() => router.push("/profile")} className="rounded-lg px-3 py-2 focus:bg-white/10 cursor-pointer text-white/70 focus:text-white">
              <User className="mr-2.5 h-4 w-4" /> Profile Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/settings")} className="rounded-lg px-3 py-2 focus:bg-white/10 cursor-pointer text-white/70 focus:text-white">
              <Settings className="mr-2.5 h-4 w-4" /> Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/10 mx-1" />
            <DropdownMenuItem onClick={logout} className="rounded-lg px-3 py-2 text-red-400 focus:bg-red-500/10 focus:text-red-400 cursor-pointer">
              <LogOut className="mr-2.5 h-4 w-4" /> Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
