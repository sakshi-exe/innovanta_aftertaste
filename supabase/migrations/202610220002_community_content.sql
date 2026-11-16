alter table public.feedback
  add column if not exists featured_on_innovanta boolean not null default false;

alter table public.feedback
  drop constraint if exists feedback_publication_requires_consent;
alter table public.feedback
  add constraint feedback_publication_requires_consent
  check (not testimonial_approved or testimonial_consent);
alter table public.feedback
  drop constraint if exists feedback_feature_requires_approval;
alter table public.feedback
  add constraint feedback_feature_requires_approval
  check (not featured_on_innovanta or testimonial_approved);

create table if not exists public.photo_submissions (
  id uuid primary key default gen_random_uuid(),
  contributor_name text check (contributor_name is null or char_length(contributor_name) <= 100),
  contributor_name_display_consent boolean not null default false,
  caption text check (caption is null or char_length(caption) <= 180),
  category text check (
    category is null or category in (
      'People & connections', 'Coffee & atmosphere', 'Speakers & ideas',
      'Behind the scenes', 'Group moments', 'Other'
    )
  ),
  storage_path text not null unique check (storage_path like 'submissions/%'),
  photo_display_consent boolean not null default false,
  moderation_status text not null default 'pending'
    check (moderation_status in ('pending', 'approved', 'rejected')),
  featured_on_innovanta boolean not null default false,
  created_at timestamptz not null default now(),
  constraint photo_name_display_requires_name_and_photo_consent
    check (
      not contributor_name_display_consent
      or (contributor_name is not null and photo_display_consent)
    ),
  constraint photo_approval_requires_public_consent
    check (moderation_status <> 'approved' or photo_display_consent),
  constraint photo_feature_requires_approval
    check (not featured_on_innovanta or moderation_status = 'approved')
);

create table if not exists public.community_stories (
  id uuid primary key default gen_random_uuid(),
  contributor_name text not null check (char_length(btrim(contributor_name)) between 1 and 100),
  college text check (college is null or char_length(college) <= 160),
  favorite_moment text check (favorite_moment is null or char_length(favorite_moment) <= 1200),
  met_or_learned text check (met_or_learned is null or char_length(met_or_learned) <= 1200),
  memorable_reason text check (memorable_reason is null or char_length(memorable_reason) <= 1200),
  community_message text check (community_message is null or char_length(community_message) <= 1200),
  story_consent boolean not null default false,
  name_display_consent boolean not null default false,
  photo_storage_path text check (photo_storage_path is null or photo_storage_path like 'stories/%'),
  photo_display_consent boolean not null default false,
  moderation_status text not null default 'pending'
    check (moderation_status in ('pending', 'approved', 'rejected')),
  featured_on_innovanta boolean not null default false,
  created_at timestamptz not null default now(),
  constraint story_name_display_requires_story_consent
    check (not name_display_consent or story_consent),
  constraint story_photo_display_requires_photo_and_story_consent
    check (
      not photo_display_consent
      or (photo_storage_path is not null and story_consent)
    ),
  constraint story_approval_requires_public_consent
    check (moderation_status <> 'approved' or story_consent),
  constraint story_feature_requires_approval
    check (not featured_on_innovanta or moderation_status = 'approved'),
  constraint story_requires_some_content check (
    coalesce(nullif(btrim(favorite_moment), ''), nullif(btrim(met_or_learned), ''),
      nullif(btrim(memorable_reason), ''), nullif(btrim(community_message), '')) is not null
  )
);

create index if not exists photo_submissions_review_idx
  on public.photo_submissions (created_at desc)
  where moderation_status = 'pending';
create index if not exists photo_submissions_public_idx
  on public.photo_submissions (created_at desc)
  where moderation_status = 'approved' and photo_display_consent;
create index if not exists community_stories_review_idx
  on public.community_stories (created_at desc)
  where moderation_status = 'pending';
create index if not exists community_stories_public_idx
  on public.community_stories (created_at desc)
  where moderation_status = 'approved' and story_consent;

alter table public.photo_submissions enable row level security;
alter table public.community_stories enable row level security;

revoke all on table public.feedback, public.photo_submissions, public.community_stories from anon, authenticated;
grant insert on table public.feedback, public.photo_submissions, public.community_stories to anon, authenticated;

