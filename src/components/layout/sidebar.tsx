"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Clapperboard,
  LayoutGrid,
  MessageSquare,
  Settings,
  Users,
  FileDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useUIStore } from "@/stores/ui-store";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  section?: "project" | "global";
}

function getProjectNav(projectId: string): NavItem[] {
  return [
    {
      label: "Writer's Room",
      href: `/project/${projectId}/room`,
      icon: MessageSquare,
      section: "project",
    },
    {
      label: "Beat Board",
      href: `/project/${projectId}/board`,
      icon: LayoutGrid,
      section: "project",
    },
    {
      label: "Characters",
      href: `/project/${projectId}/characters`,
      icon: Users,
      section: "project",
    },
    {
      label: "Show Bible",
      href: `/project/${projectId}/bible`,
      icon: BookOpen,
      section: "project",
    },
    {
      label: "Export",
      href: `/project/${projectId}/export`,
      icon: FileDown,
      section: "project",
    },
  ];
}

const globalNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: Clapperboard, section: "global" },
  { label: "Settings", href: "/settings", icon: Settings, section: "global" },
];

export function Sidebar() {
  const pathname = usePathname();
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);

  const projectMatch = pathname.match(/\/project\/([^/]+)/);
  const projectId = projectMatch?.[1];

  const navItems = projectId
    ? [...getProjectNav(projectId), ...globalNav]
    : globalNav;

  return (
    <aside
      className={cn(
        "flex h-screen flex-col border-r border-border bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out",
        sidebarCollapsed ? "w-[70px]" : "w-64",
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-border px-4">
        <Link href="/dashboard" className={cn("flex items-center gap-3", sidebarCollapsed && "justify-center w-full")}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-amber/30 bg-amber/10">
            <span className="font-display text-base font-bold text-amber">W</span>
          </div>
          {!sidebarCollapsed && (
            <div className="flex flex-col">
              <span className="font-display text-base font-semibold leading-tight tracking-tight">
                Writer&apos;s Room
              </span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Studio
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {projectId && !sidebarCollapsed && (
          <p className="mb-2 px-3 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Project
          </p>
        )}
        <div className="space-y-1">
          {navItems.map((item, i) => {
            const isActive = pathname.startsWith(item.href);
            const showDivider = projectId && item.section === "global" && navItems[i - 1]?.section === "project";

            const linkContent = (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200",
                  isActive
                    ? "bg-amber/10 font-medium text-amber"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground",
                  sidebarCollapsed && "justify-center px-2",
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-amber" />
                )}
                <item.icon className={cn("h-4 w-4 shrink-0", isActive && "text-amber")} />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </Link>
            );

            return (
              <div key={item.href}>
                {showDivider && (
                  <div className="my-3 border-t border-border" />
                )}
                {!sidebarCollapsed && showDivider && (
                  <p className="mb-2 px-3 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                    General
                  </p>
                )}
                {sidebarCollapsed ? (
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                    <TooltipContent side="right" className="font-body">
                      {item.label}
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  linkContent
                )}
              </div>
            );
          })}
        </div>
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-border p-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className="w-full justify-center text-muted-foreground hover:text-foreground"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span className="ml-2 text-xs">Collapse</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}
