"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, AlertCircle, AlertTriangle, Info, Check, X } from "lucide-react";

/* ============================================
   DSM Design System Components
   Summit K12 - District Success Manager
   ============================================ */

// ============================================
// TYPOGRAPHY
// ============================================

interface TypographyProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
}

export const H1 = ({ className, children, ...props }: TypographyProps) => (
  <h1 className={cn("text-[32px] font-semibold leading-[40px] tracking-[-0.02em] text-neutral-900", className)} {...props}>
    {children}
  </h1>
);

export const H2 = ({ className, children, ...props }: TypographyProps) => (
  <h2 className={cn("text-[24px] font-semibold leading-[32px] tracking-[-0.01em] text-neutral-900", className)} {...props}>
    {children}
  </h2>
);

export const H3 = ({ className, children, ...props }: TypographyProps) => (
  <h3 className={cn("text-[20px] font-medium leading-[28px] text-neutral-900", className)} {...props}>
    {children}
  </h3>
);

export const H4 = ({ className, children, ...props }: TypographyProps) => (
  <h4 className={cn("text-[18px] font-medium leading-[26px] text-neutral-900", className)} {...props}>
    {children}
  </h4>
);

export const H5 = ({ className, children, ...props }: TypographyProps) => (
  <h5 className={cn("text-[16px] font-medium leading-[24px] text-neutral-900", className)} {...props}>
    {children}
  </h5>
);

export const H6 = ({ className, children, ...props }: TypographyProps) => (
  <h6 className={cn("text-[14px] font-medium leading-[20px] text-neutral-900", className)} {...props}>
    {children}
  </h6>
);

export const P1 = ({ className, children, ...props }: TypographyProps) => (
  <p className={cn("text-[16px] font-normal leading-[24px] text-neutral-700", className)} {...props}>
    {children}
  </p>
);

export const P2 = ({ className, children, ...props }: TypographyProps) => (
  <p className={cn("text-[14px] font-normal leading-[20px] text-neutral-700", className)} {...props}>
    {children}
  </p>
);

export const P3 = ({ className, children, ...props }: TypographyProps) => (
  <p className={cn("text-[13px] font-normal leading-[18px] text-neutral-600", className)} {...props}>
    {children}
  </p>
);

export const P4 = ({ className, children, ...props }: TypographyProps) => (
  <p className={cn("text-[12px] font-normal leading-[16px] text-neutral-500", className)} {...props}>
    {children}
  </p>
);

// ============================================
// BUTTONS
// ============================================

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "tertiary";
  size?: "sm" | "md" | "lg";
}

export const DSMButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", disabled, children, ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:pointer-events-none";
    
    const variants = {
      primary: "bg-primary-500 text-neutral-0 hover:bg-primary-600 active:bg-primary-700 disabled:bg-neutral-200 disabled:text-neutral-400",
      secondary: "bg-neutral-0 text-neutral-700 border border-neutral-300 hover:bg-neutral-50 hover:border-neutral-400 active:bg-neutral-100 disabled:bg-neutral-50 disabled:text-neutral-400 disabled:border-neutral-200",
      tertiary: "bg-transparent text-primary-500 hover:bg-primary-50 active:bg-primary-100 disabled:text-neutral-400 disabled:bg-transparent",
    };
    
    const sizes = {
      sm: "h-8 px-3 text-[13px] rounded-md gap-1.5",
      md: "h-10 px-4 text-[14px] rounded-md gap-2",
      lg: "h-12 px-6 text-[16px] rounded-lg gap-2",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }
);
DSMButton.displayName = "DSMButton";

// ============================================
// INPUT
// ============================================

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  supportingText?: string;
  error?: boolean;
  errorMessage?: string;
}

export const DSMInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, supportingText, error, errorMessage, id, ...props }, ref) => {
    const inputId = id || React.useId();
    
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label 
            htmlFor={inputId} 
            className="text-[14px] font-medium leading-[20px] text-neutral-700"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "h-10 w-full rounded-md border bg-neutral-0 px-3 text-[14px] text-neutral-900 placeholder:text-neutral-400",
            "transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
            "disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-400",
            error ? "border-error focus:ring-error focus:border-error" : "border-neutral-300 hover:border-neutral-400",
            className
          )}
          aria-invalid={error}
          aria-describedby={supportingText || errorMessage ? `${inputId}-description` : undefined}
          {...props}
        />
        {(supportingText || errorMessage) && (
          <p 
            id={`${inputId}-description`}
            className={cn(
              "text-[13px] leading-[18px]",
              error ? "text-error" : "text-neutral-500"
            )}
          >
            {error ? errorMessage : supportingText}
          </p>
        )}
      </div>
    );
  }
);
DSMInput.displayName = "DSMInput";

