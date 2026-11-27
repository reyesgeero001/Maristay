import { CalendarPlus } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { reservationsApi } from '../api/endpoints';
import { RESERVATION_STATUSES } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { Button, Card, Field, PageHeader, Pagination, Select, enumOptions, inputClass } from '../components/ui';
import { useApi } from '../lib/useApi';
import { ReservationTable } from './DashboardPage';

/** GET /reservations — guests automatically receive only their own reservations from the API. */
export function ReservationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isGuest = user?.role === 'GUEST';
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [openId, setOpenId] = useState('');
  const list = useApi(
    () => reservationsApi.list({ page, limit: 15, reservationStatus: status, fromDate, toDate }),
    [page, status, fromDate, toDate],
  );
  const filter = (fn: () => void) => {
    fn();
    setPage(1);
  };

  return (
    <>
      <PageHeader
        title={isGuest ? 'My Reservations' : 'Reservations'}
        subtitle={isGuest ? 'Open a reservation to check in, check out, cancel or view payments.' : 'Open a reservation to confirm, record payments, check guests in or out, or cancel.'}
        actions={
          <Link to="/availability">
            <Button>
              <CalendarPlus className="h-4 w-4" /> New reservation
            </Button>
          </Link>
        }
      />
      <Card>
        <div className="mb-4 grid gap-3 sm:grid-cols-4">
          <Field label="Status">
            <Select value={status} onChange={(v) => filter(() => setStatus(v))} options={enumOptions(RESERVATION_STATUSES)} placeholder="All statuses" />
          </Field>
          <Field label="Stays from">
            <input className={inputClass} type="date" value={fromDate} onChange={(e) => filter(() => setFromDate(e.target.value))} />
          </Field>
          <Field label="Stays until">
            <input className={inputClass} type="date" value={toDate} onChange={(e) => filter(() => setToDate(e.target.value))} />
          </Field>
          {!isGuest && (
            <form
              className="flex items-end gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (/^\d+$/.test(openId)) navigate(`/reservations/${openId}`);
              }}
            >
              <Field label="Open reservation #">
                <input className={inputClass} inputMode="numeric" value={openId} onChange={(e) => setOpenId(e.target.value.replace(/\D/g, ''))} />
              </Field>
              <Button type="submit" variant="secondary">Go</Button>
            </form>
          )}
        </div>
        <ReservationTable rows={list.data?.data} loading={list.loading} error={list.error} showGuest={!isGuest} />
        {list.data && <Pagination page={page} totalPages={list.data.meta.totalPages} total={list.data.meta.total} onPage={setPage} />}
      </Card>
    </>
  );
}
