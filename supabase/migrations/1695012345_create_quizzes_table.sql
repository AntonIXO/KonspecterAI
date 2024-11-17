create table if not exists public.quizzes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id),
  title text,
  questions jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  public_id text unique default encode(gen_random_bytes(9), 'base64') not null
);

-- Enable RLS
alter table public.quizzes enable row level security;

-- Policies
create policy "Users can create quizzes"
  on public.quizzes for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can view their own quizzes"
  on public.quizzes for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Anyone can view public quizzes"
  on public.quizzes for select
  to anon
  using (public_id is not null); 