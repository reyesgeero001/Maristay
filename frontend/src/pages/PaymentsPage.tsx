import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { paymentsApi } from '../api/endpoints';
import { PAYMENT_METHODS, type Payment, type PaymentStatus } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import {
  ActionMessage,
  Button,
  Card,
  DataTable,
  Field,
  PageHeader,
  Pagination,
  Select,
  SimulationNote,
  StatusBadge,
  enumOptions,
  inputClass,
  type Column,
} from '../components/ui';
import { dateTime, money } from '../lib/format';
import { useAction, useApi } from '../lib/useApi';

const NEXT: Record<PaymentStatus, PaymentStatus[]> = { PENDING: ['PAID', 'FAILED'], PAID: ['REFUNDED'], FAILED: [], REFUNDED: [] };

/** GET /payments (guests see only their own) and PATCH /payments/:id status verification for staff. */
export function PaymentsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const staff = user?.role !== 'GUEST';
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [method, setMethod] = useState('');
  const [reservationId, setReservationId] = useState('');
  const list = useApi(
    () => paymentsApi.list({ page, limit: 20, status, paymentMethod: method, reservationId: reservationId || undefined }),
    [page, status, method, reservationId],
  );
  const action = useAction();
  const update = async (p: Payment, next: PaymentStatus) => {
    const res = await action.run(
      () => paymentsApi.updateStatus(p.paymentId, next),
      (x) => `Payment #${x.paymentId} is now ${x.status}. Reservation #${x.reservationId} balance due: ${money(x.billing.balanceDue)}.`,
    );
    if (res.ok) void list.reload();
  };

  const columns: Column<Payment>[] = [
    { header: 'ID', cell: (p) => `#${p.paymentId}` },
    { header: 'Reservation', cell: (p) => <Link className="font-medium text-navy-800 hover:text-gold-700 hover:underline" to={`/reservations/${p.reservationId}`}>#{p.reservationId}</Link> },
    { header: 'Amount', cell: (p) => money(p.amount) },
    { header: 'Method', cell: (p) => p.paymentMethod.replace('_', '-') },
    { header: 'Status', cell: (p) => <StatusBadge status={p.status} /> },
    { header: 'Processed', cell: (p) => dateTime(p.date) },
    ...(staff
      ? [{
          header: 'Update',
          cell: (p: Payment) => (
            <div className="flex gap-1">
              {NEXT[p.status].map((n) => (
                <Button key={n} size="sm" variant="secondary" busy={action.busy} onClick={() => update(p, n)}>
                  Mark {n.toLowerCase()}
                </Button>
              ))}
            </div>
          ),
        }]
      : []),
  ];

  return (
    <>
      <PageHeader
        title={staff ? 'Payments' : 'My Payments'}
        subtitle={staff ? 'To record a new payment, open the reservation and choose “Record payment”.' : 'Payments recorded by the front desk for your reservations.'}
      />
      <SimulationNote>Payment processing is simulated — no real money is moved and no card details are stored.</SimulationNote>
      <ActionMessage message={action.message} onClose={() => action.setMessage(null)} />
      <Card>
        <div className="mb-4 grid gap-3 sm:grid-cols-4">
          <Field label="Status">
            <Select value={status} onChange={(v) => { setStatus(v); setPage(1); }} options={enumOptions(['PENDING', 'PAID', 'FAILED', 'REFUNDED'])} placeholder="All statuses" />
          </Field>
          <Field label="Method">
            <Select value={method} onChange={(v) => { setMethod(v); setPage(1); }} options={PAYMENT_METHODS.map((m) => ({ value: m, label: m.replace('_', '-') }))} placeholder="All methods" />
          </Field>
          <Field label="Reservation #">
            <input className={inputClass} inputMode="numeric" value={reservationId} onChange={(e) => { setReservationId(e.target.value.replace(/\D/g, '')); setPage(1); }} />
          </Field>
          {staff && (
            <div className="flex items-end">
              <Button variant="secondary" disabled={!reservationId} onClick={() => navigate(`/reservations/${reservationId}`)}>
                Open reservation to record payment
              </Button>
            </div>
          )}
        </div>
        <DataTable columns={columns} rows={list.data?.data} rowKey={(p) => p.paymentId} loading={list.loading} error={list.error} empty="No payments found." />
        {list.data && <Pagination page={page} totalPages={list.data.meta.totalPages} total={list.data.meta.total} onPage={setPage} />}
      </Card>
    </>
  );
}
