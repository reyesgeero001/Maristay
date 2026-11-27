import { CheckCircle2, Play, Plus } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { housekeepingApi, roomsApi, staffApi } from '../api/endpoints';
import type { Housekeeping } from '../api/types';
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
  type Column,
} from '../components/ui';
import { dateTime } from '../lib/format';
import { useAction, useApi } from '../lib/useApi';

/**
 * Housekeepers: their own tasks (the API filters by the JWT), PENDING → IN_PROGRESS → COMPLETED.
 * Completing the last open task of a CLEANING room makes it AVAILABLE again (server-side rule).
 * Manager: all tasks, assign (POST) and reassign (PATCH staffId).
 */
export function HousekeepingPage() {
  const { user } = useAuth();
  const manager = user?.role === 'MANAGER';
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const list = useApi(() => housekeepingApi.list({ page, limit: 20, status }), [page, status]);
  const housekeepers = useApi(
    () => (manager ? staffApi.list({ role: 'HOUSEKEEPING', accountStatus: 'ACTIVE', limit: 100 }) : Promise.resolve(null)),
    [manager],
  );
  const action = useAction();
  const [assigning, setAssigning] = useState(false);
  const [completing, setCompleting] = useState<Housekeeping | null>(null);

  const advance = async (t: Housekeeping, next: 'IN_PROGRESS' | 'COMPLETED') => {
    const res = await action.run(
      () => housekeepingApi.update(t.hkId, { status: next }),
      (x) =>
        next === 'COMPLETED'
          ? `Task #${x.hkId} completed. Room ${x.room?.roomNo} is now ${x.room?.roomStatus?.toLowerCase()}.`
          : `Task #${x.hkId} started.`,
    );
    setCompleting(null);
    if (res.ok) void list.reload();
  };
  const reassign = async (t: Housekeeping, staffId: string) => {
    if (!staffId || Number(staffId) === t.staffId) return;
    const res = await action.run(() => housekeepingApi.update(t.hkId, { staffId: Number(staffId) }), (x) => `Task #${x.hkId} reassigned to ${x.staff?.firstName} ${x.staff?.lastName}.`);
    if (res.ok) void list.reload();
  };

  const columns: Column<Housekeeping>[] = [
    { header: 'Task', cell: (t) => `#${t.hkId}` },
    { header: 'Room', cell: (t) => <span className="font-medium text-navy-800">{t.room?.roomNo ?? `#${t.roomId}`}</span> },
    { header: 'Room status', cell: (t) => (t.room ? <StatusBadge status={t.room.roomStatus} /> : '—') },
    ...(manager
      ? [{
          header: 'Assigned to',
          cell: (t: Housekeeping) =>
            t.status === 'COMPLETED' ? (
              `${t.staff?.firstName ?? ''} ${t.staff?.lastName ?? ''}`
            ) : (
              <Select
                aria-label={`Reassign task ${t.hkId}`}
                value={String(t.staffId)}
                onChange={(v) => reassign(t, v)}
                options={(housekeepers.data?.data ?? [])
                  .map((s) => ({ value: String(s.staffId), label: `${s.firstName} ${s.lastName}` }))
                  .concat(
                    housekeepers.data?.data.some((s) => s.staffId === t.staffId)
                      ? []
                      : [{ value: String(t.staffId), label: `${t.staff?.firstName ?? ''} ${t.staff?.lastName ?? ''}` }],
                  )}
              />
            ),
        }]
      : []),
    { header: 'Status', cell: (t) => <StatusBadge status={t.status} /> },
    { header: 'Last update', cell: (t) => dateTime(t.lastUpdate) },
    {
      header: 'Actions',
      cell: (t) =>
        t.status === 'PENDING' ? (
          <Button size="sm" variant="secondary" busy={action.busy} onClick={() => advance(t, 'IN_PROGRESS')}><Play className="h-3.5 w-3.5" /> Start cleaning</Button>
        ) : t.status === 'IN_PROGRESS' ? (
          <Button size="sm" onClick={() => setCompleting(t)}><CheckCircle2 className="h-3.5 w-3.5" /> Mark completed</Button>
        ) : null,
    },
  ];

  return (
    <>
      <PageHeader
        title={manager ? 'Housekeeping' : 'My Tasks'}
        subtitle={manager ? 'Cleaning tasks are created automatically at check-out; you can also assign them manually.' : 'Start a task when you begin cleaning and complete it when the room is ready.'}
        actions={manager ? <Button onClick={() => setAssigning(true)}><Plus className="h-4 w-4" /> Assign task</Button> : undefined}
      />
      <ActionMessage message={action.message} onClose={() => action.setMessage(null)} />
      <Card>
        <div className="mb-4 max-w-xs">
          <Field label="Status">
            <Select value={status} onChange={(v) => { setStatus(v); setPage(1); }} options={enumOptions(['PENDING', 'IN_PROGRESS', 'COMPLETED'])} placeholder="All statuses" />
          </Field>
        </div>
        <DataTable columns={columns} rows={list.data?.data} rowKey={(t) => t.hkId} loading={list.loading} error={list.error} empty="No housekeeping tasks." />
        {list.data && <Pagination page={page} totalPages={list.data.meta.totalPages} total={list.data.meta.total} onPage={setPage} />}
      </Card>
      {assigning && (
        <AssignForm
          housekeepers={(housekeepers.data?.data ?? []).map((s) => ({ value: String(s.staffId), label: `${s.firstName} ${s.lastName}` }))}
          onClose={() => setAssigning(false)}
          onSaved={(t) => {
            setAssigning(false);
            action.setMessage({ type: 'success', text: `Task #${t.hkId} assigned for room ${t.room?.roomNo}.` });
            void list.reload();
          }}
        />
      )}
      <ConfirmDialog
        open={!!completing}
        title="Complete cleaning task"
        danger={false}
        confirmLabel="Mark completed"
        busy={action.busy}
        message={`Mark room ${completing?.room?.roomNo} as cleaned? If no other task is open, the room becomes available for check-in.`}
        onConfirm={() => completing && advance(completing, 'COMPLETED')}
        onCancel={() => setCompleting(null)}
      />
    </>
  );
}

