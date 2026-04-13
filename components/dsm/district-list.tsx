"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  Search,
  Plus,
  MoreHorizontal,
  Eye,
  Pause,
  Play,
  ArrowRightLeft,
  FileText,
  Trash2,
  X,
  Building2,
  CheckCircle,
  PauseCircle,
} from "lucide-react";
import { DSMBadge, DSMCard, DSMButton, DSMInput, DSMSelect, H2, H3, H4, P2, P3, P4 } from "./index";
import { portfolioDistricts, type PortfolioDistrict } from "@/lib/mock-data";

// ============================================
// SUMMARY CARDS
// ============================================

interface SummaryCardsProps {
  total: number;
  active: number;
  paused: number;
}

const SummaryCards = ({ total, active, paused }: SummaryCardsProps) => {
  return (
    <div className="grid grid-cols-3 gap-4">
      <DSMCard padding="md" className="text-center">
        <div className="flex flex-col items-center gap-1">
          <Building2 className="w-5 h-5 text-neutral-400" />
          <span className="text-[28px] font-semibold text-neutral-900">{total}</span>
          <P4 className="text-neutral-500">Total Assigned</P4>
        </div>
      </DSMCard>
      <DSMCard padding="md" className="text-center">
        <div className="flex flex-col items-center gap-1">
          <CheckCircle className="w-5 h-5 text-success" />
          <span className="text-[28px] font-semibold text-neutral-900">{active}</span>
          <P4 className="text-neutral-500">Active (Tracking)</P4>
        </div>
      </DSMCard>
      <DSMCard padding="md" className="text-center">
        <div className="flex flex-col items-center gap-1">
          <PauseCircle className="w-5 h-5 text-neutral-400" />
          <span className="text-[28px] font-semibold text-neutral-900">{paused}</span>
          <P4 className="text-neutral-500">Paused</P4>
        </div>
      </DSMCard>
    </div>
  );
};

// ============================================
// RISK STATUS BADGE
// ============================================

const RiskStatusBadge = ({ status }: { status: PortfolioDistrict["riskStatus"] }) => {
  const config = {
    red: { label: "Red", variant: "error" as const },
    yellow: { label: "Yellow", variant: "warning" as const },
    green: { label: "Green", variant: "success" as const },
    blue: { label: "Blue", variant: "info" as const },
  };

  return (
    <DSMBadge variant="status" status={config[status].variant}>
      {config[status].label}
    </DSMBadge>
  );
};

// ============================================
// TRACKING STATUS BADGE
// ============================================

const TrackingStatusBadge = ({ status }: { status: PortfolioDistrict["trackingStatus"] }) => {
  if (status === "active") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-medium bg-success-light text-success-dark">
        <span className="w-1.5 h-1.5 rounded-full bg-success" />
        Active
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-medium bg-neutral-100 text-neutral-500">
      <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
      Paused
    </span>
  );
};

// ============================================
// PHASE BADGE
// ============================================

const PhaseBadge = ({ phase }: { phase: number }) => {
  return (
    <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-primary-50 text-primary-700 text-[12px] font-semibold">
      Phase {phase}
    </span>
  );
};

// ============================================
// ACTIONS MENU
// ============================================

interface ActionsMenuProps {
  district: PortfolioDistrict;
  onAction: (action: string, district: PortfolioDistrict) => void;
}

