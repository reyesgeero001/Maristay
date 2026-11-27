import {
  BedDouble,
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  ConciergeBell,
  DoorOpen,
  Sparkles,
  Wrench,
} from 'lucide-react';
import { Link } from 'react-router';
import { housekeepingApi, reservationsApi, roomsApi, serviceOrdersApi } from '../api/endpoints';
import type { Reservation } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { Alert, Card, Column, DataTable, PageHeader, Spinner, StatCard, StatusBadge, linkButtonClass } from '../components/ui';
import { money } from '../lib/format';
import { useApi } from '../lib/useApi';

/** Count of records matching a filter = meta.total of a 1-row page. */
const count = (p: Promise<{ meta: { total: number } }>) => p.then((r) => r.meta.total);

export function DashboardPage() {
  const { user } = useAuth();
  if (!user) return null;
  const greeting = `Welcome, ${user.firstName}`;
  switch (user.role) {
    case 'MANAGER':
    case 'FRONT_DESK':
      return <StaffDashboard greeting={greeting} manager={user.role === 'MANAGER'} />;
    case 'GUEST':
      return <GuestDashboard greeting={greeting} />;
    case 'HOUSEKEEPING':
      return <HousekeepingDashboard greeting={greeting} />;
  }
}

function StaffDashboard({ greeting, manager }: { greeting: string; manager: boolean }) {
  const stats = useApi(async () => {
    const one = { limit: 1 };
    const [rooms, available, occupied, cleaning, maintenance, pending, confirmed, checkedIn, openOrders, hkPending, hkProgress] =
      await Promise.all([
        count(roomsApi.list(one)),
        count(roomsApi.list({ ...one, roomStatus: 'AVAILABLE' })),
        count(roomsApi.list({ ...one, roomStatus: 'OCCUPIED' })),
        count(roomsApi.list({ ...one, roomStatus: 'CLEANING' })),
        count(roomsApi.list({ ...one, roomStatus: 'MAINTENANCE' })),
        count(reservationsApi.list({ ...one, reservationStatus: 'PENDING' })),
        count(reservationsApi.list({ ...one, reservationStatus: 'CONFIRMED' })),
        count(reservationsApi.list({ ...one, reservationStatus: 'CHECKED_IN' })),
        count(serviceOrdersApi.list({ ...one, status: 'PENDING' })),
        manager ? count(housekeepingApi.list({ ...one, status: 'PENDING' })) : Promise.resolve(0),
        manager ? count(housekeepingApi.list({ ...one, status: 'IN_PROGRESS' })) : Promise.resolve(0),
      ]);
    return { rooms, available, occupied, cleaning, maintenance, pending, confirmed, checkedIn, openOrders, openHk: hkPending + hkProgress };
  });
  const recent = useApi(() => reservationsApi.list({ limit: 5 }));
  const s = stats.data;

  return (
    <>
      <PageHeader title={greeting} subtitle={manager ? 'Manager overview — live data from the MariStay API' : 'Front desk overview — live data from the MariStay API'} />
      {stats.error && <Alert type="error">{stats.error}</Alert>}
      {stats.loading && !s ? (
        <Spinner />
      ) : s ? (
        <>
          <SectionLabel>Rooms ({s.rooms} total)</SectionLabel>
          <RoomStatusBar total={s.rooms} parts={[
            { label: 'Available', value: s.available, className: 'bg-green-600' },
            { label: 'Occupied', value: s.occupied, className: 'bg-navy-800' },
            { label: 'Cleaning', value: s.cleaning, className: 'bg-amber-500' },
            { label: 'Maintenance', value: s.maintenance, className: 'bg-red-600' },
          ]} />
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Available" value={s.available} icon={<BedDouble className="h-5 w-5" />} tone="green" />
            <StatCard label="Occupied" value={s.occupied} icon={<DoorOpen className="h-5 w-5" />} tone="navy" />
            <StatCard label="Cleaning" value={s.cleaning} icon={<Sparkles className="h-5 w-5" />} tone="amber" />
            <StatCard label="Maintenance" value={s.maintenance} icon={<Wrench className="h-5 w-5" />} tone="red" />
          </div>
          <SectionLabel>Operations</SectionLabel>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Pending reservations" value={s.pending} icon={<CalendarClock className="h-5 w-5" />} tone="amber" />
            <StatCard label="Confirmed reservations" value={s.confirmed} icon={<CalendarCheck className="h-5 w-5" />} />
            <StatCard label="Checked-in guests" value={s.checkedIn} icon={<CheckCircle2 className="h-5 w-5" />} tone="green" />
            {manager ? (
              <StatCard label="Open housekeeping tasks" value={s.openHk} icon={<Sparkles className="h-5 w-5" />} tone="slate" />
            ) : (
              <StatCard label="Pending service orders" value={s.openOrders} icon={<ConciergeBell className="h-5 w-5" />} tone="slate" />
            )}
          </div>
        </>
      ) : null}
      <Card title="Latest reservations" actions={<Link to="/reservations" className="text-sm font-medium text-navy-800 underline decoration-gold-500 underline-offset-4 hover:text-gold-700">View all</Link>}>
        <ReservationTable rows={recent.data?.data} loading={recent.loading} error={recent.error} showGuest />
      </Card>
    </>
  );
}

