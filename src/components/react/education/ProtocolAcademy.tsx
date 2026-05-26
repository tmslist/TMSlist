'use client';

import { useState } from 'react';
import { protocols, type TMSProtocol } from '../../../data/tmsProtocols';

const TYPE_TONES: Record<string, { fg: string; bg: string }> = {
  rTMS:        { fg: '#0A1628', bg: 'rgba(10,22,40,0.08)' },
  dTMS:        { fg: '#0A1628', bg: 'rgba(10,22,40,0.08)' },
  iTBS:        { fg: '#C9654A', bg: 'rgba(201,101,74,0.10)' },
  cTBS:        { fg: '#B8541F', bg: 'rgba(184,84,31,0.10)' },
  Accelerated: { fg: '#C9654A', bg: 'rgba(201,101,74,0.10)' },
  SNT:         { fg: '#C9654A', bg: 'rgba(201,101,74,0.10)' },
};

const EVIDENCE_TONES: Record<string, { fg: string; bg: string; dot: string }> = {
  Strong:   { fg: '#15803d', bg: 'rgba(34,197,94,0.10)',  dot: '#22c55e' },
  Moderate: { fg: '#a16207', bg: 'rgba(202,138,4,0.10)',  dot: '#ca8a04' },
  Emerging: { fg: '#5A6B82', bg: 'rgba(90,107,130,0.10)', dot: '#5A6B82' },
};

interface ProtocolCardProps {
  protocol: TMSProtocol;
  isActive: boolean;
  onClick: () => void;
}

function ProtocolCard({ protocol, isActive, onClick }: ProtocolCardProps) {
  const typeT = TYPE_TONES[protocol.type] ?? TYPE_TONES.rTMS;
  const evT = EVIDENCE_TONES[protocol.evidence];

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-2xl p-5 transition-all duration-200 hover-lift"
      style={{
        background: 'var(--paper)',
        border: `1px solid ${isActive ? 'var(--warm)' : 'var(--line)'}`,
        boxShadow: isActive
          ? '0 8px 24px -8px rgba(201,101,74,0.25), 0 0 0 3px rgba(201,101,74,0.08)'
          : '0 1px 2px rgba(10,22,40,0.04)',
      }}
      aria-pressed={isActive}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <h4 className="serif" style={{ fontSize: '1.05rem', color: 'var(--ink)', lineHeight: 1.2, margin: 0 }}>
            {protocol.fullName}
          </h4>
          <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{protocol.name}</p>
        </div>
        {protocol.badge && (
          <span
            className="shrink-0"
            style={{
              fontSize: 9,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              padding: '3px 8px',
              borderRadius: 9999,
              background: 'rgba(201,101,74,0.12)',
              color: '#C9654A',
              border: '1px solid rgba(201,101,74,0.25)',
            }}
          >
            {protocol.badge}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1.5 mb-3">
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            padding: '2px 8px',
            borderRadius: 9999,
            background: typeT.bg,
            color: typeT.fg,
          }}
        >
          {protocol.type}
        </span>
        <span
          className="inline-flex items-center gap-1"
          style={{
            fontSize: 10,
            fontWeight: 600,
            padding: '2px 8px',
            borderRadius: 9999,
            background: evT.bg,
            color: evT.fg,
          }}
        >
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: evT.dot }} />
          {protocol.evidence}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        {[
          { label: 'Frequency', value: protocol.frequencyDisplay },
          { label: 'Intensity', value: protocol.intensityDisplay },
          { label: 'Pulses', value: protocol.pulsesDisplay },
          { label: 'Duration', value: protocol.duration },
        ].map(p => (
          <div
            key={p.label}
            style={{
              background: 'var(--paper2)',
              borderRadius: 10,
              padding: '8px 10px',
              border: '1px solid var(--line)',
            }}
          >
            <p
              style={{
                fontSize: 9,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--muted)',
                margin: 0,
              }}
            >
              {p.label}
            </p>
            <p
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--ink)',
                marginTop: 2,
                fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
              }}
            >
              {p.value}
            </p>
          </div>
        ))}
      </div>

      <div
        style={{
          background: 'rgba(201,101,74,0.06)',
          borderRadius: 10,
          padding: '8px 10px',
          marginBottom: 10,
        }}
      >
        <p
          style={{
            fontSize: 9,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--warm)',
            margin: 0,
          }}
        >
          Indication
        </p>
        <p style={{ fontSize: 11, color: 'var(--ink)', marginTop: 2, lineHeight: 1.4 }}>
          {protocol.indication}
        </p>
      </div>

      <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid var(--line)' }}>
        <span style={{ fontSize: 10, color: 'var(--muted)' }}>FDA: {protocol.fdaCleared}</span>
        <span style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600 }}>
          {protocol.sessionsTotal} sessions
        </span>
      </div>
    </button>
  );
}

