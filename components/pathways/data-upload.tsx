"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  AlertCircle,
  XCircle,
  Upload,
  FileSpreadsheet,
  FileText,
  Clock,
  Loader2,
  X,
  ArrowRight,
} from "lucide-react";
import {
  importRows,
  importSatScores,
  type ParsedStudentRow,
  type ImportResult,
  type SatImportResult,
} from "@/app/pathways/data-upload/actions";
import type { DataUploadRow, IndicatorType, UploadSourceType } from "@/types/database";

/* ============================================
   Data Upload Page — Region 13 CCMR Tracker
   ============================================ */

// ============================================
// REGION 13 COLUMN MAP
// ============================================

// Strips everything except lowercase letters and digits — used for fuzzy header matching
function normalizeHeader(h: string): string {
  return h.toLowerCase().replace(/[^a-z0-9]/g, "");
}

type DemographicField =
  | "grade"
  | "campus"
  | "graduation_year"
  | "is_eb"
  | "is_econ_disadvantaged"
  | "is_special_ed"
  | "is_504"
  | "ed_form_collected"
  | "cte_pathway"
  | "cte_certification"
  | "cte_exam_date";

type MappedFieldValue =
  | IndicatorType
  | "last_name"
  | "first_name"
  | "tsds_id"
  | DemographicField
  | "skip"
  | null;

/**
 * Fuzzy lookup table: normalised header fragment → DB field.
 * Entries are checked in order; first match wins.
 */
const FUZZY_HEADER_MAP: [string, MappedFieldValue][] = [
  // ── Identity ──────────────────────────────────────────────────────────────
  ["tsdsid",                   "tsds_id"],
  ["tsds",                     "tsds_id"],        // "TSDS ID", "TSDS #", "TSDS Number"
  ["lastname",                 "last_name"],
  ["firstname",                "first_name"],
  // ── Demographics ──────────────────────────────────────────────────────────
  ["gradelevel",               "grade"],
  ["grade",                    "grade"],
  ["graduationyear",           "graduation_year"],
  ["gradyear",                 "graduation_year"],
  ["classof",                  "graduation_year"],
  ["campus",                   "campus"],
  ["school",                   "campus"],
  ["iseb",                     "is_eb"],
  ["englishlearner",           "is_eb"],
  ["isecondisadvantaged",      "is_econ_disadvantaged"],
  ["econdisadvantaged",        "is_econ_disadvantaged"],
  ["economicdisadvantaged",    "is_econ_disadvantaged"],
  ["isspecialed",              "is_special_ed"],
  ["specialed",                "is_special_ed"],
  ["sped",                     "is_special_ed"],
  ["is504",                    "is_504"],
  ["504",                      "is_504"],
  ["edformcollected",          "ed_form_collected"],
  ["edform",                   "ed_form_collected"],
  ["ctepathway",               "cte_pathway"],
  ["ctecertification",         "cte_certification"],
  ["ctecert",                  "cte_certification"],
  ["cteexamdate",              "cte_exam_date"],
  // ── CCMR Indicators ────────────────────────────────────────────────────────
  ["tsirdg",                   "tsi_reading"],
  ["tsireading",               "tsi_reading"],
  ["tsimath",                  "tsi_math"],
  ["satrdg",                   "sat_reading"],
  ["satreading",               "sat_reading"],
  ["satmath",                  "sat_math"],
  ["actrdg",                   "act_reading"],
  ["actreading",               "act_reading"],
  ["actmath",                  "act_math"],
  ["collegeprepela",           "college_prep_ela"],
  ["collegeprepmath",          "college_prep_math"],
  ["apexam",                   "ap_exam"],
  ["ap3",                      "ap_exam"],          // "AP 3+", "AP Exam 3+"
  ["ibexam",                   "ib_exam"],
  ["ib4",                      "ib_exam"],          // "IB 4+", "IB Exam 4+"
  ["dualcreditela",            "dual_credit_ela"],
  ["dualcredit3hrela",         "dual_credit_ela"],
  ["dualcreditmath",           "dual_credit_math"],
  ["dualcredit3hrmath",        "dual_credit_math"],
  ["dualcredit9hr",            "dual_credit_any"],  // "Dual Credit 9hr", "Dual Credit 9hr Any"
  ["onramps",                  "onramps"],
  ["ibcearned",                "ibc"],
  ["ibc",                      "ibc"],
  ["earnindustrybased",        "ibc"],
  ["associatedegree",          "associate_degree"],
  ["leveliiicertificate",      "level_i_ii_certificate"],
  ["leveli",                   "level_i_ii_certificate"],
  ["militaryenlistment",       "military_enlistment"],
  ["enlistmilitary",           "military_enlistment"],
  ["enlistinthemilitary",      "military_enlistment"],
  ["iepcompletion",            "iep_completion"],
  ["iep",                      "iep_completion"],
  ["spedadvanceddegree",       "sped_advanced_degree"],
  ["advanceddegree",           "sped_advanced_degree"],
];

