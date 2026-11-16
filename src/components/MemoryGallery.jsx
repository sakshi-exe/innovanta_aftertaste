import React, { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Camera, Coffee, ImagePlus, LoaderCircle, X } from 'lucide-react';
import { getApprovedMemories, submitPhotoSubmission, validateImage } from '../services/community.js';
import ConsentChoice from './ConsentChoice.jsx';

const categories = ['People & connections', 'Coffee & atmosphere', 'Speakers & ideas', 'Behind the scenes', 'Group moments', 'Other'];

function MemoryUploadForm({ onClose, onSubmitted }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [values, setValues] = useState({ caption: '', contributorName: '', contributorNameDisplayConsent: '', category: '', photoDisplayConsent: '' });
  const [error, setError] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [progress, setProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submissionInProgress = useRef(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!file) {
      setPreview('');
      return undefined;
    }
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (submissionInProgress.current) return;
    const validationError = validateImage(file);
    if (validationError) {
      setFieldError(validationError);
      return;
    }
    if (!values.photoDisplayConsent) {
      setFieldError('Choose Yes or No for public photo display consent.');
      return;
    }
    if (values.contributorName.trim() && values.photoDisplayConsent === 'yes' && !values.contributorNameDisplayConsent) {
      setFieldError('Choose whether we may display your contributor name, or leave your name blank.');
      return;
    }

    setFieldError('');
    setError('');
    submissionInProgress.current = true;
    setIsSubmitting(true);
    try {
      await submitPhotoSubmission({ ...values, file }, setProgress);
      setSubmitted(true);
      onSubmitted();
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'We couldn’t send this photo. Please try again.');
    } finally {
      submissionInProgress.current = false;
      setIsSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="submission-success" role="status">
        <span className="success-icon"><Camera size={30} /></span>
        <h3>Your memory is with us.</h3>
        <p>Your photo and its review record were saved to the memories queue. The INNOVANTA team will review it before it can appear in the public gallery.</p>
        <button className="button button-dark" onClick={onClose} type="button">Back to the memories</button>
      </div>
    );
  }

  return (
    <form className="community-form" onSubmit={handleSubmit} noValidate>
      <div className="upload-heading">
        <div><p className="eyebrow">A MOMENT WORTH KEEPING</p><h3>Add your memory</h3></div>
        <button aria-label="Close photo form" className="icon-button" onClick={onClose} type="button"><X size={19} /></button>
      </div>
      <label className="upload-dropzone" htmlFor="memory-file">
        {preview ? <img alt="Preview of the image you selected" className="upload-preview" src={preview} /> : <><ImagePlus size={27} /><strong>Choose a photo</strong><span>JPG, JPEG, PNG, WebP · up to 5 MB</span></>}
        <input accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" id="memory-file" onChange={(event) => { setFile(event.target.files?.[0] ?? null); setFieldError(''); }} type="file" />
      </label>
      <div className="community-fields">
        <div className="input-wrap">
          <label htmlFor="memory-caption">Caption <span className="optional-mark">(optional)</span></label>
          <input id="memory-caption" maxLength={180} onChange={(event) => setValues({ ...values, caption: event.target.value })} placeholder="A little note about this moment" value={values.caption} />
        </div>
        <div className="input-wrap">
          <label htmlFor="memory-contributor">Your name <span className="optional-mark">(optional)</span></label>
          <input id="memory-contributor" maxLength={100} onChange={(event) => setValues({ ...values, contributorName: event.target.value, contributorNameDisplayConsent: '' })} placeholder="Leave blank to contribute anonymously" value={values.contributorName} />
        </div>
        {values.contributorName.trim() && values.photoDisplayConsent === 'yes' && (
          <ConsentChoice
            label="May we display your contributor name with this photo?"
            name="memory-name-consent"
            onChange={(value) => setValues({ ...values, contributorNameDisplayConsent: value })}
            value={values.contributorNameDisplayConsent}
          />
        )}
        <div className="input-wrap">
          <label htmlFor="memory-category">Photo category <span className="optional-mark">(optional)</span></label>
          <select id="memory-category" onChange={(event) => setValues({ ...values, category: event.target.value })} value={values.category}>
            <option value="">Choose a category</option>
            {categories.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
        </div>
        <ConsentChoice
          label="May this photo be displayed publicly if the team approves it?"
          name="memory-display-consent"
          onChange={(value) => setValues({
            ...values,
            photoDisplayConsent: value,
            ...(value === 'no' ? { contributorNameDisplayConsent: '' } : {}),
          })}
          value={values.photoDisplayConsent}
        />
      </div>
      <p className="consent-explainer">Your upload stays private while it is reviewed. Public display requires your explicit yes and separate approval by the INNOVANTA team.</p>
      {(fieldError || error) && <div className="submit-error" role="alert">{fieldError || error}</div>}
      {isSubmitting && <div className="upload-progress" aria-live="polite"><div aria-label="Photo upload progress" aria-valuemax="100" aria-valuemin="0" aria-valuenow={progress} className="upload-progress-track" role="progressbar"><span style={{ width: `${progress}%` }} /></div><span>{progress ? `Uploading ${progress}%` : 'Preparing your photo…'}</span></div>}
      <button className="button button-dark" disabled={isSubmitting} type="submit">{isSubmitting ? <><LoaderCircle className="spin" size={18} /> Sending photo…</> : <>Send for review <ArrowUpRight size={16} /></>}</button>
    </form>
  );
}

