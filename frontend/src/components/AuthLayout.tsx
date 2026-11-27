import { CalendarCheck, ConciergeBell, KeyRound } from 'lucide-react';
import type { ReactNode } from 'react';
import { Logo } from './Layout';

/**
 * Shared shell for the login and sign-up pages.
 * Desktop: navy brand panel (left) + card on warm white (right). Mobile: logo above a centred card.
 * The panel is decorative CSS only (no photograph), and lists features MariStay really has.
 */
export function AuthLayout({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return (
    <div className="grid min-h-screen bg-cream lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className="relative hidden overflow-hidden bg-navy-800 lg:flex lg:flex-col lg:justify-between lg:p-12">
        {/* thin gold frame — the only decoration */}
        <div className="pointer-events-none absolute inset-6 rounded-2xl border border-gold-500/25" aria-hidden="true" />
        <div className="relative">
          <Logo size="lg" full />
        </div>
        <div className="relative max-w-md">
          <p className="font-serif text-4xl leading-tight text-white">
            Every stay, <span className="text-gold-400">seamlessly</span> managed.
          </p>
          <div className="my-6 h-px w-16 bg-gold-500" aria-hidden="true" />
          <ul className="space-y-3 text-sm text-navy-100">
            <li className="flex items-center gap-3">
              <CalendarCheck className="h-4 w-4 text-gold-400" aria-hidden="true" /> Room reservations and digital check-in / check-out
            </li>
            <li className="flex items-center gap-3">
              <KeyRound className="h-4 w-4 text-gold-400" aria-hidden="true" /> Digital room keys with a simulated smart lock
            </li>
            <li className="flex items-center gap-3">
              <ConciergeBell className="h-4 w-4 text-gold-400" aria-hidden="true" /> In-stay service requests and housekeeping
            </li>
          </ul>
        </div>
        <p className="relative text-xs text-navy-300">ITEC 116 Final Project · academic prototype</p>
      </aside>

      <main className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className={`w-full ${wide ? 'max-w-lg' : 'max-w-md'}`}>
          <div className="mb-8 flex justify-center lg:hidden">
            <Logo light={false} />
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}

/** White card used inside AuthLayout. */
export const authCardClass = 'rounded-2xl border border-line bg-white p-6 shadow-(--shadow-raised) sm:p-8';
