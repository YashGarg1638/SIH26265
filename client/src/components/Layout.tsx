import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import {
  BarChart3, Bell, Building2, Calculator, CalendarClock, ClipboardList, FileStack, LayoutGrid, LogOut, Menu, Monitor, Moon, Plus, Search, ShieldCheck, Sun, Undo2, X,
} from 'lucide-react';
import { api, DEMO } from '../lib/api';
import { useAuth, useClock, useLive, useLookups, useTheme, useToast } from '../lib/context';
import { fmtDate, relTime } from '../lib/format';
import type { Alert } from '../lib/types';
import { severityIcon } from './ui';
import { CommandPalette } from './CommandPalette';
import { SecurityHudModal } from './SecurityHudModal';
import { FdrCalculatorModal } from './FdrCalculatorModal';

/** Institutional security mark for Team Yash / AICTE SD-FDR portal. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={clsx('size-10 shrink-0', className)} fill="none" aria-hidden>
      <rect width="40" height="40" rx="10" fill="var(--panel-2)" stroke="var(--border)" />
      {/* Precision institutional monogram: Interlocking Vault Key & Shield */}
      <path d="M20 9L30 14V21C30 26.5 25.8 31 20 32.5C14.2 31 10 26.5 10 21V14L20 9Z" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="20" cy="18" r="3.2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M20 21.2V26M18 24H22" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

const initials = (name?: string) => (name ?? '').replace(/^((Prof|Dr|Shri|Smt|Ms)\.?\s*)+/i, '').split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();

export default function Layout() {
  const { user } = useAuth();
  const [drawer, setDrawer] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [securityHudOpen, setSecurityHudOpen] = useState(false);
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const loc = useLocation();

  useEffect(() => { setDrawer(false); document.getElementById('main-scroll')?.scrollTo({ top: 0 }); }, [loc.pathname]);

  // Global Ctrl+K / Cmd+K shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCmdOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const { data: alertSummary } = useQuery({ queryKey: ['alerts-summary'], queryFn: () => api<{ unread: number; critical: number; latest: Alert[] }>('/alerts/summary'), refetchInterval: 60000 });
  const staff = user?.role !== 'institution';
  const canSubmit = ['institution', 'officer', 'head', 'admin'].includes(user?.role ?? '');
  const { data: pendingCount } = useQuery({ queryKey: ['instruments', 'pending-count'], enabled: staff, queryFn: () => api<{ total: number }>('/instruments?status=Submitted,Under Scrutiny&size=5').then((r) => r.total) });
  const { data: releaseCount } = useQuery({ queryKey: ['releases', 'mine-count'], queryFn: () => api<unknown[]>('/releases?status=mine').then((r) => r.length) });

  const items: NavLeaf[] = staff ? [
    { to: '/', label: 'Dashboard', icon: LayoutGrid, end: true },
    { to: '/desk', label: 'My desk', icon: ClipboardList, badge: pendingCount },
    { to: '/instruments', label: 'Register', icon: FileStack },
    { to: '/calendar', label: 'Maturity calendar', icon: CalendarClock },
    { to: '/releases', label: 'Releases', icon: Undo2, badge: releaseCount },
    { to: '/institutions', label: 'Institutions', icon: Building2 },
    { to: '/alerts', label: 'Alerts', icon: Bell, badge: alertSummary?.unread },
    { to: '/reports', label: 'Reports', icon: BarChart3 },
    ...(['admin', 'head', 'auditor'].includes(user?.role ?? '') ? [{ to: '/admin', label: 'Administration', icon: ShieldCheck }] : []),
  ] : [
    { to: '/', label: 'Overview', icon: LayoutGrid, end: true },
    { to: '/instruments', label: 'My deposits', icon: FileStack },
    { to: '/releases', label: 'Release requests', icon: Undo2, badge: releaseCount },
    { to: '/alerts', label: 'Notifications', icon: Bell, badge: alertSummary?.unread },
  ];

  return (
    <div className="min-h-screen bg-main lg:bg-transparent lg:p-5 xl:p-7">
      <div id="app-shell" className="lg:flex lg:h-[calc(100vh-40px)] lg:overflow-hidden lg:rounded-[20px] lg:border lg:border-white/10 lg:bg-sidebar lg:shadow-[var(--shell-shadow)] xl:h-[calc(100vh-56px)]">
        <aside className="no-print hidden w-[84px] shrink-0 border-r border-white/5 lg:block"><Rail items={items} /></aside>
        {drawer && (
          <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDrawer(false)} />
            <div className="absolute inset-y-0 left-0 w-[272px] bg-sidebar shadow-2xl"><Drawer items={items} onClose={() => setDrawer(false)} /></div>
          </div>
        )}
        <div id="main-scroll" className="relative flex min-h-screen min-w-0 flex-1 flex-col bg-main lg:min-h-0 lg:overflow-y-auto">
          <header className="header-fade no-print sticky top-0 isolate z-30 px-4 pb-2 pt-4 sm:px-8 sm:pt-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <button className={clsx(iconBtn, 'lg:hidden')} onClick={() => setDrawer(true)} aria-label="Open menu"><Menu className="size-5" /></button>
              <GlobalSearch onOpenCmd={() => setCmdOpen(true)} />
              <ClockChip />
              <div className="ml-auto flex items-center gap-1.5">
                <SecurityLedgerChip onClick={() => setSecurityHudOpen(true)} />
                <button
                  onClick={() => setCalculatorOpen(true)}
                  className={clsx(iconBtn, 'hidden sm:flex')}
                  title="AICTE Deposit & Yield Calculator"
                  aria-label="Calculator"
                >
                  <Calculator className="size-[18px]" />
                </button>
                <LiveIndicator />
                <ThemeToggle />
                <AlertBell summary={alertSummary} />
                <div className="lg:hidden"><UserMenu /></div>
              </div>
            </div>
          </header>
          <main className="print-full w-full flex-1 px-4 pb-10 pt-3 sm:px-8">
            <Outlet />
          </main>
          <footer className="no-print px-6 pb-5 text-center text-[11px] text-muted">
            {DEMO ? 'Live demo running in your browser · ' : 'Demo build · '}synthetic data: all institutions, officials, deposits and bank records are fictional · SIH 2026 · SIH26265 · Team Yash
          </footer>
        </div>
      </div>
      {canSubmit && (
        <Link to="/submit" aria-label={staff ? 'Record a deposit' : 'Submit an FDR'} title={staff ? 'Record a deposit' : 'Submit an FDR'}
          className="no-print fixed bottom-6 right-6 z-40 flex size-13 items-center justify-center rounded-xl bg-accent text-accent-ink shadow-lg shadow-black/40 transition-all hover:bg-accent-strong hover:scale-105 active:scale-95 lg:bottom-12 lg:right-12">
          <Plus className="size-5" strokeWidth={2.5} />
        </Link>
      )}
      <Toasts />
      <CommandPalette
        open={cmdOpen}
        onClose={() => setCmdOpen(false)}
        onOpenSecurityHud={() => setSecurityHudOpen(true)}
        onOpenCalculator={() => setCalculatorOpen(true)}
      />
      <SecurityHudModal
        open={securityHudOpen}
        onClose={() => setSecurityHudOpen(false)}
      />
      <FdrCalculatorModal
        open={calculatorOpen}
        onClose={() => setCalculatorOpen(false)}
      />
    </div>
  );
}

