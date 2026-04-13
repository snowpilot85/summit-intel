"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { 
  Upload,
  CheckCircle2,
  AlertCircle,
  XCircle,
  FileSpreadsheet,
  Users,
  BarChart3,
  FileText,
  ChevronDown,
  Check,
  ArrowRight,
  Calendar,
  Clock,
} from "lucide-react";

/* ============================================
   Data Upload Page
   Summit Intel - Data Import Wizard
   ============================================ */

// ============================================
// TYPES
// ============================================

type DataStatus = "complete" | "partial" | "missing";

interface DataSource {
  name: string;
  status: DataStatus;
  percentage?: number;
  records: string;
  lastUpload: string;
  impact: string;
}

interface UploadCard {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: DataStatus;
}

interface ColumnMapping {
  csvColumn: string;
  intelField: string;
  autoDetected: boolean;
}

// ============================================
// MOCK DATA
// ============================================

const dataSources: DataSource[] = [
  {
    name: "SIS Student Roster",
    status: "complete",
    percentage: 100,
    records: "11,705 students",
    lastUpload: "Oct 1, 2025",
    impact: "Required for all features",
  },
  {
    name: "TELPAS Scores",
    status: "complete",
    percentage: 98,
    records: "11,471 / 11,705",
    lastUpload: "Sep 15, 2025",
    impact: "Drives PLP #1 + reclassification",
  },
  {
    name: "Home Language Survey",
    status: "complete",
    percentage: 96,
    records: "11,237 / 11,705",
    lastUpload: "Oct 1, 2025",
    impact: "Required for EB identification",
  },
  {
    name: "Demographics",
    status: "partial",
    percentage: 74,
    records: "8,662 / 11,705",
    lastUpload: "Aug 20, 2025",
    impact: "PEIMS coding + Years in US calc",
  },
  {
    name: "STAAR Reading",
    status: "missing",
    percentage: 41,
    records: "4,799 / 11,705",
    lastUpload: "Never uploaded",
    impact: "Reclassification eligibility",
  },
  {
    name: "Parent Notifications",
    status: "partial",
    percentage: 68,
    records: "7,960 / 11,705",
    lastUpload: "Sep 30, 2025",
    impact: "Compliance documentation",
  },
];

const uploadCards: UploadCard[] = [
  {
    id: "telpas",
    title: "Upload TELPAS scores",
    description: "Match your TELPAS export to auto-populate domain scores",
    icon: <BarChart3 className="w-5 h-5" />,
    status: "complete",
  },
  {
    id: "staar",
    title: "Upload STAAR results",
    description: "Enables reclassification eligibility checks",
    icon: <FileText className="w-5 h-5" />,
    status: "missing",
  },
  {
    id: "demographics",
    title: "Upload demographics",
    description: "Completes PEIMS coding and Years in US calculations",
    icon: <Users className="w-5 h-5" />,
    status: "partial",
  },
  {
    id: "roster",
    title: "Upload roster update",
    description: "Sync new enrollments and withdrawals",
    icon: <FileSpreadsheet className="w-5 h-5" />,
    status: "complete",
  },
];

const mockColumnMappings: ColumnMapping[] = [
  { csvColumn: "StudentID", intelField: "Local Student ID", autoDetected: true },
  { csvColumn: "LastName", intelField: "Last Name", autoDetected: true },
  { csvColumn: "FirstName", intelField: "First Name", autoDetected: true },
  { csvColumn: "ListeningLevel", intelField: "Listening Score", autoDetected: true },
  { csvColumn: "SpeakingLevel", intelField: "Speaking Score", autoDetected: true },
  { csvColumn: "ReadingLevel", intelField: "Reading Score", autoDetected: true },
  { csvColumn: "WritingLevel", intelField: "Writing Score", autoDetected: true },
  { csvColumn: "CompositeLevel", intelField: "Composite Score", autoDetected: true },
  { csvColumn: "TestDate", intelField: "Assessment Date", autoDetected: false },
];

