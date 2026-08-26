-- Make the profile-images bucket private and enforce per-user storage RLS (issue #99).
-- Context: GHSA-hr23-99q4-c76j. The bucket was public and served via getPublicUrl; the app
-- now resolves photo_url to a fresh signed URL on read (see getProfile.ts / getImage.ts), so
-- public access is no longer needed.

update storage.buckets
set public = false,
    file_size_limit = 5242880, -- 5 MB
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
where id = 'profile-images';

alter table storage.objects enable row level security;

-- Any signed-in member can view any profile photo (matches prior public behaviour, now
-- gated behind auth so createSignedUrl can be used to render it).
drop policy if exists "Authenticated users can view profile images" on storage.objects;
create policy "Authenticated users can view profile images"
  on storage.objects for select to authenticated
  using (bucket_id = 'profile-images');

-- uploadImage.ts takes userId as a plain argument, so the upload prefix is client-controlled
-- and must be enforced here, not just trusted from the caller.
drop policy if exists "Users upload to their own profile-images prefix" on storage.objects;
create policy "Users upload to their own profile-images prefix"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'profile-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users update their own profile-images" on storage.objects;
create policy "Users update their own profile-images"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'profile-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'profile-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users delete their own profile-images" on storage.objects;
create policy "Users delete their own profile-images"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'profile-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Normalize any legacy full public URLs already stored in profiles.photo_url down to the
-- bucket-relative path the app now expects there.
update public.profiles
set photo_url = regexp_replace(photo_url, '^.*/storage/v1/object/public/profile-images/', '')
where photo_url like '%/storage/v1/object/public/profile-images/%';
