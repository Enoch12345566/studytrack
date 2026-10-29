-- StudyTrack schema. Paste into Supabase: SQL Editor > New query > Run.
create extension if not exists pgcrypto;

create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text not null default '', email text, created_at timestamptz not null default now());

create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null check (char_length(name) between 2 and 60),
  description text default '', color text default '#4f46e5', is_sample boolean not null default false,
  created_at timestamptz not null default now());

create table public.topics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  subject_id uuid not null references public.subjects on delete cascade,
  name text not null check (char_length(name) between 2 and 100),
  status text not null default 'not_started' check (status in ('not_started','in_progress','completed')),
  priority text not null default 'medium' check (priority in ('low','medium','high')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now());

create table public.study_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  subject_id uuid references public.subjects on delete cascade,
  topic_id uuid references public.topics on delete set null,
  title text not null check (char_length(title) between 2 and 120),
  description text default '', scheduled_date date not null,
  start_time time not null, end_time time not null check (end_time > start_time),
  status text not null default 'planned' check (status in ('planned','completed')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now());

create table public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  subject_id uuid references public.subjects on delete set null,
  topic_id uuid references public.topics on delete set null,
  duration_minutes int not null check (duration_minutes between 1 and 720),
  notes text default '', started_at timestamptz not null, ended_at timestamptz,
  created_at timestamptz not null default now());

create table public.study_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  goal_type text not null check (goal_type in ('daily','weekly')),
  target_minutes int not null check (target_minutes between 1 and 10080),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (user_id, goal_type));

-- Quiz questions are shared and read-only for students. Answer keys live in a
-- separate table that students can NEVER read; only submit_quiz() can.
create table public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects on delete cascade,
  topic_id uuid references public.topics on delete set null,
  question_text text not null,
  options jsonb not null check (jsonb_typeof(options) = 'array' and jsonb_array_length(options) = 4),
  explanation text not null default '', is_sample boolean not null default true,
  created_at timestamptz not null default now());

create table public.quiz_answer_keys (
  question_id uuid primary key references public.quiz_questions on delete cascade,
  correct_answer int not null check (correct_answer between 0 and 3));

create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  subject_id uuid references public.subjects on delete set null,
  topic_id uuid references public.topics on delete set null,
  score int not null, total_questions int not null, percentage numeric(5,2) not null,
  created_at timestamptz not null default now());

create table public.quiz_responses (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.quiz_attempts on delete cascade,
  question_id uuid not null references public.quiz_questions on delete cascade,
  selected_answer int not null check (selected_answer between 0 and 3),
  is_correct boolean not null);

-- Indexes for common lookups
create index on public.topics (subject_id);
create index on public.study_tasks (user_id, scheduled_date);
create index on public.study_sessions (user_id, started_at);
create index on public.quiz_attempts (user_id, created_at);
create index on public.quiz_responses (attempt_id);
create index on public.quiz_questions (subject_id, topic_id);

create trigger topics_updated before update on public.topics for each row execute function public.set_updated_at();
create trigger tasks_updated before update on public.study_tasks for each row execute function public.set_updated_at();
create trigger goals_updated before update on public.study_goals for each row execute function public.set_updated_at();

-- ===== Row Level Security =====
alter table public.profiles enable row level security;
alter table public.subjects enable row level security;
alter table public.topics enable row level security;
alter table public.study_tasks enable row level security;
alter table public.study_sessions enable row level security;
alter table public.study_goals enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_answer_keys enable row level security;   -- no policies = no client access
alter table public.quiz_attempts enable row level security;
alter table public.quiz_responses enable row level security;

create policy "own profile read" on public.profiles for select to authenticated using (id = auth.uid());
create policy "own profile update" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "own rows" on public.subjects for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own rows" on public.topics for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own rows" on public.study_tasks for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own rows" on public.study_sessions for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own rows" on public.study_goals for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "read questions" on public.quiz_questions for select to authenticated using (true);
-- Attempts/responses: students may only READ their own. Writes happen via submit_quiz().
create policy "own attempts read" on public.quiz_attempts for select to authenticated using (user_id = auth.uid());
create policy "own responses read" on public.quiz_responses for select to authenticated
  using (exists (select 1 from public.quiz_attempts a where a.id = attempt_id and a.user_id = auth.uid()));

-- ===== Server-side quiz scoring (client never sends a score) =====
create or replace function public.submit_quiz(p_subject uuid, p_topic uuid, p_answers jsonb)
returns table (r_attempt uuid, r_score int, r_total int, r_percent numeric)
language plpgsql security definer set search_path = public as $$
declare v_attempt uuid; v_score int; v_total int; a jsonb;
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  v_total := coalesce(jsonb_array_length(p_answers), 0);
  if v_total = 0 then raise exception 'No answers submitted'; end if;
  insert into quiz_attempts (user_id, subject_id, topic_id, score, total_questions, percentage)
    values (auth.uid(), p_subject, p_topic, 0, v_total, 0) returning id into v_attempt;
  for a in select * from jsonb_array_elements(p_answers) loop
    insert into quiz_responses (attempt_id, question_id, selected_answer, is_correct)
    select v_attempt, k.question_id, (a->>'selected')::int, k.correct_answer = (a->>'selected')::int
    from quiz_answer_keys k where k.question_id = (a->>'question_id')::uuid;
  end loop;
  select count(*) filter (where q.is_correct) into v_score from quiz_responses q where q.attempt_id = v_attempt;
  update quiz_attempts set score = v_score, percentage = round(v_score * 100.0 / v_total, 2) where id = v_attempt;
  return query select v_attempt, v_score, v_total, round(v_score * 100.0 / v_total, 2);
end $$;

-- Correct answers are revealed only for the caller's own submitted attempt.
create or replace function public.get_attempt_review(p_attempt uuid)
returns table (question_id uuid, selected_answer int, correct_answer int, is_correct boolean, explanation text)
language sql security definer set search_path = public as $$
  select r.question_id, r.selected_answer, k.correct_answer, r.is_correct, qq.explanation
  from quiz_responses r
  join quiz_attempts a on a.id = r.attempt_id and a.user_id = auth.uid()
  join quiz_answer_keys k on k.question_id = r.question_id
  join quiz_questions qq on qq.id = r.question_id
  where r.attempt_id = p_attempt $$;

revoke all on function public.submit_quiz(uuid, uuid, jsonb) from public, anon;
revoke all on function public.get_attempt_review(uuid) from public, anon;
grant execute on function public.submit_quiz(uuid, uuid, jsonb) to authenticated;
grant execute on function public.get_attempt_review(uuid) to authenticated;

-- ===== On sign-up: create profile + the five starter subjects =====
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, full_name, email)
    values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), new.email);
  insert into subjects (user_id, name, color, is_sample) values
    (new.id, 'Mathematics', '#4f46e5', true), (new.id, 'Physics', '#0ea5e9', true),
    (new.id, 'Chemistry', '#10b981', true), (new.id, 'Biology', '#f59e0b', true),
    (new.id, 'English', '#ec4899', true);
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
