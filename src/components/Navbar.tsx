import { Ambulance, Zap } from 'lucide-react';
import type { View } from '@/types';

interface NavbarProps {
  view: View;
  onNavigate: (view: View) => void;
}

const LINKS: { view: View; label: string; badge?: string }[] = [
  { view: 'home', label: 'About' },
  { view: 'request', label: 'Request ambulance' },
  { view: 'dispatch', label: 'Dispatch console' },
  { view: 'simulation', label: 'Simulation Demos', badge: 'BPMN' },
];

export default function Navbar({ view, onNavigate }: NavbarProps) {
  const isHome = view === 'home';

  return (
    <header
      className={`${
        isHome
          ? 'absolute top-0 inset-x-0 z-50 bg-gradient-to-b from-black/70 via-black/20 to-transparent border-none'
          : 'sticky top-0 z-50 border-b-4 border-ink bg-ink'
      } text-comic-cream transition-all duration-300`}
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2 transition-transform hover:-rotate-2"
          aria-label="Pranrath home"
        >
          <span className="flex h-10 w-10 items-center justify-center border-2 border-white/20 bg-comic-red shadow-panel-sm rounded-lg">
            <Ambulance className="h-6 w-6 text-comic-cream" strokeWidth={2.5} />
          </span>
          <span className="font-display text-2xl tracking-wider text-comic-yellow drop-shadow-sm">Pranrath</span>
        </button>

        <nav className="flex flex-wrap items-center gap-2" aria-label="Main">
          {LINKS.map((link) => {
            const active = link.view === view;
            return (
              <button
                key={link.view}
                id={`nav-${link.view}`}
                onClick={() => onNavigate(link.view)}
                aria-current={active ? 'page' : undefined}
                className={`relative flex items-center gap-1.5 rounded-lg border px-3 py-1.5 font-body text-sm font-bold uppercase tracking-wide transition-all ${
                  active
                    ? 'border-comic-yellow bg-comic-yellow text-ink shadow-panel-sm'
                    : 'border-transparent text-comic-cream hover:border-comic-yellow/50 hover:text-comic-yellow'
                }`}
              >
                {link.view === 'simulation' && <Zap className="h-4 w-4 text-comic-red fill-comic-red" />}
                <span>{link.label}</span>
                {link.badge && (
                  <span className="ml-1 rounded bg-comic-red px-1.5 py-0.2 text-[10px] font-extrabold text-white">
                    {link.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