/** Returns the DB field for a CSV header, or null if not recognised. */
function autoDetectField(header: string): MappedFieldValue | null {
  const n = normalizeHeader(header);
  for (const [pattern, field] of FUZZY_HEADER_MAP) {
    if (n === pattern || n.startsWith(pattern) || n.endsWith(pattern)) {
      return field;
    }
  }
  return null;
}

// Region 13 format is detected by the presence of any of these normalised keys
const REGION13_DETECTION_NORMALIZED = [
  normalizeHeader("TSI RDG"),
  normalizeHeader("Earn Industry Based Certification"),
  normalizeHeader("TSDS #"),
];

const INDICATOR_DISPLAY: Record<IndicatorType, string> = {
  tsi_reading: "TSI Reading Met",
  tsi_math: "TSI Math Met",
  sat_reading: "SAT Reading Met",
  sat_math: "SAT Math Met",
  act_reading: "ACT Reading Met",
  act_math: "ACT Math Met",
  college_prep_ela: "College Prep ELA",
  college_prep_math: "College Prep Math",
  ap_exam: "AP Exam 3+",
  ib_exam: "IB Exam 4+",
  dual_credit_ela: "Dual Credit ELA",
  dual_credit_math: "Dual Credit Math",
  dual_credit_any: "Dual Credit 9hr",
  onramps: "OnRamps",
  ibc: "IBC Earned",
  associate_degree: "Associate Degree",
  level_i_ii_certificate: "Level I/II Certificate",
  military_enlistment: "Military Enlistment",
  iep_completion: "IEP Completion",
  sped_advanced_degree: "SpEd Advanced Degree",
};

const ALL_INDICATOR_TYPES = Object.keys(INDICATOR_DISPLAY) as IndicatorType[];

// ============================================
// PARSED FILE STATE
// ============================================

interface DetectedColumn {
  header: string;
  mappedField: MappedFieldValue;
  autoDetected: boolean;
  sampleValues: string[];
}

interface DetectedFile {
  fileName: string;
  sheetName: string | null;
  rowCount: number;
  isRegion13: boolean;
  sourceType: UploadSourceType;
  columns: DetectedColumn[];
  rawRows: Record<string, string>[];
}

// ============================================
// HELPERS
// ============================================

function isMet(val: string | undefined): boolean {
  if (!val) return false;
  const v = val.trim().toLowerCase();
  return v === "x" || v === "1" || v === "yes" || v === "true" || v === "✓" || v === "y";
}

function formatDate(isoStr: string): string {
  return new Date(isoStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function sourceTypeLabel(st: UploadSourceType): string {
  const labels: Record<UploadSourceType, string> = {
    region_13_tracker: "Region 13 Tracker",
    tea_ccmr_tracker: "TEA CCMR Tracker",
    sat_scores: "SAT Scores",
    act_scores: "ACT Scores",
    tsia_results: "TSIA Results",
    peims_fall_snapshot: "PEIMS Fall Snapshot",
    peims_summer_submission: "PEIMS Summer Submission",
    trex_transcript: "TREx Transcript",
    dual_credit_transcript: "Dual Credit",
    // Legacy
    sat_act_scores: "SAT/ACT Scores",
    cte_ibc_data: "CTE/IBC Data",
    dual_credit_transcripts: "Dual Credit",
    custom_csv: "Custom CSV",
  };
  return labels[st] ?? st;
}

function daysSince(isoStr: string): number {
  return Math.floor((Date.now() - new Date(isoStr).getTime()) / 86_400_000);
}

// ============================================
// CLIENT-SIDE PARSING
// ============================================

async function parseXlsx(
  buffer: ArrayBuffer,
  fileName: string
): Promise<DetectedFile> {
  const XLSX = await import("xlsx");
  const wb = XLSX.read(buffer, { type: "array" });

  // Find the most relevant sheet — prefer one with "senior" or "2026" in name
  const sheetName =
    wb.SheetNames.find(
      (n) => /senior|2026|ccmr/i.test(n)
    ) ?? wb.SheetNames[0];

  const ws = wb.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, string>>(ws, {
    defval: "",
    raw: false,
  });

  return buildDetectedFile(fileName, sheetName, rawRows);
}

async function parseCsv(text: string, fileName: string): Promise<DetectedFile> {
  const Papa = await import("papaparse");
  const result = Papa.default.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });
  return buildDetectedFile(fileName, null, result.data);
}