const ActionsMenu = ({ district, onAction }: ActionsMenuProps) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const actions = [
    { id: "view", label: "View Portfolio", icon: Eye },
    { id: "toggle-tracking", label: district.trackingStatus === "active" ? "Pause Tracking" : "Resume Tracking", icon: district.trackingStatus === "active" ? Pause : Play },
    { id: "transfer", label: "Transfer District", icon: ArrowRightLeft },
    { id: "logs", label: "View Data Sync Logs", icon: FileText },
    { id: "remove", label: "Remove from My Portfolio", icon: Trash2, danger: true },
  ];

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-md hover:bg-neutral-100 transition-colors"
        aria-label="Actions menu"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <MoreHorizontal className="w-5 h-5 text-neutral-500" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-52 bg-neutral-0 rounded-lg shadow-lg border border-neutral-200 py-1 z-50">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={() => {
                  onAction(action.id, district);
                  setIsOpen(false);
                }}
                className={cn(
                  "flex items-center gap-2 w-full px-4 py-2 text-[14px] text-left transition-colors",
                  action.danger
                    ? "text-error hover:bg-error-light"
                    : "text-neutral-700 hover:bg-neutral-50"
                )}
              >
                <Icon className="w-4 h-4" />
                {action.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ============================================
// DISTRICT TABLE
// ============================================

interface DistrictTableProps {
  districts: PortfolioDistrict[];
  onAction: (action: string, district: PortfolioDistrict) => void;
}

const DistrictTable = ({ districts, onAction }: DistrictTableProps) => {
  if (districts.length === 0) {
    return (
      <div className="text-center py-12 text-neutral-500 border border-neutral-200 rounded-lg">
        <Building2 className="w-12 h-12 mx-auto mb-4 text-neutral-300" />
        <P2>No districts match your filters.</P2>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-neutral-200 rounded-lg">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-neutral-50 border-b border-neutral-200">
            <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wide text-neutral-600">
              District Name
            </th>
            <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wide text-neutral-600">
              State
            </th>
            <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wide text-neutral-600">
              Current Phase
            </th>
            <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wide text-neutral-600">
              Risk Status
            </th>
            <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wide text-neutral-600">
              Tracking Status
            </th>
            <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wide text-neutral-600">
              Assigned DSM
            </th>
            <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wide text-neutral-600">
              Last Updated
            </th>
            <th className="px-4 py-3 text-center text-[12px] font-semibold uppercase tracking-wide text-neutral-600">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {districts.map((district) => (
            <tr
              key={district.id}
              className={cn(
                "border-b border-neutral-100 hover:bg-neutral-50 transition-colors",
                district.trackingStatus === "paused" && "opacity-60"
              )}
            >
              <td className="px-4 py-4">
                <Link 
                  href={`/district/${district.id}`}
                  className="text-[14px] font-medium text-neutral-900 hover:text-primary-500 transition-colors"
                >
                  {district.name}
                </Link>
              </td>
              <td className="px-4 py-4">
                <span className="text-[14px] text-neutral-600">{district.state}</span>
              </td>
              <td className="px-4 py-4">
                <PhaseBadge phase={district.phase} />
              </td>
              <td className="px-4 py-4">
                <RiskStatusBadge status={district.riskStatus} />
              </td>
              <td className="px-4 py-4">
                <TrackingStatusBadge status={district.trackingStatus} />
              </td>
              <td className="px-4 py-4">
                <span className="text-[14px] text-neutral-600">{district.assignedDSM}</span>
              </td>
              <td className="px-4 py-4">
                <span className="text-[13px] text-neutral-500">{district.lastUpdated}</span>
              </td>
              <td className="px-4 py-4 text-center">
                <ActionsMenu district={district} onAction={onAction} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ============================================
// ADD DISTRICT MODAL
// ============================================

interface AddDistrictModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: Partial<PortfolioDistrict>) => void;
}

const AddDistrictModal = ({ isOpen, onClose, onAdd }: AddDistrictModalProps) => {
  const [districtName, setDistrictName] = React.useState("");
  const [state, setState] = React.useState("TX");
  const [assignedDSM, setAssignedDSM] = React.useState("Sarah");
  const [enableA2L, setEnableA2L] = React.useState(true);
  const [trackingStatus, setTrackingStatus] = React.useState<"active" | "paused">("active");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      name: districtName,
      state,
      assignedDSM,
      trackingStatus,
    });
    onClose();
    setDistrictName("");
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-neutral-900/30 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="bg-neutral-0 rounded-xl shadow-xl w-full max-w-md">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-neutral-200">
            <H4 id="modal-title">Add District</H4>
            <button
              onClick={onClose}
              className="p-2 rounded-md hover:bg-neutral-100 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5 text-neutral-500" />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {/* District Name */}
            <div>
              <label className="block text-[13px] font-medium text-neutral-700 mb-1.5">
                District Name
              </label>
              <DSMInput
                type="text"
                value={districtName}
                onChange={(e) => setDistrictName(e.target.value)}
                placeholder="Search or enter district name..."
                required
              />
            </div>

            {/* State */}
            <div>
              <label className="block text-[13px] font-medium text-neutral-700 mb-1.5">
                State
              </label>
              <DSMSelect
                value={state}
                onChange={(e) => setState(e.target.value)}
                options={[
                  { value: "TX", label: "Texas (TX)" },
                  { value: "CA", label: "California (CA)" },
                  { value: "FL", label: "Florida (FL)" },
                  { value: "NY", label: "New York (NY)" },
                ]}
              />
            </div>

            {/* Assigned DSM */}
            <div>
              <label className="block text-[13px] font-medium text-neutral-700 mb-1.5">
                Assigned DSM
              </label>
              <DSMSelect
                value={assignedDSM}
                onChange={(e) => setAssignedDSM(e.target.value)}
                options={[
                  { value: "Sarah", label: "Sarah Mitchell" },
                  { value: "John", label: "John Davis" },
                  { value: "Maria", label: "Maria Garcia" },
                ]}
              />
            </div>

            {/* Enable A2L Toggle */}
            <div className="flex items-center justify-between py-2">
              <span className="text-[14px] text-neutral-700">Enable A2L?</span>
              <button
                type="button"
                role="switch"
                aria-checked={enableA2L}
                onClick={() => setEnableA2L(!enableA2L)}
                className={cn(
                  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                  enableA2L ? "bg-primary-500" : "bg-neutral-300"
                )}
              >
                <span
                  className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-neutral-0 transition-transform",
                    enableA2L ? "translate-x-6" : "translate-x-1"
                  )}
                />
              </button>
            </div>

            {/* Tracking Status */}
            <div>
              <label className="block text-[13px] font-medium text-neutral-700 mb-1.5">
                Tracking Status
              </label>
              <DSMSelect
                value={trackingStatus}
                onChange={(e) => setTrackingStatus(e.target.value as "active" | "paused")}
                options={[
                  { value: "active", label: "Active" },
                  { value: "paused", label: "Paused" },
                ]}
              />
            </div>
          </form>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-4 border-t border-neutral-200">
            <DSMButton variant="secondary" onClick={onClose}>
              Cancel
            </DSMButton>
            <DSMButton variant="primary" onClick={(e) => handleSubmit(e as unknown as React.FormEvent)}>
              Add District
            </DSMButton>
          </div>
        </div>
      </div>
    </>
  );
};