export default function ProtocolAcademy() {
  const [selected, setSelected] = useState<TMSProtocol>(protocols[0]);
  const typeT = TYPE_TONES[selected.type] ?? TYPE_TONES.rTMS;
  const evT = EVIDENCE_TONES[selected.evidence];

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3
          className="serif"
          style={{ fontSize: '1.75rem', color: 'var(--ink)', margin: 0, lineHeight: 1.15 }}
        >
          Protocol Academy
        </h3>
        <p style={{ fontSize: 14, color: 'var(--muted)', maxWidth: 540, margin: '0.5rem auto 0', lineHeight: 1.55 }}>
          Six primary TMS protocols used clinically. Each targets different brain regions
          with distinct stimulation parameters. Click a card for the full breakdown.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {protocols.map(protocol => (
          <ProtocolCard
            key={protocol.name}
            protocol={protocol}
            isActive={selected?.name === protocol.name}
            onClick={() => setSelected(protocol)}
          />
        ))}
      </div>

      {selected && (
        <div
          className="rounded-2xl p-6 animate-entrance"
          style={{
            background: 'var(--paper)',
            border: '1px solid var(--line)',
            boxShadow: '0 8px 32px -12px rgba(10,22,40,0.12)',
          }}
        >
          <div className="flex items-start gap-4 mb-6">
            <div
              className="shrink-0 flex items-center justify-center"
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: 'rgba(201,101,74,0.10)',
                border: '1px solid rgba(201,101,74,0.20)',
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path
                  d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
                  stroke="#C9654A"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3
                className="serif"
                style={{ fontSize: '1.5rem', color: 'var(--ink)', margin: 0, lineHeight: 1.15 }}
              >
                {selected.fullName}
              </h3>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    padding: '3px 10px',
                    borderRadius: 9999,
                    background: typeT.bg,
                    color: typeT.fg,
                  }}
                >
                  {selected.type}
                </span>
                <span
                  className="inline-flex items-center gap-1.5"
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    padding: '3px 10px',
                    borderRadius: 9999,
                    background: evT.bg,
                    color: evT.fg,
                  }}
                >
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: evT.dot }} />
                  {selected.evidence} Evidence
                </span>
                <span style={{ fontSize: 11, color: 'var(--muted)' }}>· FDA: {selected.fdaCleared}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Frequency', value: selected.frequencyDisplay },
              { label: 'Intensity', value: selected.intensityDisplay },
              { label: 'Pulses', value: selected.pulsesDisplay },
              { label: 'Duration', value: selected.duration },
            ].map(param => (
              <div
                key={param.label}
                style={{
                  background: 'var(--paper2)',
                  border: '1px solid var(--line)',
                  borderRadius: 12,
                  padding: 12,
                  textAlign: 'center',
                }}
              >
                <p
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'var(--muted)',
                    margin: 0,
                  }}
                >
                  {param.label}
                </p>
                <p
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: 'var(--ink)',
                    marginTop: 4,
                    fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
                    lineHeight: 1.2,
                  }}
                >
                  {param.value}
                </p>
              </div>
            ))}
          </div>

          <div
            style={{
              background: 'rgba(201,101,74,0.06)',
              border: '1px solid rgba(201,101,74,0.18)',
              borderRadius: 12,
              padding: 16,
              marginBottom: 24,
            }}
          >
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'var(--warm)',
                    margin: 0,
                  }}
                >
                  Treatment Schedule
                </p>
                <p style={{ fontSize: 14, color: 'var(--ink)', fontWeight: 600, marginTop: 2 }}>
                  {selected.sessionsTotal} total sessions · {selected.sessionsPerDay}
                </p>
              </div>
              <div className="text-right">
                <p
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'var(--warm)',
                    margin: 0,
                  }}
                >
                  Indication
                </p>
                <p style={{ fontSize: 14, color: 'var(--ink)', fontWeight: 600, marginTop: 2 }}>
                  {selected.indication}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p
                className="flex items-center gap-1.5"
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#15803d',
                  marginBottom: 12,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="#22C55E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Advantages
              </p>
              <ul className="space-y-2">
                {selected.pros.map(p => (
                  <li key={p} style={{ fontSize: 13, color: 'var(--ink)', lineHeight: 1.55, display: 'flex', gap: 8 }}>
                    <span style={{ color: '#22C55E', flexShrink: 0, fontWeight: 700, marginTop: 1 }}>+</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p
                className="flex items-center gap-1.5"
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--warm)',
                  marginBottom: 12,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
                  <path d="M2 2l8 8M10 2l-8 8" stroke="#C9654A" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
                Considerations
              </p>
              <ul className="space-y-2">
                {selected.cons.map(c => (
                  <li key={c} style={{ fontSize: 13, color: 'var(--ink)', lineHeight: 1.55, display: 'flex', gap: 8 }}>
                    <span style={{ color: 'var(--warm)', flexShrink: 0, fontWeight: 700, marginTop: 1 }}>−</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
