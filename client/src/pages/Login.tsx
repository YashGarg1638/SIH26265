import { useEffect, useState } from 'react';
import { BadgeCheck, BellRing, ScanText, ShieldCheck } from 'lucide-react';
import { api, DEMO } from '../lib/api';
import { useAuth } from '../lib/context';
import { Button, ErrorBox, Field, Input } from '../components/ui';
import { LogoMark } from '../components/Layout';

interface Demo { username: string; name: string; designation: string; role: string; institution_name: string | null }

const FEATURES = [
  { icon: ScanText, title: 'Reads the FDR', body: 'Fields are read straight from the uploaded instrument, so nothing is typed twice.' },
  { icon: BadgeCheck, title: 'Bank-confirmed, not just declared', body: 'Every field shows what the institution said, what the document says and what the bank confirms.' },
  { icon: BellRing, title: 'Never misses a maturity', body: 'Reminders from 90 days out, then escalation up to the Competent Authority.' },
  { icon: ShieldCheck, title: 'Controlled release', body: 'Checklist, maker-checker approval and a tamper-evident audit trail.' },
];

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  const [demo, setDemo] = useState<Demo[]>([]);
  useEffect(() => { api<Demo[]>('/auth/demo-accounts').then(setDemo).catch(() => {}); }, []);

  const submit = async (u = username, p = password) => {
    setBusy(true); setError(null);
    try { await login(u, p); } catch (e) { setError(e); } finally { setBusy(false); }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-3 sm:p-8">
      <div className="grid w-full max-w-[1140px] grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[1.1fr_1fr]">
        <div className="relative hidden min-h-[620px] flex-col overflow-hidden rounded-2xl p-10 lg:flex bg-[#09090b] border border-white/10 shadow-2xl">
          <div className="relative z-10 flex items-center justify-between">
            <LogoMark className="size-10" />
            <span className="rounded-md bg-white/5 px-2.5 py-1 text-[11px] font-medium text-white/70 border border-white/10">AICTE · Regulation Bureau</span>
          </div>
          <div className="relative z-10 my-auto">
            <span className="rounded-md bg-accent/15 border border-accent/30 px-2.5 py-1 text-[11px] font-semibold text-accent-strong uppercase tracking-wider">SD / FDR Portal</span>
            <h1 className="mt-5 text-[42px] font-bold leading-[1.1] tracking-tight text-white">Every deposit<br />bank-confirmed.<br /><span className="text-accent-strong">Every maturity watched.</span></h1>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-white/60">Submit, verify, track and release security deposits and FDRs in one place — with the bank's own record beside every field.</p>
          </div>
          <ul className="relative z-10 grid grid-cols-2 gap-3">
            {FEATURES.map((f) => (
              <li key={f.title} className="flex gap-3 rounded-xl bg-white/[0.03] border border-white/5 p-3.5 transition-colors hover:border-white/10">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-accent-strong border border-white/10"><f.icon className="size-4" strokeWidth={2} /></span>
                <div className="text-xs leading-relaxed text-white/60"><span className="block font-medium text-white">{f.title}</span>{f.body}</div>
              </li>
            ))}
          </ul>
        </div>

        <div className="glass min-w-0 rounded-2xl px-5 py-10 sm:px-12 border border-border shadow-xl">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <LogoMark className="size-10" />
            <div>
              <div className="eyebrow text-ink-3">AICTE</div>
              <div className="text-lg font-bold">SD/FDR Portal</div>
            </div>
          </div>
          <form className="mx-auto max-w-sm" onSubmit={(e) => { e.preventDefault(); submit(); }}>
            <h2 className="text-[26px] font-bold tracking-tight">Sign in</h2>
            <p className="eyebrow mt-1 text-ink-3">AICTE officials and registered institutions</p>
            {DEMO && <p className="mt-5 rounded-lg bg-surface-2 border border-border px-3.5 py-2.5 text-xs leading-relaxed text-ink-2">Live demo: runs entirely in your browser with synthetic data. Pick a demo account below.</p>}
            <div className="mt-6 space-y-4">
              <Field label="Username"><Input autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} required /></Field>
              <Field label="Password"><Input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required /></Field>
              <ErrorBox error={error} />
              <Button variant="primary" className="w-full" loading={busy} type="submit">Sign in</Button>
            </div>
          </form>
          {!!demo.length && (
            <div className="mx-auto mt-9 max-w-sm">
              <div className="mb-3 flex items-baseline justify-between text-xs text-ink-3"><span className="font-semibold text-ink-2">Demo accounts</span><span>password&nbsp;<code className="text-accent-strong font-mono">Aicte@2026</code></span></div>
              <div className="space-y-2">
                {demo.map((d) => (
                  <button key={d.username} onClick={() => submit(d.username, 'Aicte@2026')} disabled={busy}
                    className="group flex w-full items-center gap-3 rounded-xl border border-border bg-tile px-3.5 py-2.5 text-left transition hover:border-accent/40 hover:bg-surface-2">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-3 text-[11px] font-bold text-ink-2 group-hover:bg-accent group-hover:text-accent-ink transition-colors">{d.username.slice(0, 2).toUpperCase()}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-semibold text-ink">{d.role === 'institution' ? 'Institution login' : d.designation}</span>
                      <span className="block truncate text-[11px] text-ink-3">{d.username} · {d.role === 'institution' ? d.institution_name : d.name}</span>
                    </span>
                    <span className="text-ink-3 transition group-hover:translate-x-0.5 group-hover:text-accent-strong">→</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          <p className="mt-8 text-center text-[11px] text-muted">SIH26265 · Team JanHash Tacklers</p>
        </div>
      </div>
    </div>
  );
}