function buildDetectedFile(
  fileName: string,
  sheetName: string | null,
  rawRows: Record<string, string>[]
): DetectedFile {
  const headers = rawRows.length > 0 ? Object.keys(rawRows[0]) : [];
  const isRegion13 = REGION13_DETECTION_NORMALIZED.some((pattern) =>
    headers.some((h) => normalizeHeader(h) === pattern)
  );

  const columns: DetectedColumn[] = headers.map((header) => {
    const trimmed = header.trim();
    const sampleValues = rawRows
      .slice(0, 5)
      .map((r) => String(r[header] ?? "").trim())
      .filter(Boolean);

    const detected = autoDetectField(trimmed);
    return {
      header: trimmed,
      mappedField: detected,
      autoDetected: detected !== null,
      sampleValues,
    };
  });

  return {
    fileName,
    sheetName,
    rowCount: rawRows.length,
    isRegion13,
    sourceType: isRegion13 ? "region_13_tracker" : "custom_csv",
    columns,
    rawRows,
  };
}

const BOOLEAN_FIELDS = new Set<MappedFieldValue>([
  "is_eb", "is_econ_disadvantaged", "is_special_ed", "is_504", "ed_form_collected",
]);

function buildParsedRows(
  detected: DetectedFile,
  columnOverrides: Record<string, MappedFieldValue>
): ParsedStudentRow[] {
  const effectiveMapping = new Map<string, MappedFieldValue>();
  for (const col of detected.columns) {
    effectiveMapping.set(col.header, columnOverrides[col.header] ?? col.mappedField);
  }

  return detected.rawRows
    .map((row) => {
      let tsdsId = "";
      let firstName = "";
      let lastName = "";
      const metIndicators: IndicatorType[] = [];
      const demographics: ParsedStudentRow["demographics"] = {};

      for (const [header, field] of effectiveMapping) {
        if (!field || field === "skip") continue;
        const val = String(row[header] ?? "").trim();

        if (field === "tsds_id") { tsdsId = val; continue; }
        if (field === "first_name") { firstName = val; continue; }
        if (field === "last_name") { lastName = val; continue; }

        // Demographic fields
        if (field === "grade") { const n = parseInt(val); if (!isNaN(n)) demographics.grade = n; continue; }
        if (field === "graduation_year") { const n = parseInt(val); if (!isNaN(n)) demographics.graduationYear = n; continue; }
        if (field === "campus") { if (val) demographics.campus = val; continue; }
        if (BOOLEAN_FIELDS.has(field)) {
          (demographics as Record<string, unknown>)[
            field === "is_eb" ? "isEb"
            : field === "is_econ_disadvantaged" ? "isEconDisadvantaged"
            : field === "is_special_ed" ? "isSpecialEd"
            : field === "is_504" ? "is504"
            : "edFormCollected"
          ] = isMet(val);
          continue;
        }
        if (field === "cte_pathway") { if (val) demographics.ctePathway = val; continue; }
        if (field === "cte_certification") { if (val) demographics.cteCertification = val; continue; }
        if (field === "cte_exam_date") { if (val) demographics.cteExamDate = val; continue; }

        // Indicator fields
        if (isMet(val)) metIndicators.push(field as IndicatorType);
      }

      return { tsdsId, firstName, lastName, metIndicators, demographics };
    })
    .filter((r) => r.tsdsId);
}

// ============================================
// DATA SOURCES STATUS TABLE
// ============================================

const PLANNED_INTEGRATIONS = [
  "ACT score files",
  "TSIA results (TEA direct export)",
  "PEIMS exports (Fall Snapshot · Summer Submission)",
  "TREx transcripts",
  "Dual credit records (community college partners)",
];

type DataSourceRow = {
  label: string;
  format: string;
  latest: DataUploadRow | null;
};