type NavLeaf = { to: string; label: string; icon: typeof LayoutGrid; end?: boolean; badge?: number };

/** Icon rail: emblem on top, items in the middle, user menu at the bottom. */
function Rail({ items }: { items: NavLeaf[] }) {
  return (
    <div className="flex h-full flex-col items-center pb-6 pt-7">
      <Link to="/" aria-label="AICTE SD/FDR portal home" className="transition-transform hover:scale-105"><LogoMark /></Link>
      <nav aria-label="Main" className="mt-14 flex flex-1 flex-col items-center gap-2 overflow-y-auto overflow-x-visible">
        {items.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end} aria-label={n.label}
            className={({ isActive }) => clsx('group relative flex size-10 items-center justify-center rounded-xl transition-all',
              isActive ? 'bg-accent/15 text-accent font-medium' : 'text-nav-ink hover:bg-white/5 hover:text-white')}>
            {({ isActive }) => (<>
              <n.icon className="size-[19px]" strokeWidth={isActive ? 2.2 : 1.8} />
              {!!n.badge && <span className="absolute -right-0.5 -top-0.5 min-w-[17px] rounded-full bg-accent px-1 text-center text-[9.5px] font-bold leading-[17px] text-accent-ink tnum">{n.badge > 99 ? '99+' : n.badge}</span>}
              <span className="pointer-events-none fixed left-[92px] z-50 hidden whitespace-nowrap rounded-lg bg-[#18181b] px-3 py-1.5 text-xs font-medium text-white shadow-xl border border-white/10 group-hover:block group-focus-visible:block lg:ml-5 xl:ml-7">{n.label}</span>
            </>)}
          </NavLink>
        ))}
      </nav>
      <UserMenu rail />
    </div>
  );
}

