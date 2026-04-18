// Centralized SVG icon library — replaces emoji throughout the codebase
// All icons use consistent stroke-based style with Tailwind color classes

import React from 'react';

const DEFAULT_CLASSES = 'inline-block';

function Icon({
  children,
  className = '',
  size = 16,
}: {
  children: React.ReactNode;
  className?: string;
  size?: number;
}) {
  return (
    <span
      className={`${DEFAULT_CLASSES} ${className}`}
      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: size, height: size }}
      role="img"
      aria-hidden="true"
    >
      {children}
    </span>
  );
}

export function CheckIcon({ className = '', size = 16 }: { className?: string; size?: number }) {
  return (
    <Icon className={className} size={size}>
      <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 13l4 4L19 7" />
      </svg>
    </Icon>
  );
}

export function CheckCircleIcon({ className = '', size = 16 }: { className?: string; size?: number }) {
  return (
    <Icon className={className} size={size}>
      <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M8 12l3 3 5-5" />
      </svg>
    </Icon>
  );
}

export function WarningIcon({ className = '', size = 16 }: { className?: string; size?: number }) {
  return (
    <Icon className={className} size={size}>
      <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
    </Icon>
  );
}

export function AlertCircleIcon({ className = '', size = 16 }: { className?: string; size?: number }) {
  return (
    <Icon className={className} size={size}>
      <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v4m0 4h.01" />
      </svg>
    </Icon>
  );
}

export function BrainIcon({ className = '', size = 16 }: { className?: string; size?: number }) {
  return (
    <Icon className={className} size={size}>
      <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 4.5a4.5 4.5 0 014.5 4.5c0 1.5-.7 2.8-1.8 3.6-.3.2-.5.5-.5.9v1.5c0 1 .8 1.8 1.8 1.8h.5v1c0 .5-.4.9-.9.9H9.4c-.5 0-.9-.4-.9-.9v-1h.5c1 0 1.8-.8 1.8-1.8V14c0-.4-.2-.7-.5-.9-1.1-.8-1.8-2.1-1.8-3.6A4.5 4.5 0 0112 4.5z" />
        <path d="M12 4.5V3M9 7.5h.01M15 7.5h.01" />
        <path d="M9 12h6" />
      </svg>
    </Icon>
  );
}

export function BoltIcon({ className = '', size = 16 }: { className?: string; size?: number }) {
  return (
    <Icon className={className} size={size}>
      <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2L4.09 12.26a.5.5 0 00.41.74h8.96a.5.5 0 00.35-.14l7.56-6.73A.5.5 0 0020.36 5H13V2z" />
      </svg>
    </Icon>
  );
}

export function PillIcon({ className = '', size = 16 }: { className?: string; size?: number }) {
  return (
    <Icon className={className} size={size}>
      <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8.5 8.5l7 7m0-7l-7 7m7-7H2m7 7v7" />
        <path d="M10.5 13.5l3 3" />
      </svg>
    </Icon>
  );
}

export function HospitalIcon({ className = '', size = 16 }: { className?: string; size?: number }) {
  return (
    <Icon className={className} size={size}>
      <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M12 8v8M8 12h8" />
      </svg>
    </Icon>
  );
}

export function BanIcon({ className = '', size = 16 }: { className?: string; size?: number }) {
  return (
    <Icon className={className} size={size}>
      <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M4.9 4.9l14.2 14.2" />
      </svg>
    </Icon>
  );
}

export function ClipboardIcon({ className = '', size = 16 }: { className?: string; size?: number }) {
  return (
    <Icon className={className} size={size}>
      <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
        <rect x="8" y="2" width="8" height="4" rx="1" />
        <path d="M9 12h6M9 16h4" />
      </svg>
    </Icon>
  );
}

export function MicroscopeIcon({ className = '', size = 16 }: { className?: string; size?: number }) {
  return (
    <Icon className={className} size={size}>
      <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
        <path d="M6 9l6-6 4 4-6 6" />
        <path d="M14 7l4 4" />
        <path d="M18 3l2 2" />
      </svg>
    </Icon>
  );
}

export function DollarIcon({ className = '', size = 16 }: { className?: string; size?: number }) {
  return (
    <Icon className={className} size={size}>
      <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
      </svg>
    </Icon>
  );
}

