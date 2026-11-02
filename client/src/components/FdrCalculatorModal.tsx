import { useState } from 'react';
import { Calculator, CheckCircle2, X, ShieldCheck } from 'lucide-react';
import { inr } from '../lib/format';
import { Button } from './ui';

interface Props {
  open: boolean;
  onClose: () => void;
}

const PRESETS = [
  { label: 'Engineering & Tech', principal: 1500000, tenureMonths: 120, rate: 7.1, norm: 1500000 },
  { label: 'Management (MBA)', principal: 1000000, tenureMonths: 96, rate: 7.0, norm: 1000000 },
  { label: 'Pharmacy / Arch.', principal: 800000, tenureMonths: 96, rate: 6.9, norm: 800000 },
  { label: 'Polytechnic / Diploma', principal: 500000, tenureMonths: 60, rate: 6.8, norm: 500000 },
];

export function FdrCalculatorModal({ open, onClose }: Props) {
  const [principal, setPrincipal] = useState<number>(1500000);
  const [rate, setRate] = useState<number>(7.1);
  const [tenureMonths, setTenureMonths] = useState<number>(120);
  const [normRequirement, setNormRequirement] = useState<number>(1500000);

  if (!open) return null;

  // Compound interest calculation: Quarterly compounding (n = 4) standard in Indian Scheduled Banks
  const years = tenureMonths / 12;
  const n = 4;
  const r = rate / 100;
  const maturityAmount = Math.round(principal * Math.pow(1 + r / n, n * years));
  const interestEarned = Math.max(0, maturityAmount - principal);
  const surplus = maturityAmount - normRequirement;
  const isCompliant = principal >= normRequirement;

  const applyPreset = (p: typeof PRESETS[number]) => {
    setPrincipal(p.principal);
    setRate(p.rate);
    setTenureMonths(p.tenureMonths);
    setNormRequirement(p.norm);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity" onClick={onClose} />
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-[#09090b] shadow-2xl p-6 sm:p-7 text-ink z-10 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-white/10 text-white border border-white/15">
              <Calculator className="size-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">AICTE Deposit & Yield Calculator</h2>
                <span className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-zinc-300">Norm Simulator</span>
              </div>
              <p className="text-xs text-zinc-400">Quarterly compounding simulation for AICTE Joint FDRs & Bank Guarantees</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/5 hover:text-white transition">
            <X className="size-5" />
          </button>
        </div>

        {/* Quick Presets */}
        <div className="mt-5">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">AICTE Approval Norm Presets</label>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => applyPreset(p)}
                className="flex flex-col items-start rounded-xl border border-white/5 bg-[#111114] p-2.5 text-left transition hover:border-white/20 hover:bg-[#16161a]"
              >
                <span className="text-xs font-semibold text-white">{p.label}</span>
                <span className="text-[11px] text-zinc-400">{inr(p.principal)}</span>
                <span className="text-[10px] text-zinc-500">{p.tenureMonths / 12} yrs @ {p.rate}%</span>
              </button>
            ))}
          </div>
        </div>

        {/* Inputs */}
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-zinc-300">Principal Deposit (₹)</label>
            <div className="relative mt-1">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500">₹</span>
              <input
                type="number"
                value={principal}
                onChange={(e) => setPrincipal(Number(e.target.value) || 0)}
                className="h-10 w-full rounded-xl border border-white/10 bg-[#111114] pl-7 pr-3 text-sm text-white focus:border-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300">Annual Interest Rate (% p.a.)</label>
            <div className="relative mt-1">
              <input
                type="number"
                step="0.05"
                value={rate}
                onChange={(e) => setRate(Number(e.target.value) || 0)}
                className="h-10 w-full rounded-xl border border-white/10 bg-[#111114] px-3 pr-8 text-sm text-white focus:border-white focus:outline-none"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500">%</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300">Tenure (Months) — {tenureMonths / 12} Years</label>
            <div className="mt-1 flex items-center gap-3">
              <input
                type="range"
                min="12"
                max="180"
                step="6"
                value={tenureMonths}
                onChange={(e) => setTenureMonths(Number(e.target.value))}
                className="h-2 flex-1 cursor-pointer accent-white"
              />
              <span className="w-14 rounded-lg bg-[#111114] px-2 py-1 text-center font-mono text-xs text-white border border-white/5">
                {tenureMonths}m
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300">Norm Minimum Requirement (₹)</label>
            <div className="relative mt-1">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500">₹</span>
              <input
                type="number"
                value={normRequirement}
                onChange={(e) => setNormRequirement(Number(e.target.value) || 0)}
                className="h-10 w-full rounded-xl border border-white/10 bg-[#111114] pl-7 pr-3 text-sm text-white focus:border-white focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Results Matrix */}
        <div className="mt-6 rounded-xl border border-white/10 bg-[#111114] p-4 sm:p-5">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-zinc-400">Maturity Value</span>
              <div className="mt-1 text-xl sm:text-2xl font-bold text-white tnum tracking-tight">{inr(maturityAmount)}</div>
              <span className="text-[10px] text-zinc-500">Estimated value at term</span>
            </div>

            <div>
              <span className="text-[11px] uppercase tracking-wider text-zinc-400">Total Interest Accrued</span>
              <div className="mt-1 text-xl sm:text-2xl font-bold text-emerald-400 tnum tracking-tight">+{inr(interestEarned)}</div>
              <span className="text-[10px] text-zinc-500">Quarterly compounding</span>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <span className="text-[11px] uppercase tracking-wider text-zinc-400">Statutory Norm Coverage</span>
              <div className="mt-1 flex items-center gap-1.5">
                {isCompliant ? (
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 className="size-3.5" /> Compliant
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/10 px-2 py-0.5 text-xs font-semibold text-rose-400 border border-rose-500/20">
                    Deficit ({inr(normRequirement - principal)})
                  </span>
                )}
              </div>
              <span className="text-[10px] text-zinc-500">
                {surplus >= 0 ? `+${inr(surplus)} over norm` : 'Shortfall against norms'}
              </span>
            </div>
          </div>
        </div>

        {/* Action bar */}
        <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-4 text-xs text-zinc-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="size-4 text-white" />
            <span>AICTE Regulation Bureau Norms (APH 2026-27)</span>
          </div>
          <Button variant="primary" size="sm" onClick={onClose}>
            Done
          </Button>
        </div>

      </div>
    </div>
  );
}
