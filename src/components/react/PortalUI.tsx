import { type ReactNode, type ReactElement } from 'react';

// ============================================================================
// PortalCard
// ============================================================================

interface PortalCardProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  onClick?: () => void;
}

export function PortalCard({
  children,
  className = '',
  padding = 'md',
  hover = false,
  onClick,
}: PortalCardProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      onClick={onClick}
      className={`
        bg-white rounded-xl border border-[var(--line)] shadow-sm
        ${paddingClasses[padding]}
        ${hover ? 'hover:shadow-md hover:border-[var(--muted)] transition-all cursor-pointer' : ''}
        ${onClick ? 'text-left w-full' : ''}
        ${className}
      `}
    >
      {children}
    </Component>
  );
}

// ============================================================================
// PortalBadge
// ============================================================================

interface PortalBadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md';
}

export function PortalBadge({ children, variant = 'default', size = 'md' }: PortalBadgeProps) {
  const variants = {
    default: 'bg-[var(--paper2)] text-[var(--ink2)]',
    success: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-amber-100 text-amber-700',
    error: 'bg-red-100 text-red-700',
    info: 'bg-blue-100 text-blue-700',
  };

  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
  };

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${variants[variant]} ${sizes[size]}`}>
      {children}
    </span>
  );
}

// ============================================================================
// PortalButton
// ============================================================================

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface PortalButtonProps {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactElement;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  href?: string;
  className?: string;
}

export function PortalButton({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  onClick,
  type = 'button',
  href,
  className = '',
}: PortalButtonProps) {
  const variants = {
    primary: 'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800',
    secondary: 'bg-white text-[var(--ink)] border border-[var(--line)] hover:bg-[var(--paper2)] active:bg-[var(--paper)]',
    ghost: 'text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--paper2)]',
    danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 rounded-lg',
    md: 'text-sm px-4 py-2 rounded-xl',
    lg: 'text-base px-6 py-3 rounded-xl',
  };

  const disabledClasses = 'opacity-50 cursor-not-allowed pointer-events-none';

  const classes = `
    inline-flex items-center justify-center gap-2 font-semibold transition-all
    ${variants[variant]}
    ${sizes[size]}
    ${disabled || loading ? disabledClasses : ''}
    ${className}
  `.trim();

  if (href) {
    return (
      <a href={href} className={classes}>
        {loading ? <Spinner size="sm" /> : icon}
        {children}
      </a>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={classes}
    >
      {loading ? <Spinner size={size === 'lg' ? 'md' : 'sm'} /> : icon}
      {children}
    </button>
  );
}

// ============================================================================
// PortalInput
// ============================================================================

interface PortalInputProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}

export function PortalInputField({ label, error, hint, required, children }: PortalInputProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-[var(--ink2)]">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
      {hint && !error && <p className="text-xs text-[var(--muted)]">{hint}</p>}
    </div>
  );
}

interface PortalInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function PortalInput({ label, error, hint, required, className = '', ...props }: PortalInputProps) {
  return (
    <PortalInputField label={label} error={error} hint={hint} required={required}>
      <input
        className={`
          w-full rounded-lg border border-[var(--line)] px-4 py-2.5 text-sm
          focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500
          placeholder:text-[var(--muted)]
          ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : ''}
          ${className}
        `.trim()}
        {...props}
      />
    </PortalInputField>
  );
}

interface PortalTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function PortalTextarea({ label, error, hint, required, className = '', ...props }: PortalTextareaProps) {
  return (
    <PortalInputField label={label} error={error} hint={hint} required={required}>
      <textarea
        className={`
          w-full rounded-lg border border-[var(--line)] px-4 py-2.5 text-sm
          focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500
          placeholder:text-[var(--muted)] resize-y min-h-[100px]
          ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : ''}
          ${className}
        `.trim()}
        {...props}
      />
    </PortalInputField>
  );
}

interface PortalSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: { value: string; label: string }[];
}

export function PortalSelect({ label, error, hint, required, options, className = '', ...props }: PortalSelectProps) {
  return (
    <PortalInputField label={label} error={error} hint={hint} required={required}>
      <select
        className={`
          w-full rounded-lg border border-[var(--line)] px-4 py-2.5 text-sm
          focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500
          ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : ''}
          ${className}
        `.trim()}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </PortalInputField>
  );
}

// ============================================================================
// Spinner
// ============================================================================

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <svg
      className={`animate-spin ${sizes[size]} ${className}`}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

// ============================================================================
// Progress Bar
// ============================================================================

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  variant?: 'default' | 'success' | 'warning';
  size?: 'sm' | 'md';
}

export function ProgressBar({
  value,
  max = 100,
  label,
  showValue = false,
  variant = 'default',
  size = 'md',
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const variants = {
    default: 'bg-emerald-500',
    success: 'bg-emerald-600',
    warning: 'bg-amber-500',
  };

  const sizes = {
    sm: 'h-1.5',
    md: 'h-2.5',
  };

  return (
    <div className="w-full">
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && <span className="text-xs font-medium text-[var(--muted)]">{label}</span>}
          {showValue && <span className="text-xs font-bold text-[var(--ink)]">{Math.round(percentage)}%</span>}
        </div>
      )}
      <div className={`w-full bg-[var(--paper2)] rounded-full ${sizes[size]}`}>
        <div
          className={`${sizes[size]} ${variants[variant]} rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// ============================================================================
