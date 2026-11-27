import { ArrowLeft, BadgeCheck, CalendarCog, CreditCard, KeyRound, LogIn, LogOut, XCircle } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useLocation, useParams } from 'react-router';
import { digitalKeysApi, paymentsApi, reservationsApi, serviceOrdersApi } from '../api/endpoints';
import {
  PAYMENT_METHODS,
  type CheckInResult,
  type CheckOutResult,
  type Payment,
  type PaymentStatus,
  type Reservation,
} from '../api/types';
import { useAuth } from '../auth/AuthContext';
import {
  ActionMessage,
  Alert,
  Button,
  Card,
  ConfirmDialog,
  DataTable,
  Field,
  Modal,
  PageHeader,
  Select,
  SimulationNote,
  Spinner,
  StatusBadge,
  enumOptions,
  inputClass,
  type Column,
} from '../components/ui';
import { dateTime, localDate, money } from '../lib/format';
import { keyWallet } from '../lib/keyWallet';
import { itemName } from '../lib/serviceCatalog';
import { useAction, useApi } from '../lib/useApi';
import { KeyCodeBox } from './DigitalKeysPage';

/** Allowed payment status changes (mirrors PAYMENT_TRANSITIONS in payments.service.ts). */
const NEXT_PAYMENT_STATUS: Record<PaymentStatus, PaymentStatus[]> = {
  PENDING: ['PAID', 'FAILED'],
  PAID: ['REFUNDED'],
  FAILED: [],
  REFUNDED: [],
};

type Dialog = 'pay' | 'checkin' | 'checkout' | 'cancel' | 'dates' | 'confirm' | null;

