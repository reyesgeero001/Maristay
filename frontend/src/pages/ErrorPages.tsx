import { ShieldAlert, SearchX } from 'lucide-react';
import { Link } from 'react-router';
import { linkButtonClass } from '../components/ui';

function ErrorPage({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="mx-auto mt-16 max-w-md rounded-(--radius-card) border border-line bg-white p-8 text-center shadow-(--shadow-card)">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-gold-300 bg-gold-50 text-gold-700">{icon}</div>
      <h1 className="mb-2 font-serif text-2xl font-semibold text-navy-800">{title}</h1>
      <p className="mb-6 text-sm text-muted">{text}</p>
      <Link to="/dashboard" className={linkButtonClass}>
        Back to dashboard
      </Link>
    </div>
  );
}

export const ForbiddenPage = () => (
  <ErrorPage icon={<ShieldAlert className="h-8 w-8" />} title="Access denied" text="Your role does not have access to this page." />
);

export const NotFoundPage = () => (
  <ErrorPage icon={<SearchX className="h-8 w-8" />} title="Page not found" text="The page you requested does not exist." />
);
