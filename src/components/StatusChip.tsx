import React from 'react';

export type ChipStatus = 
  | 'active'
  | 'pending_validation'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'approved'
  | 'rejected';

export interface StatusChipProps {
  status: ChipStatus;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const STATUS_CONFIG: Record<ChipStatus, { defaultLabel: string; color: string; bg: string }> = {
  active: { defaultLabel: 'Active', color: 'var(--accent)', bg: 'var(--accent-transparent)' },
  completed: { defaultLabel: 'Completed', color: 'var(--success)', bg: 'color-mix(in srgb, var(--success) 10%, transparent)' },
  failed: { defaultLabel: 'Failed', color: 'var(--danger)', bg: 'color-mix(in srgb, var(--danger) 10%, transparent)' },
  cancelled: { defaultLabel: 'Cancelled', color: 'var(--muted)', bg: 'color-mix(in srgb, var(--muted) 10%, transparent)' },
  pending_validation: { defaultLabel: 'Pending Validation', color: 'var(--warning)', bg: 'color-mix(in srgb, var(--warning) 10%, transparent)' },
  approved: { defaultLabel: 'Approved', color: 'var(--success)', bg: 'color-mix(in srgb, var(--success) 10%, transparent)' },
  rejected: { defaultLabel: 'Rejected', color: 'var(--danger)', bg: 'color-mix(in srgb, var(--danger) 10%, transparent)' },
};

const SIZE_STYLES = {
  sm: {
    padding: '2px 8px',
    fontSize: '11px',
  },
  md: {
    padding: '2px 10px',
    fontSize: '12px',
  },
  lg: {
    padding: '4px 12px',
    fontSize: '14px',
  },
};

export const StatusChip: React.FC<StatusChipProps> = ({ 
  status, 
  label, 
  size = 'md',
  className = ''
}) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.cancelled; // Fallback
  const sizeStyle = SIZE_STYLES[size];

  return (
    <span
      className={`status-chip ${className}`.trim()}
      style={{
        background: config.bg,
        color: config.color,
        border: `1px solid ${config.color}`,
        borderRadius: 'var(--radius-full)',
        fontWeight: 600,
        whiteSpace: 'nowrap',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...sizeStyle,
      }}
      role="status"
      aria-label={label || config.defaultLabel}
    >
      {label || config.defaultLabel}
    </span>
  );
};
