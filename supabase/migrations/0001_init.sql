-- =====================================================================
-- Socilift SaaS — Initial Schema
-- Target: Supabase (Postgres 15+)
-- =====================================================================
-- Notes:
--  - auth.users is Supabase's built-in table. `profiles` mirrors it 1:1.
--  - Every RLS policy below relies on two helper functions defined near
--    the bottom: user_org_role() and has_brand_access(). Keep them in
--    sync if you add new access rules — don't duplicate the logic
--    inline in each policy.
--  - JSONB is used only for genuinely free-form / platform-varying data
--    (brand `details`, metric `gender_pct`/`age_pct`, AI job `result`).
--    Everything used for filtering, sorting, or security lives in real
--    columns.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------------------

create type org_role as enum ('dashboard_admin', 'manager', 'creator', 'view_only');

create type platform_code as enum ('IG', 'TikTok', 'YouTube', 'FB', 'X', 'Threads');

create type content_status as enum (
  'ideation', 'scripting', 'take_konten', 'editing', 'scheduled', 'published'
);

create type ai_job_status as enum (
  'queued', 'uploading', 'file_processing', 'extracting',
  'validating', 'ready_to_review', 'imported', 'failed'
);

create type notification_type as enum ('info', 'warning', 'maintenance', 'feature_update', 'critical');

-- ---------------------------------------------------------------------
-- IDENTITY
-- ---------------------------------------------------------------------

-- Mirrors auth.users. Created via a trigger (see bottom) on signup.
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  display_name text,
  created_at timestamptz not null default now()
);

-- A tenant. One org can hold many brands and many members.
create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

create table organization_members (
  org_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role org_role not null default 'creator',
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);

create index idx_org_members_user on organization_members(user_id);

-- ---------------------------------------------------------------------
-- BRANDS
-- ---------------------------------------------------------------------

