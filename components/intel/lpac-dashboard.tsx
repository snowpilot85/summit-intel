"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { 
  Users, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  ChevronRight,
  Calendar,
  BookOpen,
  FileCheck,
  ArrowUpRight,
} from "lucide-react";

/* ============================================
   LPAC Dashboard Components
   Summit Intel - EL Compliance Platform
   ============================================ */

// ============================================
// METRIC CARD
// ============================================

interface MetricCardProps {
  label: string;
  value: string | number;
  badge?: {
    text: string;
    variant: "urgent" | "ready" | "warning" | "info" | "neutral";
  };
  icon?: React.ReactNode;
  trend?: string;
  className?: string;
}

const badgeVariants = {
  urgent: "bg-error-light text-error-dark",
  ready: "bg-teal-100 text-teal-700",
  warning: "bg-warning-light text-warning-dark",
  info: "bg-info-light text-info-dark",
  neutral: "bg-neutral-100 text-neutral-600",
};

export const MetricCard = ({ label, value, badge, icon, trend, className }: MetricCardProps) => {
  return (
    <div className={cn("bg-neutral-0 border border-neutral-200 rounded-lg p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium text-neutral-500 mb-1">{label}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-[28px] font-semibold text-neutral-900 leading-none">
              {typeof value === "number" ? value.toLocaleString() : value}
            </span>
            {badge && (
              <span className={cn(
                "px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide rounded-full",
                badgeVariants[badge.variant]
              )}>
                {badge.text}
              </span>
            )}
          </div>
          {trend && (
            <p className="text-[12px] text-neutral-500 mt-1">{trend}</p>
          )}
        </div>
        {icon && (
          <div className="flex-shrink-0 w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center text-neutral-500">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================
// COMPLIANCE PIPELINE
// ============================================

interface PipelineSegment {
  label: string;
  value: number;
  color: string;
}

interface CompliancePipelineProps {
  segments: PipelineSegment[];
  className?: string;
}

export const CompliancePipeline = ({ segments, className }: CompliancePipelineProps) => {
  const total = segments.reduce((acc, seg) => acc + seg.value, 0);
  
  return (
    <div className={cn("space-y-3", className)}>
      {/* Stacked bar */}
      <div className="h-8 flex rounded-lg overflow-hidden">
        {segments.map((segment, idx) => {
          const percentage = (segment.value / total) * 100;
          if (percentage === 0) return null;
          
          return (
            <div
              key={idx}
              className={cn("flex items-center justify-center transition-all", segment.color)}
              style={{ width: `${percentage}%` }}
            >
              {percentage > 8 && (
                <span className="text-[11px] font-semibold text-neutral-0">
                  {segment.value.toLocaleString()}
                </span>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Legend */}
      <div className="flex flex-wrap gap-4">
        {segments.map((segment, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <div className={cn("w-3 h-3 rounded-sm", segment.color)} />
            <span className="text-[12px] text-neutral-600">
              {segment.label}: <span className="font-medium text-neutral-900">{segment.value.toLocaleString()}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================
// ACTION ITEM ROW
// ============================================

interface ActionItemProps {
  title: string;
  description: string;
  badge: {
    text: string;
    variant: "urgent" | "ready" | "warning" | "info";
  };
  href: string;
  className?: string;
}

const actionBadgeVariants = {
  urgent: "bg-error text-neutral-0",
  ready: "bg-teal-500 text-neutral-0",
  warning: "bg-warning text-neutral-0",
  info: "bg-primary-500 text-neutral-0",
};

export const ActionItemRow = ({ title, description, badge, href, className }: ActionItemProps) => {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-4 p-4 rounded-lg border border-neutral-200 bg-neutral-0 hover:bg-neutral-50 hover:border-neutral-300 transition-colors group",
        className
      )}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[14px] font-medium text-neutral-900">{title}</span>
          <span className={cn(
            "px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide rounded-full",
            actionBadgeVariants[badge.variant]
          )}>
            {badge.text}
          </span>
        </div>
        <p className="text-[13px] text-neutral-500">{description}</p>
      </div>
      <ChevronRight className="w-5 h-5 text-neutral-400 group-hover:text-primary-500 transition-colors flex-shrink-0" />
    </Link>
  );
};

// ============================================
// DATA COMPLETENESS BAR
// ============================================

interface DataCompletenessProps {
  label: string;
  percentage: number;
  className?: string;
}

export const DataCompletenessBar = ({ label, percentage, className }: DataCompletenessProps) => {
  const getBarColor = (pct: number) => {
    if (pct >= 90) return "bg-teal-500";
    if (pct >= 70) return "bg-warning";
    return "bg-error";
  };
  
  const getTextColor = (pct: number) => {
    if (pct >= 90) return "text-teal-700";
    if (pct >= 70) return "text-warning-dark";
    return "text-error";
  };

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between text-[13px]">
        <span className="text-neutral-700">{label}</span>
        <span className={cn("font-semibold", getTextColor(percentage))}>{percentage}%</span>
      </div>
      <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", getBarColor(percentage))}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

// ============================================
// DEADLINE ITEM
// ============================================

interface DeadlineItemProps {
  title: string;
  date: string;
  daysLeft: number;
  className?: string;
}

export const DeadlineItem = ({ title, date, daysLeft, className }: DeadlineItemProps) => {
  const getUrgencyColor = (days: number) => {
    if (days <= 14) return "text-error font-semibold";
    if (days <= 30) return "text-warning-dark font-medium";
    return "text-neutral-600";
  };

  return (
    <div className={cn("flex items-center justify-between py-3 border-b border-neutral-100 last:border-0", className)}>
      <div>
        <p className="text-[14px] font-medium text-neutral-900">{title}</p>
        <p className="text-[12px] text-neutral-500">{date}</p>
      </div>
      <span className={cn("text-[13px]", getUrgencyColor(daysLeft))}>
        {daysLeft} days
      </span>
    </div>
  );
};

// ============================================
// SMALL METRIC CARD (for row 3)
// ============================================

interface SmallMetricProps {
  label: string;
  value: string | number;
  subtext?: string;
  color?: "default" | "teal" | "primary";
}

const SmallMetric = ({ label, value, subtext, color = "default" }: SmallMetricProps) => {
  const valueColors = {
    default: "text-neutral-900",
    teal: "text-teal-600",
    primary: "text-primary-500",
  };

  return (
    <div className="flex items-center justify-between py-2 border-b border-neutral-100 last:border-0">
      <span className="text-[13px] text-neutral-600">{label}</span>
      <div className="text-right">
        <span className={cn("text-[14px] font-semibold", valueColors[color])}>
          {typeof value === "number" ? value.toLocaleString() : value}
        </span>
        {subtext && <p className="text-[11px] text-neutral-400">{subtext}</p>}
      </div>
    </div>
  );
};

// ============================================
// MAIN LPAC DASHBOARD
// ============================================

export const LPACDashboard = () => {
  // Pipeline data
  const pipelineSegments: PipelineSegment[] = [
    { label: "Unscheduled", value: 1, color: "bg-error" },
    { label: "Scheduled", value: 2104, color: "bg-warning" },
    { label: "Open", value: 4086, color: "bg-primary-500" },
    { label: "Finalized", value: 5514, color: "bg-teal-500" },
  ];

  // Action items
  const actionItems: ActionItemProps[] = [
    {
      title: "Initial LPAC — new enrollees",
      description: "23 students need identification within 4 weeks",
      badge: { text: "URGENT", variant: "urgent" },
      href: "/intel/students?filter=pending-identification",
    },
    {
      title: "End-of-year LPAC review",
      description: "6,191 students pending annual review by June 15",
      badge: { text: "DUE SOON", variant: "warning" },
      href: "/intel/students?filter=annual-review",
    },
    {
      title: "Reclassification eligible",
      description: "847 students met all criteria on TELPAS",
      badge: { text: "READY", variant: "ready" },
      href: "/intel/students?filter=reclassification-eligible",
    },
    {
      title: "Monitoring year 2 — exit review",
      description: "312 students completing 2-year monitoring",
      badge: { text: "UPCOMING", variant: "info" },
      href: "/intel/students?filter=monitoring-y2",
    },
  ];

  // Data completeness
  const dataItems = [
    { label: "TELPAS scores uploaded", percentage: 98 },
    { label: "Home language survey on file", percentage: 96 },
    { label: "Demographic fields complete", percentage: 74 },
    { label: "STAAR reading scores", percentage: 41 },
    { label: "Parent notifications returned", percentage: 68 },
  ];

  // Deadlines
  const deadlines: DeadlineItemProps[] = [
    { title: "PEIMS fall snapshot", date: "Last Friday of October", daysLeft: 18 },
    { title: "MOY assessment window", date: "Feb 1 - Mar 15", daysLeft: 112 },
    { title: "TELPAS testing", date: "Mar - Apr", daysLeft: 142 },
    { title: "EOY LPAC review deadline", date: "Last day of school", daysLeft: 230 },
  ];

  return (
    <div className="space-y-6">
      {/* Row 1: Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Current EB Students"
          value={11705}
          icon={<Users className="w-5 h-5" />}
        />
        <MetricCard
          label="Pending Identification"
          value={23}
          badge={{ text: "URGENT", variant: "urgent" }}
          icon={<AlertCircle className="w-5 h-5" />}
        />
        <MetricCard
          label="Reclassification Eligible"
          value={847}
          badge={{ text: "READY", variant: "ready" }}
          icon={<CheckCircle2 className="w-5 h-5" />}
        />
        <MetricCard
          label="Exited / Monitoring"
          value={1452}
          icon={<Clock className="w-5 h-5" />}
        />
      </div>

      {/* Row 2: Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Compliance Pipeline */}
        <div className="bg-neutral-0 border border-neutral-200 rounded-lg p-6">
          <h3 className="text-[16px] font-semibold text-neutral-900 mb-4">Compliance Pipeline</h3>
          
          <CompliancePipeline segments={pipelineSegments} className="mb-6" />
          
          <div className="space-y-3">
            {actionItems.map((item, idx) => (
              <ActionItemRow key={idx} {...item} />
            ))}
          </div>
        </div>

        {/* Right: Data Completeness */}
        <div className="bg-neutral-0 border border-neutral-200 rounded-lg p-6">
          <h3 className="text-[16px] font-semibold text-neutral-900 mb-4">Data Completeness</h3>
          
          <div className="space-y-4">
            {dataItems.map((item, idx) => (
              <DataCompletenessBar key={idx} {...item} />
            ))}
          </div>

          {/* Callout */}
          <div className="mt-6 p-4 bg-warning-light border border-warning/30 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-warning-dark flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[14px] font-medium text-warning-dark">
                  858 students have blocked PLPs due to missing data
                </p>
                <Link
                  href="/intel/upload"
                  className="inline-flex items-center gap-1 text-[13px] font-medium text-primary-500 hover:text-primary-600 mt-1"
                >
                  Upload data to unblock
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Three cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* PEIMS Readiness */}
        <div className="bg-neutral-0 border border-neutral-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileCheck className="w-5 h-5 text-neutral-500" />
            <h3 className="text-[16px] font-semibold text-neutral-900">PEIMS Readiness</h3>
          </div>
          
          <div className="mb-4">
            <div className="flex items-center justify-between text-[13px] mb-1">
              <span className="text-neutral-600">Fall snapshot: Oct 31</span>
              <span className="font-semibold text-warning-dark">18 days</span>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-neutral-600">TEDS codes generated</span>
              <span className="font-semibold text-neutral-900">11,284 / 11,705</span>
            </div>
            <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
              <div className="h-full bg-teal-500 rounded-full" style={{ width: "96.4%" }} />
            </div>
          </div>

          <p className="text-[12px] text-neutral-500">
            421 students need LPAC decisions before codes can generate
          </p>
        </div>

        {/* Summit Instruction Sync */}
        <div className="bg-neutral-0 border border-neutral-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-neutral-500" />
            <h3 className="text-[16px] font-semibold text-neutral-900">Summit Instruction Sync</h3>
          </div>

          <div className="space-y-0">
            <SmallMetric label="BOY assessed" value={10992} />
            <SmallMetric label="PLP #1 generated" value={10847} />
            <SmallMetric label="MOY assessed" value="Scheduled: Feb" color="primary" />
            <SmallMetric label="ClassCade active" value={8340} color="teal" />
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="bg-neutral-0 border border-neutral-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-neutral-500" />
            <h3 className="text-[16px] font-semibold text-neutral-900">Upcoming Deadlines</h3>
          </div>

          <div>
            {deadlines.map((deadline, idx) => (
              <DeadlineItem key={idx} {...deadline} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
