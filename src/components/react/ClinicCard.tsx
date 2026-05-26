// Editorial clinic card component — design system v3 warm palette
// Used in featured grids and search result card views

import React from 'react';
import { StarIcon, CheckIcon, ClockIcon } from './Icons';

export interface ClinicCardProps {
  clinic: {
    name: string;
    location: string;
    rating: number;
    reviews: number;
    devices: string[];
    waitTime: string;
    price: string;
    verified?: boolean;
    inNetwork?: boolean;
    image?: string;
  };
  onClick?: () => void;
}

const ClinicCard: React.FC<ClinicCardProps> = ({ clinic, onClick }) => {
  const {
    name,
    location,
    rating,
    reviews,
    devices,
    waitTime,
    price,
    verified = false,
    inNetwork = false,
    image,
  } = clinic;

  const filledStars = Math.round(rating);

  return (
    <article
      onClick={onClick}
      className="group relative bg-[var(--paper)] border rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-[0_8px_32px_-8px_rgba(10,22,40,0.16)] hover:-translate-y-0.5"
      style={{ borderColor: 'var(--line)' }}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-[color:var(--paper2)]">
        {image ? (
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-[1.2s] group-hover:scale-105"
          />
        ) : (
          <div
            className="w-full h-full"
            style={{ background: 'linear-gradient(135deg, var(--paper2) 0%, var(--accent)/10 100%)' }}
          />
        )}

        {/* Badges overlaid on image */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {verified && (
            <span
              className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.14em] font-medium rounded-full px-2.5 py-1 backdrop-blur-sm"
              style={{ background: 'rgba(16,185,129,0.15)', color: '#059669', border: '1px solid rgba(16,185,129,0.3)' }}
            >
              <CheckIcon size={10} w={2.5} />
              Verified
            </span>
          )}
          {inNetwork && (
            <span
              className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.14em] font-medium rounded-full px-2.5 py-1 backdrop-blur-sm"
              style={{ background: 'rgba(10,22,40,0.12)', color: 'var(--accent)', border: '1px solid rgba(10,22,40,0.25)' }}
            >
              In-network
            </span>
          )}
        </div>

        {/* Price badge top-right */}
        <div className="absolute top-3 right-3">
          <span
            className="text-[12px] font-medium tabular-nums rounded-full px-2.5 py-1 backdrop-blur-sm"
            style={{ background: 'rgba(251,250,247,0.85)', color: 'var(--ink)', border: '1px solid rgba(10,22,40,0.1)' }}
          >
            {price}
          </span>
        </div>
      </div>

      {/* Card body */}
      <div className="p-5">
        {/* Name + location */}
        <div className="mb-3">
          <h3
            className="serif text-[20px] leading-tight mb-1 truncate"
            style={{ color: 'var(--ink)' }}
          >
            {name}
          </h3>
          <p
            className="text-[12px] uppercase tracking-[0.1em] truncate"
            style={{ color: 'var(--muted)' }}
          >
            {location}
          </p>
        </div>

        {/* Star rating */}
        <div className="flex items-center gap-1.5 mb-4">
          <div className="flex items-center gap-0.5" style={{ color: 'var(--warm)' }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <span
                key={i}
                style={{ opacity: i < filledStars ? 1 : 0.25 }}
              >
                <StarIcon size={13} />
              </span>
            ))}
          </div>
          <span className="text-[13px] font-semibold tabular-nums" style={{ color: 'var(--ink)' }}>
            {rating.toFixed(1)}
          </span>
          <span className="text-[12px]" style={{ color: 'var(--muted)' }}>
            ({reviews})
          </span>
        </div>

        {/* Device chips */}
        {devices.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {devices.map((device) => (
              <span
                key={device}
                className="text-[10px] uppercase tracking-[0.1em] rounded-full px-2.5 py-1"
                style={{ background: 'var(--paper2)', color: 'var(--accent)', border: '1px solid var(--line)' }}
              >
                {device}
              </span>
            ))}
          </div>
        )}

        {/* Footer: wait time */}
        <div
          className="flex items-center gap-1.5 text-[12px] pt-4"
          style={{ borderTop: '1px solid var(--line)', color: 'var(--muted)' }}
        >
          <ClockIcon size={13} />
          <span>
            Wait:{' '}
            <span className="font-medium" style={{ color: 'var(--ink)' }}>
              {waitTime}
            </span>
          </span>
        </div>
      </div>
    </article>
  );
};

export default ClinicCard;

// Expose on window for non-module contexts
if (typeof window !== 'undefined') {
  Object.assign(window, { ClinicCard });
}
