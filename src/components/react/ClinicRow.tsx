// Horizontal clinic list row — design system v3 editorial warm palette
// Used in FeaturedClinics section and search results list view

import React, { useState } from 'react';
import { ArrowRightIcon, StarIcon } from './Icons';

export interface ClinicRowProps {
  clinic: {
    name: string;
    location: string;
    devices: string;
    rating: number;
    image?: string;
  };
  index: number;
  onClick: () => void;
}

const ClinicRow: React.FC<ClinicRowProps> = ({ clinic, index, onClick }) => {
  const [hover, setHover] = useState(false);
  const { name, location, devices, rating, image } = clinic;
  const counter = `\u2116${String(index + 1).padStart(2, '0')}`;

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="group w-full text-left flex items-center gap-5 md:gap-7 py-7 px-1 transition-colors"
      style={{
        borderTop: '1px solid var(--line)',
        background: hover ? 'color-mix(in srgb, var(--paper2) 40%, transparent)' : 'transparent',
      }}
    >
      {/* № counter */}
      <div
        className="hidden sm:block text-[11px] uppercase tracking-[0.18em] tabular-nums w-12 flex-shrink-0 font-mono"
        style={{ color: 'var(--muted)' }}
      >
        {counter}
      </div>

      {/* Thumbnail */}
      <div className="hidden md:block w-14 h-14 rounded-xl overflow-hidden flex-shrink-0" style={{ background: 'var(--paper2)' }}>
        {image ? (
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-500"
            style={{ transform: hover ? 'scale(1.1)' : 'scale(1)' }}
          />
        ) : (
          <div
            className="w-full h-full"
            style={{ background: 'linear-gradient(135deg, var(--paper2) 0%, var(--accent)/20 100%)' }}
          />
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0 pr-4 overflow-hidden">
        <div className="flex items-center gap-3 mb-1">
          <h3
            className="serif text-[22px] md:text-[24px] leading-tight truncate min-w-0 flex-1 transition-all"
            style={{
              color: 'var(--ink)',
              fontStyle: hover ? 'italic' : 'normal',
            }}
          >
            {name}
          </h3>
        </div>
        <div
          className="text-[12px] flex items-center gap-2 flex-wrap"
          style={{ color: 'var(--muted)' }}
        >
          <span>{location}</span>
          <span style={{ color: 'var(--line)' }}>·</span>
          <span>{devices}</span>
        </div>
      </div>

      {/* Rating */}
      <div className="hidden md:flex items-center gap-1.5 flex-shrink-0 text-[13px]">
        <span style={{ color: 'var(--warm)' }}>
          <StarIcon size={13} />
        </span>
        <b className="font-semibold tabular-nums" style={{ color: 'var(--ink)' }}>
          {rating.toFixed(1)}
        </b>
      </div>

      {/* Arrow */}
      <div
        className="flex-shrink-0 transition-all"
        style={{
          color: hover ? 'var(--ink)' : 'var(--muted)',
          transform: hover ? 'translateX(4px)' : 'translateX(0)',
        }}
      >
        <ArrowRightIcon size={18} />
      </div>
    </button>
  );
};

export default ClinicRow;

// Expose on window for non-module contexts
if (typeof window !== 'undefined') {
  Object.assign(window, { ClinicRow });
}