create table brands (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  color text not null default '#2563EB',
  pillars text[] not null default '{}',
  funnels text[] not null default '{}',
  objectives text[] not null default '{}',
  -- niche, productServiceDesc, targetAudience, brandPositioning,
  -- toneOfVoice, mainOffer, usp
  details jsonb not null default '{}',
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create index idx_brands_org on brands(org_id);

-- Explicit brand restriction for non-admin users. A dashboard_admin or
-- manager with NO rows here has access to ALL brands in the org (same
-- convention as the old Sheets app). A creator/view_only with no rows
-- has access to NONE — rows must be added explicitly for them.
create table user_brand_access (
  user_id uuid not null references profiles(id) on delete cascade,
  brand_id uuid not null references brands(id) on delete cascade,
  primary key (user_id, brand_id)
);

-- Same convention, but for platforms within brands the user can see.
create table user_platform_access (
  user_id uuid not null references profiles(id) on delete cascade,
  org_id uuid not null references organizations(id) on delete cascade,
  platform platform_code not null,
  primary key (user_id, org_id, platform)
);

-- ---------------------------------------------------------------------
-- CONTENT PLANNER
-- ---------------------------------------------------------------------

create table contents (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references brands(id) on delete cascade,
  title text not null,
  platform platform_code not null,
  format text,
  pillar text,
  funnel text,
  objective text,
  status content_status not null default 'ideation',
  scheduled_date timestamptz,
  cart_title text,
  content_reference_url text,
  hook text,
  hook_visual text,
  script text,
  body_visual text,
  cta text,
  cta_visual text,
  caption text,
  drive_link text,
  notes text,
  duration_slides text,
  ai_prompt text,
  gcal_event_id text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_contents_brand on contents(brand_id);
create index idx_contents_brand_platform on contents(brand_id, platform);
create index idx_contents_scheduled on contents(scheduled_date);

-- One row per approved phase. Replaces the old JSON blob
-- `approvalStatus: { Ideation: {...}, Scripting: {...} }`.
-- A phase with no row here = not yet approved.
create table content_approvals (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null references contents(id) on delete cascade,
  phase content_status not null,
  approved_by uuid not null references profiles(id),
  approved_at timestamptz not null default now(),
  unique (content_id, phase)
);

create table content_comments (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null references contents(id) on delete cascade,
  user_id uuid not null references profiles(id),
  body text not null,
  resolved boolean not null default false,
  resolved_by uuid references profiles(id),
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_content_comments_content on content_comments(content_id);

create table backlog_items (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references brands(id) on delete cascade,
  concept text not null,
  platform platform_code not null,
  notes text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create index idx_backlog_brand on backlog_items(brand_id);

-- ---------------------------------------------------------------------
-- GOALS  (baseline-tracking logic preserved from the old app)
-- ---------------------------------------------------------------------

create table goals (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references brands(id) on delete cascade,
  platform platform_code not null,
  metric text not null,          -- e.g. 'Followers', 'Views', 'Engagement'
  target numeric not null,
  baseline_current numeric not null default 0,
  metric_baseline_value numeric not null default 0,
  metric_baseline_at timestamptz,
  deadline date not null,
  status text not null default 'Active',
  created_at timestamptz not null default now()
);

create index idx_goals_brand on goals(brand_id);

-- ---------------------------------------------------------------------
-- METRICS
-- ---------------------------------------------------------------------
-- Raw metrics only. Calculated ratios (engagement, click_rate, hook_rate,
-- hold_rate, watched_full_video_pct, skip_rate, avg_watch_time) are
-- intentionally NOT stored here — expose them via the `metrics_calculated`
-- view below so they never go stale relative to the raw numbers.

create table metrics (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null references contents(id) on delete cascade,
  brand_id uuid not null references brands(id) on delete cascade,
  platform platform_code not null,
  date_logged date not null,

  views numeric,
  impressions numeric,
  likes numeric,
  comments numeric,
  shares numeric,
  reposts numeric,
  saves numeric,
  clicks numeric,
  thru_plays numeric,
  three_second_watch_time numeric,
  purchase_value numeric,
  views_followers numeric,
  views_non_followers numeric,
  watch_time numeric,
  interactions numeric,
  profile_activity numeric,
  new_followers numeric,
  full_watch_views numeric,
  skipped_views numeric,
  reels_skipped_views numeric,

  retention_0s numeric, retention_5s numeric, retention_10s numeric,
  retention_15s numeric, retention_30s numeric, retention_45s numeric,
  retention_60s numeric, retention_80s numeric, retention_100s numeric,
  retention_120s numeric,

  gender_pct jsonb,      -- {"male": 40, "female": 60}
  age_pct jsonb,         -- {"18-24": 35, "25-34": 42}
  location jsonb,        -- {"Jakarta": 70, "Bandung": 30} or plain string wrapped as {"_": "Jakarta"}

  subscribers numeric,
  video_views numeric,
  total_viewers numeric,
  total_play_time numeric,
  profile_views numeric,
  post_views numeric,

  created_at timestamptz not null default now(),

  -- This constraint replaces the manual dedup logic (`metricCompositeKey_`)
  -- that used to scan the whole sheet on every upload.
  unique (content_id, brand_id, platform, date_logged)
);

create index idx_metrics_brand_platform on metrics(brand_id, platform);
create index idx_metrics_content on metrics(content_id);
create index idx_metrics_date on metrics(date_logged);

-- Calculated fields — STORED columns, not a view.
-- Confirmed against the source product's live spreadsheet: engagement,
-- avgWatchTime, clickRate, hookRate, holdRate, watchedFullVideoPct,
-- skipRate, and avgReelsSkipRate are physical columns there too, written
-- by a recalculation step at save time (`applyCalculatedMetricFields_`).
-- We keep that shape for parity, but recalculation MUST happen in one
-- place only (a single Postgres function/trigger below) — the old app's
-- bug class was recalculating in multiple JS call sites that could drift
-- out of sync. Never let the client compute and send these directly.
alter table metrics add column engagement numeric;
alter table metrics add column avg_watch_time numeric;
alter table metrics add column click_rate numeric;
alter table metrics add column hook_rate numeric;
alter table metrics add column hold_rate numeric;
alter table metrics add column watched_full_video_pct numeric;
alter table metrics add column skip_rate numeric;
alter table metrics add column avg_reels_skip_rate numeric;

create or replace function recalc_metric_fields()
returns trigger
language plpgsql as $$
begin
  new.engagement := case when coalesce(new.views, 0) > 0
    then round((coalesce(new.interactions, coalesce(new.likes,0) + coalesce(new.comments,0) + coalesce(new.shares,0) + coalesce(new.saves,0) + coalesce(new.reposts,0)) / new.views) * 100, 2)
  end;
  new.avg_watch_time := case when coalesce(new.views, 0) > 0 and new.watch_time is not null
    then round(new.watch_time / new.views, 2)
  end;
  new.click_rate := case when coalesce(new.impressions, 0) > 0 and new.clicks is not null
    then round((new.clicks / new.impressions) * 100, 2)
  end;
  new.hook_rate := case when coalesce(new.impressions, 0) > 0 and new.three_second_watch_time is not null
    then round((new.three_second_watch_time / new.impressions) * 100, 2)
  end;
  new.hold_rate := case when coalesce(new.impressions, 0) > 0 and new.thru_plays is not null
    then round((new.thru_plays / new.impressions) * 100, 2)
  end;
  new.watched_full_video_pct := case when coalesce(new.views, 0) > 0 and new.full_watch_views is not null
    then round((new.full_watch_views / new.views) * 100, 2)
  end;
  new.skip_rate := case when coalesce(new.views, 0) > 0 and new.skipped_views is not null
    then round((new.skipped_views / new.views) * 100, 2)
  end;
  new.avg_reels_skip_rate := case when coalesce(new.views, 0) > 0 and new.reels_skipped_views is not null
    then round((new.reels_skipped_views / new.views) * 100, 2)
  end;
  return new;
end;
$$;

create trigger trg_recalc_metric_fields
  before insert or update on metrics
  for each row execute function recalc_metric_fields();

-- ---------------------------------------------------------------------
-- ACTIVITY LOG
-- ---------------------------------------------------------------------

create table activity_logs (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references brands(id) on delete cascade,
  user_id uuid references profiles(id),
  action text not null,
  meta text,
  created_at timestamptz not null default now()
);

create index idx_activity_brand on activity_logs(brand_id, created_at desc);

-- ---------------------------------------------------------------------
-- NOTIFICATIONS  (broadcast + per-user read state, not per-row-per-reader)
-- ---------------------------------------------------------------------

create table notifications (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade, -- null = global broadcast to all orgs
  title text not null,
  message text not null,
  type notification_type not null default 'info',
  force_popup boolean not null default false,
  action_label text,
  action_url text,
  start_at timestamptz,
  end_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table notification_reads (
  notification_id uuid not null references notifications(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (notification_id, user_id)
);

-- ---------------------------------------------------------------------
-- AI EXTRACTOR  (screenshot/video -> Gemini -> raw metrics)
-- ---------------------------------------------------------------------

create table ai_extractor_jobs (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references brands(id) on delete cascade,
  user_id uuid references profiles(id),
  file_name text not null,
  file_mime_type text not null,
  file_size bigint not null,
  platform platform_code not null,
  date_logged date not null,
  storage_path text,          -- Supabase Storage path (temp bucket, replaces Drive)
  gemini_file_uri text,
  gemini_file_name text,
  status ai_job_status not null default 'queued',
  progress smallint not null default 0,
  error_message text,
  warnings jsonb not null default '[]',
  result jsonb,                -- extracted rows + extractionSummary
  imported_metric_ids uuid[] not null default '{}',
  retry_count smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  imported_at timestamptz
);

create index idx_ai_jobs_brand on ai_extractor_jobs(brand_id);
create index idx_ai_jobs_status on ai_extractor_jobs(status) where status not in ('imported', 'failed');

-- ---------------------------------------------------------------------
-- SOCILIFT AI CHAT
-- ---------------------------------------------------------------------

create table ai_chat_sessions (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references brands(id) on delete cascade,
  user_id uuid references profiles(id),
  title text not null default 'Socilift AI Chat',
  main_topic text,
  platform platform_code,
  funnel text,
  objective text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_message_at timestamptz not null default now()
);

create index idx_ai_sessions_brand on ai_chat_sessions(brand_id, last_message_at desc);

create table ai_chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references ai_chat_sessions(id) on delete cascade,
  brand_id uuid not null references brands(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  message_text text not null default '',
  message_type text not null default 'text',
  intent_tag text,
  context_tags text,
  draft jsonb,                 -- populated when message_type = 'draft'
  created_at timestamptz not null default now()
);

create index idx_ai_messages_session on ai_chat_messages(session_id, created_at);

create table ai_usage_logs (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references brands(id) on delete cascade,
  user_id uuid references profiles(id),
  feature_source text not null,
  model_name text,
  request_type text,
  input_tokens integer,
  output_tokens integer,
  status text not null,
  error_code text,
  error_message text,
  created_at timestamptz not null default now()
);

-- Gemini key is stored server-side ONLY. Never select this table from
-- the client — always go through a server route / edge function that
-- reads it, calls Gemini, and returns just the result.
create table gemini_settings (
  org_id uuid primary key references organizations(id) on delete cascade,
  api_key_encrypted text,       -- encrypt at the application layer before insert
  selected_model text not null default 'auto',
  status text not null default 'Not Connected',
  last_tested_at timestamptz,
  updated_at timestamptz not null default now()
);

-- =====================================================================
-- HELPER FUNCTIONS FOR RLS
-- =====================================================================

create or replace function user_org_role(p_org_id uuid)
returns org_role
language sql stable security definer as $$
  select role from organization_members
  where org_id = p_org_id and user_id = auth.uid()
$$;

create or replace function has_brand_access(p_brand_id uuid)
returns boolean
language sql stable security definer as $$
  select exists (
    select 1
    from brands b
    join organization_members om on om.org_id = b.org_id and om.user_id = auth.uid()
    where b.id = p_brand_id
      and (
        om.role in ('dashboard_admin', 'manager')
        and not exists (select 1 from user_brand_access uba where uba.user_id = auth.uid() and uba.brand_id = b.id and false)
        -- admins/managers get full access UNLESS restricted rows exist for them
        or exists (select 1 from user_brand_access uba where uba.user_id = auth.uid() and uba.brand_id = b.id)
      )
  )
  or exists (
    -- admin/manager with zero restriction rows anywhere in the org = full org access
    select 1
    from brands b
    join organization_members om on om.org_id = b.org_id and om.user_id = auth.uid()
    where b.id = p_brand_id
      and om.role in ('dashboard_admin', 'manager')
      and not exists (
        select 1 from user_brand_access uba
        join brands b2 on b2.id = uba.brand_id
        where uba.user_id = auth.uid() and b2.org_id = b.org_id
      )
  )
$$;

create or replace function can_edit_brand(p_brand_id uuid)
returns boolean
language sql stable security definer as $$
  select has_brand_access(p_brand_id)
    and (select role from organization_members om
         join brands b on b.org_id = om.org_id
         where b.id = p_brand_id and om.user_id = auth.uid())
        in ('dashboard_admin', 'manager', 'creator')
$$;

create or replace function can_approve_brand(p_brand_id uuid)
returns boolean
language sql stable security definer as $$
  select has_brand_access(p_brand_id)
    and (select role from organization_members om
         join brands b on b.org_id = om.org_id
         where b.id = p_brand_id and om.user_id = auth.uid())
        in ('dashboard_admin', 'manager')
$$;

-- =====================================================================
-- ROW LEVEL SECURITY
-- =====================================================================

alter table organizations enable row level security;
alter table organization_members enable row level security;
alter table brands enable row level security;
alter table user_brand_access enable row level security;
alter table user_platform_access enable row level security;
alter table contents enable row level security;
alter table content_approvals enable row level security;
alter table content_comments enable row level security;
alter table backlog_items enable row level security;
alter table goals enable row level security;
alter table metrics enable row level security;
alter table activity_logs enable row level security;
alter table ai_extractor_jobs enable row level security;
alter table ai_chat_sessions enable row level security;
alter table ai_chat_messages enable row level security;
alter table ai_usage_logs enable row level security;
alter table gemini_settings enable row level security;
alter table notifications enable row level security;
alter table notification_reads enable row level security;

-- organizations: visible to members only
create policy org_select on organizations for select
  using (exists (select 1 from organization_members where org_id = organizations.id and user_id = auth.uid()));

-- organization_members: visible to members of the same org
create policy org_members_select on organization_members for select
  using (exists (select 1 from organization_members m2 where m2.org_id = organization_members.org_id and m2.user_id = auth.uid()));

create policy org_members_write on organization_members for all
  using (user_org_role(org_id) in ('dashboard_admin', 'manager'))
  with check (user_org_role(org_id) in ('dashboard_admin', 'manager'));

-- brands
create policy brands_select on brands for select
  using (has_brand_access(id));

create policy brands_write on brands for all
  using (user_org_role(org_id) in ('dashboard_admin', 'manager'))
  with check (user_org_role(org_id) in ('dashboard_admin', 'manager'));

-- contents
create policy contents_select on contents for select
  using (has_brand_access(brand_id));

create policy contents_write on contents for all
  using (can_edit_brand(brand_id))
  with check (can_edit_brand(brand_id));

-- content_approvals — insert only by admin/manager, readable by anyone with brand access
create policy approvals_select on content_approvals for select
  using (has_brand_access((select brand_id from contents where id = content_id)));

create policy approvals_insert on content_approvals for insert
  with check (can_approve_brand((select brand_id from contents where id = content_id)));

-- content_comments — any editor can comment, only admin/manager resolves
create policy comments_select on content_comments for select
  using (has_brand_access((select brand_id from contents where id = content_id)));

create policy comments_insert on content_comments for insert
  with check (can_edit_brand((select brand_id from contents where id = content_id)));

create policy comments_update on content_comments for update
  using (can_approve_brand((select brand_id from contents where id = content_id)));

-- backlog_items
create policy backlog_select on backlog_items for select
  using (has_brand_access(brand_id));
create policy backlog_write on backlog_items for all
  using (can_edit_brand(brand_id)) with check (can_edit_brand(brand_id));

-- goals
create policy goals_select on goals for select
  using (has_brand_access(brand_id));
create policy goals_write on goals for all
  using (user_org_role((select org_id from brands where id = brand_id)) in ('dashboard_admin', 'manager'))
  with check (user_org_role((select org_id from brands where id = brand_id)) in ('dashboard_admin', 'manager'));

-- metrics
create policy metrics_select on metrics for select
  using (has_brand_access(brand_id));
create policy metrics_write on metrics for all
  using (can_edit_brand(brand_id)) with check (can_edit_brand(brand_id));

-- activity_logs — read-only from the app's perspective (inserted via server role)
create policy activity_select on activity_logs for select
  using (can_approve_brand(brand_id));

-- ai_extractor_jobs
create policy ai_jobs_select on ai_extractor_jobs for select
  using (has_brand_access(brand_id));
create policy ai_jobs_write on ai_extractor_jobs for all
  using (can_edit_brand(brand_id)) with check (can_edit_brand(brand_id));

-- ai_chat_sessions / messages
create policy ai_sessions_select on ai_chat_sessions for select
  using (has_brand_access(brand_id));
create policy ai_sessions_write on ai_chat_sessions for all
  using (can_edit_brand(brand_id)) with check (can_edit_brand(brand_id));

create policy ai_messages_select on ai_chat_messages for select
  using (has_brand_access(brand_id));
create policy ai_messages_write on ai_chat_messages for all
  using (can_edit_brand(brand_id)) with check (can_edit_brand(brand_id));

-- ai_usage_logs — admin/manager visibility only
create policy ai_usage_select on ai_usage_logs for select
  using (brand_id is null or can_approve_brand(brand_id));

-- gemini_settings — never selectable by normal client roles; use a
-- server-side service-role client for this table exclusively.
create policy gemini_settings_none on gemini_settings for select using (false);

-- notifications — readable by org members (or everyone, if org_id is null)
create policy notifications_select on notifications for select
  using (org_id is null or exists (select 1 from organization_members where org_id = notifications.org_id and user_id = auth.uid()));

create policy notification_reads_select on notification_reads for select
  using (user_id = auth.uid());
create policy notification_reads_write on notification_reads for insert
  with check (user_id = auth.uid());

-- user_brand_access / user_platform_access — visible to org admins/managers only
create policy uba_select on user_brand_access for select
  using (user_org_role((select org_id from brands where id = brand_id)) in ('dashboard_admin', 'manager') or user_id = auth.uid());
create policy uba_write on user_brand_access for all
  using (user_org_role((select org_id from brands where id = brand_id)) in ('dashboard_admin', 'manager'))
  with check (user_org_role((select org_id from brands where id = brand_id)) in ('dashboard_admin', 'manager'));

create policy upa_select on user_platform_access for select
  using (user_org_role(org_id) in ('dashboard_admin', 'manager') or user_id = auth.uid());
create policy upa_write on user_platform_access for all
  using (user_org_role(org_id) in ('dashboard_admin', 'manager'))
  with check (user_org_role(org_id) in ('dashboard_admin', 'manager'));

-- =====================================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- =====================================================================

create or replace function handle_new_user()
returns trigger
language plpgsql security definer as $$
begin
  insert into profiles (id, email, display_name)
  values (new.id, new.email, split_part(new.email, '@', 1));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
