create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(btrim(full_name)) between 1 and 100),
  college text check (college is null or char_length(college) <= 160),
  email text check (
    email is null
    or (
      char_length(email) <= 254
      and email ~* '^[A-Z0-9.!#$%&''*+/=?^_`{|}~-]+@[A-Z0-9-]+(\.[A-Z0-9-]+)+$'
    )
  ),
  rating integer not null check (rating between 1 and 5),
  favorite_parts text[] not null default '{}',
  learning_takeaway text check (learning_takeaway is null or char_length(learning_takeaway) <= 1000),
  event_description text not null check (char_length(btrim(event_description)) between 1 and 120),
  future_attendance text not null check (future_attendance in ('yes', 'maybe', 'definitely')),
  feedback_message text not null check (char_length(btrim(feedback_message)) between 1 and 2000),
  testimonial_consent boolean not null default false,
  name_display_consent boolean not null default false,
  testimonial_approved boolean not null default false,
  created_at timestamptz not null default now(),
  constraint feedback_name_display_requires_testimonial_consent
    check (not name_display_consent or testimonial_consent),
  constraint feedback_favorite_parts_allowed check (
    cardinality(favorite_parts) <= 6
    and favorite_parts <@ array[
      'The people and networking',
      'The conversations',
      'The speakers and insights',
      'The coffee and atmosphere',
      'The activities and experience',
      'Everything!'
    ]::text[]
  )
);

create index if not exists feedback_created_at_idx on public.feedback (created_at desc);
create index if not exists feedback_testimonial_review_idx
  on public.feedback (created_at desc)
  where testimonial_consent = true and testimonial_approved = false;

alter table public.feedback enable row level security;

revoke all on table public.feedback from anon, authenticated;
grant insert on table public.feedback to anon, authenticated;

create policy "Anyone can submit valid feedback"
  on public.feedback
  for insert
  to anon, authenticated
  with check (
    testimonial_approved = false
    and (not name_display_consent or testimonial_consent)
  );