// ============================================
// PAUSE TRACKING MODAL
// ============================================

interface PauseTrackingModalProps {
  isOpen: boolean;
  district: PortfolioDistrict | null;
  onClose: () => void;
  onConfirm: () => void;
}

const PauseTrackingModal = ({ isOpen, district, onClose, onConfirm }: PauseTrackingModalProps) => {
  if (!isOpen || !district) return null;

  const isPaused = district.trackingStatus === "paused";

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-neutral-900/30 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pause-modal-title"
      >
        <div className="bg-neutral-0 rounded-xl shadow-xl w-full max-w-sm">
          {/* Header */}
          <div className="p-4 border-b border-neutral-200">
            <H4 id="pause-modal-title">
              {isPaused ? "Resume Tracking?" : "Pause Tracking?"}
            </H4>
          </div>

          {/* Body */}
          <div className="p-4">
            <P2 className="text-neutral-600">
              {isPaused ? (
                <>
                  Resume tracking for <strong>{district.name}</strong>? This will show the district in your prioritized portfolio view.
                </>
              ) : (
                <>
                  Pause tracking for <strong>{district.name}</strong>? Paused districts remain in your list but are hidden from the prioritized portfolio view.
                </>
              )}
            </P2>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-4 border-t border-neutral-200">
            <DSMButton variant="secondary" onClick={onClose}>
              Cancel
            </DSMButton>
            <DSMButton variant="primary" onClick={onConfirm}>
              {isPaused ? "Resume Tracking" : "Pause Tracking"}
            </DSMButton>
          </div>
        </div>
      </div>
    </>
  );
};

// ============================================
// MAIN DISTRICT LIST COMPONENT
// ============================================

