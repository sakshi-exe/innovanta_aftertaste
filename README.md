# Brew & Build — The Aftertaste

A responsive community microsite for Brew & Build by INNOVANTA. Participants can submit private feedback, community stories, and event photos. Approved public content is served through narrowly scoped Supabase RPC functions; submissions are never published automatically.

## Run locally

Requirements: Node.js 18+ and npm.

```sh
npm install
cp .env.example .env
```

Configure `.env` with your Supabase project URL and publishable key (the legacy anon key is also accepted):

```dotenv
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
VITE_INNOVANTA_URL=
```

`VITE_INNOVANTA_URL` is optional. Set it only after the official INNOVANTA website URL is confirmed. Restart the dev server after changing `.env`.

```sh
npm run dev
npm run build
```

Without Supabase configuration, the site still renders, but submissions show a setup error and the public galleries show an availability message; the site never claims that content was saved. There is no service-role key in this app.

## Supabase setup

1. Create a Supabase project.
2. Run the migrations in order from the Supabase SQL Editor:
   - [`202610220001_create_feedback.sql`](./supabase/migrations/202610220001_create_feedback.sql)
   - [`202610220002_community_content.sql`](./supabase/migrations/202610220002_community_content.sql)
3. Copy the project URL and publishable/anon key to `.env`.
4. Restart Vite.

The second migration creates `photo_submissions` and `community_stories`, configures a **private** `community-memories` Storage bucket, and sets a 5 MB per-image limit and JPG/PNG/WebP MIME allowlist. Client validation is backed by bucket constraints and database checks.

### Photo upload troubleshooting

The two photo contribution forms intentionally create rows in different tables:

- **Add Your Memory** uploads to `community-memories/submissions/...` and inserts a row into `public.photo_submissions` using `storage_path`.
- **Stories from the Same Table** uploads an optional image to `community-memories/stories/...` and inserts its story row into `public.community_stories` using `photo_storage_path`.

Therefore, a Storage object whose name starts with `stories/` is not expected to appear in `photo_submissions`; check `community_stories.photo_storage_path` instead. Both flows await the corresponding metadata insert before showing success. The insert requests an exact affected-row count and accepts success only when one row is confirmed; this does not grant the browser `SELECT` access. If an insert fails after upload, the client reports failure and the uploaded object remains private for an authenticated operator to inspect or remove. The client logs only the Supabase error code/status and affected-row count, not the participant's data or full error response.

### Privacy and access control

- Anonymous visitors can insert feedback, photo metadata, and stories only in their initial unapproved state.
- The browser has no `SELECT`, `UPDATE`, or `DELETE` permission for submission tables. RLS remains enabled.
- The private Storage bucket accepts image uploads only in the `submissions/` and `stories/` folders. Objects cannot be read publicly by their storage path. Storage read policy permits signed URLs only for an approved photo with photo-display consent or an approved, consented story photo.
- Public list RPCs expose only approved, consented display fields. They do not return participant email, private feedback, moderation notes, or unapproved content.
- Testimonial consent, name-display consent, story consent, story-name consent, and photo-display consent are separate. An approval status is additionally required before content appears publicly.
- A photo can be uploaded without public-display consent, but remains private and cannot be approved for the public gallery. A story can likewise be submitted without publication consent.
- Signed gallery image URLs are short-lived (one hour); clients should request fresh URLs for a later page visit.
- Anonymous upload policies can attract spam. Before a public production launch, configure Supabase Auth rate limits/CAPTCHA or route uploads through a rate-limited Edge Function. The client-side 5 MB/type checks are not a substitute for abuse controls.

### Secure moderation workflow

There is no custom admin dashboard in this version. Review through the Supabase Dashboard with a named, authenticated project operator account (use MFA and grant project access only to the INNOVANTA moderators). Use the dashboard Table Editor to inspect pending submissions and the SQL Editor to apply these narrow approval actions. Project credentials must never be placed in this frontend.

Approve an individual testimonial only after confirming its consent:

```sql
update public.feedback
set testimonial_approved = true,
    featured_on_innovanta = false
where id = 'SUBMISSION-UUID'
  and testimonial_consent = true;
```

Approve a photo or story only if its matching public-display consent is true:

```sql
update public.photo_submissions
set moderation_status = 'approved',
    featured_on_innovanta = false
where id = 'SUBMISSION-UUID'
  and photo_display_consent = true;

update public.community_stories
set moderation_status = 'approved',
    featured_on_innovanta = false
where id = 'SUBMISSION-UUID'
  and story_consent = true;
```

Set `featured_on_innovanta = true` on an already-approved item for editorial selection; this changes ordering, not its visibility or consent requirements. Reject photos/stories with `moderation_status = 'rejected'`. General feedback remains private unless separately consented to and approved as a testimonial. The database check constraints reject approval that violates consent.

Operators can review records in the Supabase Dashboard, whose authenticated administrative access is separate from the public application. Do not grant `SELECT` to `anon` or `authenticated`, and do not build an admin screen using a hidden route, client-side password, or the service-role key in Vite. If a bespoke moderation dashboard is later needed, implement it behind Supabase Auth plus a server-side moderator role check (for example, an Edge Function); keep moderation writes out of anonymous browser clients.

Uploaded files whose metadata submission fails remain private and are not returned by public RPCs. An operator can inspect and remove orphan files using the authenticated Storage dashboard.

## Main INNOVANTA website integration

The main website's URL and technology stack are intentionally not assumed. Its backend/client can use the same Supabase project URL and publishable key to call these read-only RPCs:

- `get_public_testimonials()` — testimonial text, rating, optional consented name/college, featured flag, and date.
- `get_public_stories()` — approved story prompts/answers, optional consented identity, optional approved photo path, featured flag, and date.
- `get_public_memories()` — approved photo caption/category, optional consented contributor name, storage path, featured flag, and date.

Example using Supabase JS from the main site's frontend:

```js
const { data, error } = await supabase.rpc('get_public_stories');
if (error) throw error;
```

For a photo returned by the memory or story RPC, request a short-lived signed URL from the private bucket:

```js
const { data, error } = await supabase.storage
  .from('community-memories')
  .createSignedUrl(memory.storage_path, 60 * 60);
if (error) throw error;
const imageUrl = data.signedUrl;
```

The same RPCs are available over Supabase's PostgREST `/rest/v1/rpc/<function-name>` endpoint for a non-JavaScript site. Do not query the submission tables from the main site's public client. The functions return only public fields and filter for approval plus consent; feature flags are editorial metadata and do not bypass either condition. Photos are returned only when approved and consented. The microsite requests 800×700, quality-75 Storage image transformations for lazy-loaded gallery thumbnails; enable Supabase Image Transformations for the project plan before relying on that image optimization. Use the returned IDs for stable keys and request new signed URLs after expiration.

`src/services/community.js` contains reusable frontend retrieval functions (`getApprovedTestimonials`, `getApprovedStories`, `getApprovedMemories`) as examples for another compatible JavaScript project.

## Project structure

```text
src/
  components/       Reusable page sections, forms, and consent controls
  lib/supabase.js   Supabase client and private bucket name
  services/         Feedback, upload, and approved-content APIs
  App.jsx           Page composition
  styles.css        Design tokens, responsive layouts, and motion
supabase/
  migrations/       Schema, private bucket, RLS, storage policies, public RPCs
```

The memories and stories galleries display only real submissions that have passed consent and moderation. Until then they show an explicitly empty state rather than fabricated participant content or stock photography.
