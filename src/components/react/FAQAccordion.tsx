import React, { useState } from 'react';

const faqs = [
  {
    q: 'Is TMS covered by insurance?',
    a: 'Yes — Aetna, BCBS, Cigna, UnitedHealth, Medicare, and most major plans cover TMS for treatment-resistant depression when documented criteria are met (typically two failed medication trials). Every clinic on TMS List publishes its in-network insurers and average out-of-pocket cost upfront.',
  },
  {
    q: 'How long does treatment take?',
    a: 'A standard course is 19–37 minute sessions, five days a week, for four to six weeks. The accelerated SAINT protocol compresses this into five days of ten sessions per day. Most patients notice change by week three.',
  },
  {
    q: 'Are there side effects?',
    a: 'TMS is remarkably well-tolerated. The most common side effect is scalp discomfort at the stimulation site during the first week. Unlike ECT, there are no cognitive or memory effects. Unlike medication, there are no systemic side effects — no weight gain, no sexual side effects, no fatigue.',
  },
  {
    q: 'How is TMS List different from just searching Google?',
    a: "Every clinic on TMS List is editorially reviewed: licensed clinician on file, FDA-cleared device verified, protocol documented. We don't accept pay-to-rank — listings are ordered by editorial relevance. No anonymous or shell clinics.",
  },
  {
    q: 'What about Deep TMS vs standard TMS?',
    a: 'Standard TMS uses a figure-8 coil targeting the left dorsolateral prefrontal cortex at ~2cm depth. Deep TMS (BrainsWay) uses an H-coil reaching ~4cm. Deep TMS is FDA-cleared for OCD specifically; standard TMS for depression. Both have strong evidence; your clinician will match protocol to indication.',
  },
  {
    q: "I've already tried medication and therapy. Is TMS next?",
    a: 'For most patients with treatment-resistant depression, yes. Clinical guidelines generally recommend TMS after two or more failed antidepressant trials at adequate dose and duration. The assessment on TMS List (8 questions, 2 minutes) tells you whether you meet the standard criteria.',
  },
  {
    q: 'Can I list my clinic for free?',
    a: "Yes. Free listings are free forever and include editorial verification, a verified badge, basic profile information, and a review collection link. Premium tiers add lead routing, analytics, and review management — they're optional.",
  },
];

export default function FAQAccordion() {
  const [open, setOpen] = useState<number | null>(0);

  const toggle = (i: number) => {
    setOpen(open === i ? null : i);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '4rem', alignItems: 'start' }}>
      {/* Left: heading */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--muted)', marginBottom: '1.5rem' }}>
          <span style={{ display: 'inline-block', width: '24px', height: '1px', background: 'color-mix(in srgb, var(--ink) 30%, transparent)', verticalAlign: 'middle' }}></span>
          <span>FAQ</span>
        </div>
        <h2 className="serif" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400, letterSpacing: '-0.02em', fontSize: 'clamp(2rem, 4.5vw, 4.25rem)', lineHeight: 0.95, color: 'var(--ink)', position: 'sticky', top: '6rem' }}>
          Things patients<br/>and clinicians<br/>most <em>often ask.</em>
        </h2>
      </div>

      {/* Right: accordion */}
      <div style={{ borderTop: '1px solid var(--line)' }}>
        {faqs.map((faq, i) => {
          const isOpen = open === i;
          return (
            <div key={i} style={{ borderBottom: '1px solid var(--line)' }}>
              <button
                onClick={() => toggle(i)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '1.75rem 0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '2rem',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <span
                  className="serif"
                  style={{
                    fontFamily: "'Instrument Serif', Georgia, serif",
                    fontWeight: 400,
                    letterSpacing: '-0.02em',
                    fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)',
                    lineHeight: 1.1,
                    color: 'var(--ink)',
                    fontStyle: isOpen ? 'italic' : 'normal',
                    transition: 'font-style 0.2s',
                  }}
                >
                  {faq.q}
                </span>
                <span
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '9999px',
                    border: '1px solid var(--line)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 0.3s',
                    background: isOpen ? 'var(--ink)' : 'transparent',
                    color: isOpen ? 'white' : 'var(--muted)',
                    borderColor: isOpen ? 'var(--ink)' : 'var(--line)',
                    transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
                  }}
                >
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="M12 5v14M5 12h14"/>
                  </svg>
                </span>
              </button>

              <div
                style={{
                  display: 'grid',
                  gridTemplateRows: isOpen ? '1fr' : '0fr',
                  transition: 'grid-template-rows 0.5s ease',
                  overflow: 'hidden',
                }}
              >
                <div style={{ overflow: 'hidden' }}>
                  <p style={{ fontSize: '15px', color: 'var(--muted)', lineHeight: 1.7, maxWidth: '42rem', paddingBottom: isOpen ? '2rem' : '0' }}>
                    {faq.a}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
