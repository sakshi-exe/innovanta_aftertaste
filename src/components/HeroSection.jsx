import React from 'react';
import { ArrowDown, ArrowRight, Coffee, Leaf, Sparkles } from 'lucide-react';

const photos = {
  coffee:
    'https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=760&q=85',
  conversation:
    'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=760&q=85',
};

export default function HeroSection() {
  return (
    <section className="hero page-wrap" id="top">
      <div className="hero-copy">
        <p className="eyebrow"><span className="eyebrow-line" /> A GATHERING BY INNOVANTA</p>
        <h1>Good Coffee.<br />Better Conversations.<br /><em>Unforgettable Connections.</em></h1>
        <p className="hero-description">
          Brew &amp; Build brought people, ideas, and conversations to the same table.
          Tell us what stayed with you.
        </p>
        <div className="hero-actions">
          <a className="button button-dark" href="#share">Share Your Experience <ArrowRight size={17} /></a>
          <a className="text-link" href="#memories">Relive the Vibe <ArrowDown size={15} /></a>
        </div>
        <div className="hero-note"><span className="handwritten">good things take a little time</span><span className="note-squiggle">〰</span></div>
      </div>
      <div className="hero-art" aria-label="A scrapbook collage using illustrative stock imagery, not event photographs">
        <div className="collage-orbit orbit-one" />
        <span className="collage-stock-note">ILLUSTRATIVE IMAGERY · NOT EVENT PHOTOS</span>
        <div className="polaroid polaroid-coffee">
          <img src={photos.coffee} alt="Illustrative stock photo of coffee being prepared in a cafe, not a Brew & Build event photo" />
          <span className="polaroid-caption">a seat at the table</span>
        </div>
        <div className="polaroid polaroid-talk">
          <img src={photos.conversation} alt="Illustrative stock photo of friends sharing a meal, not a Brew & Build event photo" />
          <span className="polaroid-caption">ideas over iced coffee</span>
        </div>
        <div className="coffee-sticker"><Coffee size={28} strokeWidth={1.5} /><span>BREW<br />SOMETHING</span></div>
        <div className="botanical-sticker" aria-hidden="true"><Leaf size={27} strokeWidth={1.4} /></div>
        <div className="sparkle-sticker"><Sparkles size={25} /></div>
        <span className="collage-caption handwritten">made of little moments</span>
      </div>
      <div className="hero-bottomline"><span>THE AFTERTASTE</span><span>EVERY GOOD CONVERSATION LEAVES SOMETHING BEHIND.</span><span>01 — 03</span></div>
    </section>
  );
}
