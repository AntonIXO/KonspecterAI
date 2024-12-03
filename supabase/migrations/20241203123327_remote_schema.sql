drop policy "Users can read their own books" on "public"."books";

drop policy "Users can delete their own books" on "public"."books";

drop policy "Users can insert their own books" on "public"."books";

drop function if exists "public"."query_books"(query_embedding vector, match_threshold double precision, query_user_id uuid, query_path text);

drop index if exists "public"."books_embedding_idx";

create table "public"."embeddings" (
    "book_id" bigint not null,
    "text" text not null,
    "embedding" vector(384) not null
);


alter table "public"."embeddings" enable row level security;

alter table "public"."books" drop column "embedding";

alter table "public"."books" drop column "path";

alter table "public"."books" drop column "text";

alter table "public"."books" add column "name" text not null;

alter table "public"."books" add column "pages_read" integer not null;

alter table "public"."quizzes" drop column "path";

alter table "public"."quizzes" add column "book_id" bigint not null;

alter table "public"."summaries" drop column "path";

alter table "public"."summaries" add column "book_id" bigint not null;

alter table "public"."embeddings" add constraint "embeddings_book_id_fkey" FOREIGN KEY (book_id) REFERENCES books(id) not valid;

alter table "public"."embeddings" validate constraint "embeddings_book_id_fkey";

alter table "public"."quizzes" add constraint "quizzes_book_id_fkey" FOREIGN KEY (book_id) REFERENCES books(id) not valid;

alter table "public"."quizzes" validate constraint "quizzes_book_id_fkey";

alter table "public"."summaries" add constraint "summaries_book_id_fkey" FOREIGN KEY (book_id) REFERENCES books(id) not valid;

alter table "public"."summaries" validate constraint "summaries_book_id_fkey";

grant delete on table "public"."embeddings" to "anon";

grant insert on table "public"."embeddings" to "anon";

grant references on table "public"."embeddings" to "anon";

grant select on table "public"."embeddings" to "anon";

grant trigger on table "public"."embeddings" to "anon";

grant truncate on table "public"."embeddings" to "anon";

grant update on table "public"."embeddings" to "anon";

grant delete on table "public"."embeddings" to "authenticated";

grant insert on table "public"."embeddings" to "authenticated";

grant references on table "public"."embeddings" to "authenticated";

grant select on table "public"."embeddings" to "authenticated";

grant trigger on table "public"."embeddings" to "authenticated";

grant truncate on table "public"."embeddings" to "authenticated";

grant update on table "public"."embeddings" to "authenticated";

grant delete on table "public"."embeddings" to "service_role";

grant insert on table "public"."embeddings" to "service_role";

grant references on table "public"."embeddings" to "service_role";

grant select on table "public"."embeddings" to "service_role";

grant trigger on table "public"."embeddings" to "service_role";

grant truncate on table "public"."embeddings" to "service_role";

grant update on table "public"."embeddings" to "service_role";

create policy "Users can update their own books"
on "public"."books"
as permissive
for update
to authenticated
using ((user_id = auth.uid()))
with check ((user_id = auth.uid()));


create policy "Users can view their own books"
on "public"."books"
as permissive
for select
to authenticated
using ((user_id = auth.uid()));


create policy "Users can delete their own embeddings"
on "public"."embeddings"
as permissive
for delete
to authenticated
using ((book_id IN ( SELECT books.id
   FROM books
  WHERE (books.user_id = auth.uid()))));


create policy "Users can insert their own embeddings"
on "public"."embeddings"
as permissive
for insert
to authenticated
with check ((book_id IN ( SELECT books.id
   FROM books
  WHERE (books.user_id = auth.uid()))));


create policy "Users can update their own embeddings"
on "public"."embeddings"
as permissive
for update
to authenticated
using ((book_id IN ( SELECT books.id
   FROM books
  WHERE (books.user_id = auth.uid()))));


create policy "Users can view their own embeddings"
on "public"."embeddings"
as permissive
for select
to authenticated
using ((book_id IN ( SELECT books.id
   FROM books
  WHERE (books.user_id = auth.uid()))));


create policy "Users can delete their own books"
on "public"."books"
as permissive
for delete
to authenticated
using ((user_id = auth.uid()));


create policy "Users can insert their own books"
on "public"."books"
as permissive
for insert
to authenticated
with check ((user_id = auth.uid()));



