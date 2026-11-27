import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { roomsApi, type RoomInput } from '../api/endpoints';
import { MANUAL_ROOM_STATUSES, ROOM_STATUSES, ROOM_TYPES, type Room, type RoomStatus, type RoomType } from '../api/types';
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
import { money } from '../lib/format';
import { useAction, useApi } from '../lib/useApi';

/** Manager: room Create / Read / Update / Delete (POST, GET, PATCH, DELETE /rooms). */
export function RoomsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [search, setSearch] = useState('');
  const rooms = useApi(() => roomsApi.list({ page, limit: 100, roomStatus: status, roomType: type }), [page, status, type]);
  const action = useAction();
  const [editing, setEditing] = useState<Room | 'new' | null>(null);
  const [deleting, setDeleting] = useState<Room | null>(null);

  // The API has no room-number search parameter, so the loaded page is filtered in the browser.
  const term = search.trim().toUpperCase();
  const rows = rooms.data?.data.filter((r) => !term || r.roomNo.includes(term));

  const remove = async () => {
    if (!deleting) return;
    const res = await action.run(() => roomsApi.remove(deleting.roomId), `Room ${deleting.roomNo} deleted.`);
    setDeleting(null);
    if (res.ok) void rooms.reload();
  };

  const columns: Column<Room>[] = [
    { header: 'Room No.', cell: (r) => <span className="font-medium text-navy-800">{r.roomNo}</span> },
    { header: 'Type', cell: (r) => r.roomType },
    { header: 'Price / night', cell: (r) => money(r.pricePerNight) },
    { header: 'Status', cell: (r) => <StatusBadge status={r.roomStatus} /> },
    {
      header: 'Actions',
      cell: (r) => (
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={() => setEditing(r)} aria-label={`Edit room ${r.roomNo}`}>
            <Pencil className="h-3.5 w-3.5" /> Edit
          </Button>
          <Button size="sm" variant="ghost" className="text-red-600" onClick={() => setDeleting(r)} aria-label={`Delete room ${r.roomNo}`}>
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Rooms"
        subtitle="Create, update and remove hotel rooms."
        actions={
          <Button onClick={() => setEditing('new')}>
            <Plus className="h-4 w-4" /> Add room
          </Button>
        }
      />
      <ActionMessage message={action.message} onClose={() => action.setMessage(null)} />
      <Card>
        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <Field label="Search room number">
            <input className={inputClass} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="e.g. 101" />
          </Field>
          <Field label="Status">
            <Select value={status} onChange={(v) => { setStatus(v); setPage(1); }} options={enumOptions(ROOM_STATUSES)} placeholder="All statuses" />
          </Field>
          <Field label="Type">
            <Select value={type} onChange={(v) => { setType(v); setPage(1); }} options={ROOM_TYPES.map((t) => ({ value: t, label: t }))} placeholder="All types" />
          </Field>
        </div>
        <DataTable columns={columns} rows={rows} rowKey={(r) => r.roomId} loading={rooms.loading} error={rooms.error} empty="No rooms match the filters." />
        {rooms.data && <Pagination page={page} totalPages={rooms.data.meta.totalPages} total={rooms.data.meta.total} onPage={setPage} />}
      </Card>

      {editing && (
        <RoomForm
          room={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={(msg) => {
            setEditing(null);
            action.setMessage({ type: 'success', text: msg });
            void rooms.reload();
          }}
        />
      )}
      <ConfirmDialog
        open={!!deleting}
        title="Delete room"
        message={
          <>
            Delete room <strong>{deleting?.roomNo}</strong>? Rooms that already have reservations or housekeeping history
            cannot be deleted (the API returns 409); set them to Maintenance instead.
          </>
        }
        confirmLabel="Delete"
        busy={action.busy}
        onConfirm={remove}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}

function RoomForm({ room, onClose, onSaved }: { room: Room | null; onClose: () => void; onSaved: (msg: string) => void }) {
  const [roomNo, setRoomNo] = useState(room?.roomNo ?? '');
  const [roomType, setRoomType] = useState<string>(room?.roomType ?? 'Standard');
  const [price, setPrice] = useState(room ? String(room.pricePerNight) : '');
  const [status, setStatus] = useState<string>(room?.roomStatus ?? 'AVAILABLE');
  const [error, setError] = useState<string | null>(null);
  const action = useAction();
  const occupied = room?.roomStatus === 'OCCUPIED';

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const no = roomNo.trim().toUpperCase();
    const amount = Number(price);
    if (!/^[A-Z0-9-]{1,10}$/.test(no)) return setError('Room number must be 1–10 letters, digits or dashes.');
    if (!price || !Number.isFinite(amount) || amount < 0 || amount > 1_000_000) return setError('Enter a price between 0 and 1,000,000.');
    if (!/^\d+(\.\d{1,2})?$/.test(price.trim())) return setError('Price may have at most 2 decimal places.');
    const body: RoomInput = { roomNo: no, roomType: roomType as RoomType, pricePerNight: amount };
    // OCCUPIED rooms keep their status (it changes only at check-out).
    if (!occupied) body.roomStatus = status as RoomStatus;
    const res = room
      ? await action.run(() => roomsApi.update(room.roomId, body))
      : await action.run(() => roomsApi.create(body));
    if (res.ok) onSaved(room ? `Room ${no} updated.` : `Room ${no} created.`);
  };

  return (
    <Modal title={room ? `Edit room ${room.roomNo}` : 'Add room'} open onClose={onClose}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        {error && <Alert type="error">{error}</Alert>}
        <ActionMessage message={action.message} onClose={() => action.setMessage(null)} />
        <Field label="Room number" required>
          <input className={inputClass} value={roomNo} onChange={(e) => setRoomNo(e.target.value)} required maxLength={10} />
        </Field>
        <Field label="Room type" required>
          <Select value={roomType} onChange={setRoomType} options={ROOM_TYPES.map((t) => ({ value: t, label: t }))} />
        </Field>
        <Field label="Price per night (PHP)" required>
          <input className={inputClass} type="number" min={0} step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required />
        </Field>
        <Field label="Status" hint={occupied ? 'Occupied rooms change status automatically at check-out.' : 'Occupied is set automatically at check-in.'}>
          {occupied ? (
            <input className={inputClass} value="Occupied" disabled />
          ) : (
            <Select value={status} onChange={setStatus} options={enumOptions(MANUAL_ROOM_STATUSES)} />
          )}
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" busy={action.busy}>
            {room ? 'Save changes' : 'Create room'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
