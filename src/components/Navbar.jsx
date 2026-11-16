import React from 'react';
import { ArrowUpRight, Coffee } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="site-header">
      <a className="brand" href="#top" aria-label="INNOVANTA Brew and Build home">
        <span className="brand-mark">INNOVANTA</span>
        <span className="brand-divider" />
        <span className="brand-event"><Coffee size={14} strokeWidth={1.8} /> BREW &amp; BUILD</span>
      </a>
      <nav className="main-nav" aria-label="Main navigation">
        <a href="#testimonials">Kind Words</a>
        <a href="#memories">Our Memories</a>
        <a href="#stories">Community Stories</a>
        <a href="#share">Leave Feedback</a>
      </nav>
      <a className="nav-cta" href="#stories">Share Your Story <ArrowUpRight size={15} /></a>
    </header>
  );
}
