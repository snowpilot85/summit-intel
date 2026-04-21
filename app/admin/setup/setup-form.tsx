"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Plus, Trash2, CheckCircle2, ArrowRight, Building2, GraduationCap, Calendar, User } from "lucide-react";
import {
  createDistrict,
  createCampuses,
  createSchoolYear,
  createSetupUser,
  type CreatedDistrict,
  type CreatedCampus,
  type CreatedSchoolYear,
  type CreatedUser,
} from "./actions";
import type { UserRole } from "@/types/database";

// ── Types ────────────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3 | 4 | "complete";

interface SetupState {
  district: CreatedDistrict | null;
  campuses: CreatedCampus[];
  schoolYear: CreatedSchoolYear | null;
  user: CreatedUser | null;
}

// ── Step indicators ──────────────────────────────────────────────────────────

const STEPS = [
  { num: 1, label: "District",    icon: Building2 },
  { num: 2, label: "Campuses",    icon: GraduationCap },
  { num: 3, label: "School Year", icon: Calendar },
  { num: 4, label: "User",        icon: User },
] as const;

function StepBar({ current }: { current: Step }) {
  return (
    <div className="flex items-center gap-0 mb-10">
      {STEPS.map((s, i) => {
        const done = typeof current === "number" && current > s.num || current === "complete";
        const active = current === s.num;
        const Icon = s.icon;
        return (
          <React.Fragment key={s.num}>
            <div className="flex flex-col items-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-semibold transition-colors ${
                  done
                    ? "bg-teal-500 text-white"
                    : active
                    ? "bg-primary-500 text-white"
                    : "bg-neutral-200 text-neutral-500"
                }`}
              >
                {done ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
              </div>
              <span
                className={`text-[11px] font-medium mt-1.5 ${
                  active ? "text-primary-600" : done ? "text-teal-600" : "text-neutral-400"
                }`}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`flex-1 h-0.5 mb-5 mx-2 transition-colors ${
                  (typeof current === "number" && current > s.num) || current === "complete"
                    ? "bg-teal-400"
                    : "bg-neutral-200"
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── Shared field styles ──────────────────────────────────────────────────────

const inputCls =
  "w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 text-[14px] text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition";

const labelCls = "block text-[13px] font-medium text-neutral-700 mb-1.5";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {children}
      {hint && <p className="text-[12px] text-neutral-400 mt-1">{hint}</p>}
    </div>
  );
}

function ErrorMsg({ msg }: { msg: string }) {
  return (
    <p className="text-[13px] text-error bg-red-50 border border-red-200 rounded-lg px-3.5 py-2.5">
      {msg}
    </p>
  );
}

// ── Step 1: District ─────────────────────────────────────────────────────────

function Step1({
  onDone,
}: {
  onDone: (district: CreatedDistrict) => void;
}) {
  const [name, setName] = React.useState("");
  const [teaId, setTeaId] = React.useState("");
  const [escRegion, setEscRegion] = React.useState("");
  const [stateCode, setStateCode] = React.useState("TX");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError("");
    try {
      const district = await createDistrict({ name, teaDistrictId: teaId, escRegion, stateCode });
      onDone(district);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Field label="District name *">
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputCls}
          placeholder="Edinburg CISD"
        />
      </Field>
      <Field label="State">
        <select
          value={stateCode}
          onChange={(e) => setStateCode(e.target.value)}
          className={inputCls}
        >
          <option value="TX">Texas (TX)</option>
          <option value="CT">Connecticut (CT)</option>
        </select>
      </Field>
      <Field label="TEA district ID" hint="Optional — 6-digit TEA ID number">
        <input
          type="text"
          value={teaId}
          onChange={(e) => setTeaId(e.target.value)}
          className={inputCls}
          placeholder="108901"
          maxLength={6}
        />
      </Field>
      <Field label="ESC region" hint="Optional — 1 through 20">
        <input
          type="number"
          value={escRegion}
          onChange={(e) => setEscRegion(e.target.value)}
          className={inputCls}
          placeholder="1"
          min={1}
          max={20}
        />
      </Field>
      {error && <ErrorMsg msg={error} />}
      <button
        type="submit"
        disabled={loading || !name.trim()}
        className="w-full flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-60 disabled:cursor-not-allowed text-white text-[14px] font-semibold py-2.5 rounded-lg transition-colors"
      >
        {loading ? "Creating…" : "Create district"}
        {!loading && <ArrowRight className="w-4 h-4" />}
      </button>
    </form>
  );
}

// ── Step 2: Campuses ─────────────────────────────────────────────────────────

function Step2({
  districtId,
  onDone,
}: {
  districtId: string;
  onDone: (campuses: CreatedCampus[]) => void;
}) {
  const [names, setNames] = React.useState<string[]>([""]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  function addField() {
    setNames((n) => [...n, ""]);
  }

  function removeField(i: number) {
    setNames((n) => n.filter((_, idx) => idx !== i));
  }

  function updateField(i: number, val: string) {
    setNames((n) => n.map((v, idx) => (idx === i ? val : v)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const valid = names.map((n) => n.trim()).filter(Boolean);
    if (valid.length === 0) return;
    setLoading(true);
    setError("");
    try {
      const campuses = await createCampuses(districtId, valid);
      onDone(campuses);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-[13px] text-neutral-600">
        Add one or more campus names. You can add more later.
      </p>
      <div className="space-y-2.5">
        {names.map((val, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="text"
              value={val}
              onChange={(e) => updateField(i, e.target.value)}
              className={`${inputCls} flex-1`}
              placeholder={`Campus ${i + 1} name`}
            />
            {names.length > 1 && (
              <button
                type="button"
                onClick={() => removeField(i)}
                className="p-2 text-neutral-400 hover:text-error transition-colors flex-shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={addField}
        className="flex items-center gap-1.5 text-[13px] font-medium text-primary-600 hover:text-primary-700 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Add another campus
      </button>
      {error && <ErrorMsg msg={error} />}
      <button
        type="submit"
        disabled={loading || names.every((n) => !n.trim())}
        className="w-full flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-60 disabled:cursor-not-allowed text-white text-[14px] font-semibold py-2.5 rounded-lg transition-colors mt-2"
      >
        {loading ? "Creating…" : "Save campuses"}
        {!loading && <ArrowRight className="w-4 h-4" />}
      </button>
    </form>
  );
}

// ── Step 3: School year ──────────────────────────────────────────────────────

function Step3({
  districtId,
  onDone,
}: {
  districtId: string;
  onDone: (sy: CreatedSchoolYear) => void;
}) {
  const [label, setLabel] = React.useState("2025-26");
  const [startDate, setStartDate] = React.useState("2025-08-01");
  const [endDate, setEndDate] = React.useState("2026-05-31");
  const [gradDate, setGradDate] = React.useState("2026-05-16");
  const [isCurrent, setIsCurrent] = React.useState(true);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const sy = await createSchoolYear({
        districtId,
        label,
        startDate,
        endDate,
        graduationDate: gradDate,
        isCurrent,
      });
      onDone(sy);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Field label="School year label *">
        <input
          type="text"
          required
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className={inputCls}
          placeholder="2025-26"
        />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Start date *">
          <input
            type="date"
            required
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="End date *">
          <input
            type="date"
            required
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className={inputCls}
          />
        </Field>
      </div>
      <Field label="Graduation date" hint="Used to compute days-until-graduation for seniors">
        <input
          type="date"
          value={gradDate}
          onChange={(e) => setGradDate(e.target.value)}
          className={inputCls}
        />
      </Field>
      <label className="flex items-center gap-2.5 cursor-pointer">
        <input
          type="checkbox"
          checked={isCurrent}
          onChange={(e) => setIsCurrent(e.target.checked)}
          className="w-4 h-4 rounded accent-primary-500"
        />
        <span className="text-[13px] text-neutral-700">Mark as current school year</span>
      </label>
      {error && <ErrorMsg msg={error} />}
      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-60 disabled:cursor-not-allowed text-white text-[14px] font-semibold py-2.5 rounded-lg transition-colors"
      >
        {loading ? "Creating…" : "Save school year"}
        {!loading && <ArrowRight className="w-4 h-4" />}
      </button>
    </form>
  );
}

// ── Step 4: Create user ──────────────────────────────────────────────────────

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "district_admin", label: "District Admin" },
  { value: "campus_admin",   label: "Campus Admin" },
  { value: "counselor",      label: "Counselor" },
  { value: "viewer",         label: "Viewer" },
];

function Step4({
  districtId,
  campuses,
  onDone,
}: {
  districtId: string;
  campuses: CreatedCampus[];
  onDone: (user: CreatedUser) => void;
}) {
  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [role, setRole] = React.useState<UserRole>("district_admin");
  const [campusId, setCampusId] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const user = await createSetupUser({
        districtId,
        campusId,
        fullName,
        email,
        password,
        role,
      });
      onDone(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Field label="Full name *">
        <input
          type="text"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className={inputCls}
          placeholder="Sarah Chen"
        />
      </Field>
      <Field label="Email *">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputCls}
          placeholder="sarah.chen@district.edu"
        />
      </Field>
      <Field label="Password *" hint="Minimum 8 characters">
        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputCls}
          placeholder="••••••••••"
        />
      </Field>
      <Field label="Role *">
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as UserRole)}
          className={inputCls}
        >
          {ROLE_OPTIONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </Field>
      {campuses.length > 0 && (
        <Field label="Campus assignment" hint="Optional — leave blank for district-wide access">
          <select
            value={campusId}
            onChange={(e) => setCampusId(e.target.value)}
            className={inputCls}
          >
            <option value="">All campuses</option>
            {campuses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
      )}
      {error && <ErrorMsg msg={error} />}
      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-60 disabled:cursor-not-allowed text-white text-[14px] font-semibold py-2.5 rounded-lg transition-colors"
      >
        {loading ? "Creating user…" : "Create user"}
        {!loading && <ArrowRight className="w-4 h-4" />}
      </button>
    </form>
  );
}

// ── Completion ───────────────────────────────────────────────────────────────

function CompletionStep({ state, onReset }: { state: SetupState; onReset: () => void }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 p-4 bg-teal-50 border border-teal-200 rounded-xl">
        <CheckCircle2 className="w-6 h-6 text-teal-600 flex-shrink-0" />
        <div>
          <p className="text-[15px] font-semibold text-teal-900">District ready!</p>
          <p className="text-[13px] text-teal-700 mt-0.5">
            Everything has been set up successfully.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <SummaryRow label="District" value={state.district?.name ?? "—"} />
        <SummaryRow
          label="Campuses"
          value={
            state.campuses.length > 0
              ? state.campuses.map((c) => c.name).join(", ")
              : "None"
          }
        />
        <SummaryRow label="School year" value={state.schoolYear?.label ?? "—"} />
        {state.user && (
          <>
            <SummaryRow label="User created" value={`${state.user.fullName} (${state.user.email})`} />
          </>
        )}
      </div>

      <div className="flex flex-col gap-3 pt-2">
        <Link
          href="/login"
          className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-[14px] font-semibold py-2.5 rounded-lg transition-colors"
        >
          Go to login
          <ArrowRight className="w-4 h-4" />
        </Link>
        <button
          onClick={onReset}
          className="w-full flex items-center justify-center gap-2 border border-neutral-300 hover:bg-neutral-50 text-neutral-700 text-[14px] font-medium py-2.5 rounded-lg transition-colors"
        >
          Set up another district
        </button>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-4 text-[13px]">
      <span className="w-28 flex-shrink-0 font-medium text-neutral-500">{label}</span>
      <span className="text-neutral-900">{value}</span>
    </div>
  );
}

// ── Main form shell ──────────────────────────────────────────────────────────

export function AdminSetupForm() {
  const [step, setStep] = React.useState<Step>(1);
  const [state, setState] = React.useState<SetupState>({
    district: null,
    campuses: [],
    schoolYear: null,
    user: null,
  });

  function reset() {
    setStep(1);
    setState({ district: null, campuses: [], schoolYear: null, user: null });
  }

  const stepTitle: Record<string | number, string> = {
    1: "Create district",
    2: "Add campuses",
    3: "Configure school year",
    4: "Create first user",
    complete: "Setup complete",
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-primary-500 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Image
            src="/images/summit-k12-logo-white.png"
            alt="Summit K12"
            width={120}
            height={32}
            className="h-7 w-auto"
            priority
          />
          <span className="text-[20px] font-semibold text-teal-300">Pathways</span>
        </div>
        <Link
          href="/pathways"
          className="text-[13px] text-white/70 hover:text-white transition-colors"
        >
          ← Back to dashboard
        </Link>
      </header>

      <div className="max-w-lg mx-auto px-6 py-10">
        <div className="mb-8">
          <p className="text-[12px] font-semibold text-primary-500 uppercase tracking-wider mb-1">
            Admin Setup
          </p>
          <h1 className="text-[24px] font-semibold text-neutral-900">
            {stepTitle[step]}
          </h1>
        </div>

        {step !== "complete" && <StepBar current={step} />}

        <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-7">
          {step === 1 && (
            <Step1
              onDone={(district) => {
                setState((s) => ({ ...s, district }));
                setStep(2);
              }}
            />
          )}
          {step === 2 && state.district && (
            <Step2
              districtId={state.district.id}
              onDone={(campuses) => {
                setState((s) => ({ ...s, campuses }));
                setStep(3);
              }}
            />
          )}
          {step === 3 && state.district && (
            <Step3
              districtId={state.district.id}
              onDone={(schoolYear) => {
                setState((s) => ({ ...s, schoolYear }));
                setStep(4);
              }}
            />
          )}
          {step === 4 && state.district && (
            <Step4
              districtId={state.district.id}
              campuses={state.campuses}
              onDone={(user) => {
                setState((s) => ({ ...s, user }));
                setStep("complete");
              }}
            />
          )}
          {step === "complete" && (
            <CompletionStep state={state} onReset={reset} />
          )}
        </div>
      </div>
    </div>
  );
}
