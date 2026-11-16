import React, { useState } from 'react';
import { Coffee, Heart, Leaf, MoveDownRight } from 'lucide-react';
import Navbar from './components/Navbar.jsx';
import HeroSection from './components/HeroSection.jsx';
import ApprovedTestimonials from './components/ApprovedTestimonials.jsx';
import MemoryGallery from './components/MemoryGallery.jsx';
import CommunityStories from './components/CommunityStories.jsx';
import FeedbackForm from './components/FeedbackForm.jsx';
import SuccessMessage from './components/SuccessMessage.jsx';
import Footer from './components/Footer.jsx';

export default function App() {
  const [submitted, setSubmitted] = useState(false);

  function returnHome() {
    setSubmitted(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="app-shell" id="experience">
      <Navbar />
      <main>
        <HeroSection />
        <section className="event-story-section" aria-labelledby="event-story-title">
          <div className="event-story-inner section-wrap">
            <div className="event-story-art" aria-hidden="true">
              <span className="event-story-sun" />
              <span className="event-story-ring" />
              <Coffee className="event-story-cup" size={58} strokeWidth={1.2} />
              <Leaf className="event-story-leaf" size={27} strokeWidth={1.3} />
              <span className="event-story-label">A TABLE FOR WHAT'S NEXT</span>
            </div>
            <div className="event-story-copy">
              <p className="eyebrow"><span className="eyebrow-line" /> THE BREW &amp; BUILD STORY</p>
              <h2 id="event-story-title">Good ideas grow<br /><em>in good company.</em></h2>
              <p>Brew &amp; Build by INNOVANTA brings coffee and technology into the same conversation — a little room to meet, exchange ideas, and imagine what we can build together.</p>
              <a className="text-link" href="#stories">Meet the community <MoveDownRight size={16} /></a>
            </div>
          </div>
        </section>
        <ApprovedTestimonials />
        <MemoryGallery />
        <CommunityStories />
        <section className="feedback-section section-wrap" id="share">
          <div className="feedback-heading">
            <div>
              <p className="eyebrow"><span className="eyebrow-line" /> YOUR SIDE OF THE STORY</p>
              <h2>Leave a Little<br /><em>Note.</em></h2>
            </div>
            <div className="feedback-aside">
              <p>Every perspective adds something to our story.</p>
              <span className="handwritten">this part is all yours <MoveDownRight size={18} /></span>
              <div className="aside-stamp"><Heart size={18} /><span>made<br />of people</span></div>
            </div>
          </div>
          <div className="form-paper">
            <div className="form-topline"><span><Coffee size={14} /> BREW &amp; BUILD / FEEDBACK CARD</span><span>NO. 001 — YOURS TO FILL</span></div>
            {submitted ? <SuccessMessage onReturn={returnHome} /> : <FeedbackForm onSuccess={() => setSubmitted(true)} />}
          </div>
        </section>
        <section className="closing-note" aria-label="Closing note">
          <div className="closing-rule" /><p className="handwritten">every good conversation leaves something behind</p><div className="closing-rule" />
        </section>
      </main>
      <Footer />
    </div>
  );
}
