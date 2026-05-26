import React, { useState, useEffect } from 'react';

const quotes = [
  {
    q: "After two medications and four years, I finally matched with a TMS provider who understood my case. Six weeks later I walked out in remission. TMS List is how I found her.",
    n: 'Sarah M.',
    r: 'Matched with NeuroWell \u00b7 Treated 2025',
    tag: 'Treatment-resistant depression',
  },
  {
    q: "The comparison data on side effects and cost gave me the ammunition I needed to push back on my psychiatrist who'd dismissed TMS. I'm 11 weeks out now. It worked.",
    n: 'James K.',
    r: 'Matched with Pacific Brain \u00b7 Treated 2024',
    tag: 'Anxious depression',
  },
  {
    q: "For OCD specifically, Deep TMS wasn't something my insurance wanted to approve. The clinic's documentation pack \u2014 sourced through TMS List \u2014 got it approved in nine days.",
    n: 'Anonymous',
    r: 'Matched with Westside Psychiatry \u00b7 2025',
    tag: 'OCD',
  },
];

export default function TestimonialsCarousel() {
  const [idx, setIdx] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setIdx((prev) => (prev + 1) % quotes.length);
        setFading(false);
      }, 300);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const goTo = (i: number) => {
    setFading(true);
    setTimeout(() => {
      setIdx(i);
      setFading(false);
    }, 300);
  };

  const prev = () => goTo((idx - 1 + quotes.length) % quotes.length);
  const next = () => goTo((idx + 1) % quotes.length);

  const q = quotes[idx];
  const words = q.q.split(' ');
  const threshold = words.length - 12;

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 2rem', position: 'relative' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.18em', color: 'rgba(255,255,255,0.4)', marginBottom: '3rem' }}>
        <span style={{ width: '24px', height: '1px', background: 'rgba(255,255,255,0.3)' }}></span>
        <span>Patient voices &middot; {idx + 1} of {quotes.length}</span>
      </div>

      {/* Quote icon */}
      <div style={{ color: 'rgba(255,255,255,0.15)', marginBottom: '2rem' }}>
        <svg width="48" height="48" fill="currentColor" viewBox="0 0 24 24">
          <path d="M11.3 8.1C10.3 6.6 10 5.5 10 4.5 10 3.3 10.8 2.4 12 2.4c.6 0 1.1.2 1.6.6.5.4.8.9.8 1.6C14.4 5.8 14 7.2 13.1 8.7l-1.2 2.1c-.2.3-.4.5-.7.5-.3 0-.5-.1-.7-.4l-1-1.8c-.2-.3-.2-.6-.2-.9 0-.4.1-.7.3-1 .2-.3.5-.5.9-.5.6 0 1 .2 1.4.7l.9 1.4c.1-.1.3-.2.4-.2l1.4-.7c.3-.1.6-.1.9.1.3.2.4.5.4.8 0 .3-.1.7-.3.9l-1.2 2.2c-.2.4-.5.7-.8.8-.3.1-.7.2-1 .2-.7 0-1.3-.3-1.8-.9-.5-.6-.7-1.3-.7-2.2 0-.4.1-.8.2-1.2zM5.3 8.1C4.3 6.6 4 5.5 4 4.5 4 3.3 4.8 2.4 6 2.4c.6 0 1.1.2 1.6.6.5.4.8.9.8 1.6C8.4 5.8 8 7.2 7.1 8.7L6 10.8c-.2.3-.4.5-.7.5-.3 0-.5-.1-.7-.4l-1-1.8c-.2-.3-.2-.6-.2-.9 0-.4.1-.7.3-1 .2-.3.5-.5.9-.5.6 0 1 .2 1.4.7l.9 1.4c.1-.1.3-.2.4-.2l1.4-.7c.3-.1.6-.1.9.1.3.2.4.5.4.8 0 .3-.1.7-.3.9L8.7 13c-.2.4-.5.7-.8.8-.3.1-.7.2-1 .2-.7 0-1.3-.3-1.8-.9-.5-.6-.7-1.3-.7-2.2 0-.4.1-.8.2-1.2z"/>
        </svg>
      </div>

      {/* Quote text */}
      <blockquote
        className="serif"
        style={{
          fontFamily: "'Instrument Serif', Georgia, serif",
          fontSize: 'clamp(1.75rem, 4.5vw, 4.5rem)',
          lineHeight: 1.1,
          marginBottom: '3.5rem',
          maxWidth: '72rem',
          minHeight: '12rem',
          opacity: fading ? 0 : 1,
          transition: 'opacity 0.3s ease',
        }}
      >
        {words.map((w, i) => (
          <span key={i} style={i >= threshold ? { color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' } : {}}>
            {w}{' '}
          </span>
        ))}
      </blockquote>

      {/* Attribution */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '9999px', background: 'linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.05))', border: '1px solid rgba(255,255,255,0.1)' }}></div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 500 }}>{q.n}</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{q.r}</div>
          </div>
          <div style={{ width: '1px', height: '2rem', background: 'rgba(255,255,255,0.2)', margin: '0 1rem' }}></div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{q.tag}</div>
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={prev}
            style={{ width: '44px', height: '44px', borderRadius: '9999px', border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.2s' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <svg width="16" height="16" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>
          <button
            onClick={next}
            style={{ width: '44px', height: '44px', borderRadius: '9999px', border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.2s' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <svg width="16" height="16" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Progress dots */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
        {quotes.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            style={{
              height: '2px',
              transition: 'all 0.3s ease',
              width: i === idx ? '40px' : '20px',
              background: i === idx ? 'white' : 'rgba(255,255,255,0.2)',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          />
        ))}
      </div>
    </div>
  );
}