export function ReservationDetailPage() {
  const id = Number(useParams().id);
  const { user } = useAuth();
  const location = useLocation();
  const staff = user?.role === 'FRONT_DESK' || user?.role === 'MANAGER';
  const data = useApi(async () => {
    const [reservation, payments, orders, keys] = await Promise.all([
      reservationsApi.get(id),
      paymentsApi.list({ reservationId: id, limit: 100 }),
      serviceOrdersApi.list({ reservationId: id, limit: 100 }),
      digitalKeysApi.list({ reservationId: id, limit: 100 }),
    ]);
    return { reservation, payments: payments.data, orders: orders.data, keys: keys.data };
  }, [id]);
  const action = useAction();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [checkInResult, setCheckInResult] = useState<CheckInResult | null>(null);
  const [checkOutResult, setCheckOutResult] = useState<CheckOutResult | null>(null);
  const flash = (location.state as { flash?: string } | null)?.flash;

  if (!Number.isInteger(id) || id < 1) return <Alert type="error">Invalid reservation id.</Alert>;
  if (data.loading && !data.data) return <Spinner />;
  if (data.error && !data.data) {
    return (
      <>
        <BackLink />
        <Alert type="error">{data.error}</Alert>
      </>
    );
  }
  if (!data.data) return null;
  const { reservation: r, payments, orders, keys } = data.data;

  // Same rules as BillingService.summarize on the server.
  const serviceCharges = orders.filter((o) => o.status === 'DELIVERED').reduce((s, o) => s + Number(o.totalAmount), 0);
  const paid = payments.filter((p) => p.status === 'PAID').reduce((s, p) => s + Number(p.amount), 0);
  const billable = Number(r.totalAmount) + serviceCharges;
  const balance = Math.max(0, Math.round((billable - paid) * 100) / 100);

  const status = r.reservationStatus;
  const editable = status === 'PENDING' || status === 'CONFIRMED';
  const payable = editable || status === 'CHECKED_IN';
  const close = () => setDialog(null);
  const done = (ok: boolean) => {
    close();
    if (ok) void data.reload();
  };

  const doCheckIn = async () => {
    const res = await action.run(() => reservationsApi.checkIn(r.reservationId), (x) => x.message);
    if (res.ok) {
      keyWallet.save(res.value.digitalKey);
      setCheckInResult(res.value);
    }
    done(res.ok);
  };
  const doCheckOut = async () => {
    const res = await action.run(() => reservationsApi.checkOut(r.reservationId), (x) => x.message);
    if (res.ok) setCheckOutResult(res.value);
    done(res.ok);
  };
  const doCancel = async () => {
    const res = await action.run(
      () => reservationsApi.cancel(r.reservationId),
      (x) => `Reservation cancelled.${x.refundDue > 0 ? ` ${money(x.refundDue)} was already paid and is due for refund (mark the payment as Refunded).` : ''}`,
    );
    done(res.ok);
  };
  const doConfirm = async () => {
    const res = await action.run(() => reservationsApi.confirm(r.reservationId), 'Reservation confirmed.');
    done(res.ok);
  };
  const setPaymentStatus = async (p: Payment, next: PaymentStatus) => {
    const res = await action.run(() => paymentsApi.updateStatus(p.paymentId, next), `Payment #${p.paymentId} marked ${next}.`);
    if (res.ok) void data.reload();
  };

  const paymentColumns: Column<Payment>[] = [
    { header: 'ID', cell: (p) => `#${p.paymentId}` },
    { header: 'Amount', cell: (p) => money(p.amount) },
    { header: 'Method', cell: (p) => p.paymentMethod.replace('_', '-') },
    { header: 'Status', cell: (p) => <StatusBadge status={p.status} /> },
    { header: 'Processed', cell: (p) => dateTime(p.date) },
    ...(staff
      ? [{
          header: 'Update',
          cell: (p: Payment) => (
            <div className="flex gap-1">
              {NEXT_PAYMENT_STATUS[p.status].map((next) => (
                <Button key={next} size="sm" variant="secondary" busy={action.busy} onClick={() => setPaymentStatus(p, next)}>
                  Mark {next.toLowerCase()}
                </Button>
              ))}
            </div>
          ),
        }]
      : []),
  ];

  return (
    <>
      <BackLink />
      <PageHeader
        title={`Reservation #${r.reservationId}`}
        subtitle={r.guest ? `${r.guest.firstName} ${r.guest.lastName} · ${r.guest.email}` : undefined}
        actions={
          <>
            {staff && status === 'PENDING' && (
              <Button variant="secondary" onClick={() => setDialog('confirm')}><BadgeCheck className="h-4 w-4" /> Confirm</Button>
            )}
            {staff && payable && (
              <Button variant="secondary" onClick={() => setDialog('pay')}><CreditCard className="h-4 w-4" /> Record payment</Button>
            )}
            {editable && (
              <Button variant="secondary" onClick={() => setDialog('dates')}><CalendarCog className="h-4 w-4" /> Change dates</Button>
            )}
            {status === 'CONFIRMED' && (
              <Button onClick={() => setDialog('checkin')}><LogIn className="h-4 w-4" /> Check in</Button>
            )}
            {status === 'CHECKED_IN' && (
              <Button onClick={() => setDialog('checkout')}><LogOut className="h-4 w-4" /> Check out</Button>
            )}
            {editable && (
              <Button variant="danger" onClick={() => setDialog('cancel')}><XCircle className="h-4 w-4" /> Cancel reservation</Button>
            )}
          </>
        }
      />
      {flash && !action.message && <Alert type="success">{flash}</Alert>}
      <ActionMessage message={action.message} onClose={() => action.setMessage(null)} />
      {data.error && <Alert type="error">{data.error}</Alert>}

      {checkInResult && (
        <Card title="Digital room key issued" className="mb-6 border-green-300">
          <SimulationNote>The smart lock is simulated. SMS / e-mail notifications are simulated and not actually sent.</SimulationNote>
          <p className="mb-3 text-sm text-slate-600">
            Room <strong>{checkInResult.reservation.room?.roomNo}</strong> is ready. This key code is shown <strong>only once</strong>
            {' '}— it is kept for this browser tab so you can test it on the{' '}
            <Link className="text-navy-800 underline decoration-gold-500" to="/digital-keys">Digital Keys</Link> page.
          </p>
          <KeyCodeBox code={checkInResult.digitalKey.keyCode} room={checkInResult.reservation.room?.roomNo} expiresAt={checkInResult.digitalKey.expiresAt} />
        </Card>
      )}
      {checkOutResult && (
        <Card title="Check-out summary" className="mb-6">
          <dl className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            <Stat label="Total billed" value={money(checkOutResult.billing.totalBillable)} />
            <Stat label="Paid" value={money(checkOutResult.billing.paidTotal)} />
            <Stat label="Keys revoked" value={checkOutResult.digitalKeysRevoked} />
            <Stat label="Open orders cancelled" value={checkOutResult.openServiceOrdersCancelled} />
          </dl>
          <p className="mt-3 text-sm text-slate-600">
            {checkOutResult.housekeepingTask
              ? `Room sent for cleaning — housekeeping task #${checkOutResult.housekeepingTask.hkId} created.`
              : 'No active housekeeper was available; a manager must assign the cleaning task.'}
          </p>
        </Card>
      )}

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card title="Stay details">
          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-muted">Status</dt>
            <dd><StatusBadge status={status} /></dd>
            <dt className="text-muted">Room</dt>
            <dd>{r.room ? `${r.room.roomNo} (${r.room.roomType})` : `#${r.roomId}`}</dd>
            <dt className="text-muted">Check-in</dt>
            <dd>{r.checkInDate}</dd>
            <dt className="text-muted">Check-out</dt>
            <dd>{r.checkOutDate}</dd>
            <dt className="text-muted">Rate per night</dt>
            <dd>{money(r.ratePerNight)}</dd>
            <dt className="text-muted">Booked</dt>
            <dd>{dateTime(r.createdAt)}</dd>
          </dl>
        </Card>
        <Card title="Billing">
          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-muted">Room total</dt>
            <dd>{money(r.totalAmount)}</dd>
            <dt className="text-muted">Delivered services</dt>
            <dd>{money(serviceCharges)}</dd>
            <dt className="text-muted">Paid</dt>
            <dd>{money(paid)}</dd>
            <dt className="font-medium text-slate-700">Balance due</dt>
            <dd className={`font-semibold ${balance > 0 ? 'text-red-700' : 'text-green-700'}`}>{money(balance)}</dd>
          </dl>
          <p className="mt-3 text-xs text-muted">
            {status === 'PENDING' && 'Pending reservations are confirmed automatically once the room total is paid. '}
            {status === 'CONFIRMED' && 'Check-in opens on the check-in date when the room total is paid and the room is ready. '}
            {status === 'CHECKED_IN' && 'Check-out requires the full balance (room + delivered services) to be paid. '}
            {!staff && payable && balance > 0 && 'Payments are recorded by the front desk.'}
          </p>
        </Card>
      </div>

      <Card title="Payments" className="mb-6">
        <DataTable columns={paymentColumns} rows={payments} rowKey={(p) => p.paymentId} empty="No payments recorded." />
      </Card>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Service orders" actions={<Link className="text-sm font-medium text-navy-800 hover:text-gold-700 hover:underline" to="/service-orders">Manage</Link>}>
          <DataTable
            columns={[
              { header: 'Order', cell: (o) => `#${o.orderId} ${itemName(o.itemCode)} × ${o.quantity}` },
              { header: 'Total', cell: (o) => money(o.totalAmount) },
              { header: 'Status', cell: (o) => <StatusBadge status={o.status} /> },
            ]}
            rows={orders}
            rowKey={(o) => o.orderId}
            empty="No service orders."
          />
        </Card>
        <Card title="Digital keys" actions={<Link className="text-sm font-medium text-navy-800 hover:text-gold-700 hover:underline" to="/digital-keys"><KeyRound className="inline h-4 w-4" /> Manage</Link>}>
          <DataTable
            columns={[
              { header: 'Key', cell: (k) => `#${k.keyId}` },
              { header: 'Expires', cell: (k) => dateTime(k.expiresAt) },
              { header: 'Status', cell: (k) => <StatusBadge status={k.status} /> },
            ]}
            rows={keys}
            rowKey={(k) => k.keyId}
            empty="No keys issued yet (a key is issued at check-in)."
          />
        </Card>
      </div>

      <ConfirmDialog
        open={dialog === 'checkin'}
        title="Digital check-in"
        danger={false}
        confirmLabel="Check in"
        busy={action.busy}
        message="Check in now? The room becomes Occupied and a digital room key is issued. Requires a confirmed, fully paid reservation on or after the check-in date."
        onConfirm={doCheckIn}
        onCancel={close}
      />
      <ConfirmDialog
        open={dialog === 'checkout'}
        title="Digital check-out"
        confirmLabel="Check out"
        busy={action.busy}
        message="Check out now? Digital keys are revoked, unfinished service orders are cancelled and the room is sent for cleaning. The full balance must already be paid."
        onConfirm={doCheckOut}
        onCancel={close}
      />
      <ConfirmDialog
        open={dialog === 'cancel'}
        title="Cancel reservation"
        confirmLabel="Cancel reservation"
        busy={action.busy}
        message="Cancel this reservation? The record is kept with status Cancelled and the room is released. This cannot be undone."
        onConfirm={doCancel}
        onCancel={close}
      />
      <ConfirmDialog
        open={dialog === 'confirm'}
        title="Confirm reservation"
        danger={false}
        confirmLabel="Confirm"
        busy={action.busy}
        message="Confirm this pending reservation (guaranteed booking, pay at hotel)? The guest must still pay the room total before check-in."
        onConfirm={doConfirm}
        onCancel={close}
      />
      {dialog === 'pay' && (
        <PaymentDialog reservation={r} balance={balance} onClose={close} onSaved={(msg) => { action.setMessage({ type: 'success', text: msg }); done(true); }} />
      )}
      {dialog === 'dates' && (
        <DatesDialog reservation={r} onClose={close} onSaved={() => { action.setMessage({ type: 'success', text: 'Reservation dates updated.' }); done(true); }} />
      )}
    </>
  );
}

