-- ============================================================
-- Summit Pathways — State Configuration Layer
-- Migration: 20260416000001_state_configuration
--
-- Adds states as the top-level entity. Every pathway-related
-- table (career clusters, credentials, accountability rules,
-- partnerships, reporting formats) is scoped to a state.
-- Districts gain a state_id FK.
-- ============================================================


-- ============================================================
-- STATES
-- ============================================================

create table if not exists states (
  id                        uuid primary key default gen_random_uuid(),
  name                      text not null,
  code                      char(2) not null unique,        -- 'TX', 'CT', etc.
  accountability_system     text not null default 'placeholder'
                              check (accountability_system in (
                                'tea_af',          -- Texas A-F (TEA)
                                'placeholder'      -- future states not yet configured
                              )),
  career_cluster_framework  text not null default 'advance_cte_16'
                              check (career_cluster_framework in (
                                'advance_cte_16',  -- National 16 Advance CTE clusters
                                'tea_16'           -- Texas-branded 16 clusters (same set, TX-specific credentials)
                              )),
  settings                  jsonb not null default '{}',   -- state-level feature flags
  is_active                 boolean not null default true,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

create trigger states_updated_at
  before update on states
  for each row execute function set_updated_at();


-- ============================================================
-- STATE CAREER CLUSTERS
-- ============================================================

create table if not exists state_career_clusters (
  id          uuid primary key default gen_random_uuid(),
  state_id    uuid not null references states(id) on delete cascade,
  code        text not null,               -- e.g. 'AGRI', 'HLTH'
  name        text not null,               -- e.g. 'Health Science'
  description text,
  sort_order  smallint not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  unique (state_id, code)
);

create index if not exists state_career_clusters_state_id_idx on state_career_clusters(state_id);


-- ============================================================
-- STATE CREDENTIAL CATALOG
-- Credentials / certifications recognized by a state for
-- pathway completion (e.g., IBC-eligible certs in Texas).
-- ============================================================

create table if not exists state_credential_catalog (
  id                  uuid primary key default gen_random_uuid(),
  state_id            uuid not null references states(id) on delete cascade,
  cluster_code        text not null,         -- references state_career_clusters.code
  name                text not null,         -- e.g. 'CompTIA Security+'
  issuing_body        text,                  -- e.g. 'CompTIA'
  credential_type     text not null default 'certification'
                        check (credential_type in (
                          'certification',   -- industry cert (most IBC)
                          'license',         -- state-issued license
                          'associate_degree',
                          'level_i_certificate',
                          'level_ii_certificate',
                          'apprenticeship',
                          'military_enlistment',
                          'other'
                        )),
  is_ccmr_eligible    boolean not null default false,  -- counts toward TEA CCMR IBC indicator
  passing_score       text,                  -- free-form, e.g. '700' or '75%'
  exam_window_notes   text,                  -- e.g. 'Spring testing window Apr–May'
  metadata            jsonb not null default '{}',
  is_active           boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists state_credential_catalog_state_id_idx   on state_credential_catalog(state_id);
create index if not exists state_credential_catalog_cluster_idx     on state_credential_catalog(state_id, cluster_code);
create index if not exists state_credential_catalog_ccmr_idx        on state_credential_catalog(state_id, is_ccmr_eligible);

create trigger state_credential_catalog_updated_at
  before update on state_credential_catalog
  for each row execute function set_updated_at();


-- ============================================================
-- STATE ACCOUNTABILITY CONFIG
-- Versioned accountability rules per state.
-- The config JSONB stores cut scores, component weights,
-- grade bands, and safety rules specific to each system.
-- ============================================================

create table if not exists state_accountability_config (
  id              uuid primary key default gen_random_uuid(),
  state_id        uuid not null references states(id) on delete cascade,
  label           text not null,            -- e.g. '2025 TEA A-F Accountability'
  system_type     text not null,            -- mirrors states.accountability_system
  effective_year  smallint not null,        -- school/accountability year this applies to
  is_current      boolean not null default false,
  config          jsonb not null default '{}',
  -- Config schema (documented, not enforced by DB):
  --   components: { name, weight, cut_points: {A,B,C,D} }[]
  --   safety_rules: { three_fs: {...}, three_ds: {...} }
  --   grade_bands:  { A: [90,100], B: [80,89], ... }
  --   relative_performance_table: [...rows from Table 5.5...]
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (state_id, effective_year)
);

-- Only one current config per state
create unique index if not exists state_accountability_one_current_per_state
  on state_accountability_config(state_id)
  where is_current = true;

create index if not exists state_accountability_config_state_id_idx on state_accountability_config(state_id);

create trigger state_accountability_config_updated_at
  before update on state_accountability_config
  for each row execute function set_updated_at();


-- ============================================================
-- STATE PARTNERSHIPS
-- Regional service centers, workforce boards, community
-- colleges, and other entities a state works with.
-- ============================================================

create table if not exists state_partnerships (
  id           uuid primary key default gen_random_uuid(),
  state_id     uuid not null references states(id) on delete cascade,
  name         text not null,
  partner_type text not null default 'other'
                 check (partner_type in (
                   'esc',                -- Education Service Center (TX)
                   'community_college',
                   'workforce_board',
                   'state_agency',
                   'higher_ed',
                   'industry',
                   'other'
                 )),
  region_code  text,                    -- e.g. 'ESC-1', 'ESC-13'
  website      text,
  contact_info jsonb not null default '{}',  -- { name, email, phone }
  notes        text,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists state_partnerships_state_id_idx on state_partnerships(state_id);

create trigger state_partnerships_updated_at
  before update on state_partnerships
  for each row execute function set_updated_at();


-- ============================================================
-- STATE REPORTING FORMATS
-- Describes upload file formats accepted per state —
-- column specs, detection rules, and field mappings.
-- ============================================================

create table if not exists state_reporting_formats (
  id              uuid primary key default gen_random_uuid(),
  state_id        uuid not null references states(id) on delete cascade,
  format_code     text not null,         -- e.g. 'region_13_tracker', 'tea_ccmr_tracker'
  name            text not null,         -- human label shown in upload UI
  description     text,
  file_types      text[] not null default '{csv,xlsx}',
  column_spec     jsonb not null default '{}',
  -- column_spec schema:
  --   required_columns: string[]        -- canonical field names that must be present
  --   column_aliases: { [alias]: canonical_field }
  --   detection_hints: string[]         -- keywords that identify this format
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (state_id, format_code)
);

create index if not exists state_reporting_formats_state_id_idx on state_reporting_formats(state_id);

create trigger state_reporting_formats_updated_at
  before update on state_reporting_formats
  for each row execute function set_updated_at();


-- ============================================================
-- ADD state_id TO DISTRICTS
-- ============================================================

alter table districts
  add column if not exists state_id uuid references states(id) on delete restrict;

create index if not exists districts_state_id_idx on districts(state_id);


-- ============================================================
-- RLS — new tables are readable by authenticated users;
-- write access is super_admin only (enforced app-side via
-- service-role key; these policies gate the auth client).
-- ============================================================

alter table states                      enable row level security;
alter table state_career_clusters       enable row level security;
alter table state_credential_catalog    enable row level security;
alter table state_accountability_config enable row level security;
alter table state_partnerships          enable row level security;
alter table state_reporting_formats     enable row level security;

-- States: read-only for all authenticated users
create policy "authenticated users read states"
  on states for select
  using (auth.role() = 'authenticated');

-- Career clusters: read-only for all authenticated users
create policy "authenticated users read career clusters"
  on state_career_clusters for select
  using (auth.role() = 'authenticated');

-- Credential catalog: read-only for all authenticated users
create policy "authenticated users read credential catalog"
  on state_credential_catalog for select
  using (auth.role() = 'authenticated');

-- Accountability config: read-only for all authenticated users
create policy "authenticated users read accountability config"
  on state_accountability_config for select
  using (auth.role() = 'authenticated');

-- Partnerships: read-only for all authenticated users
create policy "authenticated users read partnerships"
  on state_partnerships for select
  using (auth.role() = 'authenticated');

-- Reporting formats: read-only for all authenticated users
create policy "authenticated users read reporting formats"
  on state_reporting_formats for select
  using (auth.role() = 'authenticated');


-- ============================================================
-- SEED — TEXAS
-- ============================================================

insert into states (id, name, code, accountability_system, career_cluster_framework, settings) values
  (
    'a1000001-0000-0000-0000-000000000001',
    'Texas',
    'TX',
    'tea_af',
    'tea_16',
    '{
      "ccmr_enabled": true,
      "af_simulator_enabled": true,
      "ibc_catalog_enabled": true,
      "tsia_enabled": true,
      "ed_form_tracking": true
    }'::jsonb
  )
on conflict (code) do nothing;


-- Texas TEA 16 Career Clusters
-- (Same 16 national clusters; TX adds IBC-eligible credentials within each)
insert into state_career_clusters (state_id, code, name, description, sort_order) values
  ('a1000001-0000-0000-0000-000000000001', 'AGRI', 'Agriculture, Food & Natural Resources',
   'Careers in agriculture, food production, natural resources, and environmental science.', 1),
  ('a1000001-0000-0000-0000-000000000001', 'ARCH', 'Architecture & Construction',
   'Design, construction, and maintenance of buildings and infrastructure.', 2),
  ('a1000001-0000-0000-0000-000000000001', 'ARTS', 'Arts, A/V Technology & Communications',
   'Creative arts, audio/visual production, journalism, and telecommunications.', 3),
  ('a1000001-0000-0000-0000-000000000001', 'BUSI', 'Business Management & Administration',
   'Business operations, management, entrepreneurship, and administrative services.', 4),
  ('a1000001-0000-0000-0000-000000000001', 'EDUC', 'Education & Training',
   'Teaching, training, and education administration across all levels.', 5),
  ('a1000001-0000-0000-0000-000000000001', 'FINA', 'Finance',
   'Banking, investments, insurance, and financial planning.', 6),
  ('a1000001-0000-0000-0000-000000000001', 'GOVT', 'Government & Public Administration',
   'Planning, managing, and providing government and public-sector services.', 7),
  ('a1000001-0000-0000-0000-000000000001', 'HLTH', 'Health Science',
   'Patient care, public health, health informatics, and biomedical research.', 8),
  ('a1000001-0000-0000-0000-000000000001', 'HOSP', 'Hospitality & Tourism',
   'Travel, lodging, recreation, food service, and event management.', 9),
  ('a1000001-0000-0000-0000-000000000001', 'HUMS', 'Human Services',
   'Family and community services, counseling, and personal care.', 10),
  ('a1000001-0000-0000-0000-000000000001', 'INFO', 'Information Technology',
   'Networking, software development, cybersecurity, and data management.', 11),
  ('a1000001-0000-0000-0000-000000000001', 'LAWS', 'Law, Public Safety, Corrections & Security',
   'Legal services, law enforcement, fire protection, and emergency response.', 12),
  ('a1000001-0000-0000-0000-000000000001', 'MANU', 'Manufacturing',
   'Production, quality control, logistics, and maintenance of manufactured goods.', 13),
  ('a1000001-0000-0000-0000-000000000001', 'MKTG', 'Marketing',
   'Marketing research, merchandising, distribution, and promotion.', 14),
  ('a1000001-0000-0000-0000-000000000001', 'STEM', 'Science, Technology, Engineering & Mathematics',
   'Engineering, mathematics, scientific research, and technology development.', 15),
  ('a1000001-0000-0000-0000-000000000001', 'TRAN', 'Transportation, Distribution & Logistics',
   'Moving people and goods via air, ground, rail, and water; supply chain management.', 16)
on conflict (state_id, code) do nothing;


-- Texas IBC-eligible credentials (representative subset, CCMR-eligible)
insert into state_credential_catalog
  (state_id, cluster_code, name, issuing_body, credential_type, is_ccmr_eligible,
   passing_score, exam_window_notes, metadata)
values
  -- Health Science
  ('a1000001-0000-0000-0000-000000000001', 'HLTH', 'Certified Nursing Assistant (CNA)',
   'Texas Department of Aging and Disability Services', 'certification', true,
   '70%', 'Spring window: Apr–May; Fall window: Oct–Nov',
   '{"tsi_waiver_eligible": false, "tea_ibc_list_id": "HLTH-001"}'::jsonb),

  ('a1000001-0000-0000-0000-000000000001', 'HLTH', 'Pharmacy Technician (CPhT)',
   'Pharmacy Technician Certification Board (PTCB)', 'certification', true,
   '1400/1600', 'Year-round testing at Pearson VUE centers',
   '{"tsi_waiver_eligible": false, "tea_ibc_list_id": "HLTH-002"}'::jsonb),

  ('a1000001-0000-0000-0000-000000000001', 'HLTH', 'Emergency Medical Technician — Basic (EMT-B)',
   'Texas Department of State Health Services', 'license', true,
   'Pass cognitive + psychomotor exams', 'Regional testing windows vary by EMS provider',
   '{"tsi_waiver_eligible": false, "tea_ibc_list_id": "HLTH-003"}'::jsonb),

  -- Information Technology
  ('a1000001-0000-0000-0000-000000000001', 'INFO', 'CompTIA Security+',
   'CompTIA', 'certification', true,
   '750/900', 'Year-round at Pearson VUE; school-based testing available',
   '{"tsi_waiver_eligible": false, "tea_ibc_list_id": "INFO-001"}'::jsonb),

  ('a1000001-0000-0000-0000-000000000001', 'INFO', 'CompTIA A+',
   'CompTIA', 'certification', true,
   '675/900 (Core 1) and 700/900 (Core 2)', 'Year-round at Pearson VUE',
   '{"tsi_waiver_eligible": false, "tea_ibc_list_id": "INFO-002"}'::jsonb),

  ('a1000001-0000-0000-0000-000000000001', 'INFO', 'CompTIA Network+',
   'CompTIA', 'certification', true,
   '720/900', 'Year-round at Pearson VUE',
   '{"tsi_waiver_eligible": false, "tea_ibc_list_id": "INFO-003"}'::jsonb),

  ('a1000001-0000-0000-0000-000000000001', 'INFO', 'Cisco Certified Network Associate (CCNA)',
   'Cisco', 'certification', true,
   '825/1000', 'Year-round at Pearson VUE',
   '{"tsi_waiver_eligible": false, "tea_ibc_list_id": "INFO-004"}'::jsonb),

  -- Manufacturing / Trades
  ('a1000001-0000-0000-0000-000000000001', 'MANU', 'AWS Certified Welder — D1.1 Structural',
   'American Welding Society', 'certification', true,
   'Visual + mechanical testing pass', 'Spring window: Mar–Apr; Fall window: Sep–Oct',
   '{"tsi_waiver_eligible": false, "tea_ibc_list_id": "MANU-001"}'::jsonb),

  ('a1000001-0000-0000-0000-000000000001', 'MANU', 'National Institute for Metalworking Skills (NIMS) — Machining Level 1',
   'NIMS', 'certification', true,
   '70% on written + performance demo', 'Year-round; school-based proctoring available',
   '{"tsi_waiver_eligible": false, "tea_ibc_list_id": "MANU-002"}'::jsonb),

  -- Transportation
  ('a1000001-0000-0000-0000-000000000001', 'TRAN', 'ASE Student Certification — Brakes (B5)',
   'National Institute for Automotive Service Excellence', 'certification', true,
   'Pass written exam', 'Year-round online proctored',
   '{"tsi_waiver_eligible": false, "tea_ibc_list_id": "TRAN-001"}'::jsonb),

  ('a1000001-0000-0000-0000-000000000001', 'TRAN', 'EPA Section 608 Technician Certification',
   'U.S. Environmental Protection Agency', 'license', true,
   '70% on proctored exam', 'Year-round at ESCO Institute locations',
   '{"tsi_waiver_eligible": false, "tea_ibc_list_id": "TRAN-002"}'::jsonb),

  -- Architecture & Construction
  ('a1000001-0000-0000-0000-000000000001', 'ARCH', 'NCCER Core Curriculum — Construction',
   'National Center for Construction Education and Research', 'certification', true,
   'Performance and written assessments', 'Year-round through NCCER accredited programs',
   '{"tsi_waiver_eligible": false, "tea_ibc_list_id": "ARCH-001"}'::jsonb),

  -- Finance / Business
  ('a1000001-0000-0000-0000-000000000001', 'FINA', 'Accredited Financial Counselor — AFC Student',
   'Association for Financial Counseling & Planning Education', 'certification', true,
   'Pass proctored exam', 'Semester-based testing windows',
   '{"tsi_waiver_eligible": false, "tea_ibc_list_id": "FINA-001"}'::jsonb),

  -- Hospitality
  ('a1000001-0000-0000-0000-000000000001', 'HOSP', 'ServSafe Manager Certification',
   'National Restaurant Association Educational Foundation', 'certification', true,
   '75%', 'Year-round at approved testing centers',
   '{"tsi_waiver_eligible": false, "tea_ibc_list_id": "HOSP-001"}'::jsonb),

  -- Cosmetology / Human Services
  ('a1000001-0000-0000-0000-000000000001', 'HUMS', 'Texas Cosmetology Operator License',
   'Texas Department of Licensing and Regulation', 'license', true,
   'Pass written + practical state board exams', 'Monthly testing windows at TDLR locations',
   '{"tsi_waiver_eligible": false, "tea_ibc_list_id": "HUMS-001"}'::jsonb),

  -- Law / Criminal Justice
  ('a1000001-0000-0000-0000-000000000001', 'LAWS', 'TCOLE Concepts of Law Enforcement',
   'Texas Commission on Law Enforcement', 'certification', true,
   'Pass written exam', 'Spring and fall school-based testing',
   '{"tsi_waiver_eligible": false, "tea_ibc_list_id": "LAWS-001"}'::jsonb),

  -- Agriculture
  ('a1000001-0000-0000-0000-000000000001', 'AGRI', 'FFA Agriscience Fair — Advanced Division',
   'National FFA Organization', 'certification', false,
   'Superior rating at state level', 'Annual spring state competition',
   '{"tsi_waiver_eligible": false, "tea_ibc_list_id": null}'::jsonb),

  -- Marketing
  ('a1000001-0000-0000-0000-000000000001', 'MKTG', 'DECA Competitive Events — Business Operations Research',
   'DECA Inc.', 'certification', false,
   'Top placement at state/ICDC', 'Annual spring competition',
   '{"tsi_waiver_eligible": false, "tea_ibc_list_id": null}'::jsonb)

on conflict do nothing;


-- Texas TEA A-F Accountability Config (2025)
insert into state_accountability_config
  (state_id, label, system_type, effective_year, is_current, config, notes)
values (
  'a1000001-0000-0000-0000-000000000001',
  '2025 TEA A-F Accountability — HS/K-12',
  'tea_af',
  2025,
  true,
  '{
    "grade_bands": {
      "A": [90, 100],
      "B": [80, 89],
      "C": [70, 79],
      "D": [60, 69],
      "F": [0,  59]
    },
    "components": [
      {
        "name": "Student Achievement",
        "weight": 1.0,
        "sub_components": [
          { "name": "STAAR All Subjects", "weight": 0.40, "cut_points": { "A": 60, "B": 53, "C": 41, "D": 35 } },
          { "name": "CCMR",              "weight": 0.40, "cut_points": { "A": 88, "B": 78, "C": 64, "D": 51 } },
          { "name": "Graduation Rate",   "weight": 0.20, "cut_points": { "A": 94, "B": 90, "C": 80, "D": 70 } }
        ]
      },
      {
        "name": "School Progress",
        "weight": 1.0,
        "sub_components": [
          { "name": "Academic Growth (Part A)", "weight": null, "note": "Best of Part A or Part B used" },
          { "name": "Relative Performance (Part B)", "weight": null, "note": "ED-adjusted CCMR; Table 5.5 lookup" }
        ],
        "cap_rule": "If either Part A or Part B < 60, domain capped at 89"
      }
    ],
    "overall": {
      "formula": "max(StudentAchievement, SchoolProgress) * 0.70 + ClosingGaps * 0.30",
      "safety_rules": {
        "three_fs": {
          "description": "If 3 of 4 areas (SA, Part A, Part B, CTG) score < 60, overall capped at 59",
          "areas": ["student_achievement", "part_a", "part_b", "closing_gaps"],
          "threshold": 60,
          "cap": 59,
          "trigger_count": 3
        },
        "three_ds": {
          "description": "If 3 of 4 areas < 70 AND student_achievement < 70, overall capped at 69",
          "areas": ["student_achievement", "part_a", "part_b", "closing_gaps"],
          "threshold": 70,
          "cap": 69,
          "trigger_count": 3,
          "additional_condition": "student_achievement < 70"
        }
      }
    },
    "source": "TEA 2025 Accountability Technical Guide, Chapter 5"
  }'::jsonb,
  'Matches lib/tea-accountability.ts cut points and scaling logic.'
)
on conflict (state_id, effective_year) do nothing;


-- Texas Partnerships
insert into state_partnerships
  (state_id, name, partner_type, region_code, website, contact_info, notes)
values
  ('a1000001-0000-0000-0000-000000000001',
   'Education Service Center Region 1', 'esc', 'ESC-1',
   'https://www.esc1.net',
   '{"phone": "956-984-6000", "address": "1900 W Schunior St, Edinburg, TX 78541"}'::jsonb,
   'Serves South Texas; primary ESC for Edinburg CISD and Rio Grande Valley districts.'),

  ('a1000001-0000-0000-0000-000000000001',
   'Education Service Center Region 13', 'esc', 'ESC-13',
   'https://www.esc13.net',
   '{"phone": "512-919-5313", "address": "5701 Springdale Rd, Austin, TX 78723"}'::jsonb,
   'Serves Central Texas; publishes the Region 13 CCMR Tracker upload format.'),

  ('a1000001-0000-0000-0000-000000000001',
   'Texas Education Agency', 'state_agency', null,
   'https://tea.texas.gov',
   '{"phone": "512-463-9734", "address": "1701 N Congress Ave, Austin, TX 78701"}'::jsonb,
   'Administers A-F accountability, CCMR reporting, and the IBC-eligible credential list.'),

  ('a1000001-0000-0000-0000-000000000001',
   'Texas Workforce Commission', 'workforce_board', null,
   'https://www.twc.texas.gov',
   '{"phone": "512-463-2222"}'::jsonb,
   'Administers apprenticeship programs and workforce credential alignment.')

on conflict do nothing;


-- Texas Reporting Formats
insert into state_reporting_formats
  (state_id, format_code, name, description, file_types, column_spec)
values
  (
    'a1000001-0000-0000-0000-000000000001',
    'region_13_tracker',
    'Region 13 CCMR Tracker',
    'ESC Region 13 Excel tracker; auto-detects class-year tabs and indicator columns.',
    '{xlsx}',
    '{
      "detection_hints": ["CCMR", "Region 13", "Class of"],
      "tab_pattern": "Class of \\d{4}",
      "required_columns": ["Student ID", "Last Name", "First Name"],
      "indicator_columns": {
        "TSI Reading": "tsi_reading", "TSI Math": "tsi_math",
        "SAT Reading": "sat_reading", "SAT Math": "sat_math",
        "ACT Reading": "act_reading", "ACT Math": "act_math",
        "College Prep ELA": "college_prep_ela", "College Prep Math": "college_prep_math",
        "AP Exam": "ap_exam", "IB Exam": "ib_exam",
        "Dual Credit ELA": "dual_credit_ela", "Dual Credit Math": "dual_credit_math",
        "OnRamps": "onramps", "IBC": "ibc"
      }
    }'::jsonb
  ),
  (
    'a1000001-0000-0000-0000-000000000001',
    'tea_ccmr_tracker',
    'TEA CCMR Tracker',
    'Official TEA Part I or Part II tracker file distributed to districts.',
    '{xlsx,csv}',
    '{
      "detection_hints": ["TEA", "Part I", "Part II", "PEIMS"],
      "required_columns": ["TSDS ID", "Student Name", "Campus"],
      "indicator_columns": {
        "TSI-R": "tsi_reading", "TSI-M": "tsi_math",
        "SAT-R": "sat_reading", "SAT-M": "sat_math",
        "ACT-R": "act_reading", "ACT-M": "act_math",
        "IBC": "ibc", "DC": "dual_credit_any",
        "CP-ELA": "college_prep_ela", "CP-Math": "college_prep_math"
      }
    }'::jsonb
  )