const DataSourcesTable = ({ uploads, hasCCMR }: { uploads: DataUploadRow[]; hasCCMR: boolean }) => {
  const latestByTypes = (types: UploadSourceType[]): DataUploadRow | null =>
    uploads
      .filter((u) => (u.status === "completed" || u.status === "completed_with_errors") && types.includes(u.source_type))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0] ?? null;

  const sources: DataSourceRow[] = [
    {
      label: hasCCMR ? "CCMR student roster" : "Student roster",
      format: hasCCMR ? "Region 13 Excel / CSV" : "CSV",
      latest: latestByTypes(["region_13_tracker", "tea_ccmr_tracker"]),
    },
    {
      label: "SAT scores (College Board ESR)",
      format: "CSV",
      latest: latestByTypes(["sat_scores"]),
    },
  ];


  return (
    <div className="bg-neutral-0 border border-neutral-200 rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-neutral-200">
        <h2 className="text-[17px] font-semibold text-neutral-900">Data sources</h2>
        <p className="text-[13px] text-neutral-500 mt-0.5">
          Active integrations powering Summit Pathways
        </p>
      </div>

      {/* Active integrations */}
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
            {sources.map((source) => (
              <tr key={source.label} className="border-b border-neutral-100 last:border-0">
                <td className="px-4 py-3 text-[13px] font-medium text-neutral-900">{source.label}</td>
                <td className="px-4 py-3">
                  {source.latest ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[12px] font-medium rounded-full bg-teal-100 text-teal-700">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Uploaded
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[12px] font-medium rounded-full bg-neutral-100 text-neutral-500">
                      <Upload className="w-3.5 h-3.5" />
                      Not uploaded
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-[13px] text-neutral-700">
                  {source.latest
                    ? `${source.latest.records_imported.toLocaleString()} students`
                    : <span className="text-neutral-400">—</span>}
                </td>
                <td className="px-4 py-3 text-[13px] text-neutral-700">
                  {source.latest
                    ? formatDate(source.latest.created_at)
                    : <span className="text-neutral-400">Never</span>}
                </td>
                <td className="px-4 py-3 text-[13px] text-neutral-500">{source.format}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Planned integrations */}
      <div className="px-6 py-4 border-t border-neutral-100 bg-neutral-50">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-3.5 h-3.5 text-neutral-400" />
          <span className="text-[12px] font-semibold text-neutral-500 uppercase tracking-wide">
            Planned integrations
          </span>
        </div>
        <ul className="space-y-1.5">
          {PLANNED_INTEGRATIONS.map((item) => (
            <li key={item} className="flex items-center gap-2 text-[13px] text-neutral-400">
              <span className="w-1 h-1 rounded-full bg-neutral-300 flex-shrink-0" />
              {item}
            </li>
          ))}
        </ul>
        <p className="text-[12px] text-neutral-400 mt-3">
          These integrations are on the roadmap and will be supported in an upcoming release.
        </p>
      </div>
    </div>
  );
};

// ============================================
// UPLOAD ZONE
// ============================================

export type UploadFormat = "tracker" | "sat";

interface UploadZoneProps {
  onFile: (file: File) => void;
  isProcessing: boolean;
  hasCCMR: boolean;
  uploadFormat: UploadFormat;
}

const UploadZone = ({ onFile, isProcessing, hasCCMR, uploadFormat }: UploadZoneProps) => {
  const [isDragOver, setIsDragOver] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const isSat = uploadFormat === "sat";

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (file) onFile(file);
  };

  return (
    <div className="bg-neutral-0 border border-neutral-200 rounded-lg p-6 space-y-4">
      {/* SAT helper note */}
      {isSat && (
        <div className="flex items-start gap-2.5 px-4 py-3 bg-primary-50 border border-primary-200 rounded-lg">
          <FileSpreadsheet className="w-4 h-4 text-primary-600 flex-shrink-0 mt-0.5" />
          <p className="text-[13px] text-primary-800">
            Upload the <strong>Educator Score Report (ESR)</strong> file from College Board.
            File format: <strong>.csv</strong>. Students are matched by State Student ID (TSDS).
            Only the LATEST_* score columns are used; the full row is stored for future reference.
          </p>
        </div>
      )}

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => !isProcessing && inputRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-lg p-12 text-center transition-colors",
          isProcessing ? "cursor-default opacity-60" : "cursor-pointer",
          isDragOver
            ? "border-teal-500 bg-teal-50"
            : "border-neutral-300 hover:border-neutral-400 hover:bg-neutral-50"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={isSat ? ".csv" : ".xlsx,.xls,.csv,.tsv"}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        {isProcessing ? (
          <Loader2 className="w-10 h-10 text-teal-500 mx-auto mb-4 animate-spin" />
        ) : (
          <Upload className="w-10 h-10 text-neutral-400 mx-auto mb-4" />
        )}
        <p className="text-[15px] font-medium text-neutral-900 mb-1">
          {isProcessing ? "Processing…" : "Drop your file here, or click to browse"}
        </p>
        <p className="text-[13px] text-neutral-500">
          {isSat
            ? "Supported: .csv (College Board ESR format)"
            : hasCCMR
            ? "Supported: .xlsx (Region 13 CCMR Tracker), .csv, .tsv"
            : "Supported: .xlsx, .csv, .tsv"}
        </p>
      </div>
    </div>
  );
};

// ============================================
// COLUMN MAPPER
// ============================================

const FIELD_OPTIONS: { value: MappedFieldValue; label: string }[] = [
  { value: "skip",                  label: "— Skip this column —" },
  // Identity
  { value: "last_name",             label: "Last Name" },
  { value: "first_name",            label: "First Name" },
  { value: "tsds_id",               label: "TSDS ID" },
  // Demographics
  { value: "grade",                 label: "Grade" },
  { value: "campus",                label: "Campus" },
  { value: "graduation_year",       label: "Graduation Year" },
  { value: "is_eb",                 label: "Is EB" },
  { value: "is_econ_disadvantaged", label: "Is Econ Disadvantaged" },
  { value: "is_special_ed",         label: "Is Special Ed" },
  { value: "is_504",                label: "Is 504" },
  { value: "ed_form_collected",     label: "ED Form Collected" },
  { value: "cte_pathway",           label: "CTE Pathway" },
  { value: "cte_certification",     label: "CTE Certification" },
  { value: "cte_exam_date",         label: "CTE Exam Date" },
  // CCMR Indicators
  ...ALL_INDICATOR_TYPES.map((t) => ({ value: t as IndicatorType, label: INDICATOR_DISPLAY[t] })),
];

interface ColumnMapperProps {
  detected: DetectedFile;
  overrides: Record<string, MappedFieldValue>;
  onOverride: (header: string, field: MappedFieldValue) => void;
  onImport: () => void;
  isImporting: boolean;
}

const ColumnMapper = ({
  detected,
  overrides,
  onOverride,
  onImport,
  isImporting,
}: ColumnMapperProps) => {
  const autoCount = detected.columns.filter((c) => c.autoDetected).length;
  const totalMapped = detected.columns.filter((c) => {
    const effective = overrides[c.header] ?? c.mappedField;
    return effective && effective !== "skip";
  }).length;

  return (
    <div className="bg-neutral-0 border border-neutral-200 rounded-lg overflow-hidden">
      {/* Detection banner */}
      <div className="p-4 bg-teal-50 border-b border-teal-200">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[14px] font-semibold text-teal-800">
              {detected.isRegion13
                ? "Region 13 CCMR Tracker detected"
                : "File loaded — review column mapping"}
              {" — "}
              <span className="font-normal">{detected.fileName}</span>
            </p>
            {detected.sheetName && (
              <p className="text-[12px] text-teal-700 mt-0.5">
                Sheet: <span className="font-medium">{detected.sheetName}</span>
              </p>
            )}
            <p className="text-[12px] text-teal-700 mt-0.5">
              <span className="font-semibold">{detected.rowCount}</span> student rows found ·{" "}
              <span className="font-semibold">{autoCount}</span> of{" "}
              <span className="font-semibold">{detected.columns.length}</span> columns auto-detected ·{" "}
              <span className="font-semibold">{totalMapped}</span> fields mapped
            </p>
          </div>
        </div>
      </div>

      {/* Column mapping table */}
      <div className="p-6 border-b border-neutral-200">
        <h3 className="text-[15px] font-semibold text-neutral-900 mb-4">Column mapping</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200">
                <th className="px-4 py-2 text-left text-[12px] font-semibold text-neutral-700 w-[200px]">
                  Your column
                </th>
                <th className="px-4 py-2 text-left text-[12px] font-semibold text-neutral-700 w-[220px]">
                  Summit Pathways field
                </th>
                <th className="px-4 py-2 text-left text-[12px] font-semibold text-neutral-700">
                  Sample values
                </th>
                <th className="px-4 py-2 text-left text-[12px] font-semibold text-neutral-700 w-[120px]">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {detected.columns.map((col) => {
                const effective = overrides[col.header] ?? col.mappedField;
                const isAuto = col.autoDetected && !overrides[col.header];
                return (
                  <tr
                    key={col.header}
                    className={cn(
                      "border-b border-neutral-100 last:border-0",
                      effective === "skip" && "opacity-50"
                    )}
                  >
                    <td className="px-4 py-2.5 text-[13px] font-medium text-neutral-900">
                      {col.header}
                    </td>
                    <td className="px-4 py-2.5">
                      <select
                        value={effective ?? "skip"}
                        onChange={(e) =>
                          onOverride(
                            col.header,
                            e.target.value as DetectedColumn["mappedField"]
                          )
                        }
                        className="w-full px-2.5 py-1.5 text-[12px] border border-neutral-200 rounded-md bg-neutral-0 text-neutral-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
                      >
                        {FIELD_OPTIONS.map((opt) => (
                          <option key={String(opt.value)} value={String(opt.value)}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2.5 text-[11px] text-neutral-400">
                      {col.sampleValues.slice(0, 3).join(", ") || "—"}
                    </td>
                    <td className="px-4 py-2.5">
                      {isAuto ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-teal-600">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Auto
                        </span>
                      ) : effective && effective !== "skip" ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-warning-dark">
                          <AlertCircle className="w-3.5 h-3.5" />
                          Manual
                        </span>
                      ) : (
                        <span className="text-[11px] text-neutral-400">Skipped</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Import button */}
      <div className="px-6 py-4 bg-neutral-50 flex items-center justify-between">
        <p className="text-[12px] text-neutral-500">
          {detected.rowCount} students will be imported or updated.
        </p>
        <button
          onClick={onImport}
          disabled={isImporting}
          className="px-5 py-2.5 bg-teal-600 text-neutral-0 text-[13px] font-semibold rounded-md hover:bg-teal-700 transition-colors flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isImporting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Importing…
            </>
          ) : (
            <>
              Import {detected.rowCount} students
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

// ============================================
// IMPORT RESULT BANNER
// ============================================

const ImportResultBanner = ({
  result,
  onDismiss,
}: {
  result: ImportResult;
  onDismiss: () => void;
}) => {
  const hasErrors = result.errored > 0 || result.errors.length > 0;
  return (
    <div
      className={cn(
        "border rounded-lg p-5",
        hasErrors
          ? "bg-warning-light border-warning/30"
          : "bg-teal-50 border-teal-200"
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          {hasErrors ? (
            <AlertCircle className="w-5 h-5 text-warning-dark flex-shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
          )}
          <div>
            <p className={cn("text-[14px] font-semibold", hasErrors ? "text-warning-dark" : "text-teal-800")}>
              {hasErrors ? "Import completed with warnings" : "Import successful"}
            </p>
            <p className={cn("text-[13px] mt-1", hasErrors ? "text-warning-dark/80" : "text-teal-700")}>
              {result.imported} students imported or updated · {result.errored} errors
            </p>
            {result.errors.length > 0 && (
              <ul className="mt-2 space-y-0.5">
                {result.errors.slice(0, 5).map((e, i) => (
                  <li key={i} className="text-[12px] text-warning-dark/70">
                    {e}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <button onClick={onDismiss} className="flex-shrink-0">
          <X className="w-4 h-4 text-neutral-400 hover:text-neutral-600" />
        </button>
      </div>
    </div>
  );
};

// ============================================
// SAT IMPORT RESULT BANNER
// ============================================

const SatImportResultBanner = ({
  result,
  onDismiss,
}: {
  result: SatImportResult;
  onDismiss: () => void;
}) => {
  const hasErrors = result.errors.length > 0 || result.unmatched > 0;
  return (
    <div
      className={cn(
        "border rounded-lg p-5",
        hasErrors
          ? "bg-warning-light border-warning/30"
          : "bg-teal-50 border-teal-200"
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          {hasErrors ? (
            <AlertCircle className="w-5 h-5 text-warning-dark flex-shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
          )}
          <div>
            <p className={cn("text-[14px] font-semibold", hasErrors ? "text-warning-dark" : "text-teal-800")}>
              {hasErrors ? "SAT import completed with warnings" : "SAT scores imported"}
            </p>
            <p className={cn("text-[13px] mt-1", hasErrors ? "text-warning-dark/80" : "text-teal-700")}>
              Matched {result.matched} of {result.matched + result.unmatched} students
              {result.inserted > 0 && ` · ${result.inserted} new SAT records`}
              {result.updated > 0 && ` · ${result.updated} updated`}
              {result.unmatched > 0 && ` · ${result.unmatched} unmatched`}
            </p>
            {result.unmatchedIds.length > 0 && (
              <div className="mt-2">
                <p className="text-[12px] text-warning-dark/70 font-medium mb-0.5">
                  Unmatched TSDS IDs:
                </p>
                <p className="text-[12px] text-warning-dark/70 font-mono break-all">
                  {result.unmatchedIds.slice(0, 20).join(", ")}
                  {result.unmatchedIds.length > 20 && ` … and ${result.unmatchedIds.length - 20} more`}
                </p>
              </div>
            )}
            {result.errors.length > 0 && (
              <ul className="mt-2 space-y-0.5">
                {result.errors.slice(0, 5).map((e, i) => (
                  <li key={i} className="text-[12px] text-warning-dark/70">
                    {e}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <button onClick={onDismiss} className="flex-shrink-0">
          <X className="w-4 h-4 text-neutral-400 hover:text-neutral-600" />
        </button>
      </div>
    </div>
  );
};

// ============================================
// UPLOAD HISTORY TABLE
// ============================================

const UPLOAD_STATUS_CONFIG = {
  processing: { label: "Processing", cls: "bg-primary-100 text-primary-700" },
  completed: { label: "Completed", cls: "bg-teal-100 text-teal-700" },
  completed_with_errors: { label: "With errors", cls: "bg-warning-light text-warning-dark" },
  failed: { label: "Failed", cls: "bg-error-light text-error-dark" },
};

const UploadHistoryTable = ({ uploads }: { uploads: DataUploadRow[] }) => {
  if (uploads.length === 0) {
    return (
      <div className="bg-neutral-0 border border-neutral-200 rounded-lg p-6">
        <h2 className="text-[17px] font-semibold text-neutral-900 mb-3">Upload history</h2>
        <p className="text-[13px] text-neutral-500">
          No uploads yet. Use the upload zone above to import your first file.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-neutral-0 border border-neutral-200 rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-neutral-200">
        <h2 className="text-[17px] font-semibold text-neutral-900">Upload history</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-200">
              <th className="px-4 py-3 text-left text-[12px] font-semibold text-neutral-700">File</th>
              <th className="px-4 py-3 text-left text-[12px] font-semibold text-neutral-700">Source</th>
              <th className="px-4 py-3 text-left text-[12px] font-semibold text-neutral-700">Status</th>
              <th className="px-4 py-3 text-right text-[12px] font-semibold text-neutral-700">Records</th>
              <th className="px-4 py-3 text-left text-[12px] font-semibold text-neutral-700">Uploaded</th>
            </tr>
          </thead>
          <tbody>
            {uploads.slice(0, 20).map((upload) => {
              const cfg =
                UPLOAD_STATUS_CONFIG[upload.status] ??
                UPLOAD_STATUS_CONFIG.processing;
              return (
                <tr
                  key={upload.id}
                  className="border-b border-neutral-100 last:border-0"
                >
                  <td className="px-4 py-3">
                    <p className="text-[13px] font-medium text-neutral-900 truncate max-w-[220px]">
                      {upload.file_name}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-[13px] text-neutral-700">
                    {sourceTypeLabel(upload.source_type)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-[11px] font-medium",
                        cfg.cls
                      )}
                    >
                      {cfg.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-[13px] text-neutral-700">
                    {upload.records_imported.toLocaleString()}{" "}
                    <span className="text-neutral-400 text-[11px]">
                      / {upload.records_total.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[13px] text-neutral-600">
                    {formatDate(upload.created_at)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ============================================
// WHAT'S MISSING CARD
// ============================================

const WhatsMissingCard = ({ uploads, hasCCMR }: { uploads: DataUploadRow[]; hasCCMR: boolean }) => {
  const rosterTypes: UploadSourceType[] = ["region_13_tracker", "tea_ccmr_tracker"];
  const hasRoster = uploads.some(
    (u) =>
      (u.status === "completed" || u.status === "completed_with_errors") &&
      rosterTypes.includes(u.source_type)
  );

  if (hasRoster) return null;

  return (
    <div className="bg-neutral-0 border border-neutral-200 rounded-lg p-5 flex items-start gap-3">
      <Upload className="w-4 h-4 text-neutral-400 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-[13px] font-medium text-neutral-900">
          {hasCCMR ? "No CCMR roster uploaded yet" : "No student roster uploaded yet"}
        </p>
        <p className="text-[12px] text-neutral-500 mt-0.5">
          Upload your {hasCCMR ? "CCMR tracker file" : "student roster"} above to populate student records, pathway data, and readiness indicators.
        </p>
      </div>
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export interface DataUploadPageProps {
  districtId: string;
  initialUploads: DataUploadRow[];
  hasCCMR: boolean;
}

export const DataUploadPage = ({
  initialUploads,
  hasCCMR,
}: DataUploadPageProps) => {
  const [uploads, setUploads] = React.useState<DataUploadRow[]>(initialUploads);
  const [uploadFormat, setUploadFormat] = React.useState<UploadFormat>("tracker");
  const [detected, setDetected] = React.useState<DetectedFile | null>(null);
  const [columnOverrides, setColumnOverrides] = React.useState<
    Record<string, MappedFieldValue>
  >({});
  const [isParsing, setIsParsing] = React.useState(false);
  const [isImporting, setIsImporting] = React.useState(false);
  const [importResult, setImportResult] = React.useState<ImportResult | null>(null);
  const [satResult, setSatResult] = React.useState<SatImportResult | null>(null);
  const [parseError, setParseError] = React.useState<string | null>(null);

  const handleFormatChange = React.useCallback((fmt: UploadFormat) => {
    setUploadFormat(fmt);
    setDetected(null);
    setColumnOverrides({});
    setImportResult(null);
    setSatResult(null);
    setParseError(null);
  }, []);

  const handleFile = React.useCallback(async (file: File) => {
    setParseError(null);
    setDetected(null);
    setColumnOverrides({});
    setImportResult(null);
    setSatResult(null);
    setIsParsing(true);

    try {
      if (uploadFormat === "sat") {
        const text = await file.text();
        const result = await importSatScores(text, file.name);
        setSatResult(result);
        // Add placeholder row to upload history
        setUploads((prev) => [
          {
            id: result.uploadId,
            district_id: "",
            school_year_id: null,
            file_name: file.name,
            source_type: "sat_scores",
            status: result.errors.length > 0 ? "completed_with_errors" : "completed",
            records_total: result.matched + result.unmatched,
            records_imported: result.matched,
            records_skipped: result.unmatched,
            records_errored: result.errors.length,
            column_mapping: {},
            error_log: null,
            uploaded_by: null,
            created_at: new Date().toISOString(),
            completed_at: new Date().toISOString(),
          },
          ...prev,
        ]);
      } else {
        let result: DetectedFile;
        if (file.name.endsWith(".csv") || file.name.endsWith(".tsv")) {
          const text = await file.text();
          result = await parseCsv(text, file.name);
        } else {
          const buffer = await file.arrayBuffer();
          result = await parseXlsx(buffer, file.name);
        }
        setDetected(result);
      }
    } catch (err) {
      setParseError(
        err instanceof Error ? err.message : "Failed to read file. Make sure it's a valid Excel or CSV file."
      );
    } finally {
      setIsParsing(false);
    }
  }, [uploadFormat]);

  const handleImport = React.useCallback(async () => {
    if (!detected) return;
    setIsImporting(true);
    setImportResult(null);

    try {
      const parsedRows = buildParsedRows(detected, columnOverrides);
      const effectiveMapping: Record<string, string> = {};
      for (const col of detected.columns) {
        const field = columnOverrides[col.header] ?? col.mappedField;
        if (field) effectiveMapping[col.header] = String(field);
      }

      const result = await importRows(
        parsedRows,
        detected.fileName,
        detected.sourceType,
        effectiveMapping
      );
      setImportResult(result);
      setDetected(null);
      setColumnOverrides({});

      // Refresh uploads list by adding a placeholder (real data comes on next page load)
      setUploads((prev) => [
        {
          id: result.uploadId,
          district_id: "",
          school_year_id: null,
          file_name: detected.fileName,
          source_type: detected.sourceType,
          status: result.errored > 0 ? "completed_with_errors" : "completed",
          records_total: detected.rowCount,
          records_imported: result.imported,
          records_skipped: result.skipped,
          records_errored: result.errored,
          column_mapping: effectiveMapping,
          error_log: null,
          uploaded_by: null,
          created_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
        },
        ...prev,
      ]);
    } catch (err) {
      setParseError(
        err instanceof Error ? err.message : "Import failed. Please try again."
      );
    } finally {
      setIsImporting(false);
    }
  }, [detected, columnOverrides]);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-[24px] font-semibold text-neutral-900">Data Upload</h1>
        <p className="text-[14px] text-neutral-600 mt-1">
          Import student roster and pathway data to keep the platform current
        </p>
      </div>

      {/* Import result banners */}
      {importResult && (
        <ImportResultBanner
          result={importResult}
          onDismiss={() => setImportResult(null)}
        />
      )}
      {satResult && (
        <SatImportResultBanner
          result={satResult}
          onDismiss={() => setSatResult(null)}
        />
      )}

      {/* Parse error */}
      {parseError && (
        <div className="flex items-start gap-3 p-4 bg-error-light border border-error/30 rounded-lg">
          <XCircle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-[13px] font-semibold text-error-dark">Error reading file</p>
            <p className="text-[12px] text-error-dark/80 mt-0.5">{parseError}</p>
          </div>
          <button onClick={() => setParseError(null)}>
            <X className="w-4 h-4 text-error-dark/60 hover:text-error-dark" />
          </button>
        </div>
      )}

      {/* Data sources status */}
      <DataSourcesTable uploads={uploads} hasCCMR={hasCCMR} />

      {/* Format selector + upload zone — hidden while column mapper is shown */}
      {!detected && (
        <>
          {/* Format selector */}
          <div className="bg-neutral-0 border border-neutral-200 rounded-lg px-6 py-4">
            <label className="block text-[13px] font-semibold text-neutral-700 mb-2">
              What are you uploading?
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => handleFormatChange("tracker")}
                className={cn(
                  "flex-1 flex items-center gap-3 px-4 py-3 rounded-lg border-2 text-left transition-colors",
                  uploadFormat === "tracker"
                    ? "border-teal-500 bg-teal-50"
                    : "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50"
                )}
              >
                <FileSpreadsheet className={cn("w-5 h-5 flex-shrink-0", uploadFormat === "tracker" ? "text-teal-600" : "text-neutral-400")} />
                <div>
                  <p className={cn("text-[13px] font-semibold", uploadFormat === "tracker" ? "text-teal-800" : "text-neutral-700")}>
                    Region 13 CCMR Tracker
                  </p>
                  <p className="text-[12px] text-neutral-500">Excel or CSV · Quick Start</p>
                </div>
              </button>
              <button
                onClick={() => handleFormatChange("sat")}
                className={cn(
                  "flex-1 flex items-center gap-3 px-4 py-3 rounded-lg border-2 text-left transition-colors",
                  uploadFormat === "sat"
                    ? "border-teal-500 bg-teal-50"
                    : "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50"
                )}
              >
                <FileText className={cn("w-5 h-5 flex-shrink-0", uploadFormat === "sat" ? "text-teal-600" : "text-neutral-400")} />
                <div>
                  <p className={cn("text-[13px] font-semibold", uploadFormat === "sat" ? "text-teal-800" : "text-neutral-700")}>
                    SAT Score File
                  </p>
                  <p className="text-[12px] text-neutral-500">College Board ESR · CSV</p>
                </div>
              </button>
            </div>
          </div>

          <UploadZone onFile={handleFile} isProcessing={isParsing} hasCCMR={hasCCMR} uploadFormat={uploadFormat} />
        </>
      )}

      {/* Column mapper */}
      {detected && (
        <ColumnMapper
          detected={detected}
          overrides={columnOverrides}
          onOverride={(header, field) =>
            setColumnOverrides((prev) => ({ ...prev, [header]: field }))
          }
          onImport={handleImport}
          isImporting={isImporting}
        />
      )}

      {/* Upload history */}
      <UploadHistoryTable uploads={uploads} />

      {/* What's missing */}
      <WhatsMissingCard uploads={uploads} hasCCMR={hasCCMR} />
    </div>
  );
};

export default DataUploadPage;
