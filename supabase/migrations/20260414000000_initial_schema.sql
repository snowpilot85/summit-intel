-- ============================================================
-- Summit Intel — CCMR Initial Schema
-- Migration: 20260414000000_initial_schema
-- ============================================================

-- ============================================================
-- EXTENSIONS
-- ============================================================

create extension if not exists "pgcrypto";


-- ============================================================
-- ENUM-LIKE TYPES (implemented as CHECK constraints on columns)
-- ============================================================

-- No native enum types — constraints are defined inline per column.
-- This makes adding values easier without ALTER TYPE.


-- ============================================================
-- DISTRICTS
-- ============================================================

create table if not exists districts (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  tea_district_id     text unique,
  esc_region          smallint,
  state_avg_ccmr_rate numeric(5,2),
  settings            jsonb not null default '{}',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);


-- ============================================================
-- CAMPUSES
-- ============================================================

create table if not exists campuses (
  id              uuid primary key default gen_random_uuid(),
  district_id     uuid not null references districts(id) on delete cascade,
  name            text not null,
  tea_campus_id   text unique,
  metadata        jsonb not null default '{}',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists campuses_district_id_idx on campuses(district_id);


-- ============================================================
-- SCHOOL YEARS
-- ============================================================

create table if not exists school_years (
  id              uuid primary key default gen_random_uuid(),
  district_id     uuid not null references districts(id) on delete cascade,
  label           text not null,            -- e.g. '2025-26'
  start_date      date not null,
  end_date        date not null,
  is_current      boolean not null default false,
  graduation_date date,
  created_at      timestamptz not null default now(),
  unique (district_id, label)
);

create index if not exists school_years_district_id_idx on school_years(district_id);

-- Only one current school year per district
create unique index if not exists school_years_one_current_per_district
  on school_years(district_id)
  where is_current = true;


-- ============================================================
-- STUDENTS
-- ============================================================

create table if not exists students (
  id                    uuid primary key default gen_random_uuid(),
  district_id           uuid not null references districts(id) on delete cascade,
  campus_id             uuid not null references campuses(id) on delete restrict,
  tsds_id               text not null,
  first_name            text not null,
  last_name             text not null,
  grade_level           smallint not null check (grade_level between 9 and 12),
  graduation_year       smallint not null,
  is_eb                 boolean not null default false,
  is_econ_disadvantaged boolean not null default false,
  is_special_ed         boolean not null default false,
  is_504                boolean not null default false,
  ed_form_collected     boolean not null default false,
  ed_form_date          date,
  ccmr_readiness        text not null default 'too_early'
                          check (ccmr_readiness in ('met','on_track','almost','at_risk','too_early')),
  ccmr_met_date         timestamptz,
  indicators_met_count  smallint not null default 0,
  metadata              jsonb not null default '{}',
  is_active             boolean not null default true,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique (district_id, tsds_id)
);

create index if not exists students_district_id_idx      on students(district_id);
create index if not exists students_campus_id_idx        on students(campus_id);
create index if not exists students_grade_level_idx      on students(grade_level);
create index if not exists students_ccmr_readiness_idx   on students(ccmr_readiness);
create index if not exists students_graduation_year_idx  on students(graduation_year);
create index if not exists students_name_idx             on students(last_name, first_name);


-- ============================================================
-- CCMR INDICATORS
-- ============================================================

create table if not exists ccmr_indicators (
  id             uuid primary key default gen_random_uuid(),
  student_id     uuid not null references students(id) on delete cascade,
  indicator_type text not null
                   check (indicator_type in (
                     'tsi_reading','tsi_math',
                     'sat_reading','sat_math',
                     'act_reading','act_math',
                     'college_prep_ela','college_prep_math',
                     'ap_exam','ib_exam',
                     'dual_credit_ela','dual_credit_math','dual_credit_any',
                     'onramps',
                     'ibc',
                     'associate_degree',
                     'level_i_ii_certificate',
                     'military_enlistment',
                     'iep_completion',
                     'sped_advanced_degree'
                   )),
  status         text not null default 'not_attempted'
                   check (status in ('met','in_progress','not_attempted','not_met')),
  met_date       date,
  score          numeric,
  threshold      numeric,
  course_grade   text,
  exam_date      date,
  source_year    text,                      -- e.g. '2025-26'
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (student_id, indicator_type)       -- one row per indicator per student
);

create index if not exists ccmr_indicators_student_id_idx      on ccmr_indicators(student_id);
create index if not exists ccmr_indicators_indicator_type_idx  on ccmr_indicators(indicator_type);
create index if not exists ccmr_indicators_status_idx          on ccmr_indicators(status);


-- ============================================================
-- INTERVENTIONS
-- ============================================================

create table if not exists interventions (
  id                     uuid primary key default gen_random_uuid(),
  student_id             uuid not null references students(id) on delete cascade,
  campus_id              uuid not null references campuses(id) on delete restrict,
  pathway_type           text,             -- mirrors indicator_type values
  title                  text not null,
  description            text,
  status                 text not null default 'recommended'
                           check (status in ('recommended','planned','in_progress','completed','expired','dismissed')),
  priority               smallint not null default 3 check (priority between 1 and 5),
  due_date               date,
  completed_date         date,
  assigned_to            text,
  projected_ccmr_impact  numeric(5,2),
  notes                  text,
  metadata               jsonb not null default '{}',
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create index if not exists interventions_student_id_idx  on interventions(student_id);
create index if not exists interventions_campus_id_idx   on interventions(campus_id);
create index if not exists interventions_status_idx      on interventions(status);


-- ============================================================
-- DATA UPLOADS
-- ============================================================

create table if not exists data_uploads (
  id               uuid primary key default gen_random_uuid(),
  district_id      uuid not null references districts(id) on delete cascade,
  school_year_id   uuid references school_years(id) on delete set null,
  file_name        text not null,
  source_type      text not null
                     check (source_type in (
                       'region_13_tracker','tea_ccmr_tracker',
                       'sat_act_scores','tsia_results',
                       'cte_ibc_data','dual_credit_transcripts','custom_csv'
                     )),
  status           text not null default 'processing'
                     check (status in ('processing','completed','completed_with_errors','failed')),
  records_total    integer not null default 0,
  records_imported integer not null default 0,
  records_skipped  integer not null default 0,
  records_errored  integer not null default 0,
  column_mapping   jsonb,
  error_log        jsonb,
  uploaded_by      uuid references auth.users(id) on delete set null,
  created_at       timestamptz not null default now(),
  completed_at     timestamptz
);

create index if not exists data_uploads_district_id_idx on data_uploads(district_id);


-- ============================================================
-- USER PROFILES
-- (extends Supabase auth.users — one row per user)
-- ============================================================

create table if not exists user_profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  district_id uuid not null references districts(id) on delete cascade,
  campus_id   uuid references campuses(id) on delete set null,
  full_name   text not null,
  role        text not null default 'viewer'
                check (role in ('district_admin','campus_admin','counselor','viewer')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists user_profiles_district_id_idx on user_profiles(district_id);
create index if not exists user_profiles_campus_id_idx   on user_profiles(campus_id);


-- ============================================================
-- CCMR ANNUAL SNAPSHOTS (historical YoY data)
-- ============================================================

create table if not exists ccmr_annual_snapshots (
  id                    uuid primary key default gen_random_uuid(),
  district_id           uuid not null references districts(id) on delete cascade,
  campus_id             uuid references campuses(id) on delete cascade,  -- null = district-level
  graduation_year       smallint not null,
  total_graduates       integer not null default 0,
  ccmr_met_count        integer not null default 0,
  ccmr_rate             numeric(5,2) not null default 0,
  state_avg_rate        numeric(5,2),
  eb_total              integer not null default 0,
  eb_met_count          integer not null default 0,
  eb_rate               numeric(5,2),
  econ_disadv_total     integer not null default 0,
  econ_disadv_met       integer not null default 0,
  econ_disadv_rate      numeric(5,2),
  sped_total            integer not null default 0,
  sped_met_count        integer not null default 0,
  sped_rate             numeric(5,2),
  indicator_breakdown   jsonb not null default '{}',
  created_at            timestamptz not null default now(),
  unique (district_id, campus_id, graduation_year)
);

create index if not exists ccmr_annual_snapshots_district_id_idx    on ccmr_annual_snapshots(district_id);
create index if not exists ccmr_annual_snapshots_graduation_year_idx on ccmr_annual_snapshots(graduation_year);


-- ============================================================
-- VIEWS
-- ============================================================

-- Per-campus CCMR summary for the current school year's seniors
create or replace view v_campus_ccmr_summary as
select
  s.district_id,
  s.campus_id,
  c.name                                                        as campus_name,
  s.graduation_year,
  count(*)                                                      as total_seniors,
  count(*) filter (where s.ccmr_readiness = 'met')             as ccmr_met,
  count(*) filter (where s.ccmr_readiness = 'at_risk')         as at_risk,
  count(*) filter (where s.ccmr_readiness = 'almost')          as almost,
  round(
    100.0 * count(*) filter (where s.ccmr_readiness = 'met')
    / nullif(count(*), 0),
    1
  )                                                             as ccmr_rate,
  count(*) filter (where s.is_eb)                              as eb_total,
  count(*) filter (where s.is_eb and s.ccmr_readiness = 'met') as eb_met,
  round(
    100.0 * count(*) filter (where s.is_eb and s.ccmr_readiness = 'met')
    / nullif(count(*) filter (where s.is_eb), 0),
    1
  )                                                             as eb_rate,
  count(*) filter (where s.is_econ_disadvantaged)              as econ_total,
  count(*) filter (where s.is_econ_disadvantaged and s.ccmr_readiness = 'met') as econ_met,
  count(*) filter (where s.is_econ_disadvantaged and not s.ed_form_collected)  as missing_ed_forms
from students s
join campuses c on c.id = s.campus_id
where s.grade_level = 12
  and s.is_active = true
group by s.district_id, s.campus_id, c.name, s.graduation_year;


-- Per-indicator breakdown across active seniors
create or replace view v_indicator_breakdown as
select
  s.district_id,
  s.graduation_year,
  i.indicator_type,
  count(*) as student_count
from ccmr_indicators i
join students s on s.id = i.student_id
where i.status = 'met'
  and s.grade_level = 12
  and s.is_active = true
group by s.district_id, s.graduation_year, i.indicator_type;


-- ============================================================
-- UPDATED_AT TRIGGER (shared function)
-- ============================================================

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger districts_updated_at
  before update on districts
  for each row execute function set_updated_at();

create trigger campuses_updated_at
  before update on campuses
  for each row execute function set_updated_at();

create trigger students_updated_at
  before update on students
  for each row execute function set_updated_at();

create trigger ccmr_indicators_updated_at
  before update on ccmr_indicators
  for each row execute function set_updated_at();

create trigger interventions_updated_at
  before update on interventions
  for each row execute function set_updated_at();

create trigger user_profiles_updated_at
  before update on user_profiles
  for each row execute function set_updated_at();


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table districts           enable row level security;
alter table campuses             enable row level security;
alter table school_years         enable row level security;
alter table students             enable row level security;
alter table ccmr_indicators      enable row level security;
alter table interventions        enable row level security;
alter table data_uploads         enable row level security;
alter table user_profiles        enable row level security;
alter table ccmr_annual_snapshots enable row level security;

-- Helper: returns the district_id of the currently authenticated user
create or replace function auth_user_district_id()
returns uuid language sql stable security definer as $$
  select district_id from user_profiles where id = auth.uid()
$$;

-- Helper: returns the role of the currently authenticated user
create or replace function auth_user_role()
returns text language sql stable security definer as $$
  select role from user_profiles where id = auth.uid()
$$;

-- districts: users can only see their own district
create policy "users see own district"
  on districts for select
  using (id = auth_user_district_id());

create policy "district admins update district"
  on districts for update
  using (id = auth_user_district_id() and auth_user_role() = 'district_admin');

-- campuses: scoped to district
create policy "users see own district campuses"
  on campuses for select
  using (district_id = auth_user_district_id());

create policy "district admins manage campuses"
  on campuses for all
  using (district_id = auth_user_district_id() and auth_user_role() = 'district_admin');

-- school_years: scoped to district
create policy "users see own district school years"
  on school_years for select
  using (district_id = auth_user_district_id());

create policy "district admins manage school years"
  on school_years for all
  using (district_id = auth_user_district_id() and auth_user_role() = 'district_admin');

-- students: district-wide read; campus admins/counselors scoped by campus
create policy "district users read students"
  on students for select
  using (district_id = auth_user_district_id());

create policy "district admins manage students"
  on students for all
  using (district_id = auth_user_district_id()
    and auth_user_role() in ('district_admin', 'campus_admin', 'counselor'));

-- ccmr_indicators: follows student access
create policy "district users read indicators"
  on ccmr_indicators for select
  using (
    exists (
      select 1 from students s
      where s.id = ccmr_indicators.student_id
        and s.district_id = auth_user_district_id()
    )
  );

create policy "staff manage indicators"
  on ccmr_indicators for all
  using (
    exists (
      select 1 from students s
      where s.id = ccmr_indicators.student_id
        and s.district_id = auth_user_district_id()
    )
    and auth_user_role() in ('district_admin', 'campus_admin', 'counselor')
  );

-- interventions: district read, staff write
create policy "district users read interventions"
  on interventions for select
  using (
    exists (
      select 1 from campuses c
      where c.id = interventions.campus_id
        and c.district_id = auth_user_district_id()
    )
  );

create policy "staff manage interventions"
  on interventions for all
  using (
    exists (
      select 1 from campuses c
      where c.id = interventions.campus_id
        and c.district_id = auth_user_district_id()
    )
    and auth_user_role() in ('district_admin', 'campus_admin', 'counselor')
  );

-- data_uploads: district admin only
create policy "district admins manage uploads"
  on data_uploads for all
  using (district_id = auth_user_district_id()
    and auth_user_role() in ('district_admin', 'campus_admin'));

-- user_profiles: users see own profile; district admins see all in district
create policy "users see own profile"
  on user_profiles for select
  using (id = auth.uid() or district_id = auth_user_district_id());

create policy "district admins manage profiles"
  on user_profiles for all
  using (district_id = auth_user_district_id() and auth_user_role() = 'district_admin');

-- ccmr_annual_snapshots: district read-only
create policy "district users read snapshots"
  on ccmr_annual_snapshots for select
  using (district_id = auth_user_district_id());

create policy "district admins manage snapshots"
  on ccmr_annual_snapshots for all
  using (district_id = auth_user_district_id() and auth_user_role() = 'district_admin');
