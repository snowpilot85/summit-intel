"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  X,
  ChevronRight,
  Bell,
  Mail,
  Filter,
  Calendar,
  AlertTriangle,
  Info,
  Clock,
} from "lucide-react";
import { DSMBadge, DSMCard, DSMButton, DSMTabs, DSMSelect, DSMCheckbox, H2, H3, H4, P2, P3, P4 } from "./index";
import { mockAlerts, notificationSettings, mockDistricts, type Alert, type NotificationSetting } from "@/lib/mock-data";

// ============================================
// SEVERITY BADGE
// ============================================

const SeverityBadge = ({ severity }: { severity: Alert["severity"] }) => {
  return (
    <DSMBadge variant="status" status={severity === "red" ? "error" : "warning"}>
      {severity === "red" ? "Critical" : "Warning"}
    </DSMBadge>
  );
};

// ============================================
// PHASE BADGE
// ============================================

const PhaseBadge = ({ phase }: { phase: number }) => {
  return (
    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary-50 text-primary-700 text-[12px] font-semibold">
      {phase}
    </span>
  );
};

// ============================================
// ALERT DRAWER
// ============================================

interface AlertDrawerProps {
  alert: Alert | null;
  onClose: () => void;
}

const AlertDrawer = ({ alert, onClose }: AlertDrawerProps) => {
  if (!alert) return null;

  const district = mockDistricts.find((d) => d.id === alert.districtId);

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-neutral-900/30 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-neutral-0 shadow-xl z-50 flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200">
          <H4 id="drawer-title">Alert Details</H4>
          <button
            onClick={onClose}
            className="p-2 rounded-md hover:bg-neutral-100 transition-colors"
            aria-label="Close drawer"
          >
            <X className="w-5 h-5 text-neutral-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Severity & District */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <SeverityBadge severity={alert.severity} />
              <span className="text-[14px] text-neutral-500">{alert.timestamp}</span>
            </div>

            <div>
              <P4 className="text-neutral-500 mb-1">District</P4>
              <H3>{alert.districtName}</H3>
            </div>

            <div className="flex items-center gap-4">
              <div>
                <P4 className="text-neutral-500 mb-1">Phase</P4>
                <PhaseBadge phase={alert.phase} />
              </div>
              <div>
                <P4 className="text-neutral-500 mb-1">KPI Value</P4>
                <span className={cn(
                  "text-[18px] font-semibold",
                  alert.severity === "red" ? "text-error" : "text-warning"
                )}>
                  {alert.kpiValue}
                </span>
              </div>
            </div>
          </div>

          {/* Trigger Condition */}
          <DSMCard padding="sm" className="bg-neutral-50">
            <P4 className="text-neutral-500 mb-2">Trigger Condition</P4>
            <P2 className="text-neutral-900 font-medium">{alert.triggerCondition}</P2>
          </DSMCard>

          {/* Metrics Snapshot */}
          {district && (
            <div>
              <P4 className="text-neutral-500 mb-3">Metrics Snapshot</P4>
              <div className="grid grid-cols-2 gap-3">
                <DSMCard padding="sm">
                  <P4 className="text-neutral-500">Risk Score</P4>
                  <span className={cn(
                    "text-[20px] font-semibold",
                    district.status === "red" ? "text-error" :
                    district.status === "yellow" ? "text-warning" : "text-neutral-900"
                  )}>
                    {district.riskScore}
                  </span>
                </DSMCard>
                <DSMCard padding="sm">
                  <P4 className="text-neutral-500">Status</P4>
                  <DSMBadge 
                    variant="status" 
                    status={
                      district.status === "red" ? "error" :
                      district.status === "yellow" ? "warning" :
                      district.status === "green" ? "success" : "info"
                    }
                  >
                    {district.status.charAt(0).toUpperCase() + district.status.slice(1)}
                  </DSMBadge>
                </DSMCard>
                {district.daysLeft !== null && (
                  <DSMCard padding="sm">
                    <P4 className="text-neutral-500">Days Left</P4>
                    <span className={cn(
                      "text-[20px] font-semibold",
                      district.daysLeft <= 3 ? "text-error" :
                      district.daysLeft <= 7 ? "text-warning" : "text-neutral-900"
                    )}>
                      {district.daysLeft}
                    </span>
                  </DSMCard>
                )}
              </div>
            </div>
          )}

          {/* Recommended Action */}
          <div>
            <P4 className="text-neutral-500 mb-2">Recommended Next Action</P4>
            <DSMCard padding="sm" className="border-l-4 border-primary-500">
              <P2 className="text-neutral-900">
                {alert.severity === "red" 
                  ? "Schedule emergency call with district leadership to discuss immediate intervention strategies."
                  : "Review district metrics and prepare targeted support recommendations for the DSM team."}
              </P2>
            </DSMCard>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-neutral-200 space-y-3">
          <Link href={`/district/${alert.districtId}`} className="block">
            <DSMButton variant="primary" className="w-full">
              View District Drilldown
              <ChevronRight className="w-4 h-4" />
            </DSMButton>
          </Link>
          <DSMButton variant="secondary" className="w-full" onClick={onClose}>
            Close
          </DSMButton>
        </div>
      </aside>
    </>
  );
};

