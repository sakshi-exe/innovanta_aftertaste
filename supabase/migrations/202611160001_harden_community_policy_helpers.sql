create schema if not exists private;

revoke all on schema private from public, anon, authenticated;
grant usage on schema private to anon, authenticated;

create or replace function private.community_storage_object_exists(object_path text)
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

create or replace function private.can_read_approved_community_image(object_path text)
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

revoke all on function private.community_storage_object_exists(text) from public, anon, authenticated;
revoke all on function private.can_read_approved_community_image(text) from public, anon, authenticated;
grant execute on function private.community_storage_object_exists(text) to anon, authenticated;
grant execute on function private.can_read_approved_community_image(text) to anon, authenticated;

drop policy if exists "Anyone can submit photos for review" on public.photo_submissions;
create policy "Anyone can submit photos for review"
  on public.photo_submissions for insert to anon, authenticated
  with check (
    moderation_status = 'pending'
    and featured_on_innovanta = false
    and (not contributor_name_display_consent or (contributor_name is not null and photo_display_consent))
    and private.community_storage_object_exists(storage_path)
  );

drop policy if exists "Anyone can submit stories for review" on public.community_stories;
create policy "Anyone can submit stories for review"
  on public.community_stories for insert to anon, authenticated
  with check (
    moderation_status = 'pending'
    and featured_on_innovanta = false
    and (not name_display_consent or story_consent)
    and (not photo_display_consent or (photo_storage_path is not null and story_consent))
    and (photo_storage_path is null or private.community_storage_object_exists(photo_storage_path))
  );

drop policy if exists "Only approved consented images can be read" on storage.objects;
create policy "Only approved consented images can be read"
  on storage.objects for select to anon, authenticated
  using (
    bucket_id = 'community-memories'
    and private.can_read_approved_community_image(name)
  );

drop function if exists public.community_storage_object_exists(text);
drop function if exists public.can_read_approved_community_image(text);