function Drawer({ items, onClose }: { items: NavLeaf[]; onClose: () => void }) {
  return (
    <div className="flex h-full flex-col px-5 pb-6 pt-6 text-white">
      <div className="flex items-center justify-between"><LogoMark /><button className={clsx(iconBtn, 'text-white/70')} onClick={onClose} aria-label="Close menu"><X className="size-5" /></button></div>
      <nav aria-label="Main" className="mt-8 flex-1 space-y-1 overflow-y-auto">
        {items.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end}
            className={({ isActive }) => clsx('flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all', isActive ? 'bg-accent/15 text-accent font-medium' : 'text-white/60 hover:bg-white/5 hover:text-white')}>
            {({ isActive }) => (<>
              <n.icon className="size-[18px]" strokeWidth={isActive ? 2.2 : 1.8} />
              <span className="flex-1">{n.label}</span>
              {!!n.badge && <span className="rounded-full bg-accent px-1.5 text-[10px] font-bold text-accent-ink tnum">{n.badge}</span>}
            </>)}
          </NavLink>
        ))}
      </nav>
      <div className="eyebrow text-[9.5px] text-white/40">SIH26265 · Team Yash</div>
    </div>
  );
}

function LiveIndicator() {
  const { connected, lastAt } = useLive();
  return (
    <div className="hidden shrink-0 items-center gap-2 rounded-full px-3 py-2 text-xs font-medium text-ink-2 xl:flex" title={connected ? `Receiving real-time updates${lastAt ? ` · last ${relTime(lastAt)}` : ''}` : 'Reconnecting…'}>
      <span className={clsx('size-2 rounded-full', connected ? 'live-dot bg-accent' : 'bg-muted')} />
      {connected ? 'Live' : 'Offline'}
    </div>
  );
}

const iconBtn = 'relative flex size-10 items-center justify-center rounded-full text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink';

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const next = theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark';
  const Icon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor;
  return <button className={clsx(iconBtn, 'hidden sm:flex')} onClick={() => setTheme(next)} title={`Theme: ${theme} (click for ${next})`} aria-label="Toggle theme"><Icon className="size-[18px]" /></button>;
}

function usePopover() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const k = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', h);
    document.addEventListener('keydown', k);
    return () => { document.removeEventListener('mousedown', h); document.removeEventListener('keydown', k); };
  }, []);
  return { open, setOpen, ref };
}

function AlertBell({ summary }: { summary?: { unread: number; critical: number; latest: Alert[] } }) {
  const { open, setOpen, ref } = usePopover();
  const nav = useNavigate();
  return (
    <div className="relative" ref={ref}>
      <button className={iconBtn} onClick={() => setOpen((o) => !o)} aria-label="Alerts" aria-expanded={open}>
        <Bell className="size-[18px]" />
        {!!summary?.unread && <span className={clsx('absolute right-1 top-1 min-w-[17px] rounded-full px-1 text-center text-[10px] font-bold leading-[17px]', summary.critical ? 'bg-critical text-white' : 'bg-accent text-accent-ink')}>{summary.unread > 99 ? '99+' : summary.unread}</span>}
      </button>
      {open && (
        <div className="glass-pop absolute right-0 top-12 z-40 w-[min(92vw,380px)] overflow-hidden rounded-2xl border border-border/80 shadow-2xl">
          <div className="flex items-center justify-between px-4 py-3 text-sm font-semibold border-b border-white/[0.04]">Alerts <span className="text-xs font-normal text-ink-3">{summary?.unread ?? 0} unread</span></div>
          <ul className="max-h-96 space-y-1 overflow-y-auto px-2 pb-2">
            {summary?.latest.map((a) => (
              <li key={a.id}>
                <button className={clsx('flex w-full gap-2.5 rounded-xl px-3 py-2.5 text-left hover:bg-surface-2', !a.read && 'bg-surface-1')}
                  onClick={() => { setOpen(false); api(`/alerts/${a.id}/read`, { method: 'POST' }).catch(() => {}); nav(a.release_id ? `/releases/${a.release_id}` : a.instrument_id ? `/instruments/${a.instrument_id}` : '/alerts'); }}>
                  <span className={clsx('mt-0.5', a.severity === 'critical' ? 'text-critical-text' : a.severity === 'serious' ? 'text-serious-text' : a.severity === 'warning' ? 'text-warning-text' : 'text-info-text')}>{severityIcon(a.severity)}</span>
                  <span className="min-w-0">
                    <span className="line-clamp-2 text-sm text-ink">{a.title}</span>
                    <span className="text-xs text-ink-3">{relTime(a.created_at)}</span>
                  </span>
                </button>
              </li>
            ))}
            {!summary?.latest.length && <li className="px-4 py-6 text-center text-sm text-ink-3">No active alerts</li>}
          </ul>
          <Link to="/alerts" onClick={() => setOpen(false)} className="block border-t border-hairline px-4 py-3 text-center text-sm font-semibold text-accent-text hover:bg-surface-2">View all alerts</Link>
        </div>
      )}
    </div>
  );
}