// ============================================
// ALERTS TABLE
// ============================================

interface AlertsTableProps {
  alerts: Alert[];
  onAlertClick: (alert: Alert) => void;
}

const AlertsTable = ({ alerts, onAlertClick }: AlertsTableProps) => {
  if (alerts.length === 0) {
    return (
      <div className="text-center py-12 text-neutral-500">
        <Bell className="w-12 h-12 mx-auto mb-4 text-neutral-300" />
        <P2>No alerts match your current filters.</P2>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-neutral-200 rounded-lg">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-neutral-50 border-b border-neutral-200">
            <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wide text-neutral-600">
              Severity
            </th>
            <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wide text-neutral-600">
              District
            </th>
            <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wide text-neutral-600">
              Phase
            </th>
            <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wide text-neutral-600">
              Trigger Condition
            </th>
            <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wide text-neutral-600">
              KPI Value
            </th>
            <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wide text-neutral-600">
              Timestamp
            </th>
            <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wide text-neutral-600">
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {alerts.map((alert) => (
            <tr 
              key={alert.id}
              className={cn(
                "border-b border-neutral-100 hover:bg-neutral-50 transition-colors cursor-pointer",
                !alert.isRead && "bg-primary-50/30"
              )}
              onClick={() => onAlertClick(alert)}
            >
              <td className="px-4 py-4">
                <SeverityBadge severity={alert.severity} />
              </td>
              <td className="px-4 py-4">
                <div className="flex items-center gap-2">
                  {!alert.isRead && (
                    <span className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0" aria-label="Unread" />
                  )}
                  <span className="text-[14px] font-medium text-neutral-900">{alert.districtName}</span>
                </div>
              </td>
              <td className="px-4 py-4">
                <PhaseBadge phase={alert.phase} />
              </td>
              <td className="px-4 py-4">
                <span className="text-[13px] text-neutral-700">{alert.triggerCondition}</span>
              </td>
              <td className="px-4 py-4">
                <span className={cn(
                  "text-[14px] font-semibold",
                  alert.severity === "red" ? "text-error" : "text-warning"
                )}>
                  {alert.kpiValue}
                </span>
              </td>
              <td className="px-4 py-4">
                <span className="text-[13px] text-neutral-500">{alert.timestamp}</span>
              </td>
              <td className="px-4 py-4">
                <span className="inline-flex items-center gap-1 text-[13px] font-medium text-primary-500 hover:text-primary-600">
                  View
                  <ChevronRight className="w-4 h-4" />
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ============================================
// FILTER BAR
// ============================================

interface AlertFilterBarProps {
  severityFilter: string;
  onSeverityChange: (value: string) => void;
  phaseFilter: string;
  onPhaseChange: (value: string) => void;
  districtFilter: string;
  onDistrictChange: (value: string) => void;
}

const AlertFilterBar = ({
  severityFilter,
  onSeverityChange,
  phaseFilter,
  onPhaseChange,
  districtFilter,
  onDistrictChange,
}: AlertFilterBarProps) => {
  const uniqueDistricts = [...new Set(mockAlerts.map(a => a.districtName))];

  return (
    <div className="flex flex-col lg:flex-row gap-4 p-4 bg-neutral-0 border border-neutral-200 rounded-lg">
      <div className="flex items-center gap-2 text-neutral-500">
        <Filter className="w-4 h-4" />
        <span className="text-[13px] font-medium">Filters:</span>
      </div>

      <div className="flex flex-wrap gap-4 flex-1">
        <div className="w-full sm:w-auto sm:min-w-[140px]">
          <DSMSelect
            value={severityFilter}
            onChange={(e) => onSeverityChange(e.target.value)}
            options={[
              { value: "all", label: "All Severity" },
              { value: "red", label: "Critical" },
              { value: "yellow", label: "Warning" },
            ]}
          />
        </div>

        <div className="w-full sm:w-auto sm:min-w-[140px]">
          <DSMSelect
            value={phaseFilter}
            onChange={(e) => onPhaseChange(e.target.value)}
            options={[
              { value: "all", label: "All Phases" },
              { value: "1", label: "Phase 1" },
              { value: "2", label: "Phase 2" },
              { value: "3", label: "Phase 3" },
              { value: "4", label: "Phase 4" },
              { value: "5", label: "Phase 5" },
            ]}
          />
        </div>

        <div className="w-full sm:w-auto sm:min-w-[180px]">
          <DSMSelect
            value={districtFilter}
            onChange={(e) => onDistrictChange(e.target.value)}
            options={[
              { value: "all", label: "All Districts" },
              ...uniqueDistricts.map(d => ({ value: d, label: d })),
            ]}
          />
        </div>
      </div>
    </div>
  );
};

// ============================================
// NOTIFICATION SETTINGS
// ============================================

interface NotificationSettingsTabProps {
  settings: NotificationSetting[];
  onSettingChange: (id: string, field: "inApp" | "email", value: boolean) => void;
}

const NotificationSettingsTab = ({ settings, onSettingChange }: NotificationSettingsTabProps) => {
  // Group settings by category
  const groupedSettings = settings.reduce((acc, setting) => {
    if (!acc[setting.category]) {
      acc[setting.category] = [];
    }
    acc[setting.category].push(setting);
    return acc;
  }, {} as Record<string, NotificationSetting[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <H3>Notification Preferences</H3>
          <P3 className="text-neutral-500 mt-1">Configure how and when you receive alerts</P3>
        </div>
      </div>

      {Object.entries(groupedSettings).map(([category, categorySettings]) => (
        <DSMCard key={category} padding="md">
          <H4 className="mb-4">{category}</H4>
          <div className="space-y-1">
            {/* Header */}
            <div className="grid grid-cols-[1fr_80px_80px] gap-4 pb-2 border-b border-neutral-200">
              <span className="text-[12px] font-semibold uppercase tracking-wide text-neutral-500">
                Alert Type
              </span>
              <span className="text-[12px] font-semibold uppercase tracking-wide text-neutral-500 text-center">
                In-App
              </span>
              <span className="text-[12px] font-semibold uppercase tracking-wide text-neutral-500 text-center">
                Email
              </span>
            </div>

            {/* Settings rows */}
            {categorySettings.map((setting) => (
              <div 
                key={setting.id} 
                className="grid grid-cols-[1fr_80px_80px] gap-4 py-3 border-b border-neutral-100 last:border-0"
              >
                <span className="text-[14px] text-neutral-700">{setting.alertType}</span>
                <div className="flex justify-center">
                  <ToggleSwitch
                    checked={setting.inApp}
                    onChange={(checked) => onSettingChange(setting.id, "inApp", checked)}
                    label={`${setting.alertType} in-app notification`}
                  />
                </div>
                <div className="flex justify-center">
                  <ToggleSwitch
                    checked={setting.email}
                    onChange={(checked) => onSettingChange(setting.id, "email", checked)}
                    label={`${setting.alertType} email notification`}
                  />
                </div>
              </div>
            ))}
          </div>
        </DSMCard>
      ))}
    </div>
  );
};

// ============================================
// TOGGLE SWITCH
// ============================================

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

const ToggleSwitch = ({ checked, onChange, label }: ToggleSwitchProps) => {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
        checked ? "bg-primary-500" : "bg-neutral-300"
      )}
    >
      <span
        className={cn(
          "inline-block h-4 w-4 transform rounded-full bg-neutral-0 transition-transform",
          checked ? "translate-x-6" : "translate-x-1"
        )}
      />
    </button>
  );
};

// ============================================
// MAIN ALERTS CENTER COMPONENT
// ============================================

export const AlertsCenter = () => {
  const [activeTab, setActiveTab] = React.useState("alerts");
  const [selectedAlert, setSelectedAlert] = React.useState<Alert | null>(null);

  // Filters
  const [severityFilter, setSeverityFilter] = React.useState("all");
  const [phaseFilter, setPhaseFilter] = React.useState("all");
  const [districtFilter, setDistrictFilter] = React.useState("all");

  // Notification settings state
  const [settings, setSettings] = React.useState(notificationSettings);

  const handleSettingChange = (id: string, field: "inApp" | "email", value: boolean) => {
    setSettings(prev => prev.map(s => 
      s.id === id ? { ...s, [field]: value } : s
    ));
  };

  // Filter alerts
  const filteredAlerts = React.useMemo(() => {
    let result = [...mockAlerts];

    if (severityFilter !== "all") {
      result = result.filter(a => a.severity === severityFilter);
    }

    if (phaseFilter !== "all") {
      result = result.filter(a => a.phase === parseInt(phaseFilter));
    }

    if (districtFilter !== "all") {
      result = result.filter(a => a.districtName === districtFilter);
    }

    // Sort: unread first, then by severity (red before yellow), then by timestamp
    result.sort((a, b) => {
      if (a.isRead !== b.isRead) return a.isRead ? 1 : -1;
      if (a.severity !== b.severity) return a.severity === "red" ? -1 : 1;
      return 0;
    });

    return result;
  }, [severityFilter, phaseFilter, districtFilter]);

  const unreadCount = mockAlerts.filter(a => !a.isRead).length;

  const tabs = [
    { id: "alerts", label: "Alerts" },
    { id: "settings", label: "Notification Settings" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <H2>Alerts & Notifications</H2>
          <P3 className="text-neutral-500 mt-1">
            {unreadCount} unread alerts requiring attention
          </P3>
        </div>
      </div>

      {/* Tabs */}
      <DSMTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Tab Content */}
      {activeTab === "alerts" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <AlertFilterBar
            severityFilter={severityFilter}
            onSeverityChange={setSeverityFilter}
            phaseFilter={phaseFilter}
            onPhaseChange={setPhaseFilter}
            districtFilter={districtFilter}
            onDistrictChange={setDistrictFilter}
          />

          {/* Results count */}
          <P4 className="text-neutral-500">
            Showing {filteredAlerts.length} of {mockAlerts.length} alerts
          </P4>

          {/* Alerts Table */}
          <AlertsTable alerts={filteredAlerts} onAlertClick={setSelectedAlert} />
        </div>
      )}

      {activeTab === "settings" && (
        <NotificationSettingsTab 
          settings={settings}
          onSettingChange={handleSettingChange}
        />
      )}

      {/* Alert Drawer */}
      <AlertDrawer 
        alert={selectedAlert} 
        onClose={() => setSelectedAlert(null)} 
      />
    </div>
  );
};
