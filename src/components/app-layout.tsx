
"use client";

import * as React from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import { Bot, LayoutDashboard, Truck, TrendingUp, Package2 } from "lucide-react";
import type { User } from 'firebase/auth';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

import { Button } from "@/components/ui/button";
import {
  SidebarProvider,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/theme-toggle";
import { Loader2 } from "lucide-react";

const Sidebar = dynamic(() => import("@/components/ui/sidebar").then((mod) => mod.Sidebar), { ssr: false });
const SidebarTrigger = dynamic(() => import("@/components/ui/sidebar").then((mod) => mod.SidebarTrigger), { ssr: false });


const navItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/forecasting",
    label: "Demand Forecasting",
    icon: TrendingUp,
  },
  {
    href: "/operations",
    label: "Operations Analysis",
    icon: Bot,
  },
  {
    href: "/logistics",
    label: "Logistics Optimization",
    icon: Truck,
  },
];

const pageTitles: { [key: string]: string } = {
  "/dashboard": "Dashboard",
  "/forecasting": "Demand Forecasting",
  "/operations": "Operations Analysis",
  "/logistics": "Logistics Optimization",
  "/customer/inventory": "Customer Inventory",
};

const publicRoutes = ['/customer/login', '/customer/signup'];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = React.useState<User | null>(null);
  const [authInitialized, setAuthInitialized] = React.useState(false);
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthInitialized(true);
    });
    return () => unsubscribe();
  }, []);

  React.useEffect(() => {
    if (authInitialized && !user && !publicRoutes.includes(pathname)) {
      router.push('/customer/login');
    }
  }, [authInitialized, user, pathname, router]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/customer/login');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const sidebarContent = (
    <>
      <SidebarHeader>
        <SidebarTrigger
          variant="ghost"
          size="default"
          className="h-auto w-full justify-start gap-2 p-2 text-lg font-semibold hover:bg-sidebar-accent md:flex"
        >
          <Package2 className="h-6 w-6 text-primary" />
          <span className="whitespace-nowrap group-data-[collapsible=icon]:hidden">SupplyChainAI</span>
        </SidebarTrigger>
        <div className="flex items-center gap-2 md:hidden">
          <Package2 className="h-6 w-6 text-primary" />
          <span className="whitespace-nowrap text-lg font-semibold">SupplyChainAI</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.label}>
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="group-data-[collapsible=icon]:hidden">
        {authInitialized && user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start gap-2 p-2" suppressHydrationWarning>
                <Avatar className="h-8 w-8">
                  {user?.photoURL && <AvatarImage src={user.photoURL} alt={user.displayName || 'User'} />}
                  <AvatarFallback>{user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <p className="font-medium truncate">{user?.displayName || 'User'}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email || 'user@example.com'}</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="start" className="w-56">
              <DropdownMenuItem asChild>
                  <Link href="/dashboard">Admin Panel</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/customer/inventory">Customer Panel</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuItem>Support</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
            <div className="flex items-center gap-2 p-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-32" />
                </div>
            </div>
        )}
      </SidebarFooter>
    </>
  );

  if (!isClient || !authInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="flex min-h-screen w-full bg-muted/40">
        <Sidebar collapsible="icon">{sidebarContent}</Sidebar>
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
            <div className="flex md:hidden">
              <SidebarTrigger />
            </div>
            <h1 className="flex-1 text-xl font-semibold md:text-2xl">{pageTitles[pathname] || 'SupplyChainAI'}</h1>
            <ThemeToggle />
          </header>
          <main className="flex-1 p-4 sm:px-6 sm:py-0">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