function UserMenu({ rail }: { rail?: boolean }) {
  const { user, logout } = useAuth();
  const { regionName, meta } = useLookups();
  const { open, setOpen, ref } = usePopover();
  const scope = user?.role === 'institution' ? `${user.institution?.name} (${user.institution?.aicte_id})` : user?.role === 'officer' ? `Regions: ${(user.regions ?? '').split(',').map((r) => regionName(r)).join(', ')}` : `${meta?.roles[user!.role] ?? ''} · all regions`;
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} aria-label="Account" aria-expanded={open} title={user?.name}
        className={clsx('flex items-center justify-center rounded-xl bg-accent font-bold text-accent-ink ring-2 ring-white/10 transition hover:ring-accent/60', rail ? 'size-11 text-sm' : 'ml-1 size-9 text-xs')}>
        {initials(user?.name)}
      </button>
      {open && (
        <div className={clsx('glass-pop absolute z-50 w-72 rounded-2xl border border-border/80 p-4 text-ink shadow-2xl', rail ? 'bottom-0 left-14' : 'right-0 top-12')}>
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-xl bg-accent font-bold text-accent-ink">{initials(user?.name)}</span>
            <div className="min-w-0">
              <div className="truncate font-semibold">{user?.name}</div>
              <div className="truncate text-xs text-ink-3">{user?.designation}</div>
            </div>
          </div>
          <div className="tile mt-3 rounded-xl px-3 py-2 text-xs text-ink-2">Scope: {scope}</div>
          <button onClick={logout} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-surface-2 px-3 py-2 text-sm font-medium hover:bg-surface-3 transition-colors"><LogOut className="size-4" />Sign out</button>
        </div>
      )}
    </div>
  );
}

function GlobalSearch({ onOpenCmd }: { onOpenCmd: () => void }) {
  return (
    <div className="relative min-w-0 flex-1 sm:max-w-md">
      <button
        onClick={onOpenCmd}
        className="group flex h-11 w-full items-center justify-between rounded-xl border border-white/10 bg-[#111114] px-3.5 text-[13px] text-zinc-400 transition hover:border-white/20 hover:bg-[#16161a] hover:text-white text-left shadow-sm"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Search className="size-4 shrink-0 text-zinc-400 group-hover:text-white transition-colors" />
          <span className="truncate">Search FDR no., institute, or type a command…</span>
        </div>
        <kbd className="hidden sm:inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[10px] font-medium text-zinc-400 group-hover:text-white transition-colors">
          <span>⌘</span>K
        </kbd>
      </button>
    </div>
  );
}

function SecurityLedgerChip({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="hidden shrink-0 items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400 transition hover:border-emerald-500/40 hover:bg-emerald-500/20 lg:flex"
      title="Real-time Cryptographic Audit Ledger & CBS Gateway Status"
    >
      <span className="relative flex size-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
      </span>
      <span>SHA-256 Ledger · 5 Bank APIs</span>
    </button>
  );
}

/** Shown when the demo time machine has moved the system date ahead of the real date. */
function ClockChip() {
  const { today, offset } = useClock();
  if (!offset) return null;
  return (
    <Link to="/admin#clock" className="hidden shrink-0 items-center gap-1.5 rounded-lg border border-warning/30 bg-warning-soft px-3 py-1 text-xs font-medium text-warning-text md:flex" title="The demo time machine is on">
      <CalendarClock className="size-3.5" />System date {fmtDate(today)} (+{offset}d)
    </Link>
  );
}

function Toasts() {
  const { toasts, dismiss } = useToast();
  const nav = useNavigate();
  return (
    <div className="no-print pointer-events-none fixed bottom-5 right-4 z-50 flex w-[min(92vw,380px)] flex-col gap-2" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={clsx('glass-pop pointer-events-auto rounded-2xl border border-border/80 shadow-2xl p-3.5', t.tone === 'warning' && 'ring-1 ring-warning/60', t.tone === 'critical' && 'ring-1 ring-critical/60', t.tone === 'good' && 'ring-1 ring-good/50')}>
          <div className="flex items-start gap-2">
            <button className="min-w-0 flex-1 text-left" onClick={() => { if (t.href) nav(t.href); dismiss(t.id); }}>
              <div className="text-sm font-semibold">{t.title}</div>
              {t.body && <div className="mt-0.5 text-sm text-ink-2">{t.body}</div>}
            </button>
            <button className="rounded-full p-1 text-ink-3 hover:bg-surface-2" onClick={() => dismiss(t.id)} aria-label="Dismiss"><X className="size-4" /></button>
          </div>
        </div>
      ))}
    </div>
  );
}
