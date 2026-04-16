-- ============================================================
-- Summit Pathways — Work-Based Learning
-- Migration: 20260416000003_work_based_learning
--
-- Tracks student internships, job-shadowing, apprenticeships,
-- clinical rotations, and other employer-connected experiences.
-- ============================================================


create table if not exists work_based_learning (
  id              uuid primary key default gen_random_uuid(),
  student_id      uuid not null references students(id) on delete cascade,
  district_id     uuid not null references districts(id) on delete cascade,
  activity_type   text not null default 'internship'
                    check (activity_type in (
                      'internship',
                      'job_shadow',
                      'apprenticeship',
                      'clinical',
                      'cooperative_education',
                      'other'
                    )),
  employer_name   text not null,
  supervisor_name text,
  start_date      date not null,
  end_date        date,
  hours_completed numeric(6,1) not null default 0,
  is_paid         boolean not null default false,
  notes           text,
  metadata        jsonb not null default '{}',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists wbl_student_id_idx  on work_based_learning(student_id);
create index if not exists wbl_district_id_idx on work_based_learning(district_id);

create trigger work_based_learning_updated_at
  before update on work_based_learning
  for each row execute function set_updated_at();

alter table work_based_learning enable row level security;

create policy "district users read wbl"
  on work_based_learning for select
  using (district_id = auth_user_district_id());

create policy "district admins manage wbl"
  on work_based_learning for all
  using (
    district_id = auth_user_district_id()
    and auth_user_role() in ('district_admin', 'campus_admin', 'counselor')
  );
