import { CalendarPlus, Search } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { guestsApi, reservationsApi, roomsApi } from '../api/endpoints';
import { ROOM_TYPES, type Paginated, type Room } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import {
  ActionMessage,
  Alert,
  Button,
  Card,
  DataTable,
  Field,
  Modal,
  PageHeader,
  Select,
  StatusBadge,
  inputClass,
  type Column,
} from '../components/ui';
import { localDate, money, nightsBetween } from '../lib/format';
import { errorMessage } from '../api/client';
import { useAction, useApi } from '../lib/useApi';

/**
 * Room availability search (GET /rooms?checkInDate&checkOutDate) and booking (POST /reservations).
 * Guests book for themselves; Front Desk / Manager choose the guest.
 */
export function AvailabilityPage() {
  const { user } = useAuth();
  const isGuest = user?.role === 'GUEST';
  const [checkIn, setCheckIn] = useState(localDate(0));
  const [checkOut, setCheckOut] = useState(localDate(1));
  const [roomType, setRoomType] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [result, setResult] = useState<{ rooms: Paginated<Room>; checkIn: string; checkOut: string } | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [booking, setBooking] = useState<Room | null>(null);

  const search = async (e?: FormEvent) => {
    e?.preventDefault();
    setFormError(null);
    if (!checkIn || !checkOut) return setFormError('Select both dates.');
    if (checkIn < localDate(0)) return setFormError('Check-in date cannot be in the past.');
    if (checkOut <= checkIn) return setFormError('Check-out must be after check-in.');
    if (nightsBetween(checkIn, checkOut) > 30) return setFormError('A reservation cannot exceed 30 nights.');
    setSearching(true);
    setSearchError(null);
    try {
      const rooms = await roomsApi.list({ checkInDate: checkIn, checkOutDate: checkOut, roomType, limit: 100 });
      setResult({ rooms, checkIn, checkOut });
    } catch (err) {
      setSearchError(errorMessage(err));
    } finally {
      setSearching(false);
    }
  };

  const nights = result ? nightsBetween(result.checkIn, result.checkOut) : 0;
  const columns: Column<Room>[] = [
    { header: 'Room', cell: (r) => <span className="font-medium text-navy-800">{r.roomNo}</span> },
    { header: 'Type', cell: (r) => r.roomType },
    { header: 'Price / night', cell: (r) => money(r.pricePerNight) },
    { header: `Estimate (${nights} night${nights === 1 ? '' : 's'})`, cell: (r) => money(r.pricePerNight * nights) },
    { header: 'Current status', cell: (r) => <StatusBadge status={r.roomStatus} /> },
    {
      header: '',
      cell: (r) => (
        <Button size="sm" onClick={() => setBooking(r)} aria-label={`Book room ${r.roomNo}`}>
          <CalendarPlus className="h-3.5 w-3.5" /> Book
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title={isGuest ? 'Book a Room' : 'Room Availability'}
        subtitle="Rooms with no overlapping reservation and not under maintenance for the selected dates."
      />
      <Card className="mb-6">
        <form onSubmit={search} className="grid items-end gap-3 sm:grid-cols-4" noValidate>
          <Field label="Check-in date" required>
            <input className={inputClass} type="date" min={localDate(0)} value={checkIn} onChange={(e) => setCheckIn(e.target.value)} required />
          </Field>
          <Field label="Check-out date" required>
            <input className={inputClass} type="date" min={checkIn} value={checkOut} onChange={(e) => setCheckOut(e.target.value)} required />
          </Field>
          <Field label="Room type">
            <Select value={roomType} onChange={setRoomType} options={ROOM_TYPES.map((t) => ({ value: t, label: t }))} placeholder="Any type" />
          </Field>
          <Button type="submit" busy={searching}>
            <Search className="h-4 w-4" /> Check availability
          </Button>
        </form>
        {formError && <div className="mt-4"><Alert type="error">{formError}</Alert></div>}
      </Card>
      {(result || searchError) && (
        <Card title={result ? `Available rooms: ${result.checkIn} → ${result.checkOut}` : 'Available rooms'}>
          <DataTable columns={columns} rows={result?.rooms.data} rowKey={(r) => r.roomId} loading={searching} error={searchError} empty="No rooms are available for these dates." />
        </Card>
      )}
      {booking && result && (
        <BookingDialog room={booking} checkIn={result.checkIn} checkOut={result.checkOut} staff={!isGuest} onClose={() => setBooking(null)} />
      )}
    </>
  );
}

function BookingDialog({ room, checkIn, checkOut, staff, onClose }: { room: Room; checkIn: string; checkOut: string; staff: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const action = useAction();
  const [guestSearch, setGuestSearch] = useState('');
  const [guestId, setGuestId] = useState('');
  const guests = useApi(
    () => (staff ? guestsApi.list({ search: guestSearch.trim(), accountStatus: 'ACTIVE', limit: 20 }) : Promise.resolve(null)),
    [staff, guestSearch],
  );
  const nights = nightsBetween(checkIn, checkOut);

  const book = async () => {
    if (staff && !guestId) {
      action.setMessage({ type: 'error', text: 'Select the guest this reservation is for.' });
      return;
    }
    const res = await action.run(() =>
      reservationsApi.create({ roomId: room.roomId, checkInDate: checkIn, checkOutDate: checkOut, ...(staff ? { guestId: Number(guestId) } : {}) }),
    );
    if (res.ok) navigate(`/reservations/${res.value.reservationId}`, { state: { flash: `Reservation #${res.value.reservationId} created (PENDING until paid).` } });
  };

  return (
    <Modal title={`Book room ${room.roomNo}`} open onClose={onClose}>
      <ActionMessage message={action.message} onClose={() => action.setMessage(null)} />
      <dl className="mb-4 grid grid-cols-2 gap-2 text-sm">
        <dt className="text-muted">Room</dt>
        <dd>{room.roomNo} — {room.roomType}</dd>
        <dt className="text-muted">Dates</dt>
        <dd>{checkIn} → {checkOut} ({nights} night{nights === 1 ? '' : 's'})</dd>
        <dt className="text-muted">Estimated total</dt>
        <dd className="font-semibold">{money(room.pricePerNight * nights)}</dd>
      </dl>
      {staff && (
        <div className="mb-4 space-y-3">
          <Field label="Find guest (name or email)">
            <input className={inputClass} value={guestSearch} onChange={(e) => setGuestSearch(e.target.value)} placeholder="Type to search" />
          </Field>
          <Field label="Guest" required>
            <Select
              value={guestId}
              onChange={setGuestId}
              placeholder={guests.loading ? 'Loading guests…' : 'Select a guest'}
              options={(guests.data?.data ?? []).map((g) => ({ value: String(g.guestId), label: `${g.firstName} ${g.lastName} (${g.email})` }))}
            />
          </Field>
          {guests.error && <Alert type="error">{guests.error}</Alert>}
        </div>
      )}
      <p className="mb-4 text-xs text-muted">
        The reservation starts as <strong>Pending</strong>. It is confirmed automatically once the room total is fully paid at the front desk.
      </p>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button busy={action.busy} onClick={book}>Confirm booking</Button>
      </div>
    </Modal>
  );
}
