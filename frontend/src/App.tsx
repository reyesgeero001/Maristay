import { Navigate, Route, Routes } from 'react-router';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { Layout, rolesFor } from './components/Layout';
import { AvailabilityPage } from './pages/AvailabilityPage';
import { DashboardPage } from './pages/DashboardPage';
import { DigitalKeysPage } from './pages/DigitalKeysPage';
import { ForbiddenPage, NotFoundPage } from './pages/ErrorPages';
import { GuestsPage } from './pages/GuestsPage';
import { HousekeepingPage } from './pages/HousekeepingPage';
import { LoginPage } from './pages/LoginPage';
import { PaymentsPage } from './pages/PaymentsPage';
import { RegisterPage } from './pages/RegisterPage';
import { ReservationDetailPage } from './pages/ReservationDetailPage';
import { ReservationsPage } from './pages/ReservationsPage';
import { RoomsPage } from './pages/RoomsPage';
import { ServiceOrdersPage } from './pages/ServiceOrdersPage';
import { StaffPage } from './pages/StaffPage';

/** Each page is wrapped in a role guard taken from NAV_ITEMS (Layout.tsx). */
const PAGES: [string, React.ReactNode][] = [
  ['/rooms', <RoomsPage />],
  ['/availability', <AvailabilityPage />],
  ['/reservations', <ReservationsPage />],
  ['/payments', <PaymentsPage />],
  ['/service-orders', <ServiceOrdersPage />],
  ['/digital-keys', <DigitalKeysPage />],
  ['/guests', <GuestsPage />],
  ['/staff', <StaffPage />],
  ['/housekeeping', <HousekeepingPage />],
];

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          {PAGES.map(([path, element]) => (
            <Route key={path} element={<ProtectedRoute roles={rolesFor(path)} />}>
              <Route path={path} element={element} />
            </Route>
          ))}
          <Route element={<ProtectedRoute roles={rolesFor('/reservations')} />}>
            <Route path="/reservations/:id" element={<ReservationDetailPage />} />
          </Route>
          <Route path="/forbidden" element={<ForbiddenPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
