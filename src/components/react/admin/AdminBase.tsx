/**
 * AdminBase — Unified Component Library for TMS List Admin
 *
 * Design System: Editorial Warm with Teal Accent
 * Colors extend public brand while providing dark admin experience
 *
 * Usage:
 * import { AdminCard, AdminButton, AdminStat, AdminBadge } from './admin/AdminBase';
 */

import React from 'react';

/* ============================================================
   Design Tokens — exported for components that need JS access
   ============================================================ */
export const tokens = {
  bgBase: 'var(--admin-bg-base)',
  bgSurface: 'var(--admin-bg-surface)',
  bgElevated: 'var(--admin-bg-elevated)',
  bgOverlay: 'var(--admin-bg-overlay)',
  borderSubtle: 'var(--admin-border-subtle)',
  borderDefault: 'var(--admin-border-default)',
  borderEmphasis: 'var(--admin-border-emphasis)',
  textPrimary: 'var(--admin-text-primary)',
  textSecondary: 'var(--admin-text-secondary)',
  textTertiary: 'var(--admin-text-tertiary)',
  accent: 'var(--admin-accent)',
  accentHover: 'var(--admin-accent-hover)',
  accentMuted: 'var(--admin-accent-muted)',
  accentSubtle: 'var(--admin-accent-subtle)',
  success: 'var(--admin-success)',
  warning: 'var(--admin-warning)',
  error: 'var(--admin-error)',
  info: 'var(--admin-info)',
};

/* ============================================================
   AdminCard — Primary container component
   ============================================================ */
interface AdminCardProps {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

export function AdminCard({
  children,
  className = '',
  interactive = false,
  padding = 'md',
  onClick
}: AdminCardProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-5',
    lg: 'p-6'
  };

  const interactiveClasses = interactive
    ? 'admin-card-interactive cursor-pointer'
    : '';

  return (
    <div
      className={`admin-card ${paddingClasses[padding]} ${interactiveClasses} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
}

/* ============================================================
   AdminButton — Primary action component
   ============================================================ */
interface AdminButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

export function AdminButton({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  disabled = false,
  loading = false,
  className = '',
  onClick,
  type = 'button'
}: AdminButtonProps) {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base'
  };

  const variantClasses = {
    primary: 'admin-btn-primary',
    secondary: 'admin-btn-secondary',
    ghost: 'admin-btn-ghost',
    danger: 'admin-btn-danger',
  };

  const disabledClasses = disabled || loading
    ? 'opacity-50 cursor-not-allowed pointer-events-none'
    : 'cursor-pointer';

  const iconOnly = !children && icon;

  return (
    <button
      type={type}
      className={`
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${disabledClasses}
        ${iconOnly ? 'p-2' : ''}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : icon && iconPosition === 'left' ? icon : null}
      {children}
      {!loading && icon && iconPosition === 'right' ? icon : null}
    </button>
  );
}

/* ============================================================
   AdminStat — Key metric display
   ============================================================ */
interface AdminStatProps {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function AdminStat({
  label,
  value,
  change,
  changeLabel = 'vs prev period',
  icon,
  className = ''
}: AdminStatProps) {
  const isPositive = change !== undefined && change >= 0;
  const isZero = change === 0 && typeof value === 'number' && value === 0;

  const formattedValue = typeof value === 'number' ? value.toLocaleString() : value;

  return (
    <AdminCard className={className}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Label */}
          <p className="text-[11px] font-semibold uppercase tracking-wider mb-2 text-[var(--admin-text-secondary)]">
            {label}
          </p>

          {/* Value */}
          <p className="text-3xl font-semibold leading-none mb-2 text-[var(--admin-text-primary)]">
            {formattedValue}
          </p>

          {/* Change indicator */}
          {change !== undefined && !isZero && (
            <div className="flex items-center gap-1.5">
              {isPositive ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--admin-success)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--admin-error)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              )}
              <span
                className="text-sm font-semibold"
                style={{ color: isPositive ? 'var(--admin-success)' : 'var(--admin-error)' }}
              >
                {isPositive ? '+' : ''}{change}%
              </span>
              <span className="text-xs text-[var(--admin-text-secondary)]">{changeLabel}</span>
            </div>
          )}

          {isZero && (
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-medium text-[var(--admin-text-secondary)]">—</span>
            </div>
          )}
        </div>

        {/* Optional icon */}
        {icon && (
          <div style={{ color: 'var(--admin-accent)', opacity: 0.5 }}>
            {icon}
          </div>
        )}
      </div>
    </AdminCard>
  );
}

/* ============================================================
   AdminBadge — Status/category indicators
   ============================================================ */
