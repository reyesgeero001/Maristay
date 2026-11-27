import {
  BedDouble,
  CalendarCheck,
  CalendarSearch,
  ConciergeBell,
  CreditCard,
  Hotel,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  Sparkles,
  UserCog,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router';
import type { Role } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { ROLE_LABEL } from '../lib/format';

export interface NavItem {
  to: string;
  label: string | Partial<Record<Role, string>>;
  icon: LucideIcon;
  roles: Role[];
}

/** Single source of truth for which role sees which screen (used by the sidebar and the router). */
export const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['MANAGER', 'FRONT_DESK', 'GUEST', 'HOUSEKEEPING'] },
  { to: '/rooms', label: 'Rooms', icon: BedDouble, roles: ['MANAGER'] },
  { to: '/availability', label: { GUEST: 'Book a Room', FRONT_DESK: 'Room Availability', MANAGER: 'Room Availability' }, icon: CalendarSearch, roles: ['GUEST', 'FRONT_DESK', 'MANAGER'] },
  { to: '/reservations', label: { GUEST: 'My Reservations', FRONT_DESK: 'Reservations', MANAGER: 'Reservations' }, icon: CalendarCheck, roles: ['GUEST', 'FRONT_DESK', 'MANAGER'] },
  { to: '/payments', label: { GUEST: 'My Payments', FRONT_DESK: 'Payments', MANAGER: 'Payments' }, icon: CreditCard, roles: ['GUEST', 'FRONT_DESK', 'MANAGER'] },
  { to: '/service-orders', label: { GUEST: 'Service Requests', FRONT_DESK: 'Service Orders', MANAGER: 'Service Orders' }, icon: ConciergeBell, roles: ['GUEST', 'FRONT_DESK', 'MANAGER'] },
  { to: '/digital-keys', label: { GUEST: 'My Digital Keys', FRONT_DESK: 'Digital Keys', MANAGER: 'Digital Keys' }, icon: KeyRound, roles: ['GUEST', 'FRONT_DESK', 'MANAGER'] },
  { to: '/guests', label: 'Guests', icon: Users, roles: ['FRONT_DESK', 'MANAGER'] },
  { to: '/staff', label: 'Staff', icon: UserCog, roles: ['MANAGER'] },
  { to: '/housekeeping', label: { HOUSEKEEPING: 'My Tasks', MANAGER: 'Housekeeping' }, icon: Sparkles, roles: ['HOUSEKEEPING', 'MANAGER'] },
];

export const rolesFor = (path: string): Role[] => NAV_ITEMS.find((n) => n.to === path)?.roles ?? [];

function navLabel(item: NavItem, role: Role): string {
  return typeof item.label === 'string' ? item.label : (item.label[role] ?? '');
}

/** Brand mark: gold hotel icon + serif wordmark. `light` = for dark (navy) backgrounds. */
export function Logo({ light = true, size = 'md', full = false }: { light?: boolean; size?: 'md' | 'lg'; full?: boolean }) {
  const big = size === 'lg';
  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex shrink-0 items-center justify-center rounded-lg border ${
          light ? 'border-gold-500/40 bg-white/5' : 'border-gold-300 bg-navy-800'
        } ${big ? 'h-12 w-12' : 'h-10 w-10'}`}
      >
        <Hotel className={`text-gold-500 ${big ? 'h-6 w-6' : 'h-5 w-5'}`} strokeWidth={1.75} />
      </div>
      <div className="min-w-0 leading-tight">
        <p className={`font-serif font-semibold tracking-wide ${light ? 'text-white' : 'text-navy-800'} ${big ? 'text-3xl' : 'text-xl'}`}>MariStay</p>
        <p className={`${big ? 'text-xs' : 'text-[11px]'} ${light ? 'text-navy-200' : 'text-muted'} ${full ? '' : 'max-w-[11rem]'}`}>
          Hotel Management and Digital Guest Services System
        </p>
      </div>
    </div>
  );
}

const initials = (first: string, last: string) => `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  if (!user) return null;

  const items = NAV_ITEMS.filter((n) => n.roles.includes(user.role));
  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const sidebar = (
    <aside className="flex h-full w-64 flex-col bg-navy-800 text-navy-100">
      <div className="flex items-start justify-between gap-2 border-b border-white/10 px-5 py-5">
        <Logo />
        <button type="button" className="rounded text-navy-200 hover:text-white md:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
          <X className="h-5 w-5" />
        </button>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Main navigation">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-lg border-l-2 px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'border-gold-500 bg-white/10 text-white'
                  : 'border-transparent text-navy-100 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={`h-4 w-4 ${isActive ? 'text-gold-500' : 'text-navy-300 group-hover:text-gold-400'}`} />
                {navLabel(item, user.role)}
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-white/10 px-4 py-4 text-sm">
        <div className="mb-3 flex items-center gap-3 px-1">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold-500/60 text-xs font-semibold text-gold-400" aria-hidden="true">
            {initials(user.firstName, user.lastName)}
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium text-white" data-testid="current-user">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-gold-400" data-testid="current-role">
              {ROLE_LABEL[user.role]}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-navy-100 transition-colors hover:bg-white/5 hover:text-white"
        >
          <LogOut className="h-4 w-4" /> Log out
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex min-h-screen bg-cream">
      <div className="sticky top-0 hidden h-screen md:block">{sidebar}</div>
      {open && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          {sidebar}
          <div className="flex-1 bg-navy-900/50" onClick={() => setOpen(false)} />
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-white px-4 py-3 md:hidden">
          <button type="button" onClick={() => setOpen(true)} aria-label="Open menu" className="rounded p-1 text-navy-800 hover:bg-navy-50">
            <Menu className="h-6 w-6" />
          </button>
          <Logo light={false} />
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