export function BuildingIcon({ className = '', size = 16 }: { className?: string; size?: number }) {
  return (
    <Icon className={className} size={size}>
      <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="2" width="16" height="20" rx="1" />
        <path d="M9 22V12h6v10M9 7h1m5 0h-1M9 11h1m5 0h-1" />
      </svg>
    </Icon>
  );
}

export function InstitutionIcon({ className = '', size = 16 }: { className?: string; size?: number }) {
  return (
    <Icon className={className} size={size}>
      <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3" />
      </svg>
    </Icon>
  );
}

export function MagnetIcon({ className = '', size = 16 }: { className?: string; size?: number }) {
  return (
    <Icon className={className} size={size}>
      <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 15V9a6 6 0 1112 0v6" />
        <path d="M6 9H3v6h3V9zM18 9h3v6h-3V9z" />
        <path d="M6 15h12" />
      </svg>
    </Icon>
  );
}

export function RedCircleIcon({ className = '', size = 16 }: { className?: string; size?: number }) {
  return (
    <Icon className={className} size={size}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="12" r="9" />
      </svg>
    </Icon>
  );
}

export function AmberCircleIcon({ className = '', size = 16 }: { className?: string; size?: number }) {
  return (
    <Icon className={className} size={size}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="12" r="9" />
      </svg>
    </Icon>
  );
}

export function GreenCircleIcon({ className = '', size = 16 }: { className?: string; size?: number }) {
  return (
    <Icon className={className} size={size}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="12" r="9" />
      </svg>
    </Icon>
  );
}

export function TargetIcon({ className = '', size = 16 }: { className?: string; size?: number }) {
  return (
    <Icon className={className} size={size}>
      <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="12" cy="12" r="1" />
      </svg>
    </Icon>
  );
}

export function TrophyIcon({ className = '', size = 16 }: { className?: string; size?: number }) {
  return (
    <Icon className={className} size={size}>
      <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 9H4.5a2.5 2.5 0 010-5H6M18 9h1.5a2.5 2.5 0 000-5H18" />
        <path d="M6 4h12v7a6 6 0 01-12 0V4z" />
        <path d="M9 16h6M12 13v6" />
      </svg>
    </Icon>
  );
}

export function SettingsIcon({ className = '', size = 16 }: { className?: string; size?: number }) {
  return (
    <Icon className={className} size={size}>
      <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
      </svg>
    </Icon>
  );
}

export function DocumentIcon({ className = '', size = 16 }: { className?: string; size?: number }) {
  return (
    <Icon className={className} size={size}>
      <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <path d="M14 2v6h6M8 13h8M8 17h5" />
      </svg>
    </Icon>
  );
}

export function BellIcon({ className = '', size = 16 }: { className?: string; size?: number }) {
  return (
    <Icon className={className} size={size}>
      <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
      </svg>
    </Icon>
  );
}

export function LinkIcon({ className = '', size = 16 }: { className?: string; size?: number }) {
  return (
    <Icon className={className} size={size}>
      <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
      </svg>
    </Icon>
  );
}

export function KeyIcon({ className = '', size = 16 }: { className?: string; size?: number }) {
  return (
    <Icon className={className} size={size}>
      <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
      </svg>
    </Icon>
  );
}

export function EmailIcon({ className = '', size = 16 }: { className?: string; size?: number }) {
  return (
    <Icon className={className} size={size}>
      <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <path d="M22 6l-10 7L2 6" />
      </svg>
    </Icon>
  );
}

export function CloseIcon({ className = '', size = 16 }: { className?: string; size?: number }) {
  return (
    <Icon className={className} size={size}>
      <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 6L6 18M6 6l12 12" />
      </svg>
    </Icon>
  );
}

export function RocketIcon({ className = '', size = 16 }: { className?: string; size?: number }) {
  return (
    <Icon className={className} size={size}>
      <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09zM12 15l-3-3a22 22 0 012-3.95A12.88 12.88 0 0122 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 01-4 2z" />
        <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0M15 12v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
      </svg>
    </Icon>
  );
}

