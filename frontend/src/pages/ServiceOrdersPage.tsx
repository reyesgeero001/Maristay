import { Plus } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { reservationsApi, serviceOrdersApi } from '../api/endpoints';
import type { ServiceOrder, ServiceOrderStatus } from '../api/types';
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
  Pagination,
  Select,
  StatusBadge,
  enumOptions,
  inputClass,
  type Column,
} from '../components/ui';
import { dateTime, money } from '../lib/format';
import { SERVICE_ITEMS, itemName } from '../lib/serviceCatalog';
import { useAction, useApi } from '../lib/useApi';

/** Staff workflow (ORDER_TRANSITIONS in service-orders.service.ts). */
const STAFF_NEXT: Record<ServiceOrderStatus, ServiceOrderStatus[]> = {
  PENDING: ['PREPARING', 'CANCELLED'],
  PREPARING: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: [],
};

/** POST / GET / PATCH /service-orders. Guests may only cancel their own PENDING orders. */
export function ServiceOrdersPage() {
  const { user } = useAuth();
  const staff = user?.role !== 'GUEST';
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [serviceType, setServiceType] = useState('');
  const list = useApi(() => serviceOrdersApi.list({ page, limit: 20, status, serviceType }), [page, status, serviceType]);
  const action = useAction();
  const [creating, setCreating] = useState(false);
  const [cancelling, setCancelling] = useState<ServiceOrder | null>(null);

  const setOrderStatus = async (o: ServiceOrder, next: ServiceOrderStatus) => {
    const res = await action.run(() => serviceOrdersApi.updateStatus(o.orderId, next), `Order #${o.orderId} is now ${next.toLowerCase()}.`);
    setCancelling(null);
    if (res.ok) void list.reload();
  };

  const allowed = (o: ServiceOrder): ServiceOrderStatus[] =>
    staff ? STAFF_NEXT[o.status] : o.status === 'PENDING' ? ['CANCELLED'] : [];

  const columns: Column<ServiceOrder>[] = [
    { header: 'Order', cell: (o) => `#${o.orderId}` },
    { header: 'Item', cell: (o) => <span title={o.itemCode}>{itemName(o.itemCode)} × {o.quantity}</span> },
    { header: 'Type', cell: (o) => o.serviceType },
    { header: 'Room', cell: (o) => o.reservation?.room?.roomNo ?? '—' },
    { header: 'Reservation', cell: (o) => <Link className="font-medium text-navy-800 hover:text-gold-700 hover:underline" to={`/reservations/${o.reservationId}`}>#{o.reservationId}</Link> },
    { header: 'Total', cell: (o) => money(o.totalAmount) },
    { header: 'Ordered', cell: (o) => dateTime(o.date) },
    { header: 'Notes', cell: (o) => <span className="text-xs text-muted">{o.notes ?? ''}</span> },
    { header: 'Status', cell: (o) => <StatusBadge status={o.status} /> },
    {
      header: 'Actions',
      cell: (o) => (
        <div className="flex gap-1">
          {allowed(o).map((n) =>
            n === 'CANCELLED' ? (
              <Button key={n} size="sm" variant="ghost" className="text-red-600" onClick={() => setCancelling(o)}>
                Cancel
              </Button>
            ) : (
              <Button key={n} size="sm" variant="secondary" busy={action.busy} onClick={() => setOrderStatus(o, n)}>
                Mark {n.toLowerCase()}
              </Button>
            ),
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title={staff ? 'Service Orders' : 'Service Requests'}
        subtitle={
          staff
            ? 'Prepare and deliver guest orders. Delivered orders are added to the guest’s bill.'
            : 'Order food, drinks, amenities and laundry during your stay.'
        }
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" /> New request
          </Button>
        }
      />
      <ActionMessage message={action.message} onClose={() => action.setMessage(null)} />
      <Card>
        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <Field label="Status">
            <Select value={status} onChange={(v) => { setStatus(v); setPage(1); }} options={enumOptions(['PENDING', 'PREPARING', 'DELIVERED', 'CANCELLED'])} placeholder="All statuses" />
          </Field>
          <Field label="Service type">
            <Select
              value={serviceType}
              onChange={(v) => { setServiceType(v); setPage(1); }}
              options={['Food', 'Beverage', 'Amenities', 'Laundry', 'Other'].map((t) => ({ value: t, label: t }))}
              placeholder="All types"
            />
          </Field>
        </div>
        <DataTable columns={columns} rows={list.data?.data} rowKey={(o) => o.orderId} loading={list.loading} error={list.error} empty="No service orders found." />
        {list.data && <Pagination page={page} totalPages={list.data.meta.totalPages} total={list.data.meta.total} onPage={setPage} />}
      </Card>
      {creating && (
        <OrderForm
          staff={staff}
          onClose={() => setCreating(false)}
          onSaved={(o) => {
            setCreating(false);
            action.setMessage({ type: 'success', text: `Order #${o.orderId} placed: ${itemName(o.itemCode)} × ${o.quantity} = ${money(o.totalAmount)}.` });
            void list.reload();
          }}
        />
      )}
      <ConfirmDialog
        open={!!cancelling}
        title="Cancel service order"
        confirmLabel="Cancel order"
        busy={action.busy}
        message={`Cancel order #${cancelling?.orderId}? Cancelled orders are not billed.`}
        onConfirm={() => cancelling && setOrderStatus(cancelling, 'CANCELLED')}
        onCancel={() => setCancelling(null)}
      />
    </>
  );
}

function OrderForm({ staff, onClose, onSaved }: { staff: boolean; onClose: () => void; onSaved: (o: ServiceOrder) => void }) {
  const stays = useApi(() => reservationsApi.list({ reservationStatus: 'CHECKED_IN', limit: 100 }));
  const [reservationId, setReservationId] = useState('');
  const [itemCode, setItemCode] = useState(SERVICE_ITEMS[0].code);
  const [quantity, setQuantity] = useState('1');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const action = useAction();
  const item = SERVICE_ITEMS.find((i) => i.code === itemCode)!;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const qty = Number(quantity);
    if (!reservationId) return setError('Select a checked-in reservation.');
    if (!Number.isInteger(qty) || qty < 1 || qty > 20) return setError('Quantity must be a whole number from 1 to 20.');
    if (notes.length > 255) return setError('Notes may be at most 255 characters.');
    const res = await action.run(() =>
      serviceOrdersApi.create({
        reservationId: Number(reservationId),
        itemCode,
        quantity: qty,
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      }),
    );
    if (res.ok) onSaved(res.value);
  };

  const noStay = stays.data && stays.data.data.length === 0;
  return (
    <Modal title="New service request" open onClose={onClose}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        {error && <Alert type="error">{error}</Alert>}
        {stays.error && <Alert type="error">{stays.error}</Alert>}
        {noStay && <Alert type="info">Service requests can only be placed during a checked-in stay.</Alert>}
        <ActionMessage message={action.message} onClose={() => action.setMessage(null)} />
        <Field label={staff ? 'Checked-in reservation' : 'Your stay'} required>
          <Select
            value={reservationId}
            onChange={setReservationId}
            placeholder={stays.loading ? 'Loading…' : 'Select'}
            options={(stays.data?.data ?? []).map((r) => ({
              value: String(r.reservationId),
              label: `#${r.reservationId} — room ${r.room?.roomNo ?? r.roomId}${staff && r.guest ? ` — ${r.guest.firstName} ${r.guest.lastName}` : ''}`,
            }))}
          />
        </Field>
        <Field label="Item" required>
          <Select
            value={itemCode}
            onChange={setItemCode}
            options={SERVICE_ITEMS.map((i) => ({ value: i.code, label: `${i.name} (${i.type}) — ${i.price ? money(i.price) : 'free'}` }))}
          />
        </Field>
        <Field label="Quantity (1–20)" required>
          <input className={inputClass} type="number" min={1} max={20} value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        </Field>
        <Field label="Notes (optional)">
          <textarea className={inputClass} rows={2} maxLength={255} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
        <p className="text-sm text-slate-600">
          Listed total: <strong>{money(item.price * (Number(quantity) || 0))}</strong>{' '}
          <span className="text-xs text-muted">(final price is set by the server and billed when delivered)</span>
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" busy={action.busy} disabled={!!noStay}>
            Place order
          </Button>
        </div>
      </form>
    </Modal>
  );
}
