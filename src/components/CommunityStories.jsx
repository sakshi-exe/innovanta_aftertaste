import React, { useEffect, useRef, useState } from 'react';
import { BookHeart, ImagePlus, LoaderCircle, Send } from 'lucide-react';
import { getApprovedStories, submitCommunityStory, validateImage } from '../services/community.js';
import ConsentChoice from './ConsentChoice.jsx';

const emptyStory = {
  name: '', college: '', favoriteMoment: '', metOrLearned: '', memorableReason: '', communityMessage: '',
  storyConsent: '', nameDisplayConsent: '', photoDisplayConsent: '', photo: null,
};

export default function CommunityStories() {
  const [stories, setStories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [values, setValues] = useState(emptyStory);
  const [preview, setPreview] = useState('');
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const submissionInProgress = useRef(false);

  useEffect(() => {
    if (!values.photo) {
      setPreview('');
      return undefined;
    }
    const objectUrl = URL.createObjectURL(values.photo);
    setPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [values.photo]);

  async function refreshStories() {
    try {
      setStories(await getApprovedStories());
      setLoadError('');
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Approved stories are temporarily unavailable.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { refreshStories(); }, []);

  function update(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({
      ...current,
      [field]: undefined,
      ...(field === 'favoriteMoment' || field === 'metOrLearned' || field === 'memorableReason' || field === 'communityMessage'
        ? { storyLength: undefined }
        : {}),
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submissionInProgress.current) return;
    const nextErrors = {};
    if (!values.name.trim()) nextErrors.name = 'Please add your name for the review team.';
    else if (values.name.trim().length > 100) nextErrors.name = 'Please keep your name under 100 characters.';
    if (values.college.trim().length > 160) nextErrors.college = 'Please keep this under 160 characters.';
    if (![values.favoriteMoment, values.metOrLearned, values.memorableReason, values.communityMessage].some((item) => item.trim())) {
      nextErrors.favoriteMoment = 'Share at least a sentence or a few words to submit your story.';
    }
    if (values.favoriteMoment.length > 1200 || values.metOrLearned.length > 1200 || values.memorableReason.length > 1200 || values.communityMessage.length > 1200) {
      nextErrors.storyLength = 'Keep each answer to 1,200 characters or fewer.';
    }
    if (!values.storyConsent) nextErrors.storyConsent = 'Please choose Yes or No for story publication consent.';
    if (values.storyConsent === 'yes' && !values.nameDisplayConsent) nextErrors.nameDisplayConsent = 'Choose whether we may display your name and college.';
    if (values.photo && !values.photoDisplayConsent) nextErrors.photoDisplayConsent = 'Choose Yes or No for public display of your photo.';
    if (values.photo) {
      const imageError = validateImage(values.photo);
      if (imageError) nextErrors.photo = imageError;
    }

    setErrors(nextErrors);
    setSubmitError('');
    if (Object.keys(nextErrors).length) {
      const firstField = Object.keys(nextErrors)[0];
      const fieldTargets = {
        storyConsent: 'story-consent-group',
        nameDisplayConsent: 'story-name-consent-group',
        photoDisplayConsent: 'story-photo-consent-group',
        photo: 'story-photo',
        college: 'story-college',
        storyLength: 'favoriteMoment',
      };
      const targetId = fieldTargets[firstField] ?? firstField;
      const foundTarget = document.getElementById(targetId);
      const target = foundTarget?.matches('fieldset')
        ? foundTarget.querySelector('input')
        : foundTarget;
      const focusTarget = target
        ?? document.querySelector(`[name="${firstField.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}"]`);
      focusTarget?.focus();
      return;
    }

    submissionInProgress.current = true;
    setIsSubmitting(true);
    try {
      await submitCommunityStory(values, setProgress);
      setSubmitted(true);
      refreshStories();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'We couldn’t save your story. Please try again.');
    } finally {
      submissionInProgress.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <section className="stories-section section-wrap" id="stories">
      <div className="section-heading">
        <div>
          <p className="eyebrow"><span className="eyebrow-line" /> FROM OUR COMMUNITY, WITH LOVE</p>
          <h2>Stories from<br />the Same Table<span>.</span></h2>
        </div>
        <p className="section-intro">Some moments stay with us long after the last sip. Share yours with the INNOVANTA community.</p>
      </div>

      {loadError && <p className="content-load-error" role="alert">{loadError}</p>}
      {isLoading ? <p className="empty-community"><LoaderCircle className="spin" size={19} /> Gathering the stories…</p> : stories.length ? (
        <div className="story-grid">
          {stories.map((story, index) => (
            <article className={`story-card story-card-${index % 3}`} key={story.id}>
              <span className="story-number">A NOTE FROM THE TABLE · {String(index + 1).padStart(2, '0')}</span>
              <BookHeart className="story-doodle" size={22} />
              {story.favorite_moment && <p><strong>Favorite moment</strong>{story.favorite_moment}</p>}
              {story.met_or_learned && <p><strong>Someone or something new</strong>{story.met_or_learned}</p>}
              {story.memorable_reason && <p><strong>What made it memorable</strong>{story.memorable_reason}</p>}
              {story.community_message && <p><strong>A note to the community</strong>{story.community_message}</p>}
              {story.image_url && <img alt="Approved photo shared with this community story" className="story-photo" loading="lazy" src={story.image_url} />}
              <footer>{story.contributor_name && <span>{story.contributor_name}</span>}{story.college && <small>{story.college}</small>}{story.featured && <small className="featured-label">FEATURED ON INNOVANTA</small>}</footer>
            </article>
          ))}
        </div>
      ) : !loadError && <div className="empty-community story-empty"><BookHeart size={29} /><p>Our story cards are waiting for their first chapter.</p><span>No participant stories are shown until they have consent and team approval.</span></div>}

      <div className="story-form-paper">
        {submitted ? (
          <div className="submission-success" role="status">
            <span className="success-icon"><BookHeart size={30} /></span>
            <h3>Thank you for sharing your story.</h3>
            <p>Your story was saved to the community stories queue. Any attached photo is part of that story submission, not a separate photo-memory entry. Nothing is published automatically.</p>
            <button className="button button-dark" onClick={() => { setSubmitted(false); setValues(emptyStory); setProgress(0); }} type="button">Share another story</button>
          </div>
        ) : (
          <form className="community-form" onSubmit={handleSubmit} noValidate>
            <div className="upload-heading"><div><p className="eyebrow">A NOTE FROM YOU</p><h3>Tell us what stayed with you.</h3></div></div>
            <div className="community-fields story-fields">
              <div className="input-wrap">
                <label htmlFor="name">Your name <span className="required-mark">*</span></label>
                <input aria-describedby={errors.name ? 'story-name-error' : undefined} aria-invalid={Boolean(errors.name)} id="name" maxLength={100} onChange={(event) => update('name', event.target.value)} placeholder="Name for our review team" required value={values.name} />
                {errors.name && <span className="field-error" id="story-name-error" role="alert">{errors.name}</span>}
              </div>
              <div className="input-wrap">
                <label htmlFor="story-college">College or organization <span className="optional-mark">(optional)</span></label>
                <input aria-describedby={errors.college ? 'story-college-error' : undefined} aria-invalid={Boolean(errors.college)} id="story-college" maxLength={160} onChange={(event) => update('college', event.target.value)} placeholder="Where you learn or build" value={values.college} />
                {errors.college && <span className="field-error" id="story-college-error" role="alert">{errors.college}</span>}
              </div>
              <StoryPrompt id="favoriteMoment" label="What was your favorite moment?" onChange={update} value={values.favoriteMoment} />
              <StoryPrompt id="metOrLearned" label="Did you meet someone interesting or learn something new?" onChange={update} value={values.metOrLearned} />
              <StoryPrompt id="memorableReason" label="What made this event memorable?" onChange={update} value={values.memorableReason} />
              <StoryPrompt id="communityMessage" label="Would you like to share a message with the INNOVANTA community?" onChange={update} value={values.communityMessage} />
              {errors.favoriteMoment && <p className="field-error story-validation" role="alert">{errors.favoriteMoment}</p>}
              {errors.storyLength && <p className="field-error story-validation" role="alert">{errors.storyLength}</p>}
              <div className="input-wrap">
                <label htmlFor="story-photo">Add a photo <span className="optional-mark">(optional · JPG, PNG, WebP · up to 5 MB)</span></label>
                <label className="story-file-button" htmlFor="story-photo">
                  <ImagePlus size={17} /><span>{values.photo ? values.photo.name : 'Choose a photo'}</span>
                  <input accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" className="visually-hidden" id="story-photo" onChange={(event) => {
                    update('photo', event.target.files?.[0] ?? null);
                    if (values.storyConsent !== 'yes') update('photoDisplayConsent', 'no');
                  }} type="file" />
                </label>
                {preview && <img alt="Preview of the optional story photo" className="story-photo-preview" src={preview} />}
                {errors.photo && <span className="field-error" role="alert">{errors.photo}</span>}
              </div>
              {values.photo && values.storyConsent === 'yes' && <ConsentChoice error={errors.photoDisplayConsent} label="May this story photo be displayed publicly if approved?" name="story-photo-consent" onChange={(value) => update('photoDisplayConsent', value)} value={values.photoDisplayConsent} />}
              {values.photo && values.storyConsent !== 'yes' && <p className="consent-explainer">Your photo will remain private because this story won’t be considered for publication.</p>}
              <ConsentChoice
                error={errors.storyConsent}
                label="May we consider publishing your story on the INNOVANTA website?"
                name="story-consent"
                onChange={(value) => {
                  update('storyConsent', value);
                  if (value === 'no') {
                    update('nameDisplayConsent', '');
                    if (values.photo) update('photoDisplayConsent', 'no');
                  }
                }}
                value={values.storyConsent}
              />
              {values.storyConsent === 'yes' && <ConsentChoice error={errors.nameDisplayConsent} label="If selected, may we display your name and college with your story?" name="story-name-consent" onChange={(value) => update('nameDisplayConsent', value)} value={values.nameDisplayConsent} />}
            </div>
            <p className="consent-explainer">Publication is optional. Your story stays private unless you consent, and the team approves it separately. Name and photo display each have their own consent.</p>
            {submitError && <div className="submit-error" role="alert">{submitError}</div>}
            {isSubmitting && values.photo && <div className="upload-progress" aria-live="polite"><div aria-label="Story photo upload progress" aria-valuemax="100" aria-valuemin="0" aria-valuenow={progress} className="upload-progress-track" role="progressbar"><span style={{ width: `${progress}%` }} /></div><span>{progress ? `Uploading ${progress}%` : 'Preparing your photo…'}</span></div>}
            <button className="button button-dark" disabled={isSubmitting} type="submit">{isSubmitting ? <><LoaderCircle className="spin" size={18} /> Sending your story…</> : <>Send your story for review <Send size={16} /></>}</button>
          </form>
        )}
      </div>
    </section>
  );
}

function StoryPrompt({ id, label, onChange, value }) {
  return (
    <div className="input-wrap story-prompt">
      <label htmlFor={id}>{label} <span className="optional-mark">(optional)</span></label>
      <textarea id={id} maxLength={1200} onChange={(event) => onChange(id, event.target.value)} placeholder="Share as much or as little as you'd like…" rows={3} value={value} />
    </div>
  );
}
