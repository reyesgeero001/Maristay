import { AlertCircle, CheckCircle2, FlaskConical, Inbox, Info, Loader2, X } from 'lucide-react';
import { useEffect, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { label } from '../lib/format';

/* ------------------------------------------------------------------ button */
type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
const VARIANTS: Record<Variant, string> = {
  primary: 'bg-navy-800 text-white shadow-sm hover:bg-navy-700 disabled:bg-navy-800/50',
  secondary: 'bg-white text-navy-800 border border-line shadow-sm hover:border-gold-400 hover:bg-gold-50/40 disabled:text-slate-400 disabled:hover:border-line disabled:hover:bg-white',
  danger: 'bg-red-600 text-white shadow-sm hover:bg-red-700 disabled:bg-red-600/50',
  ghost: 'text-navy-700 hover:bg-navy-50 disabled:text-slate-400',
};

export function Button({
  variant = 'primary',
  size = 'md',
  busy,
  className = '',
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md'; busy?: boolean }) {
  const sizing = size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-4 py-2 text-sm';
  return (
    <button
      type="button"
      disabled={busy || props.disabled}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors duration-150 disabled:cursor-not-allowed ${sizing} ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {busy && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

/** Link styled as a primary button (used for page-header shortcuts). */
export const linkButtonClass =
  'inline-flex items-center justify-center gap-1.5 rounded-lg bg-navy-800 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-navy-700';

/* ------------------------------------------------------------------ layout */
export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <div className="mb-2 h-0.5 w-10 rounded-full bg-gold-500" aria-hidden="true" />
        <h1 className="text-2xl font-semibold tracking-tight text-navy-800">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ title, children, className = '', actions }: { title?: string; children: ReactNode; className?: string; actions?: ReactNode }) {
  return (
    <section className={`rounded-(--radius-card) border border-line bg-white shadow-(--shadow-card) ${className}`}>
      {(title || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-3.5">
          {title && <h2 className="font-semibold text-navy-800">{title}</h2>}
          {actions}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

const TONES = {
  navy: 'bg-navy-50 text-navy-800',
  gold: 'bg-gold-50 text-gold-700',
  green: 'bg-green-50 text-green-700',
  amber: 'bg-amber-50 text-amber-700',
  red: 'bg-red-50 text-red-700',
  slate: 'bg-slate-100 text-slate-700',
} as const;

export function StatCard({ label: text, value, icon, tone = 'navy' }: { label: string; value: ReactNode; icon: ReactNode; tone?: keyof typeof TONES }) {
  return (
    <div className="flex items-center gap-4 rounded-(--radius-card) border border-line bg-white p-4 shadow-(--shadow-card)">
      <div className={`rounded-lg p-2.5 ${TONES[tone]}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-sm text-muted">{text}</p>
        <p className="text-2xl font-semibold tabular-nums text-navy-800">{value}</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ status */
// Each status has a text colour with AA contrast on its tint, plus a thin ring so it is not colour-only.
const STATUS_TONE: Record<string, string> = {
  AVAILABLE: 'bg-green-50 text-green-800 ring-green-600/25',
  ACTIVE: 'bg-green-50 text-green-800 ring-green-600/25',
  PAID: 'bg-green-50 text-green-800 ring-green-600/25',
  COMPLETED: 'bg-green-50 text-green-800 ring-green-600/25',
  DELIVERED: 'bg-green-50 text-green-800 ring-green-600/25',
  CONFIRMED: 'bg-blue-50 text-blue-800 ring-blue-600/25',
  CHECKED_IN: 'bg-navy-50 text-navy-800 ring-navy-600/25',
  OCCUPIED: 'bg-navy-50 text-navy-800 ring-navy-600/25',
  IN_PROGRESS: 'bg-navy-50 text-navy-800 ring-navy-600/25',
  PREPARING: 'bg-navy-50 text-navy-800 ring-navy-600/25',
  PENDING: 'bg-amber-50 text-amber-800 ring-amber-600/30',
  CLEANING: 'bg-amber-50 text-amber-800 ring-amber-600/30',
  MAINTENANCE: 'bg-orange-50 text-orange-800 ring-orange-600/30',
  CHECKED_OUT: 'bg-slate-100 text-slate-700 ring-slate-500/25',
  INACTIVE: 'bg-slate-100 text-slate-700 ring-slate-500/25',
  EXPIRED: 'bg-slate-100 text-slate-700 ring-slate-500/25',
  REFUNDED: 'bg-slate-100 text-slate-700 ring-slate-500/25',
  CANCELLED: 'bg-red-50 text-red-800 ring-red-600/25',
  FAILED: 'bg-red-50 text-red-800 ring-red-600/25',
  REVOKED: 'bg-red-50 text-red-800 ring-red-600/25',
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_TONE[status] ?? 'bg-slate-100 text-slate-700 ring-slate-500/25'}`}>
      {label(status)}
    </span>
  );
}

/* ---------------------------------------------------------------- feedback */
export function Spinner({ label: text = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted" role="status">
      <Loader2 className="h-5 w-5 animate-spin text-gold-500" />
      {text}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-sm text-muted">
      <Inbox className="h-8 w-8 text-gold-300" />
      {message}
    </div>
  );
}

export function Alert({ type, children, onClose }: { type: 'success' | 'error' | 'info'; children: ReactNode; onClose?: () => void }) {
  const styles = {
    success: ['border-green-200 bg-green-50 text-green-800', <CheckCircle2 key="i" className="h-5 w-5 shrink-0 text-green-600" />],
    error: ['border-red-200 bg-red-50 text-red-800', <AlertCircle key="i" className="h-5 w-5 shrink-0 text-red-600" />],
    info: ['border-blue-200 bg-blue-50 text-blue-800', <Info key="i" className="h-5 w-5 shrink-0 text-blue-600" />],
  } as const;
  const [cls, icon] = styles[type];
  return (
    <div role={type === 'error' ? 'alert' : 'status'} className={`mb-4 flex items-start gap-2 rounded-lg border px-4 py-3 text-sm ${cls}`}>
      {icon}
      <div className="min-w-0 flex-1">{children}</div>
      {onClose && (
        <button type="button" onClick={onClose} aria-label="Dismiss" className="rounded opacity-60 hover:opacity-100">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

/** Displays a useAction() message. */
export function ActionMessage({ message, onClose }: { message: { type: 'success' | 'error'; text: string } | null; onClose: () => void }) {
  if (!message) return null;
  return (
    <Alert type={message.type} onClose={onClose}>
      {message.text}
    </Alert>
  );
}

export function SimulationNote({ children }: { children: ReactNode }) {
  return (
    <p className="mb-4 flex items-start gap-2 rounded-lg border border-gold-200 bg-gold-50 px-3 py-2 text-xs text-gold-800">
      <FlaskConical className="mt-px h-3.5 w-3.5 shrink-0 text-gold-600" aria-hidden="true" />
      <span>
        <strong>Simulation:</strong> {children}
      </span>
    </p>
  );
}

/** Small "Simulated …" tag for cards whose behaviour is a simulation (payments, smart lock). */
export function SimulatedTag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-gold-300 bg-gold-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-gold-800">
      <FlaskConical className="h-3 w-3" aria-hidden="true" />
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------- modal */
export function Modal({ title, open, onClose, children }: { title: string; open: boolean; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/50 p-4" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-line bg-white shadow-(--shadow-raised)"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
          <h2 className="font-semibold text-navy-800">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded text-slate-400 hover:text-navy-800">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  danger = true,
  busy,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal title={title} open={open} onClose={onCancel}>
      <div className="mb-5 text-sm text-slate-600">{message}</div>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant={danger ? 'danger' : 'primary'} busy={busy} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------- forms */
export const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-navy-800 shadow-sm transition-colors placeholder:text-slate-400 hover:border-slate-400 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/30 disabled:cursor-not-allowed disabled:bg-slate-50';

/** Visual "required" marker. aria-hidden keeps it out of the label's accessible name; inputs carry `required`. */
export const RequiredMark = () => (
  <span className="ml-0.5 text-red-600" aria-hidden="true">
    *
  </span>
);

export function Field({ label: text, children, hint, required }: { label: string; children: ReactNode; hint?: string; required?: boolean }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-navy-800">
        {text}
        {required && <RequiredMark />}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

export function Select({ value, onChange, options, placeholder, ...rest }: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
  'aria-label'?: string;
}) {
  return (
    <select className={inputClass} value={value} onChange={(e) => onChange(e.target.value)} {...rest}>
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export const enumOptions = (values: readonly string[]) => values.map((v) => ({ value: v, label: label(v) }));

/* ------------------------------------------------------------------- table */
export interface Column<T> {
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
}

export function DataTable<T>({ columns, rows, rowKey, loading, error, empty = 'No records found.' }: {
  columns: Column<T>[];
  rows: T[] | undefined;
  rowKey: (row: T) => string | number;
  loading?: boolean;
  error?: string | null;
  empty?: string;
}) {
  if (error) return <Alert type="error">{error}</Alert>;
  if (loading && !rows) return <Spinner />;
  if (!rows || rows.length === 0) return <EmptyState message={empty} />;
  return (
    // As the first element of a card body it tucks under the card header (no double line);
    // after filters it gets its own top border.
    <div className={`-mx-5 overflow-x-auto transition-opacity first:-mt-5 not-first:border-t not-first:border-line ${loading ? 'opacity-60' : ''}`}>
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-line bg-cream">
            {columns.map((c) => (
              <th key={c.header} scope="col" className="whitespace-nowrap px-5 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted">
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((row) => (
            <tr key={rowKey(row)} className="transition-colors hover:bg-cream/70">
              {columns.map((c) => (
                <td key={c.header} className={`whitespace-nowrap px-5 py-3 align-middle text-slate-700 ${c.className ?? ''}`}>
                  {c.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Pagination({ page, totalPages, total, onPage }: { page: number; totalPages: number; total: number; onPage: (p: number) => void }) {
  if (totalPages <= 1) return <p className="mt-3 text-xs text-muted">{total} record(s)</p>;
  return (
    <div className="mt-3 flex items-center justify-between text-xs text-muted">
      <span>
        {total} record(s) — page {page} of {totalPages}
      </span>
      <div className="flex gap-2">
        <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          Previous
        </Button>
        <Button size="sm" variant="secondary" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
}