drop policy if exists "Anyone can submit valid feedback" on public.feedback;
create policy "Anyone can submit valid feedback"
  on public.feedback for insert to anon, authenticated
  with check (
    testimonial_approved = false
    and featured_on_innovanta = false
    and (not name_display_consent or testimonial_consent)
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'community-memories',
  'community-memories',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.community_storage_object_exists(object_path text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from storage.objects as object
    where object.bucket_id = 'community-memories'
      and object.name = object_path
  );
$$;

create or replace function public.can_read_approved_community_image(object_path text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.photo_submissions as photo
    where photo.storage_path = object_path
      and photo.moderation_status = 'approved'
      and photo.photo_display_consent
  )
  or exists (
    select 1 from public.community_stories as story
    where story.photo_storage_path = object_path
      and story.moderation_status = 'approved'
      and story.story_consent
      and story.photo_display_consent
  );
$$;

revoke all on function public.community_storage_object_exists(text) from public;
revoke all on function public.can_read_approved_community_image(text) from public;
grant execute on function public.community_storage_object_exists(text) to anon, authenticated;
grant execute on function public.can_read_approved_community_image(text) to anon, authenticated;

drop policy if exists "Anyone can submit photos for review" on public.photo_submissions;
create policy "Anyone can submit photos for review"
  on public.photo_submissions for insert to anon, authenticated
  with check (
    moderation_status = 'pending'
    and featured_on_innovanta = false
    and (not contributor_name_display_consent or (contributor_name is not null and photo_display_consent))
    and public.community_storage_object_exists(storage_path)
  );

drop policy if exists "Anyone can submit stories for review" on public.community_stories;
create policy "Anyone can submit stories for review"
  on public.community_stories for insert to anon, authenticated
  with check (
    moderation_status = 'pending'
    and featured_on_innovanta = false
    and (not name_display_consent or story_consent)
    and (not photo_display_consent or (photo_storage_path is not null and story_consent))
    and (photo_storage_path is null or public.community_storage_object_exists(photo_storage_path))
  );

drop policy if exists "Participants can upload community images" on storage.objects;
create policy "Participants can upload community images"
  on storage.objects for insert to anon, authenticated
  with check (
    bucket_id = 'community-memories'
    and (storage.foldername(name))[1] in ('submissions', 'stories')
  );

drop policy if exists "Only approved consented images can be read" on storage.objects;
create policy "Only approved consented images can be read"
  on storage.objects for select to anon, authenticated
  using (
    bucket_id = 'community-memories'
    and public.can_read_approved_community_image(name)
  );

create or replace function public.get_public_memories()
returns table (
  id uuid,
  caption text,
  contributor_name text,
  category text,
  storage_path text,
  featured boolean,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select photo.id,
    photo.caption,
    case when photo.contributor_name_display_consent then photo.contributor_name else null end,
    photo.category,
    photo.storage_path,
    photo.featured_on_innovanta,
    photo.created_at
  from public.photo_submissions as photo
  where photo.moderation_status = 'approved'
    and photo.photo_display_consent
  order by photo.featured_on_innovanta desc, photo.created_at desc
  limit 100;
$$;

create or replace function public.get_public_stories()
returns table (
  id uuid,
  contributor_name text,
  college text,
  favorite_moment text,
  met_or_learned text,
  memorable_reason text,
  community_message text,
  photo_storage_path text,
  featured boolean,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select story.id,
    case when story.name_display_consent then story.contributor_name else null end,
    case when story.name_display_consent then story.college else null end,
    story.favorite_moment,
    story.met_or_learned,
    story.memorable_reason,
    story.community_message,
    case when story.photo_display_consent then story.photo_storage_path else null end,
    story.featured_on_innovanta,
    story.created_at
  from public.community_stories as story
  where story.moderation_status = 'approved'
    and story.story_consent
  order by story.featured_on_innovanta desc, story.created_at desc
  limit 100;
$$;

create or replace function public.get_public_testimonials()
returns table (
  id uuid,
  testimonial text,
  rating integer,
  display_name text,
  college text,
  featured boolean,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select feedback.id,
    feedback.feedback_message,
    feedback.rating,
    case when feedback.name_display_consent then feedback.full_name else null end,
    case when feedback.name_display_consent then feedback.college else null end,
    feedback.featured_on_innovanta,
    feedback.created_at
  from public.feedback as feedback
  where feedback.testimonial_consent
    and feedback.testimonial_approved
  order by feedback.featured_on_innovanta desc, feedback.created_at desc
  limit 100;
$$;

revoke all on function public.get_public_memories() from public;
revoke all on function public.get_public_stories() from public;
revoke all on function public.get_public_testimonials() from public;
grant execute on function public.get_public_memories() to anon, authenticated;
grant execute on function public.get_public_stories() to anon, authenticated;
grant execute on function public.get_public_testimonials() to anon, authenticated;
