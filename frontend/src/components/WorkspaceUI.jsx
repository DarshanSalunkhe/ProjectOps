import { useEffect, useRef } from 'react';

// ── Skeleton loading component ────────────────────────────────────────────────
export const Skeleton = ({ w = '100%', h = '14px', r = '6px', style = {} }) => (
  <div className="skeleton" style={{ width: w, height: h, borderRadius: r, ...style }} />
);

export const DashboardSkeleton = () => (
  <div style={{ padding: '0' }}>
    {/* Header skeleton */}
    <div style={{ marginBottom: '28px' }}>
      <Skeleton w="120px" h="10px" style={{ marginBottom: '10px' }} />
      <Skeleton w="280px" h="28px" r="8px" style={{ marginBottom: '8px' }} />
      <Skeleton w="360px" h="13px" />
    </div>
    {/* Stat cards */}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '16px', marginBottom: '24px' }}>
      {[...Array(4)].map((_, i) => (
        <div key={i} className="card" style={{ padding: '20px' }}>
          <Skeleton w="40px" h="40px" r="10px" style={{ marginBottom: '14px' }} />
          <Skeleton w="60px" h="28px" r="6px" style={{ marginBottom: '8px' }} />
          <Skeleton w="90px" h="11px" />
        </div>
      ))}
    </div>
    {/* Content grid */}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
      <div className="card" style={{ padding: '20px', height: '200px' }}>
        <Skeleton w="100px" h="14px" style={{ marginBottom: '16px' }} />
        <Skeleton w="70px" h="40px" r="8px" style={{ marginBottom: '10px' }} />
        <Skeleton h="6px" r="100px" />
      </div>
      <div className="card" style={{ padding: '20px', height: '200px' }}>
        <Skeleton w="120px" h="14px" style={{ marginBottom: '16px' }} />
        {[...Array(3)].map((_, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
            <Skeleton w="140px" h="12px" />
            <Skeleton w="60px" h="22px" r="100px" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ── Page header ───────────────────────────────────────────────────────────────
export const PageHeader = ({ eyebrow, title, description, actions }) => (
  <header className="page-header">
    <div>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1>{title}</h1>
      {description && <p className="page-description">{description}</p>}
    </div>
    {actions && <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>{actions}</div>}
  </header>
);

// ── Dashboard card ─────────────────────────────────────────────────────────────
export const DashboardCard = ({ title, children, action, icon, accent }) => (
  <section className="card" style={{ height: '100%' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {icon && (
          <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: accent || 'rgba(124,58,237,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {icon}
          </div>
        )}
        <h2 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.01em' }}>{title}</h2>
      </div>
      {action && <div style={{ fontSize: '12px', flexShrink: 0 }}>{action}</div>}
    </div>
    {children}
  </section>
);

// ── Stat card ─────────────────────────────────────────────────────────────────
export const StatCard = ({ label, value, note, icon, accentColor = 'var(--violet)' }) => (
  <div className="card card-interactive" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '12px' }}>
      <div style={{ width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${accentColor}18`, flexShrink: 0 }}>
        {icon}
      </div>
    </div>
    <p style={{ fontSize: '30px', fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--ink)', lineHeight: 1 }}>{value}</p>
    <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)', marginTop: '2px' }}>{label}</p>
    {note && <p style={{ fontSize: '11px', color: 'var(--ink-muted)', marginTop: '2px' }}>{note}</p>}
  </div>
);

// ── Empty state ────────────────────────────────────────────────────────────────
export const EmptyState = ({ title = 'Nothing here yet', description, children, icon }) => (
  <div className="empty-state" style={{ padding: '32px 16px', textAlign: 'center' }}>
    {icon && <div style={{ marginBottom: '12px', opacity: 0.4, fontSize: '28px' }}>{icon}</div>}
    <p style={{ fontWeight: 600, fontSize: '14px', color: 'var(--ink-secondary)', marginBottom: '6px' }}>{title}</p>
    {description && <p style={{ fontSize: '12px', color: 'var(--ink-muted)', lineHeight: 1.6, maxWidth: '280px', margin: '0 auto' }}>{description}</p>}
    {children && <div style={{ marginTop: '16px' }}>{children}</div>}
  </div>
);

// ── Loading state ─────────────────────────────────────────────────────────────
export const LoadingState = ({ label = 'Loading…' }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 16px', gap: '12px' }} role="status" aria-label={label}>
    <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '3px solid rgba(124,58,237,0.2)', borderTopColor: 'var(--violet)', animation: 'spin 0.8s linear infinite' }} />
    <p style={{ fontSize: '12px', color: 'var(--ink-muted)' }}>{label}</p>
  </div>
);

// ── Error state ────────────────────────────────────────────────────────────────
export const ErrorState = ({ message, onRetry }) => (
  <div className="error-state" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }} role="alert">
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span style={{ fontSize: '16px' }}>⚠</span>
      <span>{message}</span>
    </div>
    {onRetry && (
      <button className="btn btn-secondary" onClick={onRetry} style={{ minHeight: '28px', padding: '4px 12px', fontSize: '12px', flexShrink: 0 }}>
        Try again
      </button>
    )}
  </div>
);

// ── Status badge ──────────────────────────────────────────────────────────────
const STATUS_MAP = {
  COMPLETED: { cls: 'badge-success', label: 'Completed' },
  HEALTHY:   { cls: 'badge-success', label: 'Healthy' },
  ACTIVE:    { cls: 'badge-info',    label: 'Active' },
  IN_PROGRESS:{ cls: 'badge-violet', label: 'In Progress' },
  PLANNING:  { cls: 'badge-gray',    label: 'Planning' },
  AT_RISK:   { cls: 'badge-warning', label: 'At Risk' },
  ON_HOLD:   { cls: 'badge-warning', label: 'On Hold' },
  BLOCKED:   { cls: 'badge-danger',  label: 'Blocked' },
  CRITICAL:  { cls: 'badge-danger',  label: 'Critical' },
  HIGH:      { cls: 'badge-danger',  label: 'High' },
  MEDIUM:    { cls: 'badge-warning', label: 'Medium' },
  LOW:       { cls: 'badge-gray',    label: 'Low' },
  TODO:      { cls: 'badge-gray',    label: 'To Do' },
  CANCELLED: { cls: 'badge-gray',    label: 'Cancelled' },
  UNAVAILABLE:{ cls:'badge-gray',    label: 'Unavailable' },
};
export const StatusBadge = ({ status }) => {
  const map = STATUS_MAP[status] || { cls: 'badge-gray', label: status?.replaceAll('_', ' ') || 'Unknown' };
  return <span className={`badge ${map.cls}`}>{map.label}</span>;
};

// ── Confirmation dialog ────────────────────────────────────────────────────────
export const ConfirmationDialog = ({ title, children, onConfirm, onClose, busy, confirmLabel = 'Confirm', busyLabel = 'Applying…' }) => {
  const ref = useRef(null);
  useEffect(() => { ref.current?.showModal(); }, []);
  return (
    <dialog ref={ref} className="confirmation-dialog" onCancel={onClose}>
      <h2 style={{ fontSize: '17px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '12px' }}>{title}</h2>
      <div style={{ fontSize: '13px', color: 'var(--ink-secondary)', lineHeight: 1.6, marginBottom: '20px' }}>{children}</div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
        <button className="btn btn-secondary" disabled={busy} onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" disabled={busy} aria-busy={busy} onClick={onConfirm}>
          {busy ? busyLabel : confirmLabel}
        </button>
      </div>
    </dialog>
  );
};
