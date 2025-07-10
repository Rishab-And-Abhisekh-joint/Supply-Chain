
"use client";

import * as React from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import { Bot, LayoutDashboard, Truck, TrendingUp, Package2, Loader2, User, Settings } from "lucide-react";
import type { User as FirebaseUser } from 'firebase/auth';
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
import { ThemeToggle } from "@/components/theme-toggle";

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

const authRoutes = ['/customer/login', '/customer/signup'];
const customerRoutes = ['/customer/inventory'];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = React.useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = React.useState(true);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  React.useEffect(() => {
    if (authLoading) return;

    const isAuthPage = authRoutes.includes(pathname);
    const isCustomerPage = customerRoutes.includes(pathname);

    if (user && isAuthPage) {
      router.push('/customer/inventory');
    } else if (!user && isCustomerPage) {
      router.push('/customer/login');
    }
  }, [authLoading, user, pathname, router]);

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
      <SidebarFooter className="mt-auto">
         <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname.startsWith('/customer')} tooltip="Customer Area">
                     <Link href={user ? "/customer/inventory" : "/customer/login"}>
                        <User />
                        <span>{user ? "Customer Panel" : "Customer Login"}</span>
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
                <SidebarMenuButton tooltip="Settings">
                    <Settings />
                    <span>Settings</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
            {user && (
                 <SidebarMenuItem>
                    <SidebarMenuButton onClick={handleLogout} tooltip="Logout">
                        <Loader2 />
                        <span>Logout</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            )}
        </SidebarMenu>
      </SidebarFooter>
    </>
  );

  const isAuthPage = authRoutes.includes(pathname);

  if (isAuthPage || authLoading) {
    return (
      <>
        {authLoading && (
           <div className="flex min-h-screen items-center justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        )}
        {!authLoading && children}
      </>
    )
  }

  return (
    <SidebarProvider defaultOpen={true}>
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
