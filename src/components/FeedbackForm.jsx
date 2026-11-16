import React, { useState } from 'react';
import { ArrowRight, LoaderCircle, Send } from 'lucide-react';
import { submitFeedback } from '../services/feedback.js';
import ExperienceOptions from './ExperienceOptions.jsx';
import StarRating from './StarRating.jsx';

const initialValues = {
  fullName: '',
  college: '',
  email: '',
  rating: 0,
  favoriteParts: [],
  learningTakeaway: '',
  eventDescription: '',
  futureAttendance: '',
  feedbackMessage: '',
  testimonialConsent: '',
  nameDisplayConsent: '',
};

const attendanceOptions = ['Yes', 'Maybe', 'Definitely'];

function validate(values) {
  const errors = {};
  if (!values.fullName.trim()) errors.fullName = 'Please add your name.';
  else if (values.fullName.trim().length > 100) errors.fullName = 'Please keep your name under 100 characters.';
  if (values.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = 'Enter a valid email address, or leave this optional field blank.';
  } else if (values.email.length > 254) errors.email = 'Email must be 254 characters or fewer.';
  if (!values.rating) errors.rating = 'Choose a star rating to continue.';
  if (values.college.trim().length > 160) errors.college = 'Please keep this under 160 characters.';
  if (values.learningTakeaway.trim().length > 1000) errors.learningTakeaway = 'Please keep this under 1,000 characters.';
  if (!values.eventDescription.trim()) errors.eventDescription = 'Add a few words that describe the event.';
  else if (values.eventDescription.trim().length > 120) errors.eventDescription = 'Keep it to 120 characters or fewer.';
  if (!values.futureAttendance) errors.futureAttendance = 'Please choose one option.';
  if (!values.feedbackMessage.trim()) errors.feedbackMessage = 'We’d love to hear your thoughts.';
  else if (values.feedbackMessage.trim().length > 2000) errors.feedbackMessage = 'Please keep your note under 2,000 characters.';
  if (!values.testimonialConsent) errors.testimonialConsent = 'Please choose Yes or No for testimonial consent.';
  if (values.testimonialConsent === 'yes' && !values.nameDisplayConsent) {
    errors.nameDisplayConsent = 'Please choose Yes or No for name display consent.';
  }
  return errors;
}

function ChoiceGroup({ label, name, value, onChange, options, error }) {
  return (
    <fieldset className={`field-group${error ? ' has-error' : ''}`}>
      <legend id={`${name}-legend`}>{label} <span className="required-mark">*</span></legend>
      <div className="choice-row">
        {options.map((option) => (
          <label className={`choice-pill${value === option.value ? ' is-selected' : ''}`} key={option.value}>
            <input
              aria-describedby={error ? `${name}-error` : undefined}
              aria-invalid={Boolean(error)}
              checked={value === option.value}
              name={name}
              onChange={() => onChange(option.value)}
              required
              type="radio"
            />
            <span className="choice-indicator" />{option.label}
          </label>
        ))}
      </div>
      {error && <span className="field-error" id={`${name}-error`} role="alert">{error}</span>}
    </fieldset>
  );
}