function GuestDashboard({ greeting }: { greeting: string }) {
  const res = useApi(() => reservationsApi.list({ limit: 5 }));
  const stats = useApi(async () => {
    const [upcoming, pending, stay] = await Promise.all([
      count(reservationsApi.list({ limit: 1, reservationStatus: 'CONFIRMED' })),
      count(reservationsApi.list({ limit: 1, reservationStatus: 'PENDING' })),
      count(reservationsApi.list({ limit: 1, reservationStatus: 'CHECKED_IN' })),
    ]);
    return { upcoming, pending, stay };
  });
  return (
    <>
      <section className="relative mb-6 overflow-hidden rounded-(--radius-card) bg-navy-800 px-6 py-7 text-white shadow-(--shadow-card) sm:px-8">
        <div className="pointer-events-none absolute inset-2 rounded-lg border border-gold-500/25" aria-hidden="true" />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-gold-400">Guest portal</p>
            <h1 className="font-serif text-3xl font-semibold">{greeting}</h1>
            <p className="mt-1 max-w-xl text-sm text-navy-100">Book rooms, check in digitally, open your room with a digital key and order services.</p>
          </div>
          <Link to="/availability" className="inline-flex items-center gap-1.5 rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-navy-900 shadow-sm transition-colors hover:bg-gold-400">
            <CalendarCheck className="h-4 w-4" /> Book a room
          </Link>
        </div>
      </section>
      {stats.error && <Alert type="error">{stats.error}</Alert>}
      {stats.data && (
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <StatCard label="Awaiting payment" value={stats.data.pending} icon={<CalendarClock className="h-5 w-5" />} tone="amber" />
          <StatCard label="Confirmed stays" value={stats.data.upcoming} icon={<CalendarCheck className="h-5 w-5" />} tone="gold" />
          <StatCard label="Current stays" value={stats.data.stay} icon={<DoorOpen className="h-5 w-5" />} tone="green" />
        </div>
      )}
      <Card title="My recent reservations" actions={<Link to="/reservations" className="text-sm font-medium text-navy-800 underline decoration-gold-500 underline-offset-4 hover:text-gold-700">View all</Link>}>
        <ReservationTable rows={res.data?.data} loading={res.loading} error={res.error} />
      </Card>
    </>
  );
}

function HousekeepingDashboard({ greeting }: { greeting: string }) {
  const stats = useApi(async () => {
    const [pending, progress, done] = await Promise.all([
      count(housekeepingApi.list({ limit: 1, status: 'PENDING' })),
      count(housekeepingApi.list({ limit: 1, status: 'IN_PROGRESS' })),
      count(housekeepingApi.list({ limit: 1, status: 'COMPLETED' })),
    ]);
    return { pending, progress, done };
  });
  return (
    <>
      <PageHeader
        title={greeting}
        subtitle="Your assigned cleaning tasks."
        actions={<Link to="/housekeeping" className={linkButtonClass}><Sparkles className="h-4 w-4" /> Open my tasks</Link>}
      />
      {stats.error && <Alert type="error">{stats.error}</Alert>}
      {stats.loading && !stats.data ? (
        <Spinner />
      ) : stats.data ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Pending" value={stats.data.pending} icon={<CalendarClock className="h-5 w-5" />} tone="amber" />
          <StatCard label="In progress" value={stats.data.progress} icon={<Sparkles className="h-5 w-5" />} />
          <StatCard label="Completed" value={stats.data.done} icon={<CheckCircle2 className="h-5 w-5" />} tone="green" />
        </div>
      ) : null}
    </>
  );
}

export function ReservationTable({ rows, loading, error, showGuest }: { rows?: Reservation[]; loading: boolean; error: string | null; showGuest?: boolean }) {
  const columns: Column<Reservation>[] = [
    { header: 'ID', cell: (r) => <Link className="font-semibold text-navy-800 hover:text-gold-700 hover:underline" to={`/reservations/${r.reservationId}`}>#{r.reservationId}</Link> },
    ...(showGuest ? [{ header: 'Guest', cell: (r: Reservation) => (r.guest ? `${r.guest.firstName} ${r.guest.lastName}` : `#${r.guestId}`) }] : []),
    { header: 'Room', cell: (r) => (r.room ? `${r.room.roomNo} (${r.room.roomType})` : `#${r.roomId}`) },
    { header: 'Check-in', cell: (r) => r.checkInDate },
    { header: 'Check-out', cell: (r) => r.checkOutDate },
    { header: 'Total', cell: (r) => <span className="font-medium tabular-nums text-navy-800">{money(r.totalAmount)}</span> },
    { header: 'Status', cell: (r) => <StatusBadge status={r.reservationStatus} /> },
  ];
  return <DataTable columns={columns} rows={rows} rowKey={(r) => r.reservationId} loading={loading} error={error} empty="No reservations yet." />;
}

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted">{children}</h2>
);

/** Proportional bar of live room-status counts (no chart library, no invented data). */
function RoomStatusBar({ total, parts }: { total: number; parts: { label: string; value: number; className: string }[] }) {
  if (total <= 0) return null;
  return (
    <div className="mb-4 rounded-(--radius-card) border border-line bg-white p-4 shadow-(--shadow-card)">
      <div className="flex h-2.5 overflow-hidden rounded-full bg-slate-100" role="img"
        aria-label={`Room status: ${parts.map((p) => `${p.value} ${p.label.toLowerCase()}`).join(', ')}`}>
        {parts.filter((p) => p.value > 0).map((p) => (
          <div key={p.label} className={p.className} style={{ width: `${(p.value / total) * 100}%` }} />
        ))}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted" aria-hidden="true">
        {parts.map((p) => (
          <li key={p.label} className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${p.className}`} /> {p.label} <span className="font-semibold tabular-nums text-navy-800">{p.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

