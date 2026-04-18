'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface Step {
  id: number;
  title: string;
  subtitle: string;
  explanation: string;
  svg: React.ReactNode;
}

const steps: Step[] = [
  {
    id: 1,
    title: 'Coil Activation',
    subtitle: 'Magnetic Field Generation',
    explanation: 'The TMS coil carries a rapidly alternating current (~2500 A peak). When discharged, it creates a magnetic field of 1-2 Tesla at the scalp surface.',
    svg: (
      <svg viewBox="0 0 400 200" className="w-full h-full">
        {/* TMS Device/Handle */}
        <rect x="160" y="165" width="80" height="35" rx="5" fill="#1e293b" stroke="#475569" strokeWidth="2" />
        <rect x="175" y="172" width="50" height="20" rx="3" fill="#0f172a" stroke="#6366f1" strokeWidth="1" />
        <circle cx="200" cy="182" r="3" fill="#10b981" className="animate-pulse" />
        <text x="183" y="186" fontSize="6" fill="#64748b">TMS</text>

        {/* Figure-8 Coil */}
        <g transform="translate(200, 130)">
          {/* Left wing */}
          <ellipse cx="-30" cy="0" rx="28" ry="20" fill="none" stroke="#06b6d4" strokeWidth="4" />
          <ellipse cx="-30" cy="0" rx="20" ry="14" fill="#1e293b" stroke="#06b6d4" strokeWidth="2" />
          {/* Right wing */}
          <ellipse cx="30" cy="0" rx="28" ry="20" fill="none" stroke="#06b6d4" strokeWidth="4" />
          <ellipse cx="30" cy="0" rx="20" ry="14" fill="#1e293b" stroke="#06b6d4" strokeWidth="2" />
          {/* Connection */}
          <path d="M-8 0 Q0 -8 8 0" fill="none" stroke="#06b6d4" strokeWidth="3" />
          {/* Center point */}
          <circle cx="0" cy="0" r="4" fill="#06b6d4" className="animate-pulse" />
        </g>

        {/* Magnetic field lines radiating outward */}
        <g stroke="#06b6d4" strokeWidth="1.5" fill="none" opacity="0.7">
          {/* Top field lines */}
          <path d="M200 110 Q200 80 180 50" strokeDasharray="5 3" className="animate-[dash_2s_linear_infinite]" />
          <path d="M200 110 Q220 80 240 50" strokeDasharray="5 3" className="animate-[dash_2s_linear_infinite_0.3s]" />
          <path d="M200 110 Q200 70 200 40" strokeDasharray="5 3" className="animate-[dash_2s_linear_infinite_0.6s]" />
          {/* Side field lines */}
          <path d="M240 130 Q280 110 320 90" strokeDasharray="5 3" className="animate-[dash_2s_linear_infinite_0.9s]" />
          <path d="M160 130 Q120 110 80 90" strokeDasharray="5 3" className="animate-[dash_2s_linear_infinite_1.2s]" />
          <path d="M250 140 Q300 130 350 120" strokeDasharray="5 3" className="animate-[dash_2s_linear_infinite_1.5s]" />
          <path d="M150 140 Q100 130 50 120" strokeDasharray="5 3" className="animate-[dash_2s_linear_infinite_1.8s]" />
        </g>

        {/* Current direction indicators */}
        <g fill="#f59e0b">
          <polygon points="200,115 195,105 205,105" />
          <text x="185" y="100" fontSize="8" fill="#f59e0b" fontWeight="bold">I</text>
        </g>

        {/* Stats */}
        <g transform="translate(10, 10)">
          <rect x="0" y="0" width="100" height="45" rx="5" fill="#1e293b" stroke="#334155" strokeWidth="1" />
          <text x="10" y="15" fontSize="8" fill="#64748b">Peak Current</text>
          <text x="10" y="30" fontSize="12" fill="#f59e0b" fontWeight="bold">~2500 A</text>
          <text x="10" y="40" fontSize="7" fill="#475569">Alternating</text>
        </g>
        <g transform="translate(290, 10)">
          <rect x="0" y="0" width="100" height="45" rx="5" fill="#1e293b" stroke="#334155" strokeWidth="1" />
          <text x="10" y="15" fontSize="8" fill="#64748b">Field Strength</text>
          <text x="10" y="30" fontSize="12" fill="#06b6d4" fontWeight="bold">1-2 T</text>
          <text x="10" y="40" fontSize="7" fill="#475569">At scalp surface</text>
        </g>
      </svg>
    ),
  },
  {
    id: 2,
    title: 'Field Penetration',
    subtitle: 'Skull & Tissue Penetration',
    explanation: 'The magnetic field passes through skin, fat, skull bone, and dura with negligible attenuation. Only ~5% of the field is lost to these structures.',
    svg: (
      <svg viewBox="0 0 400 200" className="w-full h-full">
        {/* Head cross-section */}
        <g transform="translate(200, 100)">
          {/* Scalp */}
          <ellipse cx="0" cy="0" rx="80" ry="85" fill="#1e293b" stroke="#475569" strokeWidth="2" />
          <ellipse cx="0" cy="0" rx="75" ry="80" fill="#0f172a" />

          {/* Fat layer */}
          <ellipse cx="0" cy="0" rx="70" ry="75" fill="#1e293b" stroke="#f59e0b" strokeWidth="1" strokeDasharray="3 2" />
          <text x="-65" y="-50" fontSize="7" fill="#f59e0b" transform="rotate(-20)">Fat Layer</text>

          {/* Skull */}
          <ellipse cx="0" cy="0" rx="62" ry="68" fill="#1e293b" stroke="#94a3b8" strokeWidth="3" />
          <ellipse cx="0" cy="0" rx="58" ry="64" fill="#1e293b" stroke="#64748b" strokeWidth="1" />

          {/* Dura */}
          <ellipse cx="0" cy="0" rx="55" ry="60" fill="#1e293b" stroke="#8b5cf6" strokeWidth="1.5" />
          <text x="-50" y="-35" fontSize="6" fill="#8b5cf6" transform="rotate(-15)">Dura Mater</text>

          {/* Brain */}
          <ellipse cx="0" cy="0" rx="50" ry="55" fill="#0f172a" stroke="#334155" strokeWidth="1" />

          {/* Field penetration arrows */}
          <g stroke="#06b6d4" strokeWidth="2" fill="none">
            <path d="M80 -40 Q90 -20 85 0" markerEnd="url(#arrow)" className="animate-pulse" />
            <path d="M80 0 Q90 20 85 40" markerEnd="url(#arrow)" className="animate-pulse" style={{ animationDelay: '0.2s' }} />
            <path d="M80 40 Q85 55 75 65" markerEnd="url(#arrow)" className="animate-pulse" style={{ animationDelay: '0.4s' }} />
          </g>

          {/* Penetration percentage */}
          <text x="-15" y="80" fontSize="10" fill="#10b981" fontWeight="bold">95%</text>
          <text x="-25" y="90" fontSize="7" fill="#64748b">transmitted</text>

          <defs>
            <marker id="arrow" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
              <polygon points="0 0, 8 4, 0 8" fill="#06b6d4" />
            </marker>
          </defs>
        </g>

        {/* Layer labels */}
        <g transform="translate(10, 30)">
          <rect x="0" y="0" width="80" height="60" rx="5" fill="#1e293b" stroke="#334155" strokeWidth="1" />
          <text x="10" y="15" fontSize="7" fill="#94a3b8">Skull Layers</text>
          <g fontSize="6">
            <circle cx="8" cy="25" r="3" fill="#94a3b8" />
            <text x="15" y="28" fill="#94a3b8">Bone</text>
            <circle cx="8" cy="38" r="3" fill="#f59e0b" />
            <text x="15" y="41" fill="#f59e0b">Fat</text>
            <circle cx="8" cy="51" r="3" fill="#8b5cf6" />
            <text x="15" y="54" fill="#8b5cf6">Dura</text>
          </g>
        </g>

        {/* Field strength indicator */}
        <g transform="translate(310, 30)">
          <rect x="0" y="0" width="80" height="60" rx="5" fill="#1e293b" stroke="#334155" strokeWidth="1" />
          <text x="10" y="15" fontSize="7" fill="#64748b">Attenuation</text>
          <text x="10" y="32" fontSize="14" fill="#10b981" fontWeight="bold">~5%</text>
          <text x="10" y="45" fontSize="6" fill="#64748b">Loss through</text>
          <text x="10" y="53" fontSize="6" fill="#64748b">non-conductive tissue</text>
        </g>
      </svg>
    ),
  },
  {
    id: 3,
    title: 'Current Induction',
    subtitle: 'Eddy Currents in Cortex',
    explanation: 'The changing magnetic field induces eddy currents in the cortex, primarily affecting layer II/III pyramidal neurons oriented perpendicular to the field.',
    svg: (
      <svg viewBox="0 0 400 200" className="w-full h-full">
        {/* Cortical layers illustration */}
        <g transform="translate(200, 100)">
          {/* Brain tissue */}
          <rect x="-80" y="-80" width="160" height="160" fill="#1e293b" stroke="#334155" strokeWidth="1" rx="10" />

          {/* Layer labels */}
          <text x="-75" y="-65" fontSize="7" fill="#64748b" transform="rotate(-90, -75, -65)">Layer I</text>
          <text x="-75" y="-25" fontSize="7" fill="#64748b" transform="rotate(-90, -75, -25)">Layer II/III</text>
          <text x="-75" y="15" fontSize="7" fill="#64748b" transform="rotate(-90, -75, 15)">Layer IV</text>
          <text x="-75" y="55" fontSize="7" fill="#64748b" transform="rotate(-90, -75, 55)">Layer V/VI</text>

          {/* Pyramidal neurons (Layer II/III focus) */}
          <g stroke="#8b5cf6" strokeWidth="1.5" fill="none">
            {/* Neuron 1 */}
            <path d="M-40 -15 L-40 25 L-40 45" />
            <ellipse cx="-40" cy="-20" rx="8" ry="10" fill="#1e293b" stroke="#8b5cf6" strokeWidth="1.5" />
            <path d="M-48 -25 Q-55 -35 -60 -40" />
            <path d="M-32 -25 Q-25 -35 -20 -40" />
            <path d="M-40 0 Q-50 5 -55 10" />
            <path d="M-40 0 Q-30 5 -25 10" />
            <circle cx="-40" cy="-20" r="3" fill="#8b5cf6" className="animate-pulse" />

            {/* Neuron 2 */}
            <path d="M0 -15 L0 25 L0 45" />
            <ellipse cx="0" cy="-20" rx="8" ry="10" fill="#1e293b" stroke="#8b5cf6" strokeWidth="1.5" />
            <path d="M-8 -25 Q-15 -35 -20 -40" />
            <path d="M8 -25 Q15 -35 20 -40" />
            <path d="M0 0 Q-10 5 -15 10" />
            <path d="M0 0 Q10 5 15 10" />
            <circle cx="0" cy="-20" r="3" fill="#8b5cf6" className="animate-pulse" style={{ animationDelay: '0.3s' }} />

            {/* Neuron 3 */}
            <path d="M40 -15 L40 25 L40 45" />
            <ellipse cx="40" cy="-20" rx="8" ry="10" fill="#1e293b" stroke="#8b5cf6" strokeWidth="1.5" />
            <path d="M32 -25 Q25 -35 20 -40" />
            <path d="M48 -25 Q55 -35 60 -40" />
            <path d="M40 0 Q30 5 25 10" />
            <path d="M40 0 Q50 5 55 10" />
            <circle cx="40" cy="-20" r="3" fill="#8b5cf6" className="animate-pulse" style={{ animationDelay: '0.6s' }} />
          </g>

          {/* Induced current vortices */}
          <g stroke="#06b6d4" strokeWidth="1.5" fill="none" opacity="0.8">
            <path d="M-55 0 Q-45 -10 -35 0 Q-45 10 -55 0" className="animate-[spin_2s_linear_infinite]" />
            <path d="M-15 0 Q-5 -10 5 0 Q-5 10 -15 0" className="animate-[spin_2s_linear_infinite_0.3s]" />
            <path d="M25 0 Q35 -10 45 0 Q35 10 25 0" className="animate-[spin_2s_linear_infinite_0.6s]" />
          </g>

          {/* Field direction */}
          <g fill="#06b6d4">
            <path d="M-80 -50 L-60 -50" stroke="#06b6d4" strokeWidth="2" />
            <polygon points="-60,-50 -65,-55 -65,-45" />
            <text x="-95" y="-48" fontSize="6" fill="#06b6d4">B field</text>
          </g>
        </g>

        {/* Info box */}
        <g transform="translate(10, 10)">
          <rect x="0" y="0" width="95" height="55" rx="5" fill="#1e293b" stroke="#334155" strokeWidth="1" />
          <text x="10" y="15" fontSize="7" fill="#64748b">Target Layer</text>
          <text x="10" y="30" fontSize="11" fill="#8b5cf6" fontWeight="bold">II / III</text>
          <text x="10" y="43" fontSize="6" fill="#475569">Pyramidal neurons</text>
        </g>

        <g transform="translate(295, 10)">
          <rect x="0" y="0" width="95" height="55" rx="5" fill="#1e293b" stroke="#334155" strokeWidth="1" />
          <text x="10" y="15" fontSize="7" fill="#64748b">Current Density</text>
          <text x="10" y="30" fontSize="11" fill="#06b6d4" fontWeight="bold">~100 A/m²</text>
          <text x="10" y="43" fontSize="6" fill="#475569">Sufficient for</text>
          <text x="10" y="51" fontSize="6" fill="#475569">depolarization</text>
        </g>
      </svg>
    ),
  },
  {
    id: 4,
    title: 'Neuron Depolarization',
    subtitle: 'Action Potential Generation',
    explanation: 'When the induced current exceeds the neuronal threshold (~20 mV), voltage-gated Na+ channels open, triggering an action potential that propagates along the axon.',
    svg: (
      <svg viewBox="0 0 400 200" className="w-full h-full">
        {/* Neuron with action potential */}
        <g transform="translate(200, 100)">
          {/* Soma */}
          <ellipse cx="-80" cy="0" rx="25" ry="20" fill="#1e293b" stroke="#8b5cf6" strokeWidth="2" />
          <ellipse cx="-80" cy="0" rx="12" ry="8" fill="#8b5cf6" opacity="0.2" />

          {/* Dendrites */}
          <path d="M-95 -12 Q-110 -25 -130 -35" stroke="#8b5cf6" strokeWidth="1.5" fill="none" />
          <path d="M-95 12 Q-110 25 -130 35" stroke="#8b5cf6" strokeWidth="1.5" fill="none" />
          <path d="M-65 -12 Q-55 -30 -45 -40" stroke="#8b5cf6" strokeWidth="1.5" fill="none" />

          {/* Axon hillock */}
          <path d="M-55 0 L-30 0" stroke="#06b6d4" strokeWidth="3" />

          {/* Axon */}
          <path d="M-30 0 Q0 -20 30 0 Q60 20 90 0" stroke="#06b5b6" strokeWidth="3" fill="none" />

          {/* Myelin sheath segments */}
          <g fill="#1e293b" stroke="#334155" strokeWidth="1">
            <rect x="-28" y="-6" width="18" height="12" rx="2" />
            <rect x="-8" y="-6" width="18" height="12" rx="2" />
            <rect x="12" y="-6" width="18" height="12" rx="2" />
            <rect x="32" y="-6" width="18" height="12" rx="2" />
            <rect x="52" y="-6" width="18" height="12" rx="2" />
          </g>

          {/* Nodes of Ranvier */}
          <g fill="#06b6d4">
            <circle cx="-10" cy="0" r="3" className="animate-pulse" />
            <circle cx="10" cy="0" r="3" className="animate-pulse" style={{ animationDelay: '0.2s' }} />
            <circle cx="30" cy="0" r="3" className="animate-pulse" style={{ animationDelay: '0.4s' }} />
            <circle cx="50" cy="0" r="3" className="animate-pulse" style={{ animationDelay: '0.6s' }} />
            <circle cx="70" cy="0" r="3" className="animate-pulse" style={{ animationDelay: '0.8s' }} />
          </g>

          {/* Axon terminals */}
          <circle cx="90" cy="0" r="5" fill="#10b981" className="animate-pulse" />
          <path d="M95 0 Q105 -10 115 -15" stroke="#10b981" strokeWidth="1.5" fill="none" />
          <path d="M95 0 Q105 0 115 0" stroke="#10b981" strokeWidth="1.5" fill="none" />
          <path d="M95 0 Q105 10 115 15" stroke="#10b981" strokeWidth="1.5" fill="none" />
        </g>

        {/* Action potential waveform */}
        <g transform="translate(200, 170)">
          <rect x="-100" y="0" width="200" height="40" rx="3" fill="#1e293b" stroke="#334155" strokeWidth="1" />
          <path
            d="M-95 25 L-70 25 L-60 25 L-50 5 L-40 35 L-30 25 L-10 25 L0 25 L10 5 L20 35 L30 25 L50 25 L70 25 L95 25"
            stroke="#10b981"
            strokeWidth="2"
            fill="none"
            className="animate-pulse"
          />
          {/* Labels */}
          <text x="-90" y="38" fontSize="6" fill="#64748b">-70mV</text>
          <text x="80" y="38" fontSize="6" fill="#10b981">+40mV</text>
          <text x="-15" y="38" fontSize="6" fill="#f43f5e">Threshold ~-55mV</text>
        </g>

        {/* Ion channels */}
        <g transform="translate(10, 20)">
          <rect x="0" y="0" width="90" height="50" rx="5" fill="#1e293b" stroke="#334155" strokeWidth="1" />
          <text x="10" y="15" fontSize="7" fill="#64748b">Ion Channels</text>
          <g fontSize="6">
            <circle cx="10" cy="28" r="4" fill="#f43f5e" />
            <text x="18" y="31" fill="#f43f5e">Na+ influx</text>
            <circle cx="10" cy="42" r="4" fill="#06b6d4" />
            <text x="18" y="45" fill="#06b6d4">K+ efflux</text>
          </g>
        </g>

        <g transform="translate(300, 20)">
          <rect x="0" y="0" width="90" height="50" rx="5" fill="#1e293b" stroke="#334155" strokeWidth="1" />
          <text x="10" y="15" fontSize="7" fill="#64748b">Velocity</text>
          <text x="10" y="32" fontSize="12" fill="#8b5cf6" fontWeight="bold">40-70 m/s</text>
          <text x="10" y="44" fontSize="6" fill="#475569">Saltatory conduction</text>
        </g>
      </svg>
    ),
  },
  {
    id: 5,
    title: 'Network Activation',
    subtitle: 'Cascading Neural Effects',
    explanation: 'The depolarized neurons activate downstream targets via excitatory synapses, propagating the signal through the thalamo-cortical loop and modulating neurotransmitter release across the network.',
    svg: (
      <svg viewBox="0 0 400 200" className="w-full h-full">
        {/* Brain network visualization */}
        <g transform="translate(200, 100)">
          {/* Brain outline */}
          <ellipse cx="0" cy="0" rx="90" ry="80" fill="#1e293b" stroke="#334155" strokeWidth="2" />

          {/* Network nodes */}
          {/* DLPFC - Left Dorsch */}
          <g className="animate-pulse">
            <circle cx="-55" cy="-40" r="18" fill="#1e293b" stroke="#6366f1" strokeWidth="3" />
            <circle cx="-55" cy="-40" r="8" fill="#6366f1" opacity="0.5" />
            <text x="-65" y="-38" fontSize="6" fill="#6366f1" fontWeight="bold">DLPFC</text>
          </g>

          {/* Thalamus */}
          <g className="animate-pulse" style={{ animationDelay: '0.3s' }}>
            <circle cx="0" cy="-20" r="15" fill="#1e293b" stroke="#06b6d4" strokeWidth="3" />
            <circle cx="0" cy="-20" r="6" fill="#06b6d4" opacity="0.5" />
            <text x="-15" y="-18" fontSize="6" fill="#06b6d4" fontWeight="bold">Thal</text>
          </g>

          {/* ACC */}
          <g className="animate-pulse" style={{ animationDelay: '0.5s' }}>
            <circle cx="-25" cy="-55" r="12" fill="#1e293b" stroke="#f59e0b" strokeWidth="2" />
            <circle cx="-25" cy="-55" r="5" fill="#f59e0b" opacity="0.5" />
            <text x="-40" y="-53" fontSize="5" fill="#f59e0b">ACC</text>
          </g>

          {/* Amygdala - Left */}
          <g className="animate-pulse" style={{ animationDelay: '0.7s' }}>
            <ellipse cx="-45" cy="20" rx="12" ry="10" fill="#1e293b" stroke="#f43f5e" strokeWidth="2" />
            <ellipse cx="-45" cy="20" rx="5" ry="4" fill="#f43f5e" opacity="0.5" />
            <text x="-60" y="23" fontSize="5" fill="#f43f5e">Amyg</text>
          </g>

          {/* Hippocampus */}
          <g className="animate-pulse" style={{ animationDelay: '0.9s' }}>
            <ellipse cx="30" cy="30" rx="15" ry="10" fill="#1e293b" stroke="#8b5cf6" strokeWidth="2" />
            <ellipse cx="30" cy="30" rx="6" ry="4" fill="#8b5cf6" opacity="0.5" />
            <text x="15" y="33" fontSize="5" fill="#8b5cf6">Hipp</text>
          </g>

          {/* Striatum */}
          <g className="animate-pulse" style={{ animationDelay: '1.1s' }}>
            <ellipse cx="0" cy="40" rx="20" ry="12" fill="#1e293b" stroke="#10b981" strokeWidth="2" />
            <ellipse cx="0" cy="40" rx="8" ry="5" fill="#10b981" opacity="0.5" />
            <text x="-15" y="43" fontSize="5" fill="#10b981">Striatum</text>
          </g>

          {/* Network connections */}
          <g stroke="#475569" strokeWidth="1.5" fill="none">
            {/* DLPFC to Thalamus */}
            <path d="M-40 -35 Q-20 -28 0 -30" />
            {/* Thalamus to ACC */}
            <path d="M-10 -35 Q-15 -45 -25 -50" />
            {/* DLPFC to Amygdala */}
            <path d="M-45 -25 Q-45 -5 -45 15" />
            {/* Amygdala to Striatum */}
            <path d="M-35 25 Q-20 35 0 35" />
            {/* Striatum to Hippocampus */}
            <path d="M18 35 Q25 32 30 30" />
            {/* Thalamus to Hippocampus */}
            <path d="M10 -10 Q20 10 25 25" />
          </g>

          {/* Active signal propagation */}
          <g stroke="#6366f1" strokeWidth="2" fill="none" opacity="0.8">
            <path d="M-40 -35 Q-20 -28 0 -30" strokeDasharray="4 4" className="animate-pulse" />
            <path d="M-10 -35 Q-15 -45 -25 -50" strokeDasharray="4 4" className="animate-pulse" style={{ animationDelay: '0.3s' }} />
            <path d="M-45 -25 Q-45 -5 -45 15" strokeDasharray="4 4" className="animate-pulse" style={{ animationDelay: '0.5s' }} />
            <path d="M-35 25 Q-20 35 0 35" strokeDasharray="4 4" className="animate-pulse" style={{ animationDelay: '0.7s' }} />
            <path d="M18 35 Q25 32 30 30" strokeDasharray="4 4" className="animate-pulse" style={{ animationDelay: '0.9s' }} />
          </g>
        </g>

        {/* Neurotransmitter effects */}
        <g transform="translate(10, 15)">
          <rect x="0" y="0" width="85" height="60" rx="5" fill="#1e293b" stroke="#334155" strokeWidth="1" />
          <text x="10" y="15" fontSize="7" fill="#64748b">Neurotransmitters</text>
          <g fontSize="6">
            <rect x="10" y="22" width="8" height="8" rx="2" fill="#8b5cf6" />
            <text x="22" y="29" fill="#8b5cf6">Glutamate ↑</text>
            <rect x="10" y="35" width="8" height="8" rx="2" fill="#10b981" />
            <text x="22" y="42" fill="#10b981">GABA modulated</text>
            <rect x="10" y="48" width="8" height="8" rx="2" fill="#f59e0b" />
            <text x="22" y="55" fill="#f59e0b">DA / 5-HT ↑</text>
          </g>
        </g>

        <g transform="translate(305, 15)">
          <rect x="0" y="0" width="85" height="60" rx="5" fill="#1e293b" stroke="#334155" strokeWidth="1" />
          <text x="10" y="15" fontSize="7" fill="#64748b">Network Effects</text>
          <text x="10" y="32" fontSize="11" fill="#6366f1" fontWeight="bold">DMN</text>
          <text x="10" y="44" fontSize="11" fill="#f59e0b" fontWeight="bold">SN</text>
          <text x="40" y="44" fontSize="11" fill="#10b981" fontWeight="bold">CEN</text>
          <text x="10" y="56" fontSize="6" fill="#475569">Default Mode, Salience,</text>
          <text x="10" y="65" fontSize="6" fill="#475569">Central Executive Networks</text>
        </g>

        {/* TMS pulse indicator */}
        <g transform="translate(165, 185)">
          <rect x="0" y="0" width="70" height="18" rx="3" fill="#1e293b" stroke="#6366f1" strokeWidth="1" />
          <circle cx="12" cy="9" r="4" fill="#6366f1" className="animate-pulse" />
          <text x="20" y="12" fontSize="7" fill="#a78bfa" fontWeight="bold">TMS Pulse</text>
        </g>
      </svg>
    ),
  },
];