function AssignForm({ housekeepers, onClose, onSaved }: { housekeepers: { value: string; label: string }[]; onClose: () => void; onSaved: (t: Housekeeping) => void }) {
  const rooms = useApi(() => roomsApi.list({ limit: 100 }));
  const [roomId, setRoomId] = useState('');
  const [staffId, setStaffId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const action = useAction();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!roomId || !staffId) return setError('Select a room and a housekeeper.');
    const res = await action.run(() => housekeepingApi.create(Number(roomId), Number(staffId)));
    if (res.ok) onSaved(res.value);
  };

  return (
    <Modal title="Assign cleaning task" open onClose={onClose}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        {error && <Alert type="error">{error}</Alert>}
        {rooms.error && <Alert type="error">{rooms.error}</Alert>}
        <ActionMessage message={action.message} onClose={() => action.setMessage(null)} />
        <Field label="Room" required hint="Occupied rooms are cleaned automatically after check-out.">
          <Select
            value={roomId}
            onChange={setRoomId}
            placeholder="Select room"
            options={(rooms.data?.data ?? []).filter((r) => r.roomStatus !== 'OCCUPIED').map((r) => ({ value: String(r.roomId), label: `Room ${r.roomNo} (${r.roomStatus.toLowerCase()})` }))}
          />
        </Field>
        <Field label="Housekeeper" required>
          <Select value={staffId} onChange={setStaffId} placeholder="Select housekeeper" options={housekeepers} />
        </Field>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" busy={action.busy}>Assign</Button>
        </div>
      </form>
    </Modal>
  );
}
