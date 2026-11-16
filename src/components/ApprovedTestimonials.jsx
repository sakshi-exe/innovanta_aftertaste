import React, { useEffect, useState } from 'react';
import { LoaderCircle, Quote, Star } from 'lucide-react';
import { getApprovedTestimonials } from '../services/community.js';

export default function ApprovedTestimonials() {
  const [testimonials, setTestimonials] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let isCurrent = true;

    async function loadTestimonials() {
      try {
        const approved = await getApprovedTestimonials();
        if (isCurrent) setTestimonials(approved);
      } catch (error) {
        if (isCurrent) setLoadError(error instanceof Error ? error.message : 'Approved testimonials are temporarily unavailable.');
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    }

    loadTestimonials();
    return () => { isCurrent = false; };
  }, []);

  return (
    <section className="testimonials-section section-wrap" id="testimonials">
      <div className="section-heading">
        <div>
          <p className="eyebrow"><span className="eyebrow-line" /> KIND WORDS, SHARED WITH PERMISSION</p>
          <h2>What Stayed<br />With Us<span>.</span></h2>
        </div>
        <p className="section-intro">A few notes from people who have shared their experience and said yes to having it published.</p>
      </div>

      {loadError && <p className="content-load-error" role="alert">{loadError}</p>}
      {isLoading ? (
        <p className="empty-community"><LoaderCircle className="spin" size={19} /> Gathering the kind words…</p>
      ) : testimonials.length ? (
        <div className="testimonial-grid">
          {testimonials.map((item) => (
            <article className="testimonial-card" key={item.id}>
              <Quote aria-hidden="true" className="testimonial-quote" size={25} />
              <div aria-label={`${item.rating} out of 5 stars`} className="testimonial-stars" role="img">
                {Array.from({ length: item.rating }, (_, index) => (
                  <Star aria-hidden="true" fill="currentColor" key={index} size={17} />
                ))}
              </div>
              <blockquote>{item.testimonial}</blockquote>
              <footer>
                {item.display_name && <span>{item.display_name}</span>}
                {item.college && <small>{item.college}</small>}
                {!item.display_name && !item.college && <span>Shared anonymously</span>}
              </footer>
            </article>
          ))}
        </div>
      ) : !loadError ? (
        <div className="empty-community testimonial-empty">
          <Quote aria-hidden="true" size={28} />
          <p>Good words are still brewing.</p>
          <span>Approved testimonials will appear here only with publication consent.</span>
        </div>
      ) : null}
    </section>
  );
}
