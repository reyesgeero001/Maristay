import { Pencil, Plus } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { staffApi } from '../api/endpoints';
import { STAFF_ROLES, type Staff, type StaffRole } from '../api/types';
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
import { ROLE_LABEL } from '../lib/format';
import { useAction, useApi } from '../lib/useApi';

const NAME = /^[\p{L}][\p{L} .'-]*$/u;
const PASSWORD = /^(?=.*[A-Za-z])(?=.*\d).{8,72}$/;

/** Manager-only staff management: POST / GET / PATCH / DELETE /staff. */
export function StaffPage() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [role, setRole] = useState('');
  const [accountStatus, setAccountStatus] = useState('');
  const [search, setSearch] = useState('');
  const list = useApi(() => staffApi.list({ page, limit: 20, role, accountStatus, search: search.trim() }), [page, role, accountStatus, search]);
  const action = useAction();
  const [editing, setEditing] = useState<Staff | 'new' | null>(null);
  const [deactivating, setDeactivating] = useState<Staff | null>(null);

  const deactivate = async () => {
    if (!deactivating) return;
    const res = await action.run(() => staffApi.deactivate(deactivating.staffId), `${deactivating.firstName} ${deactivating.lastName} was deactivated.`);
    setDeactivating(null);
    if (res.ok) void list.reload();
  };

  const columns: Column<Staff>[] = [
    { header: 'ID', cell: (s) => `#${s.staffId}` },
    { header: 'Name', cell: (s) => <span className="font-medium text-navy-800">{s.firstName} {s.lastName}</span> },
    { header: 'Email', cell: (s) => s.email },
    { header: 'Role', cell: (s) => ROLE_LABEL[s.role] },
    { header: 'Status', cell: (s) => <StatusBadge status={s.accountStatus} /> },
    {
      header: 'Actions',
      cell: (s) => (
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={() => setEditing(s)}><Pencil className="h-3.5 w-3.5" /> Edit</Button>
          {s.accountStatus === 'ACTIVE' && s.staffId !== user?.id && (
            <Button size="sm" variant="ghost" className="text-red-600" onClick={() => setDeactivating(s)}>Deactivate</Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Staff" subtitle="Hotel employee accounts and roles." actions={<Button onClick={() => setEditing('new')}><Plus className="h-4 w-4" /> Add staff</Button>} />
      <ActionMessage message={action.message} onClose={() => action.setMessage(null)} />
      <Card>
        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <Field label="Search name or email">
            <input className={inputClass} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </Field>
          <Field label="Role">
            <Select value={role} onChange={(v) => { setRole(v); setPage(1); }} options={STAFF_ROLES.map((r) => ({ value: r, label: ROLE_LABEL[r] }))} placeholder="All roles" />
          </Field>
          <Field label="Account status">
            <Select value={accountStatus} onChange={(v) => { setAccountStatus(v); setPage(1); }} options={enumOptions(['ACTIVE', 'INACTIVE'])} placeholder="All" />
          </Field>
        </div>
        <DataTable columns={columns} rows={list.data?.data} rowKey={(s) => s.staffId} loading={list.loading} error={list.error} empty="No staff found." />
        {list.data && <Pagination page={page} totalPages={list.data.meta.totalPages} total={list.data.meta.total} onPage={setPage} />}
      </Card>
      {editing && (
        <StaffForm
          staff={editing === 'new' ? null : editing}
          self={editing !== 'new' && editing.staffId === user?.id}
          onClose={() => setEditing(null)}
          onSaved={(msg) => {
            setEditing(null);
            action.setMessage({ type: 'success', text: msg });
            void list.reload();
          }}
        />
      )}
      <ConfirmDialog
        open={!!deactivating}
        title="Deactivate staff member"
        confirmLabel="Deactivate"
        busy={action.busy}
        message={`Deactivate ${deactivating?.firstName} ${deactivating?.lastName}? They will no longer be able to log in. Housekeepers with open tasks must have them reassigned first.`}
        onConfirm={deactivate}
        onCancel={() => setDeactivating(null)}
      />
    </>
  );
}

function StaffForm({ staff, self, onClose, onSaved }: { staff: Staff | null; self: boolean; onClose: () => void; onSaved: (msg: string) => void }) {
  const [firstName, setFirstName] = useState(staff?.firstName ?? '');
  const [lastName, setLastName] = useState(staff?.lastName ?? '');
  const [email, setEmail] = useState(staff?.email ?? '');
  const [role, setRole] = useState<string>(staff?.role ?? 'FRONT_DESK');
  const [accountStatus, setAccountStatus] = useState<string>(staff?.accountStatus ?? 'ACTIVE');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const action = useAction();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!NAME.test(firstName.trim()) || !NAME.test(lastName.trim())) return setError('Names may only contain letters, spaces, periods, apostrophes and hyphens.');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Enter a valid email address.');
    if ((!staff || password) && !PASSWORD.test(password)) return setError('Password must be 8–72 characters with at least one letter and one number.');
    const base = { firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim(), role: role as StaffRole };
    const res = staff
      ? await action.run(() =>
          staffApi.update(staff.staffId, {
            ...base,
            ...(self ? {} : { accountStatus: accountStatus as Staff['accountStatus'] }),
            ...(password ? { newPassword: password } : {}),
          }),
        )
      : await action.run(() => staffApi.create({ ...base, password }));
    if (res.ok) onSaved(staff ? `${base.firstName} ${base.lastName} updated.` : `${base.firstName} ${base.lastName} added.`);
  };

  return (
    <Modal title={staff ? `Edit ${staff.firstName} ${staff.lastName}` : 'Add staff member'} open onClose={onClose}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        {error && <Alert type="error">{error}</Alert>}
        <ActionMessage message={action.message} onClose={() => action.setMessage(null)} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First name" required><input className={inputClass} value={firstName} maxLength={50} onChange={(e) => setFirstName(e.target.value)} /></Field>
          <Field label="Last name" required><input className={inputClass} value={lastName} maxLength={50} onChange={(e) => setLastName(e.target.value)} /></Field>
        </div>
        <Field label="Email" required><input className={inputClass} type="email" value={email} maxLength={100} onChange={(e) => setEmail(e.target.value)} /></Field>
        <Field label="Role" required hint={self ? 'You cannot remove your own manager role.' : undefined}>
          <Select value={role} onChange={setRole} options={STAFF_ROLES.map((r) => ({ value: r, label: ROLE_LABEL[r] }))} />
        </Field>
        {staff && !self && (
          <Field label="Account status">
            <Select value={accountStatus} onChange={setAccountStatus} options={enumOptions(['ACTIVE', 'INACTIVE'])} />
          </Field>
        )}
        <Field label={staff ? 'Reset password (optional)' : 'Initial password'} required={!staff} hint="8–72 characters with at least one letter and one number.">
          <input className={inputClass} type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" busy={action.busy}>{staff ? 'Save changes' : 'Add staff'}</Button>
        </div>
      </form>
    </Modal>
  );
}
