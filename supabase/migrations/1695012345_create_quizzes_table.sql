-- Create function for custom ID generation
create or replace function generate_url_safe_id()
returns text as $$
declare
  chars text := 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result text := '';
  i integer := 0;
begin
  for i in 1..8 loop
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  end loop;
  return result;
end;
$$ language plpgsql;

create table if not exists public.quizzes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id),
  title text,
  questions jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  public_id text unique default generate_url_safe_id() not null
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