import React, { useState } from 'react';
import {
  Calculator,
  TrendingUp,
  Info,
  DollarSign,
  ArrowRight,
  HelpCircle,
  ShieldAlert,
} from 'lucide-react';
import { formatINR } from '../../lib/utils';

export const InterestAnalyticsPage: React.FC = () => {
  const [principal, setPrincipal] = useState<number>(3500000);
  const [currentRate, setCurrentRate] = useState<number>(6.5);
  const [altRate, setAltRate] = useState<number>(7.35);
  const [days, setDays] = useState<number>(365);

  // Calculations
  const rateDiff = altRate - currentRate;
  const currentInterest = (principal * (currentRate / 100) * days) / 365;
  const altInterest = (principal * (altRate / 100) * days) / 365;
  const interestDifference = (principal * (rateDiff / 100) * days) / 365;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Calculator className="w-5 h-5 text-gov-navy" />
          <span>Statutory Security Deposit &bull; Interest Impact Analytics</span>
        </h1>
        <p className="text-xs text-slate-600 mt-0.5">
          Evaluate treasury yield differential and opportunity cost across bank rate schedules
        </p>
      </div>

      {/* Calculator Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Inputs (5 cols) */}
        <div className="md:col-span-5 bg-white rounded-lg border border-slate-200 shadow-2xs p-5 space-y-4 text-xs">
          <div className="border-b border-slate-100 pb-3 font-bold text-slate-900 uppercase tracking-wide text-xs">
            Deposit Parameters
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Principal Deposit Amount (INR):
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-slate-500 font-bold">₹</span>
              <input
                type="number"
                step="50000"
                value={principal}
                onChange={(e) => setPrincipal(Number(e.target.value))}
                className="w-full pl-7 pr-3 py-2 border border-slate-300 rounded font-semibold text-slate-900 focus:border-gov-navy"
              />
            </div>
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              Formatted: {formatINR(principal)}
            </span>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Current Assumed Annual Rate (% p.a.):
            </label>
            <input
              type="number"
              step="0.05"
              value={currentRate}
              onChange={(e) => setCurrentRate(Number(e.target.value))}
              className="w-full p-2 border border-slate-300 rounded text-slate-900 focus:border-gov-navy"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Alternative Proposed Rate (% p.a.):
            </label>
            <input
              type="number"
              step="0.05"
              value={altRate}
              onChange={(e) => setAltRate(Number(e.target.value))}
              className="w-full p-2 border border-slate-300 rounded text-slate-900 focus:border-gov-navy"
            />
            <span className="text-[10px] text-emerald-700 font-semibold mt-0.5 block">
              Differential Spread: {rateDiff >= 0 ? `+${rateDiff.toFixed(2)}%` : `${rateDiff.toFixed(2)}%`}
            </span>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Duration / Tenure Horizon (Days):
            </label>
            <input
              type="number"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="w-full p-2 border border-slate-300 rounded text-slate-900 focus:border-gov-navy"
            />
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              Approx. {(days / 365).toFixed(2)} years
            </span>
          </div>
        </div>

        {/* Right Output & Formula Card (7 cols) */}
        <div className="md:col-span-7 space-y-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-2xs p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-2">
              Yield Differential Summary (Estimated)
            </h3>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-50 p-3.5 rounded border border-slate-200">
                <span className="text-slate-500 block font-medium">Estimated Interest (Current Rate):</span>
                <span className="text-lg font-bold text-slate-800 mt-1 block">
                  {formatINR(currentInterest)}
                </span>
                <span className="text-[10px] text-slate-500">at {currentRate}% for {days} days</span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded border border-slate-200">
                <span className="text-slate-500 block font-medium">Estimated Interest (Alternative):</span>
                <span className="text-lg font-bold text-emerald-800 mt-1 block">
                  {formatINR(altInterest)}
                </span>
                <span className="text-[10px] text-slate-500">at {altRate}% for {days} days</span>
              </div>
            </div>

            {/* Impact Highlight */}
            <div className="bg-emerald-50 border border-emerald-300 rounded-lg p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider block">
                  Estimated Interest Gain / Difference:
                </span>
                <span className="text-2xl font-black text-emerald-900 mt-0.5 block">
                  {interestDifference >= 0 ? `+${formatINR(interestDifference)}` : formatINR(interestDifference)}
                </span>
              </div>
              <TrendingUp className="w-8 h-8 text-emerald-600" />
            </div>

            {/* Formula Explanation */}
            <div className="bg-slate-50 rounded p-3 text-[11px] text-slate-700 space-y-1 font-mono">
              <span className="font-sans font-bold text-slate-800 block text-[10px] uppercase">
                Mathematical Model Used:
              </span>
              <p className="font-semibold text-gov-navy">
                Interest Difference = Principal &times; ((R_alt - R_curr) / 100) &times; (Days / 365)
              </p>
              <p className="text-[10px] text-slate-500 font-sans mt-1">
                = {formatINR(principal)} &times; ({rateDiff.toFixed(2)}% / 100) &times; ({days} / 365) ={' '}
                <strong className="text-slate-900">{formatINR(interestDifference)}</strong>
              </p>
            </div>
          </div>

          {/* Statutory Advisory Limitations */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-xs text-amber-950 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-amber-900">
              <ShieldAlert className="w-4 h-4 text-amber-700" />
              <span>Assumptions & Non-Advisory Disclaimer:</span>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-900">
              The calculations displayed are simple-interest mathematical illustrations based on assumed constant annualized yields. They do not constitute financial advice, guaranteed bank quotes, or regulatory endorsement. Actual fixed deposit compounding intervals (quarterly, cumulative, or monthly payout) depend on respective scheduled commercial bank terms.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