export function ChartIcon({ className = '', size = 16 }: { className?: string; size?: number }) {
  return (
    <Icon className={className} size={size}>
      <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 20V10M12 20V4M6 20v-6" />
      </svg>
    </Icon>
  );
}

export function TrendingUpIcon({ className = '', size = 16 }: { className?: string; size?: number }) {
  return (
    <Icon className={className} size={size}>
      <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
      </svg>
    </Icon>
  );
}

export function SeedlingIcon({ className = '', size = 16 }: { className?: string; size?: number }) {
  return (
    <Icon className={className} size={size}>
      <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22V12M12 12C12 7 7 4 2 4c0 6 3 9 10 8M12 12c0-5 5-8 10-8 0 6-3 9-10 8" />
      </svg>
    </Icon>
  );
}

export function StarIcon({ className = '', size = 16 }: { className?: string; size?: number }) {
  return (
    <Icon className={className} size={size}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    </Icon>
  );
}

export function SparkleIcon({ className = '', size = 16 }: { className?: string; size?: number }) {
  return (
    <Icon className={className} size={size}>
      <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4" />
      </svg>
    </Icon>
  );
}

export function GlobeIcon({ className = '', size = 16 }: { className?: string; size?: number }) {
  return (
    <Icon className={className} size={size}>
      <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
      </svg>
    </Icon>
  );
}

export function PhoneIcon({ className = '', size = 16 }: { className?: string; size?: number }) {
  return (
    <Icon className={className} size={size}>
      <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
      </svg>
    </Icon>
  );
}

export function EyeIcon({ className = '', size = 16 }: { className?: string; size?: number }) {
  return (
    <Icon className={className} size={size}>
      <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    </Icon>
  );
}

export function DownloadIcon({ className = '', size = 16 }: { className?: string; size?: number }) {
  return (
    <Icon className={className} size={size}>
      <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
      </svg>
    </Icon>
  );
}

export function UserIcon({ className = '', size = 16 }: { className?: string; size?: number }) {
  return (
    <Icon className={className} size={size}>
      <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    </Icon>
  );
}

export function LockIcon({ className = '', size = 16 }: { className?: string; size?: number }) {
  return (
    <Icon className={className} size={size}>
      <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0110 0v4" />
      </svg>
    </Icon>
  );
}

export function EditIcon({ className = '', size = 16 }: { className?: string; size?: number }) {
  return (
    <Icon className={className} size={size}>
      <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    </Icon>
  );
}

export function ShieldIcon({ className = '', size = 16 }: { className?: string; size?: number }) {
  return (
    <Icon className={className} size={size}>
      <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    </Icon>
  );
}

export function WrenchIcon({ className = '', size = 16 }: { className?: string; size?: number }) {
  return (
    <Icon className={className} size={size}>
      <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
      </svg>
    </Icon>
  );
}

export function FireIcon({ className = '', size = 16 }: { className?: string; size?: number }) {
  return (
    <Icon className={className} size={size}>
      <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 01-14 0c0-2.5 1.5-5.5 3-7.5C6 5.5 8 3 12 3c3.5 0 5 2 5 5 0 2.5-1 4-2 5z" />
      </svg>
    </Icon>
  );
}

export function HundredIcon({ className = '', size = 16 }: { className?: string; size?: number }) {
  return (
    <Icon className={className} size={size}>
      <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 19l-2 3M14 5l2-3M12 16a5 5 0 100-10 5 5 0 000 10z" />
        <path d="M7 10h5a3 3 0 110 6H9m2 0V10" />
      </svg>
    </Icon>
  );
}

export function CompassIcon({ className = '', size = 16 }: { className?: string; size?: number }) {
  return (
    <Icon className={className} size={size}>
      <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
      </svg>
    </Icon>
  );
}

export function AntennaIcon({ className = '', size = 16 }: { className?: string; size?: number }) {
  return (
    <Icon className={className} size={size}>
      <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4.93 4.93l4.24 4.24M7.76 7.76l4.24 4.24M10.59 10.59l4.24 4.24M13.41 13.41l4.24 4.24M16.24 16.24l4.24 4.24" />
        <path d="M19.07 4.93A12 12 0 0122 12a12 12 0 01-2.93 7.07" />
        <path d="M2 12a12 12 0 012.93-7.07" />
      </svg>
    </Icon>
  );
}

