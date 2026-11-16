import React from 'react';
import { ArrowUpRight, Instagram } from 'lucide-react';

export default function Footer() {
  const innovantaUrl = import.meta.env.VITE_INNOVANTA_URL;

  return (
    <footer className="site-footer">
      <div className="footer-main">
        <a className="footer-brand" href="#top">BREW &amp; BUILD <span>— BY INNOVANTA</span></a>
        <p className="footer-manifest">MANIFEST. BUILD. IMPACT.</p>
        <div className="footer-links">
          <a href="https://www.instagram.com/" rel="noreferrer" target="_blank"><Instagram size={15} /> Instagram <ArrowUpRight size={13} /></a>
          {innovantaUrl
            ? <a href={innovantaUrl} rel="noreferrer" target="_blank">INNOVANTA <ArrowUpRight size={13} /></a>
            : <span className="footer-link-placeholder">INNOVANTA WEBSITE · LINK COMING SOON</span>}
        </div>
      </div>
      <div className="footer-bottom"><span>MADE WITH WARMTH &amp; A LITTLE CAFFEINE</span><span>© INNOVANTA</span></div>
    </footer>
  );
}