// Stars Rating
// ============================================================================

interface StarsProps {
  rating: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onChange?: (rating: number) => void;
}

export function Stars({ rating, max = 5, size = 'md', interactive = false, onChange }: StarsProps) {
  const sizes = { sm: 'w-3.5 h-3.5', md: 'w-4 h-4', lg: 'w-5 h-5' };

  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <button
          key={i}
          type="button"
          disabled={!interactive}
          onClick={() => interactive && onChange?.(i + 1)}
          className={`${sizes[size]} ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}`}
        >
          <svg
            className={i < rating ? 'text-amber-400' : 'text-[var(--line)]'}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

// ============================================================================
// Stat Card
// ============================================================================

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactElement;
  trend?: { value: number; positive?: boolean };
  subtext?: string;
}

export function StatCard({ label, value, icon, trend, subtext }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-[var(--line)] p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold text-[var(--ink)] mt-1">{value}</p>
        </div>
        {icon && (
          <div className="w-10 h-10 bg-[var(--paper2)] rounded-lg flex items-center justify-center text-[var(--muted)]">
            {icon}
          </div>
        )}
      </div>
      {(trend || subtext) && (
        <div className="mt-2 flex items-center gap-2">
          {trend && (
            <span className={`text-xs font-semibold ${trend.positive ? 'text-emerald-600' : 'text-red-600'}`}>
              {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </span>
          )}
          {subtext && <p className="text-xs text-[var(--muted)]">{subtext}</p>}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Section Header
// ============================================================================

interface SectionHeaderProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

export function SectionHeader({ title, description, action }: SectionHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h2 className="text-lg font-semibold text-[var(--ink)]">{title}</h2>
        {description && <p className="text-sm text-[var(--muted)] mt-1">{description}</p>}
      </div>
      {action && (
        action.href ? (
          <a href={action.href} className="text-sm font-medium text-emerald-600 hover:text-emerald-700">
            {action.label} →
          </a>
        ) : (
          <button onClick={action.onClick} className="text-sm font-medium text-emerald-600 hover:text-emerald-700">
            {action.label} →
          </button>
        )
      )}
    </div>
  );
}

// ============================================================================
// Loading States
// ============================================================================

export function LoadingScreen({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[var(--muted)]">{message}</p>
      </div>
    </div>
  );
}

export function ErrorScreen({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-[var(--ink)] mb-2">Something went wrong</h2>
        <p className="text-[var(--muted)] mb-6">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-6 py-3 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-all"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Empty States
// ============================================================================

interface EmptyStateProps {
  icon: ReactElement;
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-12 px-4">
      <div className="w-16 h-16 bg-[var(--paper2)] rounded-2xl flex items-center justify-center mx-auto mb-4 text-[var(--muted)]">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-[var(--ink)] mb-2">{title}</h3>
      <p className="text-[var(--muted)] text-sm max-w-sm mx-auto mb-6">{description}</p>
      {action && (
        action.href ? (
          <a
            href={action.href}
            className="inline-flex items-center px-6 py-3 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-all"
          >
            {action.label}
          </a>
        ) : (
          <button
            onClick={action.onClick}
            className="inline-flex items-center px-6 py-3 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-all"
          >
            {action.label}
          </button>
        )
      )}
    </div>
  );
}