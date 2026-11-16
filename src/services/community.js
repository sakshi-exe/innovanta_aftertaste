import { MEMORY_BUCKET, supabase, supabaseConfigured } from '../lib/supabase.js';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

function requireSupabase() {
  if (!supabaseConfigured || !supabase) {
    throw new Error('Photo and story submissions need Supabase setup. Add the project URL and publishable key, then try again.');
  }
  return supabase;
}

export function validateImage(file) {
  if (!file) return 'Choose an image to upload.';
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) return 'Use a JPG, JPEG, PNG, or WebP image.';
  if (file.size > MAX_IMAGE_BYTES) return 'Images must be 5 MB or smaller.';
  if (file.size === 0) return 'This image is empty. Choose another file.';
  return '';
}

async function insertSubmission(client, table, payload, context, failureMessage) {
  let response;
  try {
    response = await client.from(table).insert(payload, { count: 'exact' });
  } catch (requestError) {
    console.error(`${context} insert request failed:`, {
      code: requestError?.code,
      status: requestError?.status,
    });
    throw new Error(failureMessage);
  }

  if (
    response.error
    || typeof response.status !== 'number'
    || response.status < 200
    || response.status >= 300
    || response.count !== 1
  ) {
    console.error(`${context} insert was rejected:`, {
      code: response.error?.code,
      status: response.error?.status ?? response.status,
      insertedRows: response.count,
    });
    throw new Error(failureMessage);
  }

  return { table, status: response.status, insertedRows: response.count };
}

async function uploadImage(file, folder, onProgress) {
  const client = requireSupabase();
  const error = validateImage(file);
  if (error) throw new Error(error);

  const path = `${folder}/${crypto.randomUUID()}.${file.type === 'image/jpeg' ? 'jpg' : file.type.split('/')[1]}`;
  const { data: { session } } = await client.auth.getSession();
  const token = session?.access_token ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  await new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open('POST', `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/${MEMORY_BUCKET}/${path}`);
    request.setRequestHeader('apikey', import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);
    request.setRequestHeader('Authorization', `Bearer ${token}`);
    request.setRequestHeader('Content-Type', file.type);
    request.setRequestHeader('x-upsert', 'false');
    request.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    });
    request.addEventListener('load', () => {
      if (request.status >= 200 && request.status < 300) resolve();
      else reject(new Error('The image could not be uploaded. Check the Supabase Storage setup and try again.'));
    });
    request.addEventListener('error', () => reject(new Error('The image upload was interrupted. Check your connection and try again.')));
    request.addEventListener('abort', () => reject(new Error('The image upload was cancelled.')));
    request.send(file);
  });

  return path;
}

export async function submitPhotoSubmission(values, onProgress) {
  const client = requireSupabase();
  const storagePath = await uploadImage(values.file, 'submissions', onProgress);
  await insertSubmission(client, 'photo_submissions', {
    contributor_name: values.contributorName.trim() || null,
    contributor_name_display_consent:
      values.photoDisplayConsent === 'yes' && values.contributorNameDisplayConsent === 'yes',
    caption: values.caption.trim() || null,
    category: values.category || null,
    storage_path: storagePath,
    photo_display_consent: values.photoDisplayConsent === 'yes',
    moderation_status: 'pending',
    featured_on_innovanta: false,
  }, 'Photo submission', 'The photo uploaded, but its review record could not be saved. The image remains private; please retry or contact the event team.');
}

export async function submitCommunityStory(values, onProgress) {
  const client = requireSupabase();
  let storagePath = null;
  if (values.photo) storagePath = await uploadImage(values.photo, 'stories', onProgress);

  await insertSubmission(client, 'community_stories', {
    contributor_name: values.name.trim(),
    college: values.college.trim() || null,
    favorite_moment: values.favoriteMoment.trim() || null,
    met_or_learned: values.metOrLearned.trim() || null,
    memorable_reason: values.memorableReason.trim() || null,
    community_message: values.communityMessage.trim() || null,
    story_consent: values.storyConsent === 'yes',
    name_display_consent: values.storyConsent === 'yes' && values.nameDisplayConsent === 'yes',
    photo_storage_path: storagePath,
    photo_display_consent: values.storyConsent === 'yes' && values.photoDisplayConsent === 'yes',
    moderation_status: 'pending',
    featured_on_innovanta: false,
  }, 'Community story', 'Your story could not be saved. Any uploaded image remains private; please retry or contact the event team.');
}

async function getSignedImage(client, storagePath) {
  if (!storagePath) return null;
  const { data, error } = await client.storage.from(MEMORY_BUCKET).createSignedUrl(
    storagePath,
    60 * 60,
    { transform: { width: 800, height: 700, resize: 'cover', quality: 75 } },
  );
  if (error) {
    console.error('Unable to create an approved image URL:', {
      code: error.code,
      status: error.status,
    });
    throw new Error('An approved community photo could not be prepared for display.');
  }
  return data.signedUrl;
}

export async function getApprovedMemories() {
  const client = requireSupabase();
  const { data, error } = await client.rpc('get_public_memories');
  if (error) {
    console.error('Unable to load approved community memories:', {
      code: error.code,
      status: error.status,
    });
    throw new Error('Approved memories are temporarily unavailable.');
  }
  return Promise.all((data ?? []).map(async (item) => ({
    ...item,
    image_url: await getSignedImage(client, item.storage_path),
  })));
}

export async function getApprovedStories() {
  const client = requireSupabase();
  const { data, error } = await client.rpc('get_public_stories');
  if (error) {
    console.error('Unable to load approved community stories:', {
      code: error.code,
      status: error.status,
    });
    throw new Error('Approved community stories are temporarily unavailable.');
  }
  return Promise.all((data ?? []).map(async (item) => ({
    ...item,
    image_url: await getSignedImage(client, item.photo_storage_path),
  })));
}

export async function getApprovedTestimonials() {
  const client = requireSupabase();
  const { data, error } = await client.rpc('get_public_testimonials');
  if (error) {
    console.error('Unable to load approved testimonials:', {
      code: error.code,
      status: error.status,
    });
    throw new Error('Approved testimonials are temporarily unavailable.');
  }
  return data ?? [];
}