const intelFields = [
  "Local Student ID",
  "State Student ID",
  "First Name",
  "Last Name",
  "Middle Name",
  "Listening Score",
  "Speaking Score",
  "Reading Score",
  "Writing Score",
  "Composite Score",
  "Assessment Date",
  "Grade Level",
  "School Name",
  "Skip this column",
];

// ============================================
// STATUS BADGE
// ============================================

const StatusBadge = ({ status, percentage }: { status: DataStatus; percentage?: number }) => {
  const config = {
    complete: {
      bg: "bg-teal-100",
      text: "text-teal-700",
      icon: <CheckCircle2 className="w-4 h-4" />,
      label: percentage ? `${percentage}%` : "Complete",
    },
    partial: {
      bg: "bg-warning-light",
      text: "text-warning-dark",
      icon: <AlertCircle className="w-4 h-4" />,
      label: `${percentage}%`,
    },
    missing: {
      bg: "bg-error-light",
      text: "text-error-dark",
      icon: <XCircle className="w-4 h-4" />,
      label: `${percentage}%`,
    },
  };

  const { bg, text, icon, label } = config[status];

  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[12px] font-medium", bg, text)}>
      {icon}
      {label}
    </span>
  );
};

// ============================================
// DATA COMPLETENESS TABLE
// ============================================