interface AdminBadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'accent' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
}

export function AdminBadge({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  className = ''
}: AdminBadgeProps) {
  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-[10px]',
    md: 'px-2 py-0.5 text-xs'
  };

  const variantClasses: Record<string, string> = {
    default: 'admin-badge-default',
    accent: 'admin-badge-accent',
    success: 'admin-badge-success',
    warning: 'admin-badge-warning',
    error: 'admin-badge-error',
    info: 'admin-badge',
  };

  const dotColors: Record<string, string> = {
    default: 'var(--admin-text-secondary)',
    accent: 'var(--admin-accent)',
    success: 'var(--admin-success)',
    warning: 'var(--admin-warning)',
    error: 'var(--admin-error)',
    info: 'var(--admin-info)',
  };

  return (
    <span
      className={`
        admin-badge
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
    >
      {dot && (
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: dotColors[variant] }}
        />
      )}
      {children}
    </span>
  );
}

/* ============================================================
   AdminInput — Form input component
   ============================================================ */
interface AdminInputProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'search' | 'url';
  placeholder?: string;
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  error?: string;
  label?: string;
  hint?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function AdminInput({
  type = 'text',
  placeholder,
  value,
  onChange,
  disabled = false,
  error,
  label,
  hint,
  icon,
  className = ''
}: AdminInputProps) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-[var(--admin-text-secondary)]">
          {label}
        </label>
      )}

      <div className="relative">
        {icon && (
          <div
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--admin-text-tertiary)' }}
          >
            {icon}
          </div>
        )}

        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`
            admin-input
            ${icon ? 'pl-10 pr-3' : 'px-3'}
          `.trim().replace(/\s+/g, ' ')}
          style={{
            borderColor: error ? 'var(--admin-error)' : 'var(--admin-border-subtle)',
            boxShadow: error
              ? '0 0 0 3px var(--admin-error-muted)'
              : '0 0 0 3px var(--admin-accent-subtle)',
          }}
        />
      </div>

      {error && (
        <p className="text-xs text-[var(--admin-error)]">{error}</p>
      )}

      {hint && !error && (
        <p className="text-xs" style={{ color: tokens.textTertiary }}>{hint}</p>
      )}
    </div>
  );
}

/* ============================================================
   AdminSelect — Dropdown select
   ============================================================ */
interface AdminSelectOption {
  value: string;
  label: string;
}

interface AdminSelectProps {
  options: AdminSelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  label?: string;
  className?: string;
}

export function AdminSelect({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  disabled = false,
  label,
  className = ''
}: AdminSelectProps) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-[var(--admin-text-secondary)]">
          {label}
        </label>
      )}

      <select
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        className="admin-input appearance-none cursor-pointer"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%238B949E' viewBox='0 0 16 16'%3E%3Cpath d='M4 6l4 4 4-4'/%3E%3C/svg%3E")`,
          backgroundPosition: 'right 12px center',
          backgroundRepeat: 'no-repeat',
          paddingRight: '2.5rem',
          boxShadow: '0 0 0 3px var(--admin-accent-subtle)',
          outline: 'none',
        }}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/* ============================================================
   AdminTabs — Navigation tabs
   ============================================================ */