export const DistrictList = () => {
  const [districts, setDistricts] = React.useState(portfolioDistricts);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [trackingFilter, setTrackingFilter] = React.useState("all");
  const [phaseFilter, setPhaseFilter] = React.useState("all");

  // Modals
  const [addModalOpen, setAddModalOpen] = React.useState(false);
  const [pauseModalOpen, setPauseModalOpen] = React.useState(false);
  const [selectedDistrict, setSelectedDistrict] = React.useState<PortfolioDistrict | null>(null);

  // Summary calculations
  const totalDistricts = districts.length;
  const activeDistricts = districts.filter((d) => d.trackingStatus === "active").length;
  const pausedDistricts = districts.filter((d) => d.trackingStatus === "paused").length;

  // Filter districts
  const filteredDistricts = React.useMemo(() => {
    let result = [...districts];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((d) => d.name.toLowerCase().includes(query));
    }

    // Tracking status filter
    if (trackingFilter !== "all") {
      result = result.filter((d) => d.trackingStatus === trackingFilter);
    }

    // Phase filter
    if (phaseFilter !== "all") {
      result = result.filter((d) => d.phase === parseInt(phaseFilter));
    }

    return result;
  }, [districts, searchQuery, trackingFilter, phaseFilter]);

  // Handle actions
  const handleAction = (action: string, district: PortfolioDistrict) => {
    switch (action) {
      case "view":
        window.location.href = `/district/${district.id}`;
        break;
      case "toggle-tracking":
        setSelectedDistrict(district);
        setPauseModalOpen(true);
        break;
      case "transfer":
        // TODO: Implement transfer modal
        break;
      case "logs":
        // TODO: Implement logs view
        break;
      case "remove":
        // TODO: Implement remove confirmation
        break;
    }
  };

  // Handle pause/resume tracking
  const handleToggleTracking = () => {
    if (!selectedDistrict) return;

    setDistricts((prev) =>
      prev.map((d) =>
        d.id === selectedDistrict.id
          ? { ...d, trackingStatus: d.trackingStatus === "active" ? "paused" : "active" }
          : d
      )
    );
    setPauseModalOpen(false);
    setSelectedDistrict(null);
  };

  // Handle add district
  const handleAddDistrict = (data: Partial<PortfolioDistrict>) => {
    const newDistrict: PortfolioDistrict = {
      id: `pd${Date.now()}`,
      name: data.name || "New District",
      state: data.state || "TX",
      phase: 1,
      riskStatus: "green",
      trackingStatus: data.trackingStatus || "active",
      assignedDSM: data.assignedDSM || "Sarah",
      lastUpdated: "Just now",
    };
    setDistricts((prev) => [...prev, newDistrict]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <H2>District Portfolio Management</H2>
        <P3 className="text-neutral-500 mt-1">Manage assigned districts and tracking status</P3>
      </div>

      {/* Summary Cards */}
      <SummaryCards total={totalDistricts} active={activeDistricts} paused={pausedDistricts} />

      {/* Controls Row */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Left: Filters */}
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <DSMInput
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search District"
              className="pl-9"
            />
          </div>

          {/* Tracking Status Filter */}
          <div className="w-full sm:w-auto sm:min-w-[160px]">
            <DSMSelect
              value={trackingFilter}
              onChange={(e) => setTrackingFilter(e.target.value)}
              options={[
                { value: "all", label: "All Tracking Status" },
                { value: "active", label: "Active" },
                { value: "paused", label: "Paused" },
              ]}
            />
          </div>

          {/* Phase Filter */}
          <div className="w-full sm:w-auto sm:min-w-[140px]">
            <DSMSelect
              value={phaseFilter}
              onChange={(e) => setPhaseFilter(e.target.value)}
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
        </div>

        {/* Right: Add Button */}
        <DSMButton variant="primary" onClick={() => setAddModalOpen(true)}>
          <Plus className="w-4 h-4" />
          Add District
        </DSMButton>
      </div>

      {/* Results count */}
      <P4 className="text-neutral-500">
        Showing {filteredDistricts.length} of {totalDistricts} districts
      </P4>

      {/* District Table */}
      <DistrictTable districts={filteredDistricts} onAction={handleAction} />

      {/* Add District Modal */}
      <AddDistrictModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onAdd={handleAddDistrict}
      />

      {/* Pause Tracking Modal */}
      <PauseTrackingModal
        isOpen={pauseModalOpen}
        district={selectedDistrict}
        onClose={() => {
          setPauseModalOpen(false);
          setSelectedDistrict(null);
        }}
        onConfirm={handleToggleTracking}
      />
    </div>
  );
};