const BackLink = () => (
  <Link to="/reservations" className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-navy-800 hover:text-gold-700 hover:underline">
    <ArrowLeft className="h-4 w-4" /> Back to reservations
  </Link>
);

const Stat = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div>
    <dt className="text-muted">{label}</dt>
    <dd className="font-semibold text-navy-800">{value}</dd>
  </div>
);

export function PaymentDialog({ reservation, balance, onClose, onSaved }: { reservation: Reservation; balance: number; onClose: () => void; onSaved: (msg: string) => void }) {
  const [amount, setAmount] = useState(balance > 0 ? balance.toFixed(2) : '');
  const [method, setMethod] = useState('CASH');
  const [status, setStatus] = useState('PAID');
  const [error, setError] = useState<string | null>(null);
  const action = useAction();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const value = Number(amount);
    if (!/^\d+(\.\d{1,2})?$/.test(amount.trim()) || value < 0.01) return setError('Enter an amount greater than 0 with at most 2 decimals.');
    if (status === 'PAID' && value > balance + 0.001) return setError(`Amount cannot exceed the balance due (${money(balance)}).`);
    const res = await action.run(() =>
      paymentsApi.create({ reservationId: reservation.reservationId, amount: value, paymentMethod: method as Payment['paymentMethod'], status: status as PaymentStatus }),
    );
    if (res.ok) {
      const b = res.value.billing;
      onSaved(`Payment #${res.value.paymentId} recorded (${res.value.status}). Balance due: ${money(b.balanceDue)}. Reservation is ${res.value.reservationStatus}.`);
    }
  };

  return (
    <Modal title={`Record payment — reservation #${reservation.reservationId}`} open onClose={onClose}>
      <SimulationNote>No real money is charged. No card numbers or e-wallet credentials are collected.</SimulationNote>
      <form onSubmit={submit} className="space-y-4" noValidate>
        {error && <Alert type="error">{error}</Alert>}
        <ActionMessage message={action.message} onClose={() => action.setMessage(null)} />
        <p className="text-sm text-slate-600">Balance due: <strong>{money(balance)}</strong></p>
        <Field label="Amount (PHP)" required>
          <input className={inputClass} type="number" min={0.01} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        </Field>
        <Field label="Payment method" required>
          <Select value={method} onChange={setMethod} options={PAYMENT_METHODS.map((m) => ({ value: m, label: m.replace('_', '-') }))} />
        </Field>
        <Field label="Status" required hint="Pending payments can later be marked Paid or Failed.">
          <Select value={status} onChange={setStatus} options={enumOptions(['PAID', 'PENDING', 'FAILED'])} />
        </Field>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" busy={action.busy}>Record payment</Button>
        </div>
      </form>
    </Modal>
  );
}

