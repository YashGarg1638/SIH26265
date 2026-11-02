import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import {
  AlertTriangle, Building2, Calculator, CalendarClock, ChevronRight,
  ClipboardList, Download, FileStack, LayoutGrid, Moon, Plus, Search, ShieldCheck, Sun, Undo2, X,
} from 'lucide-react';
import { api, download, qs } from '../lib/api';
import { useTheme, useToast } from '../lib/context';
import { inrShort } from '../lib/format';
import type { InstrumentRow } from '../lib/types';
import { StatusBadge } from './ui';

interface Props {
  open: boolean;
  onClose: () => void;
  onOpenSecurityHud: () => void;
  onOpenCalculator: () => void;
}

interface CommandItem {
  id: string;
  category: 'Actions' | 'Pages' | 'Tools';
  title: string;
  subtitle?: string;
  icon: typeof Search;
  shortcut?: string;
  perform: () => void;
}

export function CommandPalette({ open, onClose, onOpenSecurityHud, onOpenCalculator }: Props) {
  const [q, setQ] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [activeTab, setActiveTab] = useState<'all' | 'actions' | 'pages' | 'records'>('all');
  const nav = useNavigate();
  const { theme, setTheme } = useTheme();
  const { push } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQ('');
      setSelectedIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Dynamic server search
  const debouncedQ = q.trim();
  const { data: searchResults } = useQuery({
    queryKey: ['cmd-search', debouncedQ],
    enabled: open && debouncedQ.length >= 2,
    queryFn: () => api<{
      instruments: InstrumentRow[];
      institutions: Array<{ id: number; name: string; aicte_id: string; city: string; state: string }>;
    }>(`/search${qs({ q: debouncedQ })}`),
  });

  const go = (path: string) => {
    onClose();
    nav(path);
  };

  const handleExport = async () => {
    onClose();
    try {
      push({ tone: 'info', title: 'Exporting FDR Register…', body: 'Preparing CSV download.' });
      await download('/instruments?format=csv', 'aicte-fdr-register.csv');
      push({ tone: 'good', title: 'Export Complete', body: 'FDR register downloaded as CSV.' });
    } catch {
      push({ tone: 'critical', title: 'Export Failed', body: 'Could not export register.' });
    }
  };

  const defaultCommands: CommandItem[] = [
    {
      id: 'action-submit',
      category: 'Actions',
      title: 'Submit New FDR / Security Deposit',
      subtitle: 'Upload instrument scan and verify bank confirmation',
      icon: Plus,
      shortcut: 'S',
      perform: () => go('/submit'),
    },
    {
      id: 'action-export',
      category: 'Actions',
      title: 'Export Full FDR Register (CSV)',
      subtitle: 'Instant download of all active deposits, tenures and statuses',
      icon: Download,
      shortcut: 'E',
      perform: handleExport,
    },
    {
      id: 'tool-security',
      category: 'Tools',
      title: 'Security & Bank Gateway Telemetry',
      subtitle: 'Check SHA-256 audit ledger, AES-256 vault & live CBS interfaces',
      icon: ShieldCheck,
      shortcut: 'G',
      perform: () => { onClose(); onOpenSecurityHud(); },
    },
    {
      id: 'tool-calculator',
      category: 'Tools',
      title: 'AICTE Deposit & Yield Calculator',
      subtitle: 'Simulate compound yield, norm compliance & retainage',
      icon: Calculator,
      shortcut: 'C',
      perform: () => { onClose(); onOpenCalculator(); },
    },
    {
      id: 'page-dashboard',
      category: 'Pages',
      title: 'Executive Dashboard',
      subtitle: 'High-level maturity outlook, KPIs and operational matrix',
      icon: LayoutGrid,
      perform: () => go('/'),
    },
    {
      id: 'page-desk',
      category: 'Pages',
      title: 'Verification Desk',
      subtitle: 'Maker-checker scrutiny queue for Section Officers',
      icon: ClipboardList,
      perform: () => go('/desk'),
    },
    {
      id: 'page-register',
      category: 'Pages',
      title: 'Deposit Register',
      subtitle: 'Searchable inventory of all submitted and active FDRs',
      icon: FileStack,
      perform: () => go('/instruments'),
    },
    {
      id: 'action-lapsed',
      category: 'Actions',
      title: 'Filter Overdue Renewals (Lapsed)',
      subtitle: 'Quickly review deposits needing urgent legal escalation',
      icon: AlertTriangle,
      perform: () => go('/instruments?validity=lapsed'),
    },
    {
      id: 'page-calendar',
      category: 'Pages',
      title: 'Maturity Calendar',
      subtitle: 'Timeline of upcoming maturities and reminder triggers',
      icon: CalendarClock,
      perform: () => go('/calendar'),
    },
    {
      id: 'page-releases',
      category: 'Pages',
      title: 'Releases & Encashment',
      subtitle: 'Checklist approval and tripartite discharge workflow',
      icon: Undo2,
      perform: () => go('/releases'),
    },
    {
      id: 'tool-theme',
      category: 'Tools',
      title: `Switch Theme (Current: ${theme})`,
      subtitle: 'Toggle between Obsidian Dark and Clean Light modes',
      icon: theme === 'dark' ? Sun : Moon,
      shortcut: 'T',
      perform: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
    },
  ];

  // Filter commands by query and tab
  const filteredCommands = defaultCommands.filter((cmd) => {
    if (activeTab === 'actions' && cmd.category !== 'Actions') return false;
    if (activeTab === 'pages' && cmd.category !== 'Pages') return false;
    if (activeTab === 'records') return false;
    if (!debouncedQ) return true;
    const s = `${cmd.title} ${cmd.subtitle ?? ''}`.toLowerCase();
    return s.includes(debouncedQ.toLowerCase());
  });

  const matchingInstitutions = searchResults?.institutions ?? [];
  const matchingInstruments = searchResults?.instruments ?? [];

  const totalItemsCount = filteredCommands.length + matchingInstitutions.length + matchingInstruments.length;

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx((prev) => (prev + 1) % Math.max(1, totalItemsCount));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx((prev) => (prev - 1 + Math.max(1, totalItemsCount)) % Math.max(1, totalItemsCount));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      // Execute selected item
      if (selectedIdx < filteredCommands.length) {
        filteredCommands[selectedIdx]?.perform();
      } else {
        const instIdx = selectedIdx - filteredCommands.length;
        if (instIdx < matchingInstitutions.length) {
          go(`/institutions/${matchingInstitutions[instIdx].id}`);
        } else {
          const itemIdx = instIdx - matchingInstitutions.length;
          if (matchingInstruments[itemIdx]) {
            go(`/instruments/${matchingInstruments[itemIdx].id}`);
          }
        }
      }
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4" role="dialog" aria-modal="true" onKeyDown={handleKeyDown}>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-[#09090b] shadow-2xl text-ink z-10 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Search Input Bar */}
        <div className="relative flex items-center border-b border-white/10 px-4 py-3.5">
          <Search className="size-5 shrink-0 text-zinc-400" />
          <input
            ref={inputRef}
            type="text"
            value={q}
            onChange={(e) => { setQ(e.target.value); setSelectedIdx(0); }}
            placeholder="Type a command, FDR number, institute name, or AICTE ID…"
            className="ml-3 h-7 w-full bg-transparent text-sm text-white placeholder:text-zinc-500 focus:outline-none"
          />
          {q && (
            <button onClick={() => setQ('')} className="rounded p-1 text-zinc-500 hover:text-white">
              <X className="size-4" />
            </button>
          )}
          <span className="ml-2 hidden rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-mono font-medium text-zinc-400 sm:inline-block">
            ESC
          </span>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 border-b border-white/5 bg-[#111114] px-4 py-1.5 text-xs">
          {(['all', 'actions', 'pages', 'records'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={clsx(
                'rounded-lg px-2.5 py-1 font-medium capitalize transition-colors',
                activeTab === tab ? 'bg-white/10 text-white' : 'text-zinc-400 hover:text-zinc-200'
              )}
            >
              {tab === 'records' ? 'FDRs & Institutes' : tab}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {/* Default Commands */}
          {filteredCommands.length > 0 && activeTab !== 'records' && (
            <div className="mb-2">
              <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                Commands & Shortcuts
              </div>
              {filteredCommands.map((cmd, idx) => {
                const isSelected = selectedIdx === idx;
                return (
                  <button
                    key={cmd.id}
                    onClick={cmd.perform}
                    onMouseEnter={() => setSelectedIdx(idx)}
                    className={clsx(
                      'flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition',
                      isSelected ? 'bg-white/10 text-white' : 'text-zinc-300 hover:bg-white/5'
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={clsx(
                        'flex size-8 shrink-0 items-center justify-center rounded-lg border',
                        isSelected ? 'border-white/30 bg-white/15 text-white' : 'border-white/5 bg-[#16161a] text-zinc-400'
                      )}>
                        <cmd.icon className="size-4" />
                      </span>
                      <div className="min-w-0">
                        <span className="block truncate text-xs font-semibold text-white">{cmd.title}</span>
                        {cmd.subtitle && (
                          <span className="block truncate text-[11px] text-zinc-400">{cmd.subtitle}</span>
                        )}
                      </div>
                    </div>
                    {cmd.shortcut && (
                      <span className="rounded border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-mono text-zinc-400">
                        {cmd.shortcut}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Dynamic Records: Institutions */}
          {matchingInstitutions.length > 0 && activeTab !== 'actions' && (
            <div className="mb-2">
              <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                Institutions ({matchingInstitutions.length})
              </div>
              {matchingInstitutions.map((inst, i) => {
                const itemGlobalIdx = filteredCommands.length + i;
                const isSelected = selectedIdx === itemGlobalIdx;
                return (
                  <button
                    key={inst.id}
                    onClick={() => go(`/institutions/${inst.id}`)}
                    onMouseEnter={() => setSelectedIdx(itemGlobalIdx)}
                    className={clsx(
                      'flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition',
                      isSelected ? 'bg-white/10 text-white' : 'text-zinc-300 hover:bg-white/5'
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Building2 className="size-4 shrink-0 text-zinc-400" />
                      <div className="min-w-0">
                        <span className="block truncate text-xs font-semibold text-white">{inst.name}</span>
                        <span className="block truncate text-[11px] text-zinc-400">
                          {inst.aicte_id} · {inst.city}, {inst.state}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="size-4 text-zinc-600" />
                  </button>
                );
              })}
            </div>
          )}

          {/* Dynamic Records: Instruments */}
          {matchingInstruments.length > 0 && activeTab !== 'actions' && (
            <div>
              <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                Deposit Instruments ({matchingInstruments.length})
              </div>
              {matchingInstruments.map((inst, i) => {
                const itemGlobalIdx = filteredCommands.length + matchingInstitutions.length + i;
                const isSelected = selectedIdx === itemGlobalIdx;
                return (
                  <button
                    key={inst.id}
                    onClick={() => go(`/instruments/${inst.id}`)}
                    onMouseEnter={() => setSelectedIdx(itemGlobalIdx)}
                    className={clsx(
                      'flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition',
                      isSelected ? 'bg-white/10 text-white' : 'text-zinc-300 hover:bg-white/5'
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <FileStack className="size-4 shrink-0 text-zinc-400" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-xs font-semibold text-white">
                            {inst.ref_no} · {inst.type} {inst.instrument_no}
                          </span>
                          <StatusBadge status={inst.status} />
                        </div>
                        <span className="block truncate text-[11px] text-zinc-400">
                          {inst.institution_name} · {inrShort(inst.amount)}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="size-4 text-zinc-600" />
                  </button>
                );
              })}
            </div>
          )}

          {totalItemsCount === 0 && (
            <div className="py-8 text-center text-xs text-zinc-500">
              No matching commands or deposits found for “{q}”
            </div>
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="flex items-center justify-between border-t border-white/5 bg-[#111114] px-4 py-2.5 text-[11px] text-zinc-400">
          <div className="flex items-center gap-4">
            <span><kbd className="rounded bg-white/10 px-1 py-0.5 font-mono text-[10px]">↑↓</kbd> navigate</span>
            <span><kbd className="rounded bg-white/10 px-1 py-0.5 font-mono text-[10px]">↵</kbd> select</span>
            <span><kbd className="rounded bg-white/10 px-1 py-0.5 font-mono text-[10px]">esc</kbd> close</span>
          </div>
          <span className="font-semibold text-zinc-300">Team JanHash Tacklers</span>
        </div>

      </div>
    </div>
  );
}
