"use server";

import { createAdminClient } from "@/utils/supabase/admin";
import { requireSuperAdmin } from "@/lib/db/users";
import type { UserRole } from "@/types/database";

// ── Step 1: Create district ─────────────────────────────────────────────────

export interface CreatedDistrict {
  id: string;
  name: string;
}

export async function createDistrict(data: {
  name: string;
  teaDistrictId: string;
  escRegion: string;
  stateCode?: string;
}): Promise<CreatedDistrict> {
  await requireSuperAdmin();
  const admin = createAdminClient();

  // Look up the state by code (defaults to TX)
  const stateCode = (data.stateCode ?? "TX").toUpperCase();
  const { data: stateRow, error: stateError } = await admin
    .from("states")
    .select("id")
    .eq("code", stateCode)
    .single();

  if (stateError || !stateRow) {
    throw new Error(`State '${stateCode}' not found in states table`);
  }

  const { data: district, error } = await admin
    .from("districts")
    .insert({
      name: data.name.trim(),
      tea_district_id: data.teaDistrictId.trim() || null,
      esc_region: data.escRegion ? parseInt(data.escRegion) : null,
      state_id: stateRow.id,
      state_avg_ccmr_rate: null,
      settings: {},
    })
    .select("id, name")
    .single();

  if (error) throw new Error(`Failed to create district: ${error.message}`);
  return district;
}

// ── Step 2: Create campuses ─────────────────────────────────────────────────

export interface CreatedCampus {
  id: string;
  name: string;
}

export async function createCampuses(
  districtId: string,
  names: string[]
): Promise<CreatedCampus[]> {
  await requireSuperAdmin();
  const admin = createAdminClient();

  const validNames = names.map((n) => n.trim()).filter(Boolean);
  if (validNames.length === 0) return [];

  const { data, error } = await admin
    .from("campuses")
    .insert(
      validNames.map((name) => ({
        district_id: districtId,
        name,
        tea_campus_id: null,
        metadata: {},
      }))
    )
    .select("id, name");

  if (error) throw new Error(`Failed to create campuses: ${error.message}`);
  return data ?? [];
}

// ── Step 3: Create school year ──────────────────────────────────────────────

export interface CreatedSchoolYear {
  id: string;
  label: string;
}

export async function createSchoolYear(data: {
  districtId: string;
  label: string;
  startDate: string;
  endDate: string;
  graduationDate: string;
  isCurrent: boolean;
}): Promise<CreatedSchoolYear> {
  await requireSuperAdmin();
  const admin = createAdminClient();

  const { data: sy, error } = await admin
    .from("school_years")
    .insert({
      district_id: data.districtId,
      label: data.label.trim(),
      start_date: data.startDate,
      end_date: data.endDate,
      graduation_date: data.graduationDate || null,
      is_current: data.isCurrent,
    })
    .select("id, label")
    .single();

  if (error) throw new Error(`Failed to create school year: ${error.message}`);
  return sy;
}

// ── Step 4: Create user ─────────────────────────────────────────────────────

export interface CreatedUser {
  userId: string;
  email: string;
  fullName: string;
}

export async function createSetupUser(data: {
  districtId: string;
  campusId: string;
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
}): Promise<CreatedUser> {
  await requireSuperAdmin();
  const admin = createAdminClient();

  // Create the Supabase auth user (email confirmed immediately)
  const { data: authData, error: authError } =
    await admin.auth.admin.createUser({
      email: data.email.trim(),
      password: data.password,
      email_confirm: true,
    });

  if (authError) throw new Error(`Failed to create auth user: ${authError.message}`);

  const userId = authData.user.id;

  // Insert the user_profiles row
  const { error: profileError } = await admin.from("user_profiles").insert({
    id: userId,
    district_id: data.districtId,
    campus_id: data.campusId || null,
    full_name: data.fullName.trim(),
    role: data.role,
  });

  if (profileError) {
    // Clean up the auth user if profile creation fails
    await admin.auth.admin.deleteUser(userId);
    throw new Error(`Failed to create user profile: ${profileError.message}`);
  }

  return { userId, email: data.email.trim(), fullName: data.fullName.trim() };
}