export function RobotArmIcon({ className = '', size = 16 }: { className?: string; size?: number }) {
  return (
    <Icon className={className} size={size}>
      <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 11V7a5 5 0 0110 0v4M5 11h14l-1 10H6L5 11z" />
        <path d="M12 17v4M8 21h8" />
      </svg>
    </Icon>
  );
}

export function MapIcon({ className = '', size = 16 }: { className?: string; size?: number }) {
  return (
    <Icon className={className} size={size}>
      <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
        <line x1="8" y1="2" x2="8" y2="18" />
        <line x1="16" y1="6" x2="16" y2="22" />
      </svg>
    </Icon>
  );
}

export function QuestionIcon({ className = '', size = 16 }: { className?: string; size?: number }) {
  return (
    <Icon className={className} size={size}>
      <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M9 9a3 3 0 015.12 2.13c0 1.63-2.12 2.37-2.12 4.37M12 17h.01" />
      </svg>
    </Icon>
  );
}

export function PersonIcon({ className = '', size = 16 }: { className?: string; size?: number }) {
  return (
    <Icon className={className} size={size}>
      <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    </Icon>
  );
}

export function ScientificIcon({ className = '', size = 16 }: { className?: string; size?: number }) {
  return (
    <Icon className={className} size={size}>
      <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 3h6M9 3v11l-4 4M9 3H5m4 0v11l4 4M15 3v11l4 4M15 3h4m-4 0v11l4 4" />
        <path d="M3 17l4-4 4 4 4-4 4 4" />
      </svg>
    </Icon>
  );
}

export function SyringeIcon({ className = '', size = 16 }: { className?: string; size?: number }) {
  return (
    <Icon className={className} size={size}>
      <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 2l4 4M7.5 20.5L19 9l-4-4L3.5 16.5 2 22l5.5-1.5z" />
        <path d="M15 5l4 4" />
        <path d="M9 15l-3 3" />
      </svg>
    </Icon>
  );
}

export function HeartbeatIcon({ className = '', size = 16 }: { className?: string; size?: number }) {
  return (
    <Icon className={className} size={size}>
      <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
        <path d="M4 12h4l2-4 2 8 2-4h4" />
      </svg>
    </Icon>
  );
}

export function SpeechIcon({ className = '', size = 16 }: { className?: string; size?: number }) {
  return (
    <Icon className={className} size={size}>
      <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    </Icon>
  );
}

export function WeightIcon({ className = '', size = 16 }: { className?: string; size?: number }) {
  return (
    <Icon className={className} size={size}>
      <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="5" r="3" />
        <path d="M6.5 8a2 2 0 00-1.91 1.26L3.1 12a7 7 0 1013.8 0l-1.49-2.74A2 2 0 0017.5 8z" />
      </svg>
    </Icon>
  );
}

export function RepeatIcon({ className = '', size = 16 }: { className?: string; size?: number }) {
  return (
    <Icon className={className} size={size}>
      <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="17 1 21 5 17 9" />
        <path d="M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4" />
        <path d="M21 13v2a4 4 0 01-4 4H3" />
      </svg>
    </Icon>
  );
}

export function ElderlyIcon({ className = '', size = 16 }: { className?: string; size?: number }) {
  return (
    <Icon className={className} size={size}>
      <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="5" r="3" />
        <path d="M12 8v1M8 22v-5a4 4 0 018 0v5M9 13l-2 9M15 13l2 9" />
      </svg>
    </Icon>
  );
}

export function SadIcon({ className = '', size = 16 }: { className?: string; size?: number }) {
  return (
    <Icon className={className} size={size}>
      <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M16 16s-1.5-2-4-2-4 2-4 2" />
        <path d="M9 9h.01M15 9h.01" />
      </svg>
    </Icon>
  );
}

export function EarIcon({ className = '', size = 16 }: { className?: string; size?: number }) {
  return (
    <Icon className={className} size={size}>
      <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 8.5a6.5 6.5 0 1111.5 3.5c0 1.5-1.5 3-2.5 4l-2 2" />
        <path d="M15 8.5a2.5 2.5 0 10-3 2.5" />
        <path d="M4 8.5V5c0-1.5 2-3 6-3s6 1.5 6 3v3.5" />
      </svg>
    </Icon>
  );
}

