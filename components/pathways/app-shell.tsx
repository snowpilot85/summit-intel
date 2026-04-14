"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import {
  LayoutDashboard,
  Users,
  Target,
  Building2,
  Upload,
  Settings,
  Bell,
  ChevronRight,
  User,
  ChevronDown,
  Menu,
  X,
  Grid3X3,
  GraduationCap,
  Gauge,
} from "lucide-react";

/* ============================================
   Summit Intel App Shell Components
   College, Career & Military Readiness Platform
   ============================================ */

// ============================================
// HEADER
// ============================================

interface PathwaysHeaderProps {
  userName?: string;
  userRole?: string;
  districtName?: string;
  schoolYear?: string;
  notificationCount?: number;
}

export const PathwaysHeader = ({
  userName = "Sarah Chen",
  userRole = "CCMR Coordinator",
  districtName = "Edinburg CISD",
  schoolYear = "2025-26",
  notificationCount = 3,
}: PathwaysHeaderProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = React.useState(false);
  const [productMenuOpen, setProductMenuOpen] = React.useState(false);

  return (
    <header className="bg-primary-500 text-neutral-0 w-full">
      <div className="h-[120px] lg:h-[130px] px-4 lg:px-6">
        <div className="h-full flex items-center justify-between gap-4">
          {/* LEFT ZONE: Logo + Product Name */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Mobile menu button */}
            <button
              className="lg:hidden p-2 -ml-2 rounded-md hover:bg-primary-600 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            
            {/* Summit K12 Intel Logo with subtitle */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <Image
                  src="/images/summit-k12-logo-white.png"
                  alt="Summit K12"
                  width={120}
                  height={32}
                  className="h-7 w-auto flex-shrink-0"
                  priority
                />
                <span className="text-[20px] font-semibold text-teal-300">Intel</span>
              </div>
              <p className="text-[11px] opacity-70 mt-1 tracking-wide">College, Career & Military Readiness</p>
            </div>
          </div>

          {/* CENTER ZONE: Spacer */}
          <div className="hidden lg:flex flex-1" />

          {/* RIGHT ZONE: District Info + User Actions */}
          <div className="flex items-center gap-3 lg:gap-4 flex-shrink-0">
            {/* District + School Year chip */}
            <div className="hidden sm:flex items-center gap-2 bg-primary-600 px-3 py-1.5 rounded-full">
              <span className="text-[13px] font-medium">{districtName}</span>
              <span className="text-[11px] opacity-70">|</span>
              <span className="text-[12px] opacity-90">{schoolYear}</span>
            </div>

            {/* Product switcher */}
            <div className="relative">
              <button
                onClick={() => setProductMenuOpen(!productMenuOpen)}
                className="p-2 rounded-md hover:bg-primary-600 transition-colors"
                aria-label="Switch products"
                aria-expanded={productMenuOpen}
                aria-haspopup="true"
              >
                <Grid3X3 className="w-5 h-5" />
              </button>

              {productMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-neutral-0 rounded-lg shadow-lg border border-neutral-200 py-2 z-50">
                  <p className="px-4 py-2 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                    Summit K12 Products
                  </p>
                  <Link
                    href="/"
                    onClick={() => setProductMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 transition-colors"
                  >
                    <div className="w-8 h-8 bg-primary-100 rounded-md flex items-center justify-center">
                      <LayoutDashboard className="w-4 h-4 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-[14px] font-medium text-neutral-900">DSM Dashboard</p>
                      <p className="text-[12px] text-neutral-500">District Success Team</p>
                    </div>
                  </Link>
                  <Link
                    href="/intel"
                    onClick={() => setProductMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 transition-colors"
                  >
                    <div className="w-8 h-8 bg-teal-100 rounded-md flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-teal-600" />
                    </div>
                    <div>
                      <p className="text-[14px] font-medium text-neutral-900">Summit K12 IntELL</p>
                      <p className="text-[12px] text-neutral-500">EL Compliance & Instruction</p>
                    </div>
                  </Link>
                  <Link
                    href="/pathways"
                    onClick={() => setProductMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 transition-colors bg-neutral-50"
                  >
                    <div className="w-8 h-8 bg-teal-100 rounded-md flex items-center justify-center">
                      <GraduationCap className="w-4 h-4 text-teal-600" />
                    </div>
                    <div>
                      <p className="text-[14px] font-medium text-neutral-900">Summit Intel</p>
                      <p className="text-[12px] text-neutral-500">College, Career & Military Readiness</p>
                    </div>
                  </Link>
                </div>
              )}
            </div>

            {/* Notification bell */}
            <Link
              href="/pathways/alerts"
              className="relative p-2 rounded-md hover:bg-primary-600 transition-colors"
              aria-label={`Notifications: ${notificationCount} unread`}
            >
              <Bell className="w-5 h-5" />
              {notificationCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-error text-[10px] font-bold rounded-full flex items-center justify-center">
                  {notificationCount}
                </span>
              )}
            </Link>

            {/* Profile menu */}
            <div className="relative">
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center gap-2 p-2 rounded-md hover:bg-primary-600 transition-colors"
                aria-expanded={profileMenuOpen}
                aria-haspopup="true"
              >
                <div className="w-8 h-8 bg-primary-700 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-[13px] font-medium leading-tight">{userName}</p>
                  <p className="text-[11px] opacity-70">{userRole}</p>
                </div>
                <ChevronDown className="w-4 h-4 hidden md:block" />
              </button>

              {/* Profile dropdown */}
              {profileMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-neutral-0 rounded-lg shadow-lg border border-neutral-200 py-1 z-50">
                  <Link
                    href="#"
                    className="block px-4 py-2 text-[14px] text-neutral-700 hover:bg-neutral-50"
                  >
                    Profile Settings
                  </Link>
                  <Link
                    href="#"
                    className="block px-4 py-2 text-[14px] text-neutral-700 hover:bg-neutral-50"
                  >
                    Help & Support
                  </Link>
                  <hr className="my-1 border-neutral-200" />
                  <Link
                    href="#"
                    className="block px-4 py-2 text-[14px] text-error hover:bg-neutral-50"
                  >
                    Sign Out
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile navigation menu */}
      {mobileMenuOpen && (
        <nav className="lg:hidden border-t border-primary-600 px-4 py-3 bg-primary-600">
          {pathwaysNavItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block w-full text-left px-4 py-3 text-[14px] font-medium rounded-md transition-colors text-neutral-0/80 hover:text-neutral-0 hover:bg-primary-700/50"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
};

// ============================================
// BREADCRUMBS
// ============================================

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const PathwaysBreadcrumbs = ({ items, className }: BreadcrumbsProps) => {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("bg-neutral-0 border-b border-neutral-200 px-4 lg:px-6 py-3", className)}
    >
      <ol className="flex items-center gap-2 text-[13px]">
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-2">
            {index > 0 && (
              <ChevronRight className="w-4 h-4 text-neutral-400" aria-hidden="true" />
            )}
            {item.href && index < items.length - 1 ? (
              <Link
                href={item.href}
                className="text-neutral-500 hover:text-primary-500 transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={cn(
                  index === items.length - 1 ? "text-neutral-900 font-medium" : "text-neutral-500"
                )}
                aria-current={index === items.length - 1 ? "page" : undefined}
              >
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

// ============================================
// NAV RAIL (Left Sidebar)
// ============================================

const pathwaysNavItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/pathways" },
  { id: "students", label: "Students", icon: Users, href: "/pathways/students" },
  { id: "interventions", label: "Interventions", icon: Target, href: "/pathways/interventions" },
  { id: "campus-reports", label: "Campus Reports", icon: Building2, href: "/pathways/campus-reports" },
  { id: "simulator", label: "A-F Simulator", icon: Gauge, href: "/pathways/simulator" },
  { id: "data-upload", label: "Data Upload", icon: Upload, href: "/pathways/data-upload" },
  { id: "settings", label: "Settings", icon: Settings, href: "/pathways/settings" },
];

interface NavRailProps {
  activeItem?: string;
  onItemChange?: (item: string) => void;
  className?: string;
}

export const PathwaysNavRail = ({ activeItem = "dashboard", onItemChange, className }: NavRailProps) => {
  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col w-[200px] bg-neutral-0 border-r border-neutral-200 flex-shrink-0",
        className
      )}
      role="navigation"
      aria-label="Side navigation"
    >
      <nav className="flex flex-col py-4">
        {pathwaysNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem === item.id;
          
          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => onItemChange?.(item.id)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 mx-2 rounded-md text-[14px] font-medium transition-colors",
                isActive
                  ? "bg-teal-50 text-teal-700"
                  : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

// ============================================
// APP SHELL LAYOUT
// ============================================

interface PathwaysAppShellProps {
  children: React.ReactNode;
  headerProps?: PathwaysHeaderProps;
  breadcrumbs?: BreadcrumbItem[];
  activeNavItem?: string;
  onNavItemChange?: (item: string) => void;
}

export const PathwaysAppShell = ({
  children,
  headerProps,
  breadcrumbs = [
    { label: "Summit Intel", href: "/pathways" },
    { label: "Dashboard" },
  ],
  activeNavItem = "dashboard",
  onNavItemChange,
}: PathwaysAppShellProps) => {
  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
      {/* Header */}
      <PathwaysHeader {...headerProps} />

      {/* Breadcrumbs */}
      <PathwaysBreadcrumbs items={breadcrumbs} />

      {/* Main Layout */}
      <div className="flex flex-1">
        {/* Nav Rail */}
        <PathwaysNavRail activeItem={activeNavItem} onItemChange={onNavItemChange} />

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-6 pb-20 lg:pb-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

// ============================================
// MOBILE NAV BAR (Bottom Navigation)
// ============================================

interface MobileNavBarProps {
  activeItem?: string;
  onItemChange?: (item: string) => void;
  className?: string;
}

export const PathwaysMobileNavBar = ({ activeItem = "dashboard", onItemChange, className }: MobileNavBarProps) => {
  const mobileNavItems = pathwaysNavItems.slice(0, 4);
  
  return (
    <nav
      className={cn(
        "lg:hidden fixed bottom-0 left-0 right-0 bg-neutral-0 border-t border-neutral-200 z-50",
        className
      )}
      role="navigation"
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around py-2">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem === item.id;
          
          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => onItemChange?.(item.id)}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 rounded-md transition-colors min-w-[64px]",
                isActive ? "text-teal-600" : "text-neutral-500"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="w-5 h-5" aria-hidden="true" />
              <span className="text-[11px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
