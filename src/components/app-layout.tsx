"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, LayoutDashboard, Truck, TrendingUp, Package2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";


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
};


export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);


  const sidebarContent = (
    <>
      <SidebarHeader>
        <div className="flex h-14 items-center gap-2 px-2">
            <Package2 className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold">SupplyChainAI</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                tooltip={item.label}
              >
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
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start gap-2 p-2">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src="https://placehold.co/100x100.png" alt="User" />
                        <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                    <div className="text-left">
                        <p className="font-medium">User</p>
                        <p className="text-xs text-muted-foreground">user@example.com</p>
                    </div>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="start" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuItem>Support</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Logout</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </>
  );

  if (!isClient) {
    return (
        <div className="flex min-h-screen w-full bg-muted/40" style={{'--sidebar-width-icon': '3rem'} as React.CSSProperties}>
            <div className="hidden md:block">
                <div className="flex h-full w-[var(--sidebar-width-icon)] flex-col border-r bg-sidebar p-2 text-sidebar-foreground">
                    <div className="flex h-14 items-center justify-center">
                        <Skeleton className="h-6 w-6" />
                    </div>
                    <div className="flex flex-col items-center gap-1 py-2">
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-8 w-8" />
                    </div>
                </div>
            </div>
            <div className="flex flex-1 flex-col">
                <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
                    <Skeleton className="h-7 w-7" />
                    <Skeleton className="h-6 w-36" />
                </header>
                <main className="flex-1 p-4 sm:px-6 sm:py-0">
                    {children}
                </main>
            </div>
        </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={false}>
        <div className="flex min-h-screen w-full bg-muted/40">
            <Sidebar collapsible="icon">
                {sidebarContent}
            </Sidebar>
            <div className="flex flex-1 flex-col">
                <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
                    <SidebarTrigger />
                    <h1 className="text-xl font-semibold md:text-2xl">{pageTitles[pathname] || 'SupplyChainAI'}</h1>
                </header>
                <main className="flex-1 p-4 sm:px-6 sm:py-0">
                    {children}
                </main>
            </div>
        </div>
    </SidebarProvider>
  );
}
