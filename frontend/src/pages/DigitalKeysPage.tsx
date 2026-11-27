import { Copy, DoorOpen, KeyRound, RefreshCw, Wifi } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { digitalKeysApi, reservationsApi, roomsApi } from '../api/endpoints';
import type { DigitalKey } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import {
  ActionMessage,
  Alert,
  Button,
  Card,
  ConfirmDialog,
  DataTable,
  Field,
  PageHeader,
  Pagination,
  Select,
  SimulatedTag,
  SimulationNote,
  StatusBadge,
  enumOptions,
  inputClass,
  type Column,
} from '../components/ui';
import { dateTime } from '../lib/format';
import { keyWallet } from '../lib/keyWallet';
import { useAction, useApi } from '../lib/useApi';

/**
 * The one-time key code, shown as an electronic keycard. The code itself is
 * never stored outside this tab's memory (see keyWallet).
 */
export function KeyCodeBox({ code, room, expiresAt }: { code: string; room?: string; expiresAt?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative overflow-hidden rounded-xl bg-navy-800 p-4 text-white shadow-(--shadow-raised) sm:p-5">
      <div className="pointer-events-none absolute inset-2 rounded-lg border border-gold-500/25" aria-hidden="true" />
      <div className="relative mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-gold-500" aria-hidden="true" />
          <span className="font-serif text-lg tracking-wide">MariStay</span>
          <span className="text-xs text-navy-200">Digital room key</span>
        </div>
        <Wifi className="h-5 w-5 rotate-90 text-gold-500/70" aria-hidden="true" />
      </div>
      {(room || expiresAt) && (
        <p className="relative mb-2 text-xs text-navy-200">
          {room && <>Room <strong className="text-sm text-white">{room}</strong></>}
          {room && expiresAt && ' · '}
          {expiresAt && <>valid until {dateTime(expiresAt)}</>}
        </p>
      )}
      <div className="relative flex items-center gap-2 rounded-lg bg-white/10 p-2">
        <code className="flex-1 break-all font-mono text-xs text-gold-100" data-testid="key-code">{code}</code>
        <button
          type="button"
          className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-gold-500/50 px-2.5 py-1 text-xs font-medium text-gold-100 hover:bg-white/10"
          onClick={() => navigator.clipboard?.writeText(code).then(() => setCopied(true), () => undefined)}
        >
          <Copy className="h-3.5 w-3.5" /> {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
    </div>
  );
}

/** Keycard summary of a stored key (metadata only — the API never returns key codes or hashes here). */
function KeyCard({ k, room }: { k: DigitalKey; room?: string }) {
  return (
    <div className="relative overflow-hidden rounded-xl bg-navy-800 p-4 text-white shadow-(--shadow-card)">
      <div className="pointer-events-none absolute inset-1.5 rounded-lg border border-gold-500/20" aria-hidden="true" />
      <div className="relative flex items-start justify-between gap-2">
        <KeyRound className="h-5 w-5 text-gold-500" aria-hidden="true" />
        <StatusBadge status={k.status} />
      </div>
      <p className="relative mt-3 font-serif text-xl">{room ? `Room ${room}` : `Reservation #${k.reservationId}`}</p>
      <p className="relative text-xs text-navy-200">
        Key #{k.keyId} · reservation #{k.reservationId}
      </p>
      <p className="relative mt-2 text-xs text-navy-200">Valid until {dateTime(k.expiresAt)}</p>
    </div>
  );
}

/**
 * GET /digital-keys, POST /digital-keys (re-issue), POST /digital-keys/validate
 * (simulated smart lock) and PATCH /digital-keys/:id/revoke (staff).
 */
export function DigitalKeysPage() {
  const { user } = useAuth();
  const staff = user?.role !== 'GUEST';
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const keys = useApi(() => digitalKeysApi.list({ page, limit: 20, status }), [page, status]);
  const stays = useApi(() => reservationsApi.list({ reservationStatus: 'CHECKED_IN', limit: 100 }));
  const rooms = useApi(() => roomsApi.list({ limit: 100 }));
  const action = useAction();
  const [walletVersion, setWalletVersion] = useState(0);
  const [revoking, setRevoking] = useState<DigitalKey | null>(null);

  // Lock test form
  const [keyCode, setKeyCode] = useState(keyWallet.all()[0]?.keyCode ?? '');
  const [roomId, setRoomId] = useState('');
  const [lockError, setLockError] = useState<string | null>(null);
  const lock = useAction();

  // Re-issue form
  const [reissueId, setReissueId] = useState('');

  const validate = async (e: FormEvent) => {
    e.preventDefault();
    setLockError(null);
    if (!/^MSK-[A-Za-z0-9_-]{20,100}$/.test(keyCode.trim())) return setLockError('Key codes start with “MSK-” followed by at least 20 characters.');
    if (!roomId) return setLockError('Select the room door to open.');
    await lock.run(() => digitalKeysApi.validate(keyCode.trim(), Number(roomId)), (d) => `${d.message} — room ${d.roomNo}.`);
  };

  const reissue = async () => {
    if (!reissueId) return;
    const res = await action.run(
      () => digitalKeysApi.issue(Number(reissueId)),
      (k) => `New key #${k.keyId} issued for reservation #${k.reservationId}. Any previous active key was revoked.`,
    );
    if (res.ok) {
      keyWallet.save(res.value);
      setKeyCode(res.value.keyCode);
      setWalletVersion((v) => v + 1);
      void keys.reload();
    }
  };

  const revoke = async () => {
    if (!revoking) return;
    const res = await action.run(() => digitalKeysApi.revoke(revoking.keyId), `Key #${revoking.keyId} revoked.`);
    setRevoking(null);
    if (res.ok) void keys.reload();
  };

  const wallet = keyWallet.all();
  // Room numbers come from the checked-in stays already loaded for the re-issue form.
  const roomOf = (reservationId: number) => stays.data?.data.find((r) => r.reservationId === reservationId)?.room?.roomNo;
  const activeKeys = (keys.data?.data ?? []).filter((k) => k.status === 'ACTIVE').slice(0, 3);
  void walletVersion; // re-render trigger after the in-memory wallet changes

  const columns: Column<DigitalKey>[] = [
    { header: 'Key', cell: (k) => `#${k.keyId}` },
    { header: 'Reservation', cell: (k) => <Link className="font-medium text-navy-800 hover:text-gold-700 hover:underline" to={`/reservations/${k.reservationId}`}>#{k.reservationId}</Link> },
    { header: 'Issued', cell: (k) => dateTime(k.issuedAt) },
    { header: 'Expires', cell: (k) => dateTime(k.expiresAt) },
    { header: 'Status', cell: (k) => <StatusBadge status={k.status} /> },
    ...(staff
      ? [{
          header: '',
          cell: (k: DigitalKey) =>
            k.status === 'ACTIVE' ? (
              <Button size="sm" variant="ghost" className="text-red-600" onClick={() => setRevoking(k)}>Revoke</Button>
            ) : null,
        }]
      : []),
  ];

  return (
    <>
      <PageHeader title={staff ? 'Digital Keys' : 'My Digital Keys'} subtitle="Keyless room access for checked-in reservations." />
      <SimulationNote>
        MariStay does not control real door locks. “Open door” sends the key to the API’s simulated smart-lock check and shows whether access would be granted.
      </SimulationNote>
      <ActionMessage message={action.message} onClose={() => action.setMessage(null)} />

      {activeKeys.length > 0 && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Active keys">
          {activeKeys.map((k) => <KeyCard key={k.keyId} k={k} room={roomOf(k.reservationId)} />)}
        </div>
      )}

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card title="Open a room door (simulated)" actions={<SimulatedTag>Simulated Smart Lock</SimulatedTag>}>
          <form onSubmit={validate} className="space-y-4" noValidate>
            {lockError && <Alert type="error">{lockError}</Alert>}
            <ActionMessage message={lock.message} onClose={() => lock.setMessage(null)} />
            {wallet.length > 0 && (
              <Field label="Keys issued in this browser tab">
                <Select
                  value={wallet.some((k) => k.keyCode === keyCode) ? keyCode : ''}
                  onChange={setKeyCode}
                  placeholder="Choose a key"
                  options={wallet.map((k) => ({ value: k.keyCode, label: `Key #${k.keyId} — reservation #${k.reservationId}` }))}
                />
              </Field>
            )}
            <Field label="Key code" hint="Shown once at check-in or re-issue. Lost it? Re-issue a key below.">
              <input className={inputClass} value={keyCode} onChange={(e) => setKeyCode(e.target.value)} placeholder="MSK-…" autoComplete="off" />
            </Field>
            <Field label="Room door">
              <Select
                value={roomId}
                onChange={setRoomId}
                placeholder="Select room"
                options={(rooms.data?.data ?? []).map((r) => ({ value: String(r.roomId), label: `Room ${r.roomNo}` }))}
              />
            </Field>
            <Button type="submit" busy={lock.busy} className="w-full sm:w-auto"><DoorOpen className="h-4 w-4" /> Open door</Button>
          </form>
        </Card>
        <Card title="Re-issue a digital key">
          <p className="mb-4 text-sm text-slate-600">
            Issues a new key for a checked-in stay (for example after changing phones). The previous active key is revoked automatically.
          </p>
          {stays.error && <Alert type="error">{stays.error}</Alert>}
          <div className="space-y-4">
            <Field label="Checked-in reservation">
              <Select
                value={reissueId}
                onChange={setReissueId}
                placeholder={stays.loading ? 'Loading…' : (stays.data?.data.length ?? 0) === 0 ? 'No checked-in reservations' : 'Select reservation'}
                options={(stays.data?.data ?? []).map((r) => ({
                  value: String(r.reservationId),
                  label: `#${r.reservationId} — room ${r.room?.roomNo ?? r.roomId}${staff && r.guest ? ` — ${r.guest.firstName} ${r.guest.lastName}` : ''}`,
                }))}
              />
            </Field>
            <Button onClick={reissue} busy={action.busy} disabled={!reissueId}><RefreshCw className="h-4 w-4" /> Issue new key</Button>
            {wallet[0] && wallet[0].reservationId === Number(reissueId) && (
              <div>
                <p className="mb-1 flex items-center gap-1 text-xs font-medium text-slate-600"><KeyRound className="h-3.5 w-3.5" /> Latest key code (shown once)</p>
                <KeyCodeBox code={wallet[0].keyCode} />
              </div>
            )}
          </div>
        </Card>
      </div>

      <Card title="Key history">
        <div className="mb-4 max-w-xs">
          <Field label="Status">
            <Select value={status} onChange={(v) => { setStatus(v); setPage(1); }} options={enumOptions(['ACTIVE', 'EXPIRED', 'REVOKED'])} placeholder="All statuses" />
          </Field>
        </div>
        <DataTable columns={columns} rows={keys.data?.data} rowKey={(k) => k.keyId} loading={keys.loading} error={keys.error} empty="No digital keys yet. A key is issued at check-in." />
        {keys.data && <Pagination page={page} totalPages={keys.data.meta.totalPages} total={keys.data.meta.total} onPage={setPage} />}
      </Card>

      <ConfirmDialog
        open={!!revoking}
        title="Revoke digital key"
        confirmLabel="Revoke key"
        busy={action.busy}
        message={`Revoke key #${revoking?.keyId}? The guest will no longer be able to open the room with it.`}
        onConfirm={revoke}
        onCancel={() => setRevoking(null)}
      />
    </>
  );
}