const DataCompletenessTable = () => {
  return (
    <div className="bg-neutral-0 border border-neutral-200 rounded-lg overflow-hidden">
      <div className="p-5 border-b border-neutral-200">
        <h3 className="text-[16px] font-semibold text-neutral-900">Data Completeness</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50">
              <th className="px-5 py-3 text-left text-[12px] font-semibold text-neutral-600 uppercase tracking-wide">
                Data Source
              </th>
              <th className="px-5 py-3 text-left text-[12px] font-semibold text-neutral-600 uppercase tracking-wide">
                Status
              </th>
              <th className="px-5 py-3 text-left text-[12px] font-semibold text-neutral-600 uppercase tracking-wide">
                Records
              </th>
              <th className="px-5 py-3 text-left text-[12px] font-semibold text-neutral-600 uppercase tracking-wide">
                Last Upload
              </th>
              <th className="px-5 py-3 text-left text-[12px] font-semibold text-neutral-600 uppercase tracking-wide">
                Impact
              </th>
            </tr>
          </thead>
          <tbody>
            {dataSources.map((source, idx) => (
              <tr key={idx} className="border-b border-neutral-100 last:border-0">
                <td className="px-5 py-4 text-[14px] font-medium text-neutral-900">{source.name}</td>
                <td className="px-5 py-4">
                  <StatusBadge status={source.status} percentage={source.percentage} />
                </td>
                <td className="px-5 py-4 text-[13px] text-neutral-700">{source.records}</td>
                <td className="px-5 py-4 text-[13px] text-neutral-500">{source.lastUpload}</td>
                <td className="px-5 py-4 text-[13px] text-neutral-600">{source.impact}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ============================================
// DROP ZONE
// ============================================

interface DropZoneProps {
  onFileSelect: (file: File) => void;
}

const DropZone = ({ onFileSelect }: DropZoneProps) => {
  const [isDragging, setIsDragging] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelect(file);
  };

  return (
    <div
      onClick={handleClick}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={cn(
        "border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors",
        isDragging
          ? "border-primary-500 bg-primary-50"
          : "border-neutral-300 hover:border-neutral-400 bg-neutral-0"
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xlsx,.tsv"
        onChange={handleInputChange}
        className="hidden"
      />
      <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Upload className="w-6 h-6 text-neutral-500" />
      </div>
      <p className="text-[16px] font-medium text-neutral-900 mb-1">
        Drop your file here, or click to browse
      </p>
      <p className="text-[13px] text-neutral-500">
        Supported: .csv, .xlsx, .tsv
      </p>
    </div>
  );
};

// ============================================
// QUICK UPLOAD CARDS
// ============================================

interface QuickUploadCardsProps {
  onCardClick: (id: string) => void;
}

const QuickUploadCards = ({ onCardClick }: QuickUploadCardsProps) => {
  const getBorderColor = (status: DataStatus) => {
    switch (status) {
      case "complete":
        return "border-l-teal-500";
      case "partial":
        return "border-l-warning";
      case "missing":
        return "border-l-error";
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {uploadCards.map((card) => (
        <button
          key={card.id}
          onClick={() => onCardClick(card.id)}
          className={cn(
            "text-left p-4 bg-neutral-0 border border-neutral-200 rounded-lg border-l-4 hover:border-neutral-300 hover:shadow-sm transition-all",
            getBorderColor(card.status)
          )}
        >
          <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center text-neutral-600 mb-3">
            {card.icon}
          </div>
          <h4 className="text-[14px] font-medium text-neutral-900 mb-1">{card.title}</h4>
          <p className="text-[12px] text-neutral-500">{card.description}</p>
        </button>
      ))}
    </div>
  );
};

// ============================================
// UNLOCK CARDS
// ============================================

const UnlockCards = () => {
  const cards = [
    {
      title: "PLPs unblocked",
      value: 858,
      description: "Upload STAAR + demographics to generate PLPs for these students",
      subtext: "Their teachers are waiting for instructional recommendations",
      color: "text-primary-600",
    },
    {
      title: "PEIMS codes completed",
      value: 421,
      description: "Upload demographics to auto-generate remaining TEDS codes",
      subtext: "Fall snapshot deadline: 18 days",
      color: "text-warning-dark",
    },
    {
      title: "Reclassification unlocked",
      value: 234,
      description: "Upload STAAR reading scores to check reclassification eligibility",
      subtext: "These students may be ready to exit the program",
      color: "text-teal-600",
    },
  ];

  return (
    <div className="bg-neutral-0 border border-neutral-200 rounded-lg p-6">
      <h3 className="text-[16px] font-semibold text-neutral-900 mb-5">What uploading unlocks</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card, idx) => (
          <div key={idx} className="space-y-2">
            <p className="text-[13px] font-medium text-neutral-500">{card.title}</p>
            <p className={cn("text-[36px] font-semibold leading-none", card.color)}>
              {card.value.toLocaleString()}
            </p>
            <p className="text-[13px] text-neutral-700">{card.description}</p>
            <p className="text-[12px] text-neutral-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {card.subtext}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================
// COLUMN MAPPING WIZARD (Step 2)
// ============================================

interface ColumnMappingWizardProps {
  fileName: string;
  onBack: () => void;
  onContinue: () => void;
}

const ColumnMappingWizard = ({ fileName, onBack, onContinue }: ColumnMappingWizardProps) => {
  const [mappings, setMappings] = React.useState<ColumnMapping[]>(mockColumnMappings);

  const handleFieldChange = (index: number, newField: string) => {
    const updated = [...mappings];
    updated[index] = { ...updated[index], intelField: newField, autoDetected: false };
    setMappings(updated);
  };

  const autoDetectedCount = mappings.filter((m) => m.autoDetected).length;

  return (
    <div className="bg-neutral-0 border border-neutral-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-neutral-200 bg-neutral-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[16px] font-semibold text-neutral-900">Map Columns</h3>
            <p className="text-[13px] text-neutral-500 mt-1">
              File: <span className="font-medium text-neutral-700">{fileName}</span> — 11,471 rows detected
            </p>
          </div>
          <div className="flex items-center gap-2 text-[13px] text-teal-600">
            <CheckCircle2 className="w-4 h-4" />
            {autoDetectedCount} of {mappings.length} auto-detected
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-3 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-teal-500 text-neutral-0 text-[12px] font-semibold flex items-center justify-center">
              <Check className="w-4 h-4" />
            </div>
            <span className="text-[13px] text-neutral-600">File detected</span>
          </div>
          <div className="w-8 h-px bg-neutral-300" />
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-primary-500 text-neutral-0 text-[12px] font-semibold flex items-center justify-center">
              2
            </div>
            <span className="text-[13px] font-medium text-neutral-900">Map columns</span>
          </div>
          <div className="w-8 h-px bg-neutral-300" />
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-neutral-200 text-neutral-500 text-[12px] font-semibold flex items-center justify-center">
              3
            </div>
            <span className="text-[13px] text-neutral-500">Review & confirm</span>
          </div>
          <div className="w-8 h-px bg-neutral-300" />
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-neutral-200 text-neutral-500 text-[12px] font-semibold flex items-center justify-center">
              4
            </div>
            <span className="text-[13px] text-neutral-500">Complete</span>
          </div>
        </div>
      </div>

      {/* Mapping table */}
      <div className="p-5">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-200">
              <th className="pb-3 text-left text-[12px] font-semibold text-neutral-600 uppercase tracking-wide">
                Your CSV Column
              </th>
              <th className="pb-3 text-center w-12">
                <ArrowRight className="w-4 h-4 text-neutral-400 mx-auto" />
              </th>
              <th className="pb-3 text-left text-[12px] font-semibold text-neutral-600 uppercase tracking-wide">
                Summit Intel Field
              </th>
              <th className="pb-3 text-left text-[12px] font-semibold text-neutral-600 uppercase tracking-wide w-24">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {mappings.map((mapping, idx) => (
              <tr key={idx} className="border-b border-neutral-100">
                <td className="py-3">
                  <code className="px-2 py-1 bg-neutral-100 rounded text-[13px] text-neutral-700">
                    {mapping.csvColumn}
                  </code>
                </td>
                <td className="py-3 text-center">
                  <ArrowRight className="w-4 h-4 text-neutral-400 mx-auto" />
                </td>
                <td className="py-3">
                  <div className="relative max-w-xs">
                    <select
                      value={mapping.intelField}
                      onChange={(e) => handleFieldChange(idx, e.target.value)}
                      className={cn(
                        "w-full appearance-none bg-neutral-0 border rounded-md pl-3 pr-8 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent",
                        mapping.autoDetected
                          ? "border-teal-300 bg-teal-50"
                          : "border-neutral-200"
                      )}
                    >
                      {intelFields.map((field) => (
                        <option key={field} value={field}>
                          {field}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                  </div>
                </td>
                <td className="py-3">
                  {mapping.autoDetected ? (
                    <span className="inline-flex items-center gap-1 text-[12px] text-teal-600 font-medium">
                      <Check className="w-4 h-4" />
                      Auto-detected
                    </span>
                  ) : (
                    <span className="text-[12px] text-neutral-500">Manual</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="p-5 border-t border-neutral-200 bg-neutral-50 flex items-center justify-between">
        <button
          onClick={onBack}
          className="px-4 py-2 text-[14px] font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
        >
          Back
        </button>
        <button
          onClick={onContinue}
          className="px-6 py-2.5 bg-primary-500 text-neutral-0 text-[14px] font-medium rounded-md hover:bg-primary-600 transition-colors flex items-center gap-2"
        >
          Continue to Review
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// ============================================
// MAIN DATA UPLOAD PAGE
// ============================================

export const DataUpload = () => {
  const [showWizard, setShowWizard] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState<string | null>(null);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file.name);
    setShowWizard(true);
  };

  const handleQuickUpload = (id: string) => {
    // Simulate selecting a TELPAS file
    setSelectedFile("edinburg_telpas_2025.csv");
    setShowWizard(true);
  };

  const handleBack = () => {
    setShowWizard(false);
    setSelectedFile(null);
  };

  const handleContinue = () => {
    // Would go to step 3
    alert("Continuing to Review & Confirm step...");
  };

  return (
    <div className="space-y-6">
      {/* Data Completeness Table */}
      <DataCompletenessTable />

      {showWizard ? (
        /* Column Mapping Wizard */
        <ColumnMappingWizard
          fileName={selectedFile || ""}
          onBack={handleBack}
          onContinue={handleContinue}
        />
      ) : (
        <>
          {/* Drop Zone */}
          <DropZone onFileSelect={handleFileSelect} />

          {/* Quick Upload Cards */}
          <QuickUploadCards onCardClick={handleQuickUpload} />
        </>
      )}

      {/* What Uploading Unlocks */}
      <UnlockCards />
    </div>
  );
};
