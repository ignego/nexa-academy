-- Nexa AI Studio: Execute no SQL Editor de um projeto NOVO.
create extension if not exists pgcrypto;
create table public.studio_admins(user_id uuid primary key references auth.users(id) on delete cascade, created_at timestamptz not null default now());
create table public.studio_courses(id uuid primary key default gen_random_uuid(),title text not null,description text not null default '',category text not null default 'Geral',status text not null default 'locked' check(status in ('locked','published')),created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table public.studio_modules(id uuid primary key default gen_random_uuid(),course_id uuid not null references public.studio_courses(id) on delete cascade,position int not null check(position>0),title text not null,unique(course_id,position));
create table public.studio_lessons(id uuid primary key default gen_random_uuid(),module_id uuid not null references public.studio_modules(id) on delete cascade,position int not null check(position>0),title text not null,topic text not null default '',format text not null default 'mixed' check(format in ('mixed','screen','animation')),duration_minutes int not null default 20 check(duration_minutes between 1 and 180),script jsonb not null default '[]'::jsonb,notes text not null default '',video_path text,reviewed boolean not null default false,created_at timestamptz not null default now(),unique(module_id,position));
create table public.studio_activities(id uuid primary key default gen_random_uuid(),lesson_id uuid not null references public.studio_lessons(id) on delete cascade,position int not null check(position>0),question text not null,options jsonb not null default '[]'::jsonb,answer_index int not null default 0,explanation text not null default '',unique(lesson_id,position));
create index on public.studio_modules(course_id);create index on public.studio_lessons(module_id);create index on public.studio_activities(lesson_id);
create or replace function public.studio_is_admin() returns boolean language sql stable security invoker set search_path='' as $$ select exists(select 1 from public.studio_admins where user_id=(select auth.uid())) $$;
alter table public.studio_admins enable row level security;
alter table public.studio_courses enable row level security;
alter table public.studio_modules enable row level security;
alter table public.studio_lessons enable row level security;
alter table public.studio_activities enable row level security;
create policy "admins read self" on public.studio_admins for select to authenticated using(user_id=(select auth.uid()));
create policy "admins courses" on public.studio_courses for all to authenticated using((select public.studio_is_admin())) with check((select public.studio_is_admin()));
create policy "admins modules" on public.studio_modules for all to authenticated using((select public.studio_is_admin())) with check((select public.studio_is_admin()));
create policy "admins lessons" on public.studio_lessons for all to authenticated using((select public.studio_is_admin())) with check((select public.studio_is_admin()));
create policy "admins activities" on public.studio_activities for all to authenticated using((select public.studio_is_admin())) with check((select public.studio_is_admin()));
grant usage on schema public to authenticated;
grant select on public.studio_admins to authenticated;
grant select,insert,update,delete on public.studio_courses,public.studio_modules,public.studio_lessons,public.studio_activities to authenticated;
grant execute on function public.studio_is_admin() to authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values ('studio-videos','studio-videos',false,524288000,array['video/mp4']) on conflict(id) do nothing;
create policy "studio video read" on storage.objects for select to authenticated using(bucket_id='studio-videos' and (select public.studio_is_admin()));
create policy "studio video upload" on storage.objects for insert to authenticated with check(bucket_id='studio-videos' and (select public.studio_is_admin()));
create policy "studio video update" on storage.objects for update to authenticated using(bucket_id='studio-videos' and (select public.studio_is_admin())) with check(bucket_id='studio-videos' and (select public.studio_is_admin()));
create policy "studio video delete" on storage.objects for delete to authenticated using(bucket_id='studio-videos' and (select public.studio_is_admin()));
-- CRÍTICO: depois de criar sua conta em Authentication > Users, execute MANUALMENTE:
-- insert into public.studio_admins(user_id) values ('UUID_DA_SUA_CONTA');
-- Nunca crie uma policy que permita ao próprio usuário inserir-se como admin.
