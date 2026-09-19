-- Migration: Add Subscriptions & Invitations Schema
create table if not exists public.user_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade unique,
  tier text not null default 'free',
  status text not null default 'active',
  is_free_access boolean not null default false,
  start_date timestamptz not null default now(),
  end_date timestamptz not null default (now() + interval '30 days'),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_invitations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  email text not null,
  role text not null default 'creator',
  tier text not null default 'free',
  invited_by uuid references public.profiles(id),
  status text not null default 'pending',
  notes text,
  created_at timestamptz not null default now(),
  accepted_at timestamptz
);

alter table public.profiles add column if not exists is_approved boolean default true;
