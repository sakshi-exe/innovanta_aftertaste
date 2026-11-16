import React from 'react';
import { ArrowLeft, Coffee, Heart } from 'lucide-react';

export default function SuccessMessage({ onReturn }) {
  return (
    <section className="success-card" aria-live="polite" role="status">
      <div className="success-icon"><Coffee size={34} strokeWidth={1.5} /><Heart className="success-heart" size={16} fill="currentColor" /></div>
      <p className="eyebrow">NOTE RECEIVED, HEART FULL</p>
      <h2>Your note is now<br />part of our story. <span>☕</span></h2>
      <p className="success-copy">Thank you for being a part of Brew &amp; Build. Here’s to more ideas, more conversations, and more things we create together.</p>
      <button className="button button-dark" onClick={onReturn} type="button"><ArrowLeft size={16} /> Back to the beginning</button>
      <span className="success-doodle handwritten">until next time!</span>
    </section>
  );
}
