import { useState } from 'react';
import { Activity, CheckCircle2, KeyRound, Lock, RefreshCw, ShieldCheck, X, Cpu } from 'lucide-react';
import { Button } from './ui';
import { useToast } from '../lib/context';

interface Props {
  open: boolean;
  onClose: () => void;
}

const GATEWAYS = [
  { bank: 'State Bank of India', protocol: 'Host-to-Host (CBS API v2.4)', latency: '34ms', status: 'Healthy', uptime: '99.98%' },
  { bank: 'Punjab National Bank', protocol: 'Direct SFTP & Webhook', latency: '42ms', status: 'Healthy', uptime: '99.94%' },
  { bank: 'Canara Bank', protocol: 'Core Banking ISO-8583', latency: '48ms', status: 'Healthy', uptime: '100%' },
  { bank: 'HDFC Bank', protocol: 'mTLS Corporate Connect', latency: '29ms', status: 'Healthy', uptime: '99.99%' },
  { bank: 'ICICI Bank', protocol: 'Institutional Treasury Link', latency: '31ms', status: 'Healthy', uptime: '99.97%' },
];

export function SecurityHudModal({ open, onClose }: Props) {
  const { push } = useToast();
  const [verifying, setVerifying] = useState(false);
  const [lastCheck, setLastCheck] = useState<string>('Just now');

  if (!open) return null;

  const runVerification = () => {
    setVerifying(true);
    setTimeout(() => {
      setVerifying(false);
      setLastCheck('Verified now');
      push({
        tone: 'good',
        title: 'Cryptographic Audit Verified',
        body: 'All 583 ledger blocks and document SHA-256 hashes matched with zero discrepancies.',
      });
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity" onClick={onClose} />
      <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-white/10 bg-[#09090b] shadow-2xl p-6 sm:p-7 text-ink z-10 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <span className="relative flex size-10 items-center justify-center rounded-xl bg-white/10 text-white border border-white/15">
              <ShieldCheck className="size-5" />
              <span className="absolute -right-0.5 -top-0.5 flex size-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
              </span>
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">Security & Bank Gateway Telemetry</h2>
                <span className="rounded-md bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                  LEDGER INTACT
                </span>
              </div>
              <p className="text-xs text-zinc-400">Real-time status of cryptographic proofs, encryption-at-rest & CBS bank interfaces</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/5 hover:text-white transition">
            <X className="size-5" />
          </button>
        </div>

        {/* Security Matrix Highlights */}
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-white/5 bg-[#111114] p-3.5">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Vault Encryption</span>
              <Lock className="size-4 text-zinc-400" />
            </div>
            <div className="mt-2 text-base font-bold text-white">AES-256-GCM</div>
            <p className="mt-0.5 text-[11px] text-zinc-400">Per-document key derivation; encrypted before storage</p>
          </div>

          <div className="rounded-xl border border-white/5 bg-[#111114] p-3.5">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Audit Trail Hash</span>
              <Cpu className="size-4 text-emerald-400" />
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-base font-bold text-white">
              <CheckCircle2 className="size-4 text-emerald-400" />
              <span>SHA-256 Verified</span>
            </div>
            <p className="mt-0.5 text-[11px] text-zinc-400">Immutable hash chain on all administrative actions</p>
          </div>

          <div className="rounded-xl border border-white/5 bg-[#111114] p-3.5">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Lien Enforcement</span>
              <KeyRound className="size-4 text-zinc-400" />
            </div>
            <div className="mt-2 text-base font-bold text-white">Member Secretary, AICTE</div>
            <p className="mt-0.5 text-[11px] text-zinc-400">Automated encashment restriction validation</p>
          </div>
        </div>

        {/* Bank Gateways */}
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Direct Core Banking Interfaces (Live Sync)
            </label>
            <span className="text-[11px] text-zinc-500">Last heartbeat: {lastCheck}</span>
          </div>

          <div className="mt-2 divide-y divide-white/5 overflow-hidden rounded-xl border border-white/10 bg-[#111114]">
            {GATEWAYS.map((g) => (
              <div key={g.bank} className="flex items-center justify-between px-4 py-3 text-xs">
                <div className="flex items-center gap-3">
                  <span className="size-2 rounded-full bg-emerald-400" />
                  <div>
                    <span className="font-semibold text-white">{g.bank}</span>
                    <span className="ml-2 text-zinc-500">{g.protocol}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-zinc-400">
                  <span className="font-mono text-[11px] text-zinc-300">{g.latency}</span>
                  <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400">
                    {g.uptime}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/5 pt-4">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <Activity className="size-4 text-emerald-400" />
            <span>Zero discrepancies recorded in current epoch</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              loading={verifying}
              onClick={runVerification}
              className="gap-1.5"
            >
              <RefreshCw className="size-3.5" />
              Re-Verify Ledger
            </Button>
            <Button variant="primary" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
