import { useEffect, useRef, useId } from 'react';

// ── Skeleton loading component ────────────────────────────────────────────────
export const Skeleton = ({ w = '100%', h = '14px', r = '6px', style = {} }) => (
  <div aria-hidden="true" className="skeleton" style={{ width: w, height: h, borderRadius: r, ...style }} />
);

export const DashboardSkeleton = () => (
  <div role="status" aria-label="Loading workspace dashboard" className="dashboard-skeleton">
    <span className="sr-only">Loading workspace dashboard…</span>
    <div className="dashboard-hero skeleton-hero"><Skeleton w="140px" h="12px" /><Skeleton w="70%" h="36px" /><Skeleton w="85%" h="14px" /></div>
    <div className="metrics-grid">{Array.from({ length: 4 }, (_, i) => <div key={i} className="card stat-card"><Skeleton w="36px" h="36px" /><Skeleton w="60px" h="32px" /><Skeleton w="100px" h="14px" /></div>)}</div>
    <div className="dashboard-primary-grid">{[0, 1].map(i => <div key={i} className="card"><Skeleton w="140px" h="20px" /><div className="skeleton-rows">{[0, 1, 2].map(j => <Skeleton key={j} h="26px" />)}</div></div>)}</div>
    <div className="dashboard-secondary-grid">{[0, 1, 2].map(i => <div key={i} className="card"><Skeleton w="65%" h="20px" /><div className="skeleton-rows"><Skeleton h="50px" /><Skeleton h="50px" /></div></div>)}</div>
    <div className="card"><Skeleton w="120px" h="20px" /><div className="skeleton-rows"><Skeleton h="50px" /></div></div>
  </div>
);

export const CollectionSkeleton = ({ label = 'Loading items…', count = 3 }) => <div role="status" aria-label={label}>
  <span className="sr-only">{label}</span>
  <div className="collection-grid">{Array.from({ length: count }, (_, i) => <div className="card" key={i}>
    <Skeleton w="60%" h="20px" /><div className="skeleton-rows"><Skeleton h="14px" /><Skeleton w="80%" h="14px" /><Skeleton h="6px" /><Skeleton w="50%" h="16px" /></div>
  </div>)}</div>
</div>;

export const StartupLoader = ({ label = 'Preparing your workspace…' }) => <div className="startup-loader" role="status">
  <div className="startup-mark"><img src="/projectops-icon.svg" width="52" height="52" alt="" /></div>
  <strong>ProjectOps</strong><p>{label}</p><div className="startup-line" aria-hidden="true" />
</div>;

export const Modal = ({ title, children, onClose, busy = false }) => {
  const ref = useRef(null);
  const titleId = useId();
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const previous = document.activeElement;
    ref.current?.showModal();
    return () => { ref.current?.close(); previous?.focus(); };
  }, []);
  return <dialog ref={ref} className="workspace-dialog" aria-labelledby={titleId} onCancel={event => {
    event.preventDefault(); if (!busy) closeRef.current?.();
  }}>
    <header className="dialog-heading"><div><p className="eyebrow">ProjectOps workspace</p><h2 id={titleId}>{title}</h2></div>
      {onClose && <button type="button" className="btn btn-ghost" aria-label="Close dialog" disabled={busy} onClick={onClose}>×</button>}
    </header>
    {children}
  </dialog>;
};

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
  <section className="card dashboard-card" style={{ height: '100%' }}>
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
  <div className="card stat-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
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
export const LoadingState = ({ label = 'Loading…', variant = 'default' }) => (
  <div className={`loading-state loading-${variant}`} role="status">
    <div className="processing-mark" aria-hidden="true">{variant === 'sync' ? '↻' : variant === 'ai' ? '✦' : <img src="/projectops-icon.svg" alt="" width="24" height="24" />}</div>
    <p>{label}</p><div className="processing-dots" aria-hidden="true"><i /><i /><i /></div>
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
  BLOCKED:   { cls: 'badge-warning',  label: 'Blocked' },
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
    <dialog ref={ref} className="confirmation-dialog" aria-label={title} onCancel={event => { if (busy) event.preventDefault(); else onClose(); }}>
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