on conflict (state_id, format_code) do nothing;


-- ============================================================
-- SEED — CONNECTICUT
-- Placeholder state: national 16 Advance CTE clusters,
-- no accountability config yet, no reporting formats yet.
-- ============================================================

insert into states (id, name, code, accountability_system, career_cluster_framework, settings) values
  (
    'a2000002-0000-0000-0000-000000000001',
    'Connecticut',
    'CT',
    'placeholder',
    'advance_cte_16',
    '{
      "ccmr_enabled": false,
      "af_simulator_enabled": false,
      "ibc_catalog_enabled": false,
      "tsia_enabled": false,
      "ed_form_tracking": false,
      "note": "Placeholder — accountability rules and credential catalog not yet configured."
    }'::jsonb
  )
on conflict (code) do nothing;


-- Connecticut — National 16 Advance CTE Career Clusters
insert into state_career_clusters (state_id, code, name, description, sort_order) values
  ('a2000002-0000-0000-0000-000000000001', 'AGRI', 'Agriculture, Food & Natural Resources',
   'Careers in agriculture, food production, natural resources, and environmental science.', 1),
  ('a2000002-0000-0000-0000-000000000001', 'ARCH', 'Architecture & Construction',
   'Design, construction, and maintenance of buildings and infrastructure.', 2),
  ('a2000002-0000-0000-0000-000000000001', 'ARTS', 'Arts, A/V Technology & Communications',
   'Creative arts, audio/visual production, journalism, and telecommunications.', 3),
  ('a2000002-0000-0000-0000-000000000001', 'BUSI', 'Business Management & Administration',
   'Business operations, management, entrepreneurship, and administrative services.', 4),
  ('a2000002-0000-0000-0000-000000000001', 'EDUC', 'Education & Training',
   'Teaching, training, and education administration across all levels.', 5),
  ('a2000002-0000-0000-0000-000000000001', 'FINA', 'Finance',
   'Banking, investments, insurance, and financial planning.', 6),
  ('a2000002-0000-0000-0000-000000000001', 'GOVT', 'Government & Public Administration',
   'Planning, managing, and providing government and public-sector services.', 7),
  ('a2000002-0000-0000-0000-000000000001', 'HLTH', 'Health Science',
   'Patient care, public health, health informatics, and biomedical research.', 8),
  ('a2000002-0000-0000-0000-000000000001', 'HOSP', 'Hospitality & Tourism',
   'Travel, lodging, recreation, food service, and event management.', 9),
  ('a2000002-0000-0000-0000-000000000001', 'HUMS', 'Human Services',
   'Family and community services, counseling, and personal care.', 10),
  ('a2000002-0000-0000-0000-000000000001', 'INFO', 'Information Technology',
   'Networking, software development, cybersecurity, and data management.', 11),
  ('a2000002-0000-0000-0000-000000000001', 'LAWS', 'Law, Public Safety, Corrections & Security',
   'Legal services, law enforcement, fire protection, and emergency response.', 12),
  ('a2000002-0000-0000-0000-000000000001', 'MANU', 'Manufacturing',
   'Production, quality control, logistics, and maintenance of manufactured goods.', 13),
  ('a2000002-0000-0000-0000-000000000001', 'MKTG', 'Marketing',
   'Marketing research, merchandising, distribution, and promotion.', 14),
  ('a2000002-0000-0000-0000-000000000001', 'STEM', 'Science, Technology, Engineering & Mathematics',
   'Engineering, mathematics, scientific research, and technology development.', 15),
  ('a2000002-0000-0000-0000-000000000001', 'TRAN', 'Transportation, Distribution & Logistics',
   'Moving people and goods via air, ground, rail, and water; supply chain management.', 16)
on conflict (state_id, code) do nothing;


-- ============================================================
-- UPDATE EXISTING SEED DISTRICT → Texas
-- If the Edinburg CISD seed district already exists, assign it to TX.
-- ============================================================

update districts
  set state_id = 'a1000001-0000-0000-0000-000000000001'
  where id = 'a0000001-0000-0000-0000-000000000001'
    and state_id is null;