export default function MemoryGallery() {
  const [memories, setMemories] = useState([]);
  const [loadError, setLoadError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  async function refreshMemories() {
    setLoadError('');
    try {
      setMemories(await getApprovedMemories());
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Approved memories are temporarily unavailable.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { refreshMemories(); }, []);

  return (
    <section className="memories-section section-wrap" id="memories">
      <div className="section-heading memories-heading">
        <div>
          <p className="eyebrow"><span className="eyebrow-line" /> LITTLE MOMENTS, BIG AFTERTASTE</p>
          <h2>Our Little Coffee<br />Memories<span>.</span></h2>
        </div>
        <div className="memory-intro">
          <p className="section-intro">The people, the coffee, the in-between moments. Add a memory to our scrapbook, or take a look at the photos approved to share.</p>
          <button className="button button-dark" onClick={() => setShowForm((open) => !open)} type="button"><Camera size={17} /> Add Your Memory</button>
        </div>
      </div>
      <p className="gallery-disclaimer">Every photo is reviewed first. Only photos with public-display consent and team approval appear here.</p>
      {showForm && <MemoryUploadForm onClose={() => setShowForm(false)} onSubmitted={refreshMemories} />}
      {loadError && <p className="content-load-error" role="alert">{loadError}</p>}
      {isLoading ? <p className="empty-community"><LoaderCircle className="spin" size={19} /> Gathering the memories…</p> : memories.length ? (
        <div className="community-memory-grid">
          {memories.map((memory, index) => (
            <figure className={`community-polaroid polaroid-tilt-${index % 4}`} key={memory.id}>
              {memory.image_url ? <img alt={`Community photo from Brew & Build: ${memory.caption || memory.category || 'a shared event memory'}`} loading="lazy" src={memory.image_url} /> : <div className="memory-image-placeholder"><Coffee size={28} /><span>IMAGE UNAVAILABLE</span></div>}
              <figcaption><span className="handwritten">{memory.caption || memory.category || 'a little moment'}</span>{memory.contributor_name && <small>— {memory.contributor_name}</small>}</figcaption>
              {memory.featured && <span className="memory-featured">A LITTLE FAVOURITE</span>}
            </figure>
          ))}
        </div>
      ) : !loadError && <div className="empty-community"><span className="empty-doodle"><Coffee size={31} /></span><p>No approved photos just yet.</p><span>Be the first to add a memory from the day.</span></div>}
      <p className="gallery-disclaimer">Only approved community submissions are shown here — no placeholder photos or invented event moments.</p>
    </section>
  );
}
