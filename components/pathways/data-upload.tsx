"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  AlertCircle,
  XCircle,
  Upload,
  FileSpreadsheet,
  ChevronRight,
  FileText,
  Lightbulb,
} from "lucide-react";

/* ============================================
   Data Upload Page
   Region 13 CCMR Tracker import
   ============================================ */

// ============================================
// TYPES
// ============================================

interface DataSource {
  name: string;
  status: "current" | "partial" | "outdated";
  records: string;
  lastUpload: string;
  format: string;
}

interface ColumnMapping {
  excelColumn: string;
  pathwaysField: string;
  status: "auto" | "manual";
}

// ============================================
// MOCK DATA
// ============================================

const dataSources: DataSource[] = [
  { name: "CCMR student roster", status: "current", records: "4,847 students", lastUpload: "Oct 15, 2025", format: "Region 13 Excel / CSV" },
  { name: "SAT/ACT scores", status: "partial", records: "2,134 / 4,847", lastUpload: "Sep 1, 2025", format: "CSV from College Board" },
  { name: "CTE enrollment", status: "current", records: "1,456 students", lastUpload: "Oct 15, 2025", format: "SIS export" },
  { name: "IBC certifications earned", status: "partial", records: "312 earned", lastUpload: "Mar 1, 2026", format: "Manual / CSV" },
  { name: "Dual credit transcripts", status: "current", records: "834 students", lastUpload: "Oct 15, 2025", format: "CSV" },
  { name: "TSIA scores", status: "outdated", records: "890 results", lastUpload: "Aug 2025", format: "TEA file" },
];

const columnMappings: ColumnMapping[] = [
  { excelColumn: "Last Name", pathwaysField: "Last Name", status: "auto" },
  { excelColumn: "First Name", pathwaysField: "First Name", status: "auto" },
  { excelColumn: "TSDS #", pathwaysField: "Student ID (TSDS)", status: "auto" },
  { excelColumn: "TSI RDG", pathwaysField: "TSI Reading Met", status: "auto" },
  { excelColumn: "TSI Math", pathwaysField: "TSI Math Met", status: "auto" },
  { excelColumn: "AP 3+", pathwaysField: "AP Exam 3+", status: "auto" },
  { excelColumn: "Earn Industry Based Certification", pathwaysField: "IBC Earned", status: "auto" },
  { excelColumn: "Dual Credit 3 hr - ELA", pathwaysField: "Dual Credit ELA", status: "auto" },
  { excelColumn: "Enlist in the Military", pathwaysField: "Military Enlistment", status: "manual" },
];

// ============================================
// DATA SOURCES TABLE
// ============================================