// ============================================
// BADGES / PILLS
// ============================================

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "phase" | "status";
  status?: "success" | "warning" | "error" | "info" | "neutral";
}

export const DSMBadge = ({ className, variant = "status", status = "neutral", children, ...props }: BadgeProps) => {
  const baseStyles = "inline-flex items-center justify-center font-medium rounded-full";
  
  const variantStyles = {
    phase: "px-3 py-1 text-[12px] leading-[16px]",
    status: "px-2 py-0.5 text-[11px] leading-[14px] uppercase tracking-wide",
  };
  
  const statusStyles = {
    success: "bg-success-light text-success-dark",
    warning: "bg-warning-light text-warning-dark",
    error: "bg-error-light text-error-dark",
    info: "bg-info-light text-info-dark",
    neutral: "bg-neutral-100 text-neutral-600",
  };

  return (
    <span className={cn(baseStyles, variantStyles[variant], statusStyles[status], className)} {...props}>
      {children}
    </span>
  );
};

// ============================================
// CARD
// ============================================

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: "sm" | "md" | "lg";
}

export const DSMCard = ({ className, padding = "md", children, ...props }: CardProps) => {
  const paddings = {
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  return (
    <div
      className={cn(
        "bg-neutral-0 border border-neutral-200 rounded-lg",
        paddings[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

// ============================================
// TABS
// ============================================

interface TabsProps {
  tabs: { id: string; label: string; disabled?: boolean }[];
  activeTab: string;
  onTabChange: (id: string) => void;
  className?: string;
}

export const DSMTabs = ({ tabs, activeTab, onTabChange, className }: TabsProps) => {
  return (
    <div 
      className={cn("flex border-b border-neutral-200", className)} 
      role="tablist"
      aria-label="Tabs"
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={activeTab === tab.id}
          aria-controls={`panel-${tab.id}`}
          tabIndex={activeTab === tab.id ? 0 : -1}
          disabled={tab.disabled}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "px-4 py-3 text-[14px] font-medium transition-colors relative",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-inset",
            activeTab === tab.id
              ? "text-primary-500 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-primary-500"
              : "text-neutral-500 hover:text-neutral-700",
            tab.disabled && "text-neutral-300 cursor-not-allowed hover:text-neutral-300"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

// ============================================
// TABLE
// ============================================

interface Column<T> {
  key: keyof T | string;
  header: string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  stickyHeader?: boolean;
  sortColumn?: string;
  sortDirection?: "asc" | "desc";
  onSort?: (column: string) => void;
  className?: string;
}

export function DSMTable<T extends Record<string, unknown>>({
  columns,
  data,
  stickyHeader = false,
  sortColumn,
  sortDirection,
  onSort,
  className,
}: TableProps<T>) {
  return (
    <div className={cn("overflow-auto", className)}>
      <table className="w-full border-collapse">
        <thead className={cn(stickyHeader && "sticky top-0 z-10")}>
          <tr className="bg-neutral-50 border-b border-neutral-200">
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className={cn(
                  "px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wide text-neutral-600",
                  col.sortable && "cursor-pointer select-none hover:bg-neutral-100"
                )}
                onClick={() => col.sortable && onSort?.(String(col.key))}
                aria-sort={sortColumn === col.key ? (sortDirection === "asc" ? "ascending" : "descending") : undefined}
              >
                <span className="inline-flex items-center gap-1">
                  {col.header}
                  {col.sortable && (
                    <span className="text-neutral-400" aria-hidden="true">
                      {sortColumn === col.key ? (
                        sortDirection === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4 opacity-0 group-hover:opacity-50" />
                      )}
                    </span>
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr 
              key={idx} 
              className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors"
            >
              {columns.map((col) => (
                <td key={String(col.key)} className="px-4 py-3 text-[14px] text-neutral-700">
                  {col.render ? col.render(row) : String(row[col.key as keyof T] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================
// PROGRESS BAR
// ============================================

interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  showLabel?: boolean;
}

export const DSMProgressBar = ({ value, max = 100, className, showLabel = false }: ProgressBarProps) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div 
        className="flex-1 h-2 bg-neutral-200 rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div 
          className="h-full bg-primary-500 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-[13px] font-medium text-neutral-600 min-w-[40px] text-right">
          {Math.round(percentage)}%
        </span>
      )}
    </div>
  );
};

// ============================================
// SEGMENTED PROGRESS BAR
// ============================================

interface SegmentedProgressProps {
  segments: { completed: boolean; label?: string }[];
  className?: string;
}

export const DSMSegmentedProgress = ({ segments, className }: SegmentedProgressProps) => {
  const completedCount = segments.filter(s => s.completed).length;
  
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex gap-1" role="group" aria-label={`Progress: ${completedCount} of ${segments.length} completed`}>
        {segments.map((segment, idx) => (
          <div
            key={idx}
            className={cn(
              "flex-1 h-2 rounded-sm transition-colors",
              segment.completed ? "bg-success" : "bg-neutral-200"
            )}
            aria-label={segment.label || `Segment ${idx + 1}: ${segment.completed ? "Complete" : "Incomplete"}`}
          />
        ))}
      </div>
      <div className="flex justify-between text-[12px] text-neutral-500">
        {segments.map((segment, idx) => (
          <span key={idx} className={cn(segment.completed && "text-success-dark font-medium")}>
            {segment.label || `Phase ${idx + 1}`}
          </span>
        ))}
      </div>
    </div>
  );
};

// ============================================
// ALERT BANNER
// ============================================

interface AlertProps {
  variant: "info" | "warning" | "urgent";
  title?: string;
  children: React.ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

export const DSMAlert = ({ variant, title, children, dismissible, onDismiss, className }: AlertProps) => {
  const variants = {
    info: {
      container: "bg-info-light border-info text-info-dark",
      icon: <Info className="w-5 h-5" />,
    },
    warning: {
      container: "bg-warning-light border-warning text-warning-dark",
      icon: <AlertTriangle className="w-5 h-5" />,
    },
    urgent: {
      container: "bg-error-light border-error text-error-dark",
      icon: <AlertCircle className="w-5 h-5" />,
    },
  };

  const config = variants[variant];

  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-3 p-4 border-l-4 rounded-r-md",
        config.container,
        className
      )}
    >
      <span className="flex-shrink-0 mt-0.5" aria-hidden="true">{config.icon}</span>
      <div className="flex-1 min-w-0">
        {title && <p className="font-medium text-[14px] mb-1">{title}</p>}
        <div className="text-[14px] opacity-90">{children}</div>
      </div>
      {dismissible && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 p-1 rounded hover:bg-black/5 transition-colors"
          aria-label="Dismiss alert"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

// ============================================
// COLOR SWATCH (for documentation)
// ============================================

interface SwatchProps {
  name: string;
  color: string;
  textColor?: string;
}

export const ColorSwatch = ({ name, color, textColor = "text-neutral-0" }: SwatchProps) => (
  <div className="flex flex-col">
    <div 
      className={cn("h-16 rounded-t-md flex items-end p-2", textColor)}
      style={{ backgroundColor: color }}
    >
      <span className="text-[11px] font-medium opacity-80">{color}</span>
    </div>
    <div className="bg-neutral-0 border border-t-0 border-neutral-200 rounded-b-md px-2 py-1.5">
      <span className="text-[12px] font-medium text-neutral-700">{name}</span>
    </div>
  </div>
);

// ============================================
// CHECKBOX (Accessible)
// ============================================

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

export const DSMCheckbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, id, ...props }, ref) => {
    const checkboxId = id || React.useId();
    
    return (
      <div className="flex items-center gap-2">
        <input
          ref={ref}
          type="checkbox"
          id={checkboxId}
          className={cn(
            "h-4 w-4 rounded border-neutral-300 text-primary-500",
            "focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          {...props}
        />
        {label && (
          <label 
            htmlFor={checkboxId}
            className="text-[14px] text-neutral-700 select-none cursor-pointer"
          >
            {label}
          </label>
        )}
      </div>
    );
  }
);
DSMCheckbox.displayName = "DSMCheckbox";

// ============================================
// SELECT
// ============================================

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
  supportingText?: string;
}

export const DSMSelect = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, options, supportingText, id, ...props }, ref) => {
    const selectId = id || React.useId();
    
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label 
            htmlFor={selectId}
            className="text-[14px] font-medium leading-[20px] text-neutral-700"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            "h-10 w-full rounded-md border border-neutral-300 bg-neutral-0 px-3 text-[14px] text-neutral-900",
            "transition-colors hover:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
            "disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-400",
            className
          )}
          aria-describedby={supportingText ? `${selectId}-description` : undefined}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {supportingText && (
          <p id={`${selectId}-description`} className="text-[13px] leading-[18px] text-neutral-500">
            {supportingText}
          </p>
        )}
      </div>
    );
  }
);
DSMSelect.displayName = "DSMSelect";