export function BoltOffIcon({ className = '', size = 16 }: { className?: string; size?: number }) {
  return (
    <Icon className={className} size={size}>
      <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2L4.09 12.26a.5.5 0 00.41.74h8.96a.5.5 0 00.35-.14l7.56-6.73A.5.5 0 0020.36 5H13V2z" />
        <path d="M2 2l20 20" />
      </svg>
    </Icon>
  );
}

export function FaceIcon({ className = '', size = 16 }: { className?: string; size?: number }) {
  return (
    <Icon className={className} size={size}>
      <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M8 9h.01M16 9h.01M8 14s1.5 2 4 2 4-2 4-2" />
      </svg>
    </Icon>
  );
}

export function WaterIcon({ className = '', size = 16 }: { className?: string; size?: number }) {
  return (
    <Icon className={className} size={size}>
      <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0L12 2.69z" />
      </svg>
    </Icon>
  );
}

export function CalendarIcon({ className = '', size = 16 }: { className?: string; size?: number }) {
  return (
    <Icon className={className} size={size}>
      <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    </Icon>
  );
}

export function MoonIcon({ className = '', size = 16 }: { className?: string; size?: number }) {
  return (
    <Icon className={className} size={size}>
      <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
      </svg>
    </Icon>
  );
}

export function CoffeeIcon({ className = '', size = 16 }: { className?: string; size?: number }) {
  return (
    <Icon className={className} size={size}>
      <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 8h1a4 4 0 110 8h-1M3 8h14v9a4 4 0 01-4 4H7a4 4 0 01-4-4V8zM6 2v3M10 2v3M14 2v3" />
      </svg>
    </Icon>
  );
}

export function SkullIcon({ className = '', size = 16 }: { className?: string; size?: number }) {
  return (
    <Icon className={className} size={size}>
      <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="10" r="1.5" fill="currentColor" />
        <circle cx="15" cy="10" r="1.5" fill="currentColor" />
        <path d="M8 3C5.5 3 3 5.5 3 8v1c0 1.7 1.3 3 3 3h1v4c0 2.8-2.2 5-5 5v2h12v-2c-2.8 0-5-2.2-5-5v-4h1c1.7 0 3-1.3 3-3V8c0-2.5-2.5-5-5-5H8z" />
        <path d="M9 15h6" />
      </svg>
    </Icon>
  );
}

export function ChevronUpIcon({ className = '', size = 16 }: { className?: string; size?: number }) {
  return (
    <Icon className={className} size={size}>
      <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 15l-6-6-6 6" />
      </svg>
    </Icon>
  );
}

export function MegaphoneIcon({ className = '', size = 16 }: { className?: string; size?: number }) {
  return (
    <Icon className={className} size={size}>
      <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 11l18-5v12L3 13v-2zM11.6 16.8a3 3 0 11-5.8-1.6" />
      </svg>
    </Icon>
  );
}

export function InfoIcon({ className = '', size = 16 }: { className?: string; size?: number }) {
  return (
    <Icon className={className} size={size}>
      <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 16v-4M12 8h.01" />
      </svg>
    </Icon>
  );
}

export function FlagIcon({ className = '', size = 16 }: { className?: string; size?: number }) {
  return (
    <Icon className={className} size={size}>
      <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7" />
      </svg>
    </Icon>
  );
}

export function FolderIcon({ className = '', size = 16 }: { className?: string; size?: number }) {
  return (
    <Icon className={className} size={size}>
      <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
      </svg>
    </Icon>
  );
}

export function ChevronRightIcon({ className = '', size = 16 }: { className?: string; size?: number }) {
  return (
    <Icon className={className} size={size}>
      <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18l6-6-6-6" />
      </svg>
    </Icon>
  );
}

export function ChevronDownIcon({ className = '', size = 16 }: { className?: string; size?: number }) {
  return (
    <Icon className={className} size={size}>
      <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 9l6 6 6-6" />
      </svg>
    </Icon>
  );
}
