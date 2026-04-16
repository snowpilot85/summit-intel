-- ============================================================
-- Summit Pathways — CTE Pathway Tables
-- Migration: 20260416000002_cte_pathways
--
-- Adds pathway structure scoped to the state layer:
--   programs_of_study     within each career cluster
--   pathway_credentials   links programs to the credential catalog
--   student_pathways      student enrollment + credential progress
--   labor_market_data     regional LMI per cluster
-- ============================================================


-- ============================================================
-- PROGRAMS OF STUDY
-- A named program within a career cluster (e.g., "Welding
-- Technology" within Manufacturing). Scoped to state via the
-- cluster FK.
-- ============================================================

create table if not exists programs_of_study (
  id                      uuid primary key default gen_random_uuid(),
  state_id                uuid not null references states(id) on delete cascade,
  cluster_id              uuid not null references state_career_clusters(id) on delete cascade,
  code                    text not null,             -- e.g., 'CYBER', 'WELD-TECH'
  name                    text not null,
  description             text,
  cip_code                text,                      -- federal CIP classification
  typical_duration_years  numeric(3,1) default 2.0,  -- most TX CTE programs are 2 yrs
  is_active               boolean not null default true,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  unique (state_id, code)
);

create index if not exists programs_of_study_state_id_idx   on programs_of_study(state_id);
create index if not exists programs_of_study_cluster_id_idx on programs_of_study(cluster_id);

create trigger programs_of_study_updated_at
  before update on programs_of_study
  for each row execute function set_updated_at();


-- ============================================================
-- PATHWAY CREDENTIALS
-- Join table: which credentials a program leads to.
-- One capstone credential + optional prep credentials.
-- ============================================================

create table if not exists pathway_credentials (
  id              uuid primary key default gen_random_uuid(),
  program_id      uuid not null references programs_of_study(id) on delete cascade,
  credential_id   uuid not null references state_credential_catalog(id) on delete cascade,
  is_capstone     boolean not null default false,  -- the primary/final credential
  sequence_order  smallint not null default 1,     -- order within the program pathway
  typical_grade   smallint,                        -- grade level when typically earned
  notes           text,
  created_at      timestamptz not null default now(),
  unique (program_id, credential_id)
);

create index if not exists pathway_credentials_program_id_idx    on pathway_credentials(program_id);
create index if not exists pathway_credentials_credential_id_idx on pathway_credentials(credential_id);


-- ============================================================
-- STUDENT PATHWAYS
-- Tracks a student's enrollment in a program of study and
-- their progress toward the capstone credential.
-- ============================================================

create table if not exists student_pathways (
  id                       uuid primary key default gen_random_uuid(),
  student_id               uuid not null references students(id) on delete cascade,
  state_id                 uuid not null references states(id) on delete restrict,
  cluster_id               uuid not null references state_career_clusters(id) on delete restrict,
  program_id               uuid not null references programs_of_study(id) on delete restrict,
  credential_id            uuid references state_credential_catalog(id) on delete set null,
  enrollment_status        text not null default 'enrolled'
                             check (enrollment_status in (
                               'enrolled',     -- actively in the program
                               'completed',    -- finished; may or may not have earned credential
                               'withdrawn',    -- dropped the program
                               'transferred'   -- moved to a different program
                             )),
  start_grade              smallint check (start_grade between 9 and 12),
  enrollment_date          date,
  expected_completion_date date,
  actual_completion_date   date,
  credential_earned        boolean not null default false,
  notes                    text,
  metadata                 jsonb not null default '{}',
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  unique (student_id, program_id)
);

create index if not exists student_pathways_student_id_idx   on student_pathways(student_id);
create index if not exists student_pathways_program_id_idx   on student_pathways(program_id);
create index if not exists student_pathways_cluster_id_idx   on student_pathways(cluster_id);
create index if not exists student_pathways_state_id_idx     on student_pathways(state_id);
create index if not exists student_pathways_status_idx       on student_pathways(enrollment_status);

create trigger student_pathways_updated_at
  before update on student_pathways
  for each row execute function set_updated_at();


-- ============================================================
-- LABOR MARKET DATA
-- Regional job outlook per career cluster.
-- region_code = 'statewide', 'ESC-1', 'ESC-13', etc.
-- ============================================================

create table if not exists labor_market_data (
  id                   uuid primary key default gen_random_uuid(),
  state_id             uuid not null references states(id) on delete cascade,
  cluster_id           uuid not null references state_career_clusters(id) on delete cascade,
  region_code          text not null,          -- 'statewide' or 'ESC-N'
  data_year            smallint not null,
  total_jobs           integer,
  annual_job_openings  integer,
  median_annual_salary integer,
  salary_entry_level   integer,
  salary_experienced   integer,
  growth_rate_pct      numeric(5,2),           -- projected 10-yr growth %
  top_occupations      jsonb not null default '[]',
  -- [{ title, soc_code, median_salary, annual_openings }]
  data_source          text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  unique (state_id, cluster_id, region_code, data_year)
);

create index if not exists labor_market_data_state_id_idx   on labor_market_data(state_id);
create index if not exists labor_market_data_cluster_id_idx on labor_market_data(cluster_id);

create trigger labor_market_data_updated_at
  before update on labor_market_data
  for each row execute function set_updated_at();


-- ============================================================
-- RLS
-- Programs + LMI: read-only for all authenticated users.
-- Student pathways: follow student access (district-scoped).
-- ============================================================

alter table programs_of_study  enable row level security;
alter table pathway_credentials enable row level security;
alter table student_pathways    enable row level security;
alter table labor_market_data   enable row level security;

create policy "authenticated users read programs"
  on programs_of_study for select
  using (auth.role() = 'authenticated');

create policy "authenticated users read pathway credentials"
  on pathway_credentials for select
  using (auth.role() = 'authenticated');

create policy "authenticated users read labor market data"
  on labor_market_data for select
  using (auth.role() = 'authenticated');

-- Student pathways: scoped to district via student FK
create policy "district users read student pathways"
  on student_pathways for select
  using (
    exists (
      select 1 from students s
      where s.id = student_pathways.student_id
        and s.district_id = auth_user_district_id()
    )
  );

create policy "staff manage student pathways"
  on student_pathways for all
  using (
    exists (
      select 1 from students s
      where s.id = student_pathways.student_id
        and s.district_id = auth_user_district_id()
    )
    and auth_user_role() in ('district_admin', 'campus_admin', 'counselor')
  );


-- ============================================================
-- SEED — TEXAS PROGRAMS OF STUDY
-- Fixed UUIDs so pathway_credentials + seed script can
-- reference them deterministically.
-- ============================================================

-- Health Science (HLTH)
insert into programs_of_study
  (id, state_id, cluster_id, code, name, description, cip_code, typical_duration_years)
select
  p.id, 'a1000001-0000-0000-0000-000000000001'::uuid, c.id, p.code, p.name, p.description, p.cip_code, p.yrs
from (values
  ('a1000001-0000-0000-0000-000000000001'::uuid, 'MED-ASST',   'Medical Assistant Technology',
   'Prepares students for clinical and administrative roles in physician offices and clinics. Includes patient intake, vitals, EHR documentation, and clinical procedures.',
   '51.0801', 2.0),
  ('a1000001-0000-0000-0000-000000000002'::uuid, 'NURS-SCI',   'Nursing Science',
   'Introduces nursing concepts including patient care, anatomy, and clinical practicum. Students may earn a CNA credential through the Practicum of Health Science course.',
   '51.1601', 2.0),
  ('a1000001-0000-0000-0000-000000000003'::uuid, 'EMT',        'Emergency Medical Technician',
   'Prepares students to respond to emergency situations. Aligns with the Texas DSHS EMT-Basic curriculum and leads to the state EMT-B license exam.',
   '51.0904', 1.0),
  ('a1000001-0000-0000-0000-000000000004'::uuid, 'PHARM-TECH', 'Pharmacy Technology',
   'Covers pharmacy operations, drug dosage calculations, inventory management, and pharmacy law. Leads to the PTCB CPhT certification.',
   '51.2001', 2.0),
  ('a1000001-0000-0000-0000-000000000005'::uuid, 'DENT-ASST',  'Dental Assisting',
   'Covers chairside assisting, radiography, infection control, and dental office management. Prepares students for entry-level roles in dental practices.',
   '51.0601', 2.0)
) as p(id, code, name, description, cip_code, yrs)
join state_career_clusters c
  on c.state_id = 'a1000001-0000-0000-0000-000000000001' and c.code = 'HLTH'
on conflict (state_id, code) do nothing;


-- Information Technology (INFO)
insert into programs_of_study
  (id, state_id, cluster_id, code, name, description, cip_code, typical_duration_years)
select
  p.id, 'a1000001-0000-0000-0000-000000000001'::uuid, c.id, p.code, p.name, p.description, p.cip_code, p.yrs
from (values
  ('a1000002-0000-0000-0000-000000000001'::uuid, 'CYBER',      'Cybersecurity',
   'Covers network defense, ethical hacking, cryptography, and security operations. Aligns with CompTIA Security+ and forms the foundation for a career in information security.',
   '11.1003', 2.0),
  ('a1000002-0000-0000-0000-000000000002'::uuid, 'NET-ADMIN',  'Network Administration',
   'Teaches network infrastructure design, configuration, troubleshooting, and administration. Leads to CompTIA A+ and Network+ certifications.',
   '11.0901', 2.0),
  ('a1000002-0000-0000-0000-000000000003'::uuid, 'WEB-DIGITAL', 'Web & Digital Communications',
   'Covers web design, front-end development, UX principles, and digital media production. Students build portfolio projects using HTML, CSS, and JavaScript.',
   '11.0801', 2.0),
  ('a1000002-0000-0000-0000-000000000004'::uuid, 'COMP-SCI',   'Computer Science',
   'Introduces programming fundamentals, data structures, and computational thinking. Prepares students for AP Computer Science and post-secondary CS pathways.',
   '11.0701', 2.0)
) as p(id, code, name, description, cip_code, yrs)
join state_career_clusters c
  on c.state_id = 'a1000001-0000-0000-0000-000000000001' and c.code = 'INFO'
on conflict (state_id, code) do nothing;


-- Manufacturing (MANU)
insert into programs_of_study
  (id, state_id, cluster_id, code, name, description, cip_code, typical_duration_years)
select
  p.id, 'a1000001-0000-0000-0000-000000000001'::uuid, c.id, p.code, p.name, p.description, p.cip_code, p.yrs
from (values
  ('a1000003-0000-0000-0000-000000000001'::uuid, 'WELD-TECH',  'Welding Technology',
   'Covers SMAW, MIG, TIG, and plasma cutting. Students work toward AWS D1.1 Structural Welder certification, one of the most in-demand IBC credentials in Texas.',
   '48.0508', 2.0),
  ('a1000003-0000-0000-0000-000000000002'::uuid, 'PRECIS-MFG', 'Precision Manufacturing / CNC',
   'Introduces CNC machining, blueprint reading, metrology, and quality control. Leads to NIMS Machining Level 1 credential.',
   '48.0502', 2.0),
  ('a1000003-0000-0000-0000-000000000003'::uuid, 'IND-MAINT',  'Industrial Maintenance Technology',
   'Covers electrical systems, hydraulics, pneumatics, and preventive maintenance in manufacturing environments. Leads to NCCER credentials.',
   '47.0303', 2.0)
) as p(id, code, name, description, cip_code, yrs)
join state_career_clusters c
  on c.state_id = 'a1000001-0000-0000-0000-000000000001' and c.code = 'MANU'
on conflict (state_id, code) do nothing;


-- Business Management & Administration (BUSI)
insert into programs_of_study
  (id, state_id, cluster_id, code, name, description, cip_code, typical_duration_years)
select
  p.id, 'a1000001-0000-0000-0000-000000000001'::uuid, c.id, p.code, p.name, p.description, p.cip_code, p.yrs
from (values
  ('a1000004-0000-0000-0000-000000000001'::uuid, 'BUS-MGMT',   'Business Management',
   'Covers business operations, leadership, human resources, and organizational behavior. Prepares students for management roles and post-secondary business programs.',
   '52.0201', 2.0),
  ('a1000004-0000-0000-0000-000000000002'::uuid, 'FIN-SVC',    'Financial Services',
   'Introduces financial planning, banking, investment principles, and consumer credit. Leads to the AFC Student Certification.',
   '52.0801', 2.0),
  ('a1000004-0000-0000-0000-000000000003'::uuid, 'ENTREP',     'Entrepreneurship',
   'Guides students through the business planning process, market research, financing, and launch strategy. Culminates in a business plan presentation.',
   '52.0701', 2.0)
) as p(id, code, name, description, cip_code, yrs)
join state_career_clusters c
  on c.state_id = 'a1000001-0000-0000-0000-000000000001' and c.code = 'BUSI'
on conflict (state_id, code) do nothing;


-- Law, Public Safety, Corrections & Security (LAWS)
insert into programs_of_study
  (id, state_id, cluster_id, code, name, description, cip_code, typical_duration_years)
select
  p.id, 'a1000001-0000-0000-0000-000000000001'::uuid, c.id, p.code, p.name, p.description, p.cip_code, p.yrs
from (values
  ('a1000005-0000-0000-0000-000000000001'::uuid, 'LAW-ENFC',   'Law Enforcement',
   'Covers criminal law, patrol procedures, arrest and control techniques, and professional ethics. Leads to TCOLE Concepts of Law Enforcement certification.',
   '43.0107', 2.0),
  ('a1000005-0000-0000-0000-000000000002'::uuid, 'CRIM-JUST',  'Criminal Justice',
   'Examines the criminal justice system including courts, corrections, and juvenile justice. Bridges theory and practice for students pursuing careers in public safety.',
   '43.0104', 2.0),
  ('a1000005-0000-0000-0000-000000000003'::uuid, 'FIRE-EMS',   'Fire & Emergency Services',
   'Prepares students for careers as firefighters and EMS responders. Covers fire suppression, hazmat, rescue operations, and EMT-Basic curriculum.',
   '43.0201', 2.0)
) as p(id, code, name, description, cip_code, yrs)
join state_career_clusters c
  on c.state_id = 'a1000001-0000-0000-0000-000000000001' and c.code = 'LAWS'
on conflict (state_id, code) do nothing;


-- Architecture & Construction (ARCH) — HVAC
insert into programs_of_study
  (id, state_id, cluster_id, code, name, description, cip_code, typical_duration_years)
select
  'a1000006-0000-0000-0000-000000000001'::uuid,
  'a1000001-0000-0000-0000-000000000001'::uuid, c.id,
  'HVAC-TECH', 'HVAC Technology',
  'Covers installation, maintenance, and repair of heating, ventilation, air conditioning, and refrigeration systems. Leads to EPA Section 608 certification.',
  '47.0201', 2.0
from state_career_clusters c
where c.state_id = 'a1000001-0000-0000-0000-000000000001' and c.code = 'ARCH'
on conflict (state_id, code) do nothing;


-- Transportation, Distribution & Logistics (TRAN) — Automotive
insert into programs_of_study
  (id, state_id, cluster_id, code, name, description, cip_code, typical_duration_years)
select
  'a1000007-0000-0000-0000-000000000001'::uuid,
  'a1000001-0000-0000-0000-000000000001'::uuid, c.id,
  'AUTO-TECH', 'Automotive Technology',
  'Covers engine systems, brakes, electrical, and suspension diagnostics using modern scan tools. Leads to ASE Student Certification.',
  '47.0604', 2.0
from state_career_clusters c
where c.state_id = 'a1000001-0000-0000-0000-000000000001' and c.code = 'TRAN'
on conflict (state_id, code) do nothing;


-- Hospitality & Tourism (HOSP) — Culinary Arts
insert into programs_of_study
  (id, state_id, cluster_id, code, name, description, cip_code, typical_duration_years)
select
  'a1000008-0000-0000-0000-000000000001'::uuid,
  'a1000001-0000-0000-0000-000000000001'::uuid, c.id,
  'CULIN-ARTS', 'Culinary Arts',
  'Covers food safety, classical cooking techniques, baking, and restaurant operations. Leads to ServSafe Manager Certification.',
  '12.0508', 2.0
from state_career_clusters c
where c.state_id = 'a1000001-0000-0000-0000-000000000001' and c.code = 'HOSP'
on conflict (state_id, code) do nothing;


-- Human Services (HUMS) — Cosmetology
insert into programs_of_study
  (id, state_id, cluster_id, code, name, description, cip_code, typical_duration_years)
select
  'a1000009-0000-0000-0000-000000000001'::uuid,
  'a1000001-0000-0000-0000-000000000001'::uuid, c.id,
  'COSMETOLOGY', 'Cosmetology',
  'Provides 1,000 TDLR-required hours in hair, skin, and nail care techniques. Leads to the Texas Cosmetology Operator License exam.',
  '12.0401', 1.5
from state_career_clusters c
where c.state_id = 'a1000001-0000-0000-0000-000000000001' and c.code = 'HUMS'
on conflict (state_id, code) do nothing;


-- ============================================================
-- SEED — PATHWAY CREDENTIALS
-- Links programs to the credentials they lead to.
-- Credential IDs looked up by name from state_credential_catalog.
-- ============================================================

insert into pathway_credentials (program_id, credential_id, is_capstone, sequence_order, typical_grade, notes)
select prog_id, cred.id, is_cap, seq, grade, note
from (values
  -- Medical Assistant Technology
  ('a1000001-0000-0000-0000-000000000001'::uuid, 'Certified Nursing Assistant (CNA)',              true,  1, 12, 'Primary capstone — CNA awarded through Practicum of Health Science'),
  -- Nursing Science
  ('a1000001-0000-0000-0000-000000000002'::uuid, 'Certified Nursing Assistant (CNA)',              true,  1, 11, 'CNA exam typically taken in grade 11 or 12'),
  -- EMT
  ('a1000001-0000-0000-0000-000000000003'::uuid, 'Emergency Medical Technician — Basic (EMT-B)',   true,  1, 12, 'State EMT-B license; pass cognitive + psychomotor'),
  -- Pharmacy Technology
  ('a1000001-0000-0000-0000-000000000004'::uuid, 'Pharmacy Technician (CPhT)',                     true,  1, 12, 'PTCB CPhT exam; typically taken senior year'),
  -- Cybersecurity
  ('a1000002-0000-0000-0000-000000000001'::uuid, 'CompTIA Security+',                              true,  2, 12, 'Capstone certification; requires A+ foundation recommended'),
  ('a1000002-0000-0000-0000-000000000001'::uuid, 'CompTIA A+',                                     false, 1, 11, 'Foundation cert; typically earned junior year before Security+'),
  -- Network Administration
  ('a1000002-0000-0000-0000-000000000002'::uuid, 'CompTIA Network+',                               true,  2, 12, 'Capstone for networking pathway'),
  ('a1000002-0000-0000-0000-000000000002'::uuid, 'CompTIA A+',                                     false, 1, 11, 'Foundation cert earned first'),
  -- Welding Technology
  ('a1000003-0000-0000-0000-000000000001'::uuid, 'AWS Certified Welder — D1.1 Structural',         true,  1, 12, 'High-demand IBC; structural welding certification'),
  -- Precision Manufacturing / CNC
  ('a1000003-0000-0000-0000-000000000002'::uuid, 'NIMS Machining Level 1',                         true,  1, 11, 'NIMS Level 1 can be earned junior year; Level 2 after graduation'),
  -- Industrial Maintenance
  ('a1000003-0000-0000-0000-000000000003'::uuid, 'NCCER Core Curriculum — Construction',           true,  1, 11, 'NCCER Core is the standard industrial maintenance entry credential'),
  -- Financial Services
  ('a1000004-0000-0000-0000-000000000002'::uuid, 'AFC Student Certification',                      true,  1, 12, 'AFC student-level credential for financial services pathway'),
  -- Law Enforcement
  ('a1000005-0000-0000-0000-000000000001'::uuid, 'TCOLE Concepts of Law Enforcement',             true,  1, 12, 'TCOLE concepts cert; prerequisite for academy enrollment'),
  -- Criminal Justice
  ('a1000005-0000-0000-0000-000000000002'::uuid, 'TCOLE Concepts of Law Enforcement',             true,  1, 12, 'Same TCOLE credential; criminal justice pathway variant'),
  -- Fire & Emergency Services
  ('a1000005-0000-0000-0000-000000000003'::uuid, 'Emergency Medical Technician — Basic (EMT-B)',   true,  1, 12, 'EMT-B is the standard credential for fire/EMS pathway'),
  -- HVAC Technology
  ('a1000006-0000-0000-0000-000000000001'::uuid, 'EPA Section 608 Technician Certification',       true,  1, 11, 'EPA 608 can be earned junior year; required for any HVAC work'),
  -- Automotive Technology
  ('a1000007-0000-0000-0000-000000000001'::uuid, 'ASE Student Certification — Brakes (B5)',        true,  1, 12, 'ASE B5 Brakes is the most accessible student-level ASE cert'),
  -- Culinary Arts
  ('a1000008-0000-0000-0000-000000000001'::uuid, 'ServSafe Manager Certification',                 true,  1, 11, 'ServSafe can be earned junior year; required by most food-service employers'),
  -- Cosmetology
  ('a1000009-0000-0000-0000-000000000001'::uuid, 'Texas Cosmetology Operator License',             true,  1, 12, '1000-hr TDLR requirement; exam taken after completion')
) as v(prog_id, cred_name, is_cap, seq, grade, note)
join state_credential_catalog cred
  on cred.state_id = 'a1000001-0000-0000-0000-000000000001'
  and cred.name = v.cred_name
on conflict (program_id, credential_id) do nothing;


-- ============================================================
-- SEED — LABOR MARKET DATA (Texas, 2024)
-- Statewide + ESC Region 1 (South Texas) for top 8 clusters.
-- Salary figures in USD; growth rate is 10-year projection.
-- Sources: Texas Workforce Commission, BLS OES 2024.
-- ============================================================

insert into labor_market_data
  (state_id, cluster_id, region_code, data_year,
   total_jobs, annual_job_openings, median_annual_salary,
   salary_entry_level, salary_experienced,
   growth_rate_pct, top_occupations, data_source)
select
  'a1000001-0000-0000-0000-000000000001'::uuid, c.id,
  lm.region, lm.yr,
  lm.total_jobs, lm.openings, lm.median_sal,
  lm.entry_sal, lm.exp_sal, lm.growth,
  lm.top_occ::jsonb, 'Texas Workforce Commission / BLS OES 2024'
from (values
  -- ── Health Science ─────────────────────────────────────────
  ('HLTH', 'statewide', 2024,
   645200, 42800, 52800, 31200, 92400, 15.2,
   '[{"title":"Registered Nurses","soc":"29-1141","median_salary":77600,"annual_openings":12400},{"title":"Licensed Vocational Nurses","soc":"29-2061","median_salary":54200,"annual_openings":5800},{"title":"Medical Assistants","soc":"31-9092","median_salary":38100,"annual_openings":7200},{"title":"Nursing Assistants (CNA)","soc":"31-1131","median_salary":32400,"annual_openings":9100},{"title":"Pharmacy Technicians","soc":"29-2052","median_salary":38800,"annual_openings":3600}]'),
  ('HLTH', 'ESC-1', 2024,
   48200, 3100, 39400, 28800, 74200, 14.8,
   '[{"title":"Registered Nurses","soc":"29-1141","median_salary":68400,"annual_openings":920},{"title":"Nursing Assistants (CNA)","soc":"31-1131","median_salary":29800,"annual_openings":680},{"title":"Medical Assistants","soc":"31-9092","median_salary":33600,"annual_openings":540},{"title":"Pharmacy Technicians","soc":"29-2052","median_salary":34200,"annual_openings":280}]'),

  -- ── Information Technology ─────────────────────────────────
  ('INFO', 'statewide', 2024,
   382400, 28200, 97500, 52400, 158200, 11.8,
   '[{"title":"Software Developers","soc":"15-1252","median_salary":124800,"annual_openings":7400},{"title":"Information Security Analysts","soc":"15-1212","median_salary":108600,"annual_openings":3200},{"title":"Network & Systems Admins","soc":"15-1244","median_salary":82400,"annual_openings":3800},{"title":"Computer Support Specialists","soc":"15-1232","median_salary":54200,"annual_openings":5600},{"title":"Database Administrators","soc":"15-1242","median_salary":98200,"annual_openings":1800}]'),
  ('INFO', 'ESC-1', 2024,
   22100, 1620, 71200, 41800, 118400, 10.9,
   '[{"title":"Network & Systems Admins","soc":"15-1244","median_salary":68400,"annual_openings":480},{"title":"Computer Support Specialists","soc":"15-1232","median_salary":46800,"annual_openings":520},{"title":"Information Security Analysts","soc":"15-1212","median_salary":92400,"annual_openings":210}]'),

  -- ── Manufacturing ─────────────────────────────────────────
  ('MANU', 'statewide', 2024,
   921000, 54800, 49200, 34800, 78400, 4.1,
   '[{"title":"Welders, Cutters & Solderers","soc":"51-4121","median_salary":47800,"annual_openings":8200},{"title":"Machinists","soc":"51-4041","median_salary":52400,"annual_openings":3400},{"title":"Industrial Maintenance Mechanics","soc":"49-9041","median_salary":58200,"annual_openings":5200},{"title":"CNC Machine Tool Operators","soc":"51-4011","median_salary":44800,"annual_openings":4800},{"title":"First-Line Production Supervisors","soc":"51-1011","median_salary":68400,"annual_openings":4200}]'),
  ('MANU', 'ESC-1', 2024,
   31400, 1920, 42100, 31200, 64800, 3.2,
   '[{"title":"Welders, Cutters & Solderers","soc":"51-4121","median_salary":43200,"annual_openings":620},{"title":"Industrial Maintenance Mechanics","soc":"49-9041","median_salary":52400,"annual_openings":380},{"title":"CNC Machine Tool Operators","soc":"51-4011","median_salary":39800,"annual_openings":340}]'),

  -- ── Business Management & Administration ─────────────────
  ('BUSI', 'statewide', 2024,
   448200, 34600, 63400, 38200, 118600, 7.9,
   '[{"title":"General & Operations Managers","soc":"11-1021","median_salary":98400,"annual_openings":8200},{"title":"Administrative Services Managers","soc":"11-3012","median_salary":102800,"annual_openings":2400},{"title":"Human Resources Specialists","soc":"13-1071","median_salary":64200,"annual_openings":4800},{"title":"Financial Managers","soc":"11-3031","median_salary":142600,"annual_openings":2800},{"title":"Office Clerks, General","soc":"43-9061","median_salary":38200,"annual_openings":9800}]'),
  ('BUSI', 'ESC-1', 2024,
   28700, 2100, 48200, 30400, 88400, 7.1,
   '[{"title":"General & Operations Managers","soc":"11-1021","median_salary":78400,"annual_openings":680},{"title":"Human Resources Specialists","soc":"13-1071","median_salary":52400,"annual_openings":380},{"title":"Office Clerks, General","soc":"43-9061","median_salary":33800,"annual_openings":720}]'),

  -- ── Law, Public Safety, Corrections & Security ───────────
  ('LAWS', 'statewide', 2024,
   124400, 8200, 54100, 38400, 84200, 6.3,
   '[{"title":"Police & Sheriff Patrol Officers","soc":"33-3051","median_salary":64800,"annual_openings":3200},{"title":"Correctional Officers","soc":"33-1011","median_salary":46800,"annual_openings":2400},{"title":"Firefighters","soc":"33-2011","median_salary":58200,"annual_openings":1400},{"title":"EMTs & Paramedics","soc":"29-2040","median_salary":38400,"annual_openings":1800},{"title":"Security Guards","soc":"33-9032","median_salary":34200,"annual_openings":4200}]'),
  ('LAWS', 'ESC-1', 2024,
   9800, 640, 45300, 32800, 68200, 5.8,
   '[{"title":"Police & Sheriff Patrol Officers","soc":"33-3051","median_salary":54200,"annual_openings":240},{"title":"Correctional Officers","soc":"33-1011","median_salary":41800,"annual_openings":180},{"title":"Firefighters","soc":"33-2011","median_salary":48400,"annual_openings":82}]'),

  -- ── Transportation, Distribution & Logistics ─────────────
  ('TRAN', 'statewide', 2024,
   682400, 48200, 52400, 36400, 82400, 5.6,
   '[{"title":"Heavy Truck Drivers","soc":"53-3032","median_salary":52800,"annual_openings":14200},{"title":"Automotive Service Technicians","soc":"49-3023","median_salary":48200,"annual_openings":5800},{"title":"Logisticians","soc":"13-1081","median_salary":78400,"annual_openings":3200},{"title":"Industrial Truck Operators","soc":"53-7051","median_salary":41800,"annual_openings":6400}]'),
  ('TRAN', 'ESC-1', 2024,
   38200, 2640, 44200, 32800, 68400, 5.1,
   '[{"title":"Automotive Service Technicians","soc":"49-3023","median_salary":42400,"annual_openings":420},{"title":"Heavy Truck Drivers","soc":"53-3032","median_salary":48400,"annual_openings":820}]'),

  -- ── Architecture & Construction ───────────────────────────
  ('ARCH', 'statewide', 2024,
   512800, 38400, 54800, 36200, 88400, 8.4,
   '[{"title":"Construction Managers","soc":"11-9021","median_salary":102800,"annual_openings":3400},{"title":"HVAC Mechanics & Installers","soc":"49-9021","median_salary":54800,"annual_openings":4200},{"title":"Electricians","soc":"47-2111","median_salary":62400,"annual_openings":5800},{"title":"Plumbers, Pipefitters","soc":"47-2152","median_salary":62800,"annual_openings":4400}]'),
  ('ARCH', 'ESC-1', 2024,
   28400, 2020, 44800, 32400, 72400, 7.8,
   '[{"title":"HVAC Mechanics & Installers","soc":"49-9021","median_salary":48200,"annual_openings":320},{"title":"Electricians","soc":"47-2111","median_salary":54800,"annual_openings":420},{"title":"Construction Laborers","soc":"47-2061","median_salary":38400,"annual_openings":620}]')

) as lm(cluster_code, region, yr, total_jobs, openings, median_sal, entry_sal, exp_sal, growth, top_occ)
join state_career_clusters c
  on c.state_id = 'a1000001-0000-0000-0000-000000000001' and c.code = lm.cluster_code
on conflict (state_id, cluster_id, region_code, data_year) do nothing;