function DatesDialog({ reservation, onClose, onSaved }: { reservation: Reservation; onClose: () => void; onSaved: () => void }) {
  const [checkIn, setCheckIn] = useState(reservation.checkInDate);
  const [checkOut, setCheckOut] = useState(reservation.checkOutDate);
  const [error, setError] = useState<string | null>(null);
  const action = useAction();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (checkOut <= checkIn) return setError('Check-out must be after check-in.');
    if (checkIn !== reservation.checkInDate && checkIn < localDate(0)) return setError('Check-in date cannot be in the past.');
    const body: { checkInDate?: string; checkOutDate?: string } = {};
    if (checkIn !== reservation.checkInDate) body.checkInDate = checkIn;
    if (checkOut !== reservation.checkOutDate) body.checkOutDate = checkOut;
    if (!body.checkInDate && !body.checkOutDate) return setError('Change at least one date.');
    const res = await action.run(() => reservationsApi.update(reservation.reservationId, body));
    if (res.ok) onSaved();
  };

  return (
    <Modal title="Change reservation dates" open onClose={onClose}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        {error && <Alert type="error">{error}</Alert>}
        <ActionMessage message={action.message} onClose={() => action.setMessage(null)} />
        <Field label="Check-in date" required>
          <input className={inputClass} type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
        </Field>
        <Field label="Check-out date" required>
          <input className={inputClass} type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
        </Field>
        <p className="text-xs text-muted">The total is recalculated by the server. A 409 error means the room is already booked for the new dates.</p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" busy={action.busy}>Save dates</Button>
        </div>
      </form>
    </Modal>
  );
}