export default function FeedbackForm({ onSuccess }) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  function update(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (isSubmitting) return;
    const nextErrors = validate(values);
    setErrors(nextErrors);
    setSubmitError('');
    if (Object.keys(nextErrors).length) {
      const firstInvalidField = Object.keys(nextErrors)[0];
      const targetId = firstInvalidField === 'rating' ? 'rating-1' : firstInvalidField;
      const target = document.getElementById(targetId)
        ?? document.querySelector(`[name="${firstInvalidField}"]`);
      target?.focus();
      return;
    }

    setIsSubmitting(true);
    try {
      await submitFeedback(values);
      onSuccess();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="feedback-form" onSubmit={handleSubmit} noValidate>
      <div className="form-section-label"><span>01</span><p>A LITTLE ABOUT YOU <i>— just the basics</i></p></div>
      <div className="form-grid">
        <div className={`input-wrap${errors.fullName ? ' has-error' : ''}`}>
          <label htmlFor="fullName">Full name <span className="required-mark">*</span></label>
          <input aria-describedby={errors.fullName ? 'fullName-error' : undefined} aria-invalid={Boolean(errors.fullName)} autoComplete="name" id="fullName" maxLength={100} onChange={(event) => update('fullName', event.target.value)} placeholder="What should we call you?" required value={values.fullName} />
          {errors.fullName && <span className="field-error" id="fullName-error" role="alert">{errors.fullName}</span>}
        </div>
        <div className={`input-wrap${errors.college ? ' has-error' : ''}`}>
          <label htmlFor="college">College or organization <span className="optional-mark">(optional)</span></label>
          <input aria-describedby={errors.college ? 'college-error' : undefined} aria-invalid={Boolean(errors.college)} autoComplete="organization" id="college" maxLength={160} onChange={(event) => update('college', event.target.value)} placeholder="Where are you learning or building?" value={values.college} />
          {errors.college && <span className="field-error" id="college-error" role="alert">{errors.college}</span>}
        </div>
        <div className={`input-wrap${errors.email ? ' has-error' : ''}`}>
          <label htmlFor="email">Email <span className="optional-mark">(optional)</span></label>
          <input aria-describedby={errors.email ? 'email-error' : undefined} aria-invalid={Boolean(errors.email)} autoComplete="email" id="email" maxLength={254} onChange={(event) => update('email', event.target.value)} placeholder="For a follow-up, only if needed" type="email" value={values.email} />
          <span className="field-hint">Your email stays private and is never shown as a testimonial.</span>
          {errors.email && <span className="field-error" id="email-error" role="alert">{errors.email}</span>}
        </div>
      </div>

      <div className="form-section-label"><span>02</span><p>THE GOOD STUFF <i>— your experience</i></p></div>
      <StarRating error={errors.rating} onChange={(rating) => update('rating', rating)} value={values.rating} />
      <ExperienceOptions onChange={(favoriteParts) => update('favoriteParts', favoriteParts)} selected={values.favoriteParts} />
      <div className="input-wrap">
        <label htmlFor="learningTakeaway">One thing you learned or took away <span className="optional-mark">(optional)</span></label>
        <textarea id="learningTakeaway" maxLength={1000} onChange={(event) => update('learningTakeaway', event.target.value)} placeholder="A thought, a new perspective, a person you'll remember..." rows={3} value={values.learningTakeaway} />
      </div>
      <div className={`input-wrap${errors.eventDescription ? ' has-error' : ''}`}>
        <label htmlFor="eventDescription">Describe Brew &amp; Build in a few words <span className="required-mark">*</span></label>
        <input aria-describedby={errors.eventDescription ? 'eventDescription-error' : undefined} aria-invalid={Boolean(errors.eventDescription)} id="eventDescription" maxLength={120} onChange={(event) => update('eventDescription', event.target.value)} placeholder="e.g. energizing, welcoming, unexpectedly inspiring" required value={values.eventDescription} />
        <span className="character-count">{values.eventDescription.length}/120</span>
        {errors.eventDescription && <span className="field-error" id="eventDescription-error" role="alert">{errors.eventDescription}</span>}
      </div>
      <ChoiceGroup
        error={errors.futureAttendance}
        label="Would you attend another INNOVANTA event?"
        name="futureAttendance"
        onChange={(value) => update('futureAttendance', value)}
        options={attendanceOptions.map((option) => ({ label: option, value: option.toLowerCase() }))}
        value={values.futureAttendance}
      />
      <div className={`input-wrap${errors.feedbackMessage ? ' has-error' : ''}`}>
        <label htmlFor="feedbackMessage">Your message or feedback <span className="required-mark">*</span></label>
        <textarea aria-describedby={errors.feedbackMessage ? 'feedbackMessage-error' : undefined} aria-invalid={Boolean(errors.feedbackMessage)} id="feedbackMessage" maxLength={2000} onChange={(event) => update('feedbackMessage', event.target.value)} placeholder="Tell us what worked, what could be better, or anything you wish we'd asked..." required rows={5} value={values.feedbackMessage} />
        <span className="character-count">{values.feedbackMessage.length}/2000</span>
        {errors.feedbackMessage && <span className="field-error" id="feedbackMessage-error" role="alert">{errors.feedbackMessage}</span>}
      </div>

      <div className="consent-block">
        <div className="form-section-label"><span>03</span><p>YOUR WORDS, YOUR CALL <i>— always your choice</i></p></div>
        <p className="consent-explainer">Your feedback is private by default. Saying yes lets our team consider your words for the INNOVANTA website — it does not mean they'll be published. Every testimonial is reviewed and approved separately.</p>
        <ChoiceGroup
          error={errors.testimonialConsent}
          label="May we consider featuring your feedback as a testimonial on the INNOVANTA website?"
          name="testimonialConsent"
          onChange={(value) => {
            update('testimonialConsent', value);
            if (value === 'no') update('nameDisplayConsent', '');
          }}
          options={[{ label: 'Yes, you may consider it', value: 'yes' }, { label: 'No, keep it private', value: 'no' }]}
          value={values.testimonialConsent}
        />
        {values.testimonialConsent === 'yes' && (
          <ChoiceGroup
            error={errors.nameDisplayConsent}
            label="If selected, may we display your name and college alongside your testimonial?"
            name="nameDisplayConsent"
            onChange={(value) => update('nameDisplayConsent', value)}
            options={[{ label: 'Yes, name and college are okay', value: 'yes' }, { label: 'No, keep me anonymous', value: 'no' }]}
            value={values.nameDisplayConsent}
          />
        )}
      </div>
      {submitError && <div className="submit-error" role="alert">{submitError}</div>}
      <div className="submit-row">
        <button className="button button-dark submit-button" disabled={isSubmitting} type="submit">
          {isSubmitting ? <><LoaderCircle className="spin" size={18} /> Sending your note…</> : <>Send your little note <Send size={16} /></>}
        </button>
        <span className="submit-privacy">Your note is private unless you choose otherwise. <ArrowRight size={13} /></span>
      </div>
    </form>
  );
}
