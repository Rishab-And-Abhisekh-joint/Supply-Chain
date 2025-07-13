
"use client";

import * as React from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import { Bot, LayoutDashboard, Truck, TrendingUp, Package2, Loader2, User, Settings, LogOut } from "lucide-react";
import type { User as FirebaseUser } from 'firebase/auth';
import { onAuthStateChanged, signOut, getRedirectResult } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import {
  SidebarProvider,
  useSidebar,
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

function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = React.useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = React.useState(true);
  const { setOpen, open } = useSidebar();

  React.useEffect(() => {
    console.log("AppLayout: useEffect for auth processing is running.");

    const processAuth = async () => {
      try {
        console.log("AppLayout: Checking for redirect result...");
        const result = await getRedirectResult(auth);
        if (result) {
          console.log("AppLayout: Google redirect result found.", result.user);
          toast({ title: "Logged in successfully!" });
          router.push('/customer/inventory');
        } else {
          console.log("AppLayout: No redirect result.");
        }
      } catch (error: any) {
        console.error("AppLayout: Error during getRedirectResult:", error);
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: error.message || "Could not complete sign-in. Please try again.",
        });
      }

      console.log("AppLayout: Setting up onAuthStateChanged listener.");
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        console.log("AppLayout: onAuthStateChanged triggered. User:", currentUser);
        setUser(currentUser);
        if (authLoading) {
            console.log("AppLayout: Auth loading finished.");
            setAuthLoading(false);
        }
      });
      
      return unsubscribe;
    };

    const unsubscribePromise = processAuth();

    return () => {
      console.log("AppLayout: Cleaning up auth useEffect.");
      unsubscribePromise.then(unsubscribe => {
        if (unsubscribe) {
          console.log("AppLayout: Unsubscribing from onAuthStateChanged.");
          unsubscribe();
        }
      });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (authLoading) {
      console.log("Auth Guard: Auth is loading, skipping checks.");
      return;
    };

    console.log("Auth Guard: Running checks. User:", user, "Pathname:", pathname);
    const isAuthPage = authRoutes.includes(pathname);
    const isCustomerPage = customerRoutes.some(route => pathname.startsWith(route));

    if (user && isAuthPage) {
      console.log("Auth Guard: User is on auth page, redirecting to /customer/inventory");
      router.push('/customer/inventory');
    } else if (!user && isCustomerPage) {
      console.log("Auth Guard: User not logged in, on customer page, redirecting to /customer/login");
      router.push('/customer/login');
    }
  }, [authLoading, user, pathname, router]);

  const handleLogout = async () => {
    try {
      console.log("Logout: Attempting to sign out.");
      await signOut(auth);
      console.log("Logout: Sign out successful.");
      router.push('/customer/login');
    } catch (error) {
      console.error("Logout: Error signing out:", error);
    }
  };

  const isAuthPage = authRoutes.includes(pathname);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (isAuthPage) {
    return <>{children}</>;
  }

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
                        <LogOut />
                        <span>Logout</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            )}
        </SidebarMenu>
      </SidebarFooter>
    </>
  );

  return (
    <div 
      className="flex min-h-screen w-full bg-muted/40"
    >
      <Sidebar 
        collapsible="icon"
        onMouseEnter={() => !open && setOpen(true)}
        onMouseLeave={() => open && setOpen(false)}
      >
        {sidebarContent}
      </Sidebar>
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
  );
}


export default function AppLayout({ children }: { children: React.ReactNode }) {
    const [isClient, setIsClient] = React.useState(false);

    React.useEffect(() => {
        setIsClient(true);
    }, []);

    if (!isClient) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }
    
  return (
    <SidebarProvider defaultOpen={false}>
      <LayoutContent>{children}</LayoutContent>
    </SidebarProvider>
  );
}