interface AdminTab {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

interface AdminTabsProps {
  tabs: AdminTab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export function AdminTabs({ tabs, activeTab, onChange, className = '' }: AdminTabsProps) {
  return (
    <div className={`admin-tabs ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`admin-tab ${activeTab === tab.id ? 'admin-tab-active' : ''}`}
        >
          {tab.icon}
          {tab.label}
          {tab.count !== undefined && (
            <span
              className="px-1.5 py-0.5 text-xs rounded-full"
              style={{
                backgroundColor: activeTab === tab.id
                  ? 'rgba(30,42,59,0.2)'
                  : 'var(--admin-bg-elevated)',
                color: activeTab === tab.id ? 'var(--admin-accent)' : 'var(--admin-text-tertiary)',
              }}
            >
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

/* ============================================================
   AdminTooltip — Hover tooltip
   ============================================================ */
interface AdminTooltipProps {
  children: React.ReactNode;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function AdminTooltip({ children, content, position = 'top' }: AdminTooltipProps) {
  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  };

  return (
    <div className="relative group inline-block">
      {children}
      <div
        className={`
          absolute ${positionClasses[position]}
          admin-tooltip-content
        `.trim().replace(/\s+/g, ' ')}
      >
        {content}
        <div
          className="absolute w-2 h-2 rotate-45"
          style={{
            backgroundColor: 'var(--admin-bg-overlay)',
            borderColor: 'var(--admin-border-default)',
          }}
        />
      </div>
    </div>
  );
}

/* ============================================================
   AdminProgress — Progress bar
   ============================================================ */
interface AdminProgressProps {
  value: number;
  max?: number;
  variant?: 'default' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md';
  showLabel?: boolean;
  className?: string;
}

export function AdminProgress({
  value,
  max = 100,
  variant = 'default',
  size = 'md',
  showLabel = false,
  className = ''
}: AdminProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const variantColors: Record<string, string> = {
    default: 'var(--admin-accent)',
    success: 'var(--admin-success)',
    warning: 'var(--admin-warning)',
    error: 'var(--admin-error)'
  };

  return (
    <div className={`space-y-1 ${className}`}>
      {showLabel && (
        <div className="flex justify-between text-xs">
          <span style={{ color: 'var(--admin-text-secondary)' }}>{value} / {max}</span>
          <span style={{ color: 'var(--admin-text-primary)' }}>{percentage.toFixed(0)}%</span>
        </div>
      )}
      <div
        className={`admin-progress ${size === 'sm' ? 'h-1' : 'h-1.5'}`}
      >
        <div
          className="admin-progress-bar"
          style={{
            backgroundColor: variantColors[variant],
            width: `${percentage}%`
          }}
        />
      </div>
    </div>
  );
}

/* ============================================================
   AdminSkeleton — Loading placeholder
   ============================================================ */
interface AdminSkeletonProps {
  width?: string | number;
  height?: string | number;
  variant?: 'text' | 'circular' | 'rectangular';
  className?: string;
}

export function AdminSkeleton({
  width,
  height,
  variant = 'text',
  className = ''
}: AdminSkeletonProps) {
  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg'
  };

  return (
    <div
      className={`admin-skeleton ${variantClasses[variant]} ${className}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height
      }}
    />
  );
}

/* ============================================================
   AdminEmptyState — No data placeholder
   ============================================================ */
interface AdminEmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  };
  className?: string;
}

export function AdminEmptyState({
  icon,
  title,
  description,
  action,
  className = ''
}: AdminEmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 text-center ${className}`}>
      {icon ? (
        <div className="mb-4 text-[var(--admin-border-default)]">{icon}</div>
      ) : (
        <svg
          className="w-12 h-12 mb-4 text-[var(--admin-border-default)]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      )}

      <h3 className="text-lg font-semibold mb-1 text-[var(--admin-text-primary)]">{title}</h3>

      {description && (
        <p className="text-sm max-w-sm mb-4 text-[var(--admin-text-secondary)]">{description}</p>
      )}

      {action && (
        <AdminButton
          variant={action.variant || 'secondary'}
          onClick={action.onClick}
        >
          {action.label}
        </AdminButton>
      )}
    </div>
  );
}

/* ============================================================
   AdminDropdown — Dropdown menu
   ============================================================ */
interface AdminDropdownItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

interface AdminDropdownProps {
  items: AdminDropdownItem[];
  trigger: React.ReactNode;
  align?: 'left' | 'right';
  className?: string;
}

export function AdminDropdown({ items, trigger, align = 'left', className = '' }: AdminDropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)}>
        {trigger}
      </div>

      {isOpen && (
        <div
          className="admin-dropdown animate-in fade-in slide-in-from-top-2 duration-150"
          style={{
            [align === 'right' ? 'right' : 'left']: 0,
          }}
        >
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                if (!item.disabled) {
                  item.onClick();
                  setIsOpen(false);
                }
              }}
              disabled={item.disabled}
              className={`
                admin-dropdown-item
                ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                ${item.danger ? 'admin-dropdown-item-danger' : ''}
              `.trim().replace(/\s+/g, ' ')}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   Chart Helpers
   ============================================================ */

/** Chart color palette - teal-focused with warm accent */
export const chartColors = {
  primary: '#1E2A3B',      // Teal (brand)
  secondary: '#C9654A',    // Light teal
  accent: '#C9654A',       // Terracotta
  success: '#3FB950',      // Green
  warning: '#D29922',      // Amber
  error: '#F85149',        // Red
  info: '#58A6FF',         // Blue
  muted: '#484F58'         // Neutral gray
};

/** Format large numbers for charts */
export function formatChartValue(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
}

/** Get appropriate chart color for data type */
export function getChartColor(type: string): string {
  const colorMap: Record<string, string> = {
    leads: chartColors.primary,
    reviews: chartColors.success,
    users: chartColors.secondary,
    clinics: chartColors.accent,
    revenue: chartColors.success,
    errors: chartColors.error,
    warnings: chartColors.warning
  };
  return colorMap[type] || chartColors.primary;
}