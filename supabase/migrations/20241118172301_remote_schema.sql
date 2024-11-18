create extension if not exists "vector" with schema "extensions";


create table "public"."books" (
    "id" bigint generated always as identity not null,
    "user_id" uuid not null,
    "path" text not null,
    "embedding" vector(384),
    "text" text not null
);


alter table "public"."books" enable row level security;

create table "public"."summaries" (
    "id" bigint generated always as identity not null,
    "user_id" uuid not null,
    "content" text not null,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "path" text not null
);


alter table "public"."summaries" enable row level security;

alter table "public"."quizzes" add column "path" text not null;

CREATE INDEX books_embedding_idx ON public.books USING hnsw (embedding vector_ip_ops);

CREATE UNIQUE INDEX books_pkey ON public.books USING btree (id);

CREATE UNIQUE INDEX summaries_content_key ON public.summaries USING btree (content);

CREATE UNIQUE INDEX summaries_pkey ON public.summaries USING btree (id);

alter table "public"."books" add constraint "books_pkey" PRIMARY KEY using index "books_pkey";

alter table "public"."summaries" add constraint "summaries_pkey" PRIMARY KEY using index "summaries_pkey";

alter table "public"."books" add constraint "books_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."books" validate constraint "books_user_id_fkey";

alter table "public"."summaries" add constraint "summaries_content_key" UNIQUE using index "summaries_content_key";

alter table "public"."summaries" add constraint "summaries_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."summaries" validate constraint "summaries_user_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.query_books(query_embedding vector, match_threshold double precision, query_user_id uuid, query_path text)
 RETURNS SETOF books
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    SELECT b.*
    FROM books b
    WHERE
        b.user_id = query_user_id  -- Use the renamed parameter
        AND b.path = query_path           -- Filter by path
        AND b.embedding <#> query_embedding < -match_threshold  -- Similarity check
    ORDER BY
        b.embedding <#> query_embedding;  -- Order by similarity
END;
$function$
;

grant delete on table "public"."books" to "anon";

grant insert on table "public"."books" to "anon";

grant references on table "public"."books" to "anon";

grant select on table "public"."books" to "anon";

grant trigger on table "public"."books" to "anon";

grant truncate on table "public"."books" to "anon";

grant update on table "public"."books" to "anon";

grant delete on table "public"."books" to "authenticated";

grant insert on table "public"."books" to "authenticated";

grant references on table "public"."books" to "authenticated";

grant select on table "public"."books" to "authenticated";

grant trigger on table "public"."books" to "authenticated";

grant truncate on table "public"."books" to "authenticated";

grant update on table "public"."books" to "authenticated";

grant delete on table "public"."books" to "service_role";

grant insert on table "public"."books" to "service_role";

grant references on table "public"."books" to "service_role";

grant select on table "public"."books" to "service_role";

grant trigger on table "public"."books" to "service_role";

grant truncate on table "public"."books" to "service_role";

grant update on table "public"."books" to "service_role";

grant delete on table "public"."summaries" to "anon";

grant insert on table "public"."summaries" to "anon";

grant references on table "public"."summaries" to "anon";

grant select on table "public"."summaries" to "anon";

grant trigger on table "public"."summaries" to "anon";

grant truncate on table "public"."summaries" to "anon";

grant update on table "public"."summaries" to "anon";

grant delete on table "public"."summaries" to "authenticated";

grant insert on table "public"."summaries" to "authenticated";

grant references on table "public"."summaries" to "authenticated";

grant select on table "public"."summaries" to "authenticated";

grant trigger on table "public"."summaries" to "authenticated";

grant truncate on table "public"."summaries" to "authenticated";

grant update on table "public"."summaries" to "authenticated";

grant delete on table "public"."summaries" to "service_role";

grant insert on table "public"."summaries" to "service_role";

grant references on table "public"."summaries" to "service_role";

grant select on table "public"."summaries" to "service_role";

grant trigger on table "public"."summaries" to "service_role";

grant truncate on table "public"."summaries" to "service_role";

grant update on table "public"."summaries" to "service_role";

create policy "Users can delete their own books"
on "public"."books"
as permissive
for delete
to authenticated
using ((( SELECT auth.uid() AS uid) = user_id));


create policy "Users can insert their own books"
on "public"."books"
as permissive
for insert
to authenticated
with check ((( SELECT auth.uid() AS uid) = user_id));


create policy "Users can read their own books"
on "public"."books"
as permissive
for select
to authenticated
using ((( SELECT auth.uid() AS uid) = user_id));


create policy "Enable delete for users based on user_id"
on "public"."summaries"
as permissive
for delete
to public
using ((( SELECT auth.uid() AS uid) = user_id));


create policy "Users can insert their own summaries"
on "public"."summaries"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can view their own summaries"
on "public"."summaries"
as permissive
for select
to public
using ((auth.uid() = user_id));



create schema if not exists "summaries";


create schema if not exists "userdata";

create table "userdata"."summaries" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null default auth.uid(),
    "content" text,
    "created_at" timestamp with time zone default now()
);


alter table "userdata"."summaries" enable row level security;

CREATE UNIQUE INDEX summaries_pkey ON userdata.summaries USING btree (id);

alter table "userdata"."summaries" add constraint "summaries_pkey" PRIMARY KEY using index "summaries_pkey";

alter table "userdata"."summaries" add constraint "summaries_user_id_fkey" FOREIGN KEY (user_id) REFERENCES userdata.summaries(id) not valid;

alter table "userdata"."summaries" validate constraint "summaries_user_id_fkey";

create policy "Users can insert their own summaries"
on "userdata"."summaries"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can view their own summaries"
on "userdata"."summaries"
as permissive
for select
to public
using ((auth.uid() = user_id));



