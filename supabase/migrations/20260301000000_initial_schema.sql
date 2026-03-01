-- Writers Room Initial Schema (reordered: tables → functions → policies → triggers)
-- Deploy via Supabase SQL Editor or CLI migrations

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- 1. CREATE ALL TABLES FIRST
-- ============================================================

create table public.projects (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  show_idea text not null default '',
  genre text not null default '',
  format text not null default 'tv_series' check (format in ('tv_series', 'feature_film', 'custom')),
  status text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.project_members (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'editor' check (role in ('owner', 'editor', 'viewer')),
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

create table public.agents (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  role text not null default '',
  expertise text not null default '',
  personality_traits text[] not null default '{}',
  writing_style text not null default '',
  avatar_color text not null default '#6366f1',
  model_override text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.characters (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  role text not null default '',
  color_hex text not null default '#6366f1',
  bio jsonb not null default '{}',
  motivations text not null default '',
  flaws text not null default '',
  arc text not null default '',
  position_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.relationships (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  character_a_id uuid not null references public.characters(id) on delete cascade,
  character_b_id uuid not null references public.characters(id) on delete cascade,
  label text not null,
  description text not null default '',
  created_at timestamptz not null default now()
);

create table public.episodes (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  episode_number integer not null,
  synopsis text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.acts (
  id uuid primary key default uuid_generate_v4(),
  episode_id uuid not null references public.episodes(id) on delete cascade,
  title text not null,
  act_number integer not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.beats (
  id uuid primary key default uuid_generate_v4(),
  act_id uuid not null references public.acts(id) on delete cascade,
  character_id uuid not null references public.characters(id) on delete cascade,
  title text not null,
  content text not null default '',
  emotion_core text,
  emotion_sub text,
  position_index integer not null default 0,
  type text not null default 'plot' check (type in ('plot', 'emotion')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.discussions (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  topic text not null,
  max_rounds integer not null default 5,
  current_round integer not null default 0,
  status text not null default 'pending' check (status in ('pending', 'running', 'paused', 'completed')),
  summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.discussion_messages (
  id uuid primary key default uuid_generate_v4(),
  discussion_id uuid not null references public.discussions(id) on delete cascade,
  agent_id uuid references public.agents(id) on delete set null,
  round_number integer not null,
  turn_order integer not null,
  role text not null check (role in ('agent', 'showrunner', 'system')),
  content text not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table public.proposals (
  id uuid primary key default uuid_generate_v4(),
  discussion_id uuid not null references public.discussions(id) on delete cascade,
  category text not null,
  title text not null,
  description text not null default '',
  proposed_content jsonb not null default '{}',
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'modified')),
  user_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.memory_index (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  category text not null,
  keywords text[] not null default '{}',
  summary text not null,
  source_discussion_id uuid references public.discussions(id) on delete set null,
  source_round integer,
  importance integer not null default 3 check (importance between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.show_bible_sections (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  section_type text not null,
  title text not null,
  content jsonb not null default '{}',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.bible_versions (
  id uuid primary key default uuid_generate_v4(),
  bible_id uuid not null references public.show_bible_sections(id) on delete cascade,
  content jsonb not null default '{}',
  changed_by_agent_id uuid references public.agents(id) on delete set null,
  change_summary text not null default '',
  created_at timestamptz not null default now()
);

create table public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  model_config jsonb not null default '{"fast": "haiku", "smart": "sonnet", "creative": "sonnet"}',
  default_round_count integer not null default 5,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes
create index idx_memory_index_keywords on public.memory_index using gin (keywords);
create index idx_memory_index_project on public.memory_index (project_id, importance desc);

-- ============================================================
-- 2. HELPER FUNCTIONS (tables exist now)
-- ============================================================

create or replace function public.is_project_member(p_project_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.project_members
    where project_id = p_project_id
      and user_id = (select auth.uid())
  );
$$;

create or replace function public.is_project_owner(p_project_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.project_members
    where project_id = p_project_id
      and user_id = (select auth.uid())
      and role = 'owner'
  );
$$;

create or replace function public.handle_new_project()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.project_members (project_id, user_id, role)
  values (new.id, new.created_by, 'owner');
  return new;
end;
$$;

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- 3. ENABLE RLS ON ALL TABLES
-- ============================================================

alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.agents enable row level security;
alter table public.characters enable row level security;
alter table public.relationships enable row level security;
alter table public.episodes enable row level security;
alter table public.acts enable row level security;
alter table public.beats enable row level security;
alter table public.discussions enable row level security;
alter table public.discussion_messages enable row level security;
alter table public.proposals enable row level security;
alter table public.memory_index enable row level security;
alter table public.show_bible_sections enable row level security;
alter table public.bible_versions enable row level security;
alter table public.user_settings enable row level security;

-- ============================================================
-- 4. RLS POLICIES
-- ============================================================

-- Projects
create policy "Users can view their projects" on public.projects for select using (public.is_project_member(id));
create policy "Users can create projects" on public.projects for insert with check ((select auth.uid()) = created_by);
create policy "Owners can update projects" on public.projects for update using (public.is_project_owner(id));
create policy "Owners can delete projects" on public.projects for delete using (public.is_project_owner(id));

-- Project Members
create policy "Members can view membership" on public.project_members for select using (public.is_project_member(project_id));
create policy "Owners can manage members" on public.project_members for all using (public.is_project_owner(project_id));

-- Agents
create policy "Members can view agents" on public.agents for select using (public.is_project_member(project_id));
create policy "Members can manage agents" on public.agents for all using (public.is_project_member(project_id));

-- Characters
create policy "Members can view characters" on public.characters for select using (public.is_project_member(project_id));
create policy "Members can manage characters" on public.characters for all using (public.is_project_member(project_id));

-- Relationships
create policy "Members can view relationships" on public.relationships for select using (public.is_project_member(project_id));
create policy "Members can manage relationships" on public.relationships for all using (public.is_project_member(project_id));

-- Episodes
create policy "Members can view episodes" on public.episodes for select using (public.is_project_member(project_id));
create policy "Members can manage episodes" on public.episodes for all using (public.is_project_member(project_id));

-- Acts
create policy "Members can view acts" on public.acts for select using (exists (select 1 from public.episodes e where e.id = episode_id and public.is_project_member(e.project_id)));
create policy "Members can manage acts" on public.acts for all using (exists (select 1 from public.episodes e where e.id = episode_id and public.is_project_member(e.project_id)));

-- Beats
create policy "Members can view beats" on public.beats for select using (exists (select 1 from public.acts a join public.episodes e on e.id = a.episode_id where a.id = act_id and public.is_project_member(e.project_id)));
create policy "Members can manage beats" on public.beats for all using (exists (select 1 from public.acts a join public.episodes e on e.id = a.episode_id where a.id = act_id and public.is_project_member(e.project_id)));

-- Discussions
create policy "Members can view discussions" on public.discussions for select using (public.is_project_member(project_id));
create policy "Members can manage discussions" on public.discussions for all using (public.is_project_member(project_id));

-- Discussion Messages
create policy "Members can view messages" on public.discussion_messages for select using (exists (select 1 from public.discussions d where d.id = discussion_id and public.is_project_member(d.project_id)));
create policy "Members can insert messages" on public.discussion_messages for insert with check (exists (select 1 from public.discussions d where d.id = discussion_id and public.is_project_member(d.project_id)));

-- Proposals
create policy "Members can view proposals" on public.proposals for select using (exists (select 1 from public.discussions d where d.id = discussion_id and public.is_project_member(d.project_id)));
create policy "Members can manage proposals" on public.proposals for all using (exists (select 1 from public.discussions d where d.id = discussion_id and public.is_project_member(d.project_id)));

-- Memory Index
create policy "Members can view memory" on public.memory_index for select using (public.is_project_member(project_id));
create policy "Members can manage memory" on public.memory_index for all using (public.is_project_member(project_id));

-- Show Bible Sections
create policy "Members can view bible sections" on public.show_bible_sections for select using (public.is_project_member(project_id));
create policy "Members can manage bible sections" on public.show_bible_sections for all using (public.is_project_member(project_id));

-- Bible Versions
create policy "Members can view bible versions" on public.bible_versions for select using (exists (select 1 from public.show_bible_sections s where s.id = bible_id and public.is_project_member(s.project_id)));
create policy "Members can insert bible versions" on public.bible_versions for insert with check (exists (select 1 from public.show_bible_sections s where s.id = bible_id and public.is_project_member(s.project_id)));

-- User Settings
create policy "Users can view own settings" on public.user_settings for select using ((select auth.uid()) = user_id);
create policy "Users can manage own settings" on public.user_settings for all using ((select auth.uid()) = user_id);

-- ============================================================
-- 5. TRIGGERS
-- ============================================================

create trigger on_project_created after insert on public.projects for each row execute function public.handle_new_project();

create trigger set_updated_at before update on public.projects for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.agents for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.characters for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.beats for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.discussions for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.proposals for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.memory_index for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.show_bible_sections for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.user_settings for each row execute function public.handle_updated_at();

-- ============================================================
-- 6. REALTIME
-- ============================================================

alter publication supabase_realtime add table public.discussion_messages;
alter publication supabase_realtime add table public.proposals;
alter publication supabase_realtime add table public.beats;
