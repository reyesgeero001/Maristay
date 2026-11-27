import { useState } from 'react';
import { guestsApi } from '../api/endpoints';
import type { Guest } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import {
  ActionMessage,
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
import { dateTime } from '../lib/format';
import { useAction, useApi } from '../lib/useApi';
import { ReservationTable } from './DashboardPage';

/** GET /guests (Front Desk, Manager); deactivate / reactivate is Manager-only in the API. */
export function GuestsPage() {
  const { user } = useAuth();
  const manager = user?.role === 'MANAGER';
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [accountStatus, setAccountStatus] = useState('');
  const list = useApi(() => guestsApi.list({ page, limit: 20, search: search.trim(), accountStatus }), [page, search, accountStatus]);
  const action = useAction();
  const [viewing, setViewing] = useState<Guest | null>(null);
  const [deactivating, setDeactivating] = useState<Guest | null>(null);

  const deactivate = async () => {
    if (!deactivating) return;
    const res = await action.run(() => guestsApi.deactivate(deactivating.guestId), `${deactivating.firstName} ${deactivating.lastName} was deactivated.`);
    setDeactivating(null);
    if (res.ok) void list.reload();
  };
  const reactivate = async (g: Guest) => {
    const res = await action.run(() => guestsApi.setStatus(g.guestId, 'ACTIVE'), `${g.firstName} ${g.lastName} was reactivated.`);
    if (res.ok) void list.reload();
  };

  const columns: Column<Guest>[] = [
    { header: 'ID', cell: (g) => `#${g.guestId}` },
    { header: 'Name', cell: (g) => <span className="font-medium text-navy-800">{g.firstName} {g.lastName}</span> },
    { header: 'Email', cell: (g) => g.email },
    { header: 'Phone', cell: (g) => g.phoneNumber },
    { header: 'Status', cell: (g) => <StatusBadge status={g.accountStatus} /> },
    { header: 'Registered', cell: (g) => dateTime(g.createdAt) },
    {
      header: 'Actions',
      cell: (g) => (
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={() => setViewing(g)}>Reservations</Button>
          {manager && g.accountStatus === 'ACTIVE' && (
            <Button size="sm" variant="ghost" className="text-red-600" onClick={() => setDeactivating(g)}>Deactivate</Button>
          )}
          {manager && g.accountStatus === 'INACTIVE' && (
            <Button size="sm" variant="ghost" busy={action.busy} onClick={() => reactivate(g)}>Reactivate</Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Guests" subtitle="Registered guest records." />
      <ActionMessage message={action.message} onClose={() => action.setMessage(null)} />
      <Card>
        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <Field label="Search name or email">
            <input className={inputClass} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </Field>
          <Field label="Account status">
            <Select value={accountStatus} onChange={(v) => { setAccountStatus(v); setPage(1); }} options={enumOptions(['ACTIVE', 'INACTIVE'])} placeholder="All" />
          </Field>
        </div>
        <DataTable columns={columns} rows={list.data?.data} rowKey={(g) => g.guestId} loading={list.loading} error={list.error} empty="No guests found." />
        {list.data && <Pagination page={page} totalPages={list.data.meta.totalPages} total={list.data.meta.total} onPage={setPage} />}
      </Card>
      {viewing && <GuestReservations guest={viewing} onClose={() => setViewing(null)} />}
      <ConfirmDialog
        open={!!deactivating}
        title="Deactivate guest"
        confirmLabel="Deactivate"
        busy={action.busy}
        message={`Deactivate ${deactivating?.firstName} ${deactivating?.lastName}? They will no longer be able to log in. Guests with active reservations cannot be deactivated.`}
        onConfirm={deactivate}
        onCancel={() => setDeactivating(null)}
      />
    </>
  );
}

function GuestReservations({ guest, onClose }: { guest: Guest; onClose: () => void }) {
  const res = useApi(() => guestsApi.reservations(guest.guestId, { limit: 50 }), [guest.guestId]);
  return (
    <Modal title={`Reservations — ${guest.firstName} ${guest.lastName}`} open onClose={onClose}>
      <ReservationTable rows={res.data?.data} loading={res.loading} error={res.error} />
    </Modal>
  );
}