const DataSourcesTable = () => {
  return (
    <div className="bg-neutral-0 border border-neutral-200 rounded-lg overflow-hidden">
      <div className="p-6 border-b border-neutral-200">
        <h2 className="text-[18px] font-semibold text-neutral-900">Data sources</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-200">
              <th className="px-4 py-3 text-left text-[12px] font-semibold text-neutral-700">Data source</th>
              <th className="px-4 py-3 text-left text-[12px] font-semibold text-neutral-700">Status</th>
              <th className="px-4 py-3 text-left text-[12px] font-semibold text-neutral-700">Records</th>
              <th className="px-4 py-3 text-left text-[12px] font-semibold text-neutral-700">Last upload</th>
              <th className="px-4 py-3 text-left text-[12px] font-semibold text-neutral-700">Format</th>
            </tr>
          </thead>
          <tbody>
            {dataSources.map((source, idx) => (
              <tr key={idx} className="border-b border-neutral-100 last:border-0">
                <td className="px-4 py-3 text-[13px] font-medium text-neutral-900">{source.name}</td>
                <td className="px-4 py-3">
                  <span className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-1 text-[12px] font-medium rounded-full",
                    source.status === "current" && "bg-teal-100 text-teal-700",
                    source.status === "partial" && "bg-warning-light text-warning-dark",
                    source.status === "outdated" && "bg-error-light text-error-dark"
                  )}>
                    {source.status === "current" && <CheckCircle2 className="w-3.5 h-3.5" />}
                    {source.status === "partial" && <AlertCircle className="w-3.5 h-3.5" />}
                    {source.status === "outdated" && <XCircle className="w-3.5 h-3.5" />}
                    {source.status === "current" && "Current"}
                    {source.status === "partial" && "Partial"}
                    {source.status === "outdated" && "Outdated"}
                  </span>
                </td>
                <td className="px-4 py-3 text-[13px] text-neutral-700">{source.records}</td>
                <td className="px-4 py-3 text-[13px] text-neutral-700">{source.lastUpload}</td>
                <td className="px-4 py-3 text-[13px] text-neutral-500">{source.format}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ============================================
// UPLOAD ZONE
// ============================================

interface UploadZoneProps {
  onFileSelect: () => void;
}

const UploadZone = ({ onFileSelect }: UploadZoneProps) => {
  const [isDragOver, setIsDragOver] = React.useState(false);

  return (
    <div className="bg-neutral-0 border border-neutral-200 rounded-lg p-6">
      {/* Drag-drop area */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragOver(false); onFileSelect(); }}
        onClick={onFileSelect}
        className={cn(
          "border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors",
          isDragOver ? "border-teal-500 bg-teal-50" : "border-neutral-300 hover:border-neutral-400 hover:bg-neutral-50"
        )}
      >
        <Upload className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
        <p className="text-[16px] font-medium text-neutral-900 mb-2">
          Drop your file here, or click to browse
        </p>
        <p className="text-[13px] text-neutral-500">
          Supported: .xlsx (Region 13 CCMR Tracker), .csv, .tsv
        </p>
      </div>

      {/* Quick-upload shortcut cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        <button 
          onClick={onFileSelect}
          className="flex items-start gap-3 p-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors text-left"
        >
          <FileSpreadsheet className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-[14px] font-medium text-neutral-900">Upload Region 13 CCMR Tracker</p>
            <p className="text-[12px] text-neutral-500 mt-1">
              We&apos;ll auto-detect the class year tabs and parse indicator columns
            </p>
          </div>
        </button>
        <button 
          onClick={onFileSelect}
          className="flex items-start gap-3 p-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors text-left"
        >
          <FileText className="w-5 h-5 text-primary-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-[14px] font-medium text-neutral-900">Upload TEA CCMR Tracker</p>
            <p className="text-[12px] text-neutral-500 mt-1">
              Official TEA Part I or Part II tracker file
            </p>
          </div>
        </button>
        <button 
          onClick={onFileSelect}
          className="flex items-start gap-3 p-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors text-left"
        >
          <FileSpreadsheet className="w-5 h-5 text-neutral-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-[14px] font-medium text-neutral-900">Upload SAT/ACT scores</p>
            <p className="text-[12px] text-neutral-500 mt-1">
              College Board or ACT CSV export
            </p>
          </div>
        </button>
        <button 
          onClick={onFileSelect}
          className="flex items-start gap-3 p-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors text-left"
        >
          <FileText className="w-5 h-5 text-neutral-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-[14px] font-medium text-neutral-900">Upload TSIA results</p>
            <p className="text-[12px] text-neutral-500 mt-1">
              TEA TSIA results file
            </p>
          </div>
        </button>
        <button 
          onClick={onFileSelect}
          className="flex items-start gap-3 p-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors text-left"
        >
          <FileSpreadsheet className="w-5 h-5 text-neutral-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-[14px] font-medium text-neutral-900">Upload CTE/IBC data</p>
            <p className="text-[12px] text-neutral-500 mt-1">
              CTE enrollment and certification records
            </p>
          </div>
        </button>
      </div>
    </div>
  );
};

// ============================================
// COLUMN MAPPER
// ============================================

const ColumnMapper = () => {
  return (
    <div className="bg-neutral-0 border border-neutral-200 rounded-lg overflow-hidden">
      {/* File detection banner */}
      <div className="p-4 bg-teal-50 border-b border-teal-100">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[14px] font-semibold text-teal-700">
              File detected: Region-13-CCMR-Tracker-2025-2026.xlsx
            </p>
            <p className="text-[13px] text-teal-600 mt-1">
              Sheet detected: CCMR for Seniors 2026 — 342 student rows found
            </p>
            <p className="text-[13px] text-teal-600">
              8 of 9 columns auto-detected
            </p>
          </div>
        </div>
      </div>

      {/* Column mapping table */}
      <div className="p-6 border-b border-neutral-200">
        <h3 className="text-[16px] font-semibold text-neutral-900 mb-4">Column mapping</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200">
                <th className="px-4 py-3 text-left text-[12px] font-semibold text-neutral-700">Your Excel column</th>
                <th className="px-4 py-3 text-left text-[12px] font-semibold text-neutral-700">Summit Pathways field</th>
                <th className="px-4 py-3 text-left text-[12px] font-semibold text-neutral-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {columnMappings.map((mapping, idx) => (
                <tr key={idx} className="border-b border-neutral-100 last:border-0">
                  <td className="px-4 py-3 text-[13px] font-medium text-neutral-900">{mapping.excelColumn}</td>
                  <td className="px-4 py-3">
                    <select className="px-3 py-1.5 text-[13px] border border-neutral-200 rounded-md bg-neutral-0 text-neutral-700">
                      <option>{mapping.pathwaysField}</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    {mapping.status === "auto" ? (
                      <span className="inline-flex items-center gap-1 text-[12px] font-medium text-teal-600">
                        <CheckCircle2 className="w-4 h-4" />
                        Auto-detected
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[12px] font-medium text-warning-dark">
                        <AlertCircle className="w-4 h-4" />
                        Manual
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Continue button */}
      <div className="p-4 bg-neutral-50 flex justify-end">
        <button className="px-5 py-2.5 bg-teal-600 text-neutral-0 text-[14px] font-medium rounded-md hover:bg-teal-700 transition-colors flex items-center gap-2">
          Continue to review
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// ============================================
// WHAT'S MISSING CARD
// ============================================

const WhatsMissingCard = () => {
  return (
    <div className="bg-neutral-0 border border-neutral-200 rounded-lg p-6">
      <div className="flex items-start gap-3 mb-4">
        <Lightbulb className="w-5 h-5 text-warning-dark flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="text-[16px] font-semibold text-neutral-900">What&apos;s missing</h3>
          <p className="text-[13px] text-neutral-600 mt-1">
            To unlock the full intervention planner, upload these additional data sources:
          </p>
        </div>
      </div>

      <div className="space-y-3 ml-8">
        <div className="flex items-start gap-3 p-3 bg-warning-light/50 rounded-lg">
          <span className="w-2 h-2 mt-1.5 bg-warning-dark rounded-full flex-shrink-0" />
          <div>
            <p className="text-[13px] font-medium text-neutral-900">CTE course enrollment with certification alignment</p>
            <p className="text-[12px] text-neutral-600">Enables IBC exam scheduling recommendations</p>
          </div>
        </div>
        <div className="flex items-start gap-3 p-3 bg-warning-light/50 rounded-lg">
          <span className="w-2 h-2 mt-1.5 bg-warning-dark rounded-full flex-shrink-0" />
          <div>
            <p className="text-[13px] font-medium text-neutral-900">Current semester grades for college prep courses</p>
            <p className="text-[12px] text-neutral-600">Enables at-risk-of-failing alerts</p>
          </div>
        </div>
        <div className="flex items-start gap-3 p-3 bg-warning-light/50 rounded-lg">
          <span className="w-2 h-2 mt-1.5 bg-warning-dark rounded-full flex-shrink-0" />
          <div>
            <p className="text-[13px] font-medium text-neutral-900">SAT/ACT score details (not just met/not met)</p>
            <p className="text-[12px] text-neutral-600">Enables &quot;close to threshold&quot; identification</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// MAIN DATA UPLOAD PAGE
// ============================================

export const DataUploadPage = () => {
  const [showColumnMapper, setShowColumnMapper] = React.useState(false);

  return (
    <div className="space-y-6">
      {/* Data Sources Table */}
      <DataSourcesTable />

      {/* Upload Zone */}
      <UploadZone onFileSelect={() => setShowColumnMapper(true)} />

      {/* Column Mapper (shown after file upload) */}
      {showColumnMapper && <ColumnMapper />}

      {/* What's Missing */}
      <WhatsMissingCard />
    </div>
  );
};

export default DataUploadPage;