type Speed = 0.5 | 1 | 2;

export default function TMSMechanismVisualizer() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<Speed>(1);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const animationRef = useRef<number | null>(null);

  const stepDuration = 4000 / speed;

  const clearTimers = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  }, []);

  const goToStep = useCallback((step: number) => {
    setCurrentStep(Math.max(0, Math.min(steps.length - 1, step)));
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStep((prev) => {
      if (prev >= steps.length - 1) {
        setIsPlaying(false);
        return prev;
      }
      return prev + 1;
    });
  }, []);

  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => {
      if (prev) {
        clearTimers();
        return false;
      } else {
        if (currentStep >= steps.length - 1) {
          setCurrentStep(0);
        }
        return true;
      }
    });
  }, [currentStep, clearTimers]);

  // Auto-advance when playing
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(nextStep, stepDuration);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, stepDuration, nextStep]);

  // Update animation key for step changes
  useEffect(() => {
    // Force re-render of SVG animations when step changes
  }, [currentStep]);

  const step = steps[currentStep];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-white">TMS Mechanism</h2>
          <p className="text-[10px] text-slate-400">Interactive step-by-step animation</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Speed control */}
          <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
            {([0.5, 1, 2] as Speed[]).map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`px-2 py-1 rounded text-[10px] font-medium transition-all ${
                  speed === s
                    ? 'bg-violet-600 text-white'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main visualization */}
      <div className="glass-panel rounded-2xl p-4">
        {/* Step indicator */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span
              className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
              style={{ backgroundColor: '#6366f1', color: 'white' }}
            >
              {step.id}
            </span>
            <div>
              <h3 className="text-sm font-bold text-white">{step.title}</h3>
              <p className="text-[10px] text-slate-400">{step.subtitle}</p>
            </div>
          </div>
        </div>

        {/* SVG visualization with animation key */}
        <div
          key={currentStep}
          className="bg-slate-900/50 rounded-xl p-4 mb-4"
          style={{ minHeight: '220px' }}
        >
          {step.svg}
        </div>

        {/* Explanation text */}
        <p className="text-[11px] text-slate-300 leading-relaxed">
          {step.explanation}
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        {/* Step navigation dots */}
        <div className="flex items-center gap-2">
          {steps.map((s, index) => (
            <button
              key={s.id}
              onClick={() => goToStep(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                currentStep === index
                  ? 'bg-violet-500 scale-125'
                  : 'bg-slate-600 hover:bg-slate-500'
              }`}
              aria-label={`Go to step ${s.id}: ${s.title}`}
            />
          ))}
        </div>

        {/* Play/Pause button */}
        <button
          onClick={togglePlay}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl transition-all"
        >
          {isPlaying ? (
            <>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
              <span className="text-xs font-semibold">Pause</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <polygon points="5,3 19,12 5,21" />
              </svg>
              <span className="text-xs font-semibold">{currentStep >= steps.length - 1 ? 'Replay' : 'Play'}</span>
            </>
          )}
        </button>

        {/* Step counter */}
        <div className="text-[10px] text-slate-500">
          {currentStep + 1} / {steps.length}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-violet-600 to-cyan-500 transition-all duration-300"
          style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
        />
      </div>

      {/* Keyboard shortcuts hint */}
      <p className="text-[9px] text-slate-600 text-center">
        Click dots to navigate or press Play to watch the full sequence
      </p>
    </div>
  );
}
