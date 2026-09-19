'use client';

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  DollarSign,
  Leaf,
  Battery,
  Calendar,
  Zap,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import { HourlyEnergyPoint } from '@/lib/types';

export default function YieldArbitragePage() {
  const [timeRange, setTimeRange] = useState<'DAY' | 'WEEK' | 'MONTH' | 'YEAR'>('DAY');
  const [hourlyData, setHourlyData] = useState<HourlyEnergyPoint[]>([]);

  useEffect(() => {
    fetch('/api/deye/history')
      .then((r) => r.json())
      .then((json) => {
        if (json.data) setHourlyData(json.data);
      })
      .catch((err) => console.error(err));
  }, []);

  const historyRows = [
    { date: 'Today (Live)', yieldKwh: 486.2, selfConsPct: 82.4, gridExportKwh: 85.5, peakSavedUsd: 184.20, roiScore: '+24.2%' },
    { date: 'Yesterday', yieldKwh: 512.4, selfConsPct: 78.9, gridExportKwh: 108.2, peakSavedUsd: 198.50, roiScore: '+26.1%' },
    { date: 'Sep 13, 2026', yieldKwh: 479.8, selfConsPct: 84.1, gridExportKwh: 76.2, peakSavedUsd: 176.40, roiScore: '+22.8%' },
    { date: 'Sep 12, 2026', yieldKwh: 520.1, selfConsPct: 80.5, gridExportKwh: 101.4, peakSavedUsd: 204.80, roiScore: '+27.4%' },
    { date: 'Sep 11, 2026', yieldKwh: 495.6, selfConsPct: 81.2, gridExportKwh: 93.1, peakSavedUsd: 189.10, roiScore: '+25.0%' },
  ];

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1600px] mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-2 border-b border-[#222a3d]">
        <div>
          <h1 className="font-headline-lg text-[26px] text-on-surface font-bold flex items-center gap-2.5">
            <TrendingUp className="text-primary" size={26} />
            Yield Analytics & Time-of-Use Arbitrage
          </h1>
          <p className="font-body-sm text-[13px] text-on-surface-variant mt-0.5">
            Tariff delta optimization, smart battery peak-shaving, and historical revenue generation.
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="flex items-center gap-1 p-1 bg-surface-container rounded-xl border border-[#222a3d]">
          {(['DAY', 'WEEK', 'MONTH', 'YEAR'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3.5 py-1.5 rounded-lg text-[12px] font-label-sm font-semibold transition-all ${
                timeRange === range
                  ? 'bg-primary text-on-primary shadow-[0_0_12px_rgba(255,193,116,0.4)]'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* 4 Primary Financial & Yield KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Peak Shaved Savings */}
        <div className="bg-surface-container p-5 rounded-2xl border border-tertiary/40 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="font-label-sm text-[11px] text-on-surface-variant uppercase tracking-wider">
              Today Arbitrage Savings
            </span>
            <span className="p-2 rounded-xl bg-tertiary/10 text-tertiary">
              <DollarSign size={18} />
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-telemetry-display text-[32px] text-tertiary font-bold">
              $184.20
            </span>
            <span className="font-label-sm text-[12px] text-tertiary font-bold">+18.4%</span>
          </div>
          <span className="font-label-sm text-[11px] text-on-surface-variant mt-2 block">
            Grid peak tariff ($0.36/kWh) avoided via battery
          </span>
        </div>

        {/* Monthly Projection */}
        <div className="bg-surface-container p-5 rounded-2xl border border-primary/40 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="font-label-sm text-[11px] text-on-surface-variant uppercase tracking-wider">
              Projected Monthly Savings
            </span>
            <span className="p-2 rounded-xl bg-primary/10 text-primary">
              <Sparkles size={18} />
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-telemetry-display text-[32px] text-primary font-bold">
              $5,480.00
            </span>
            <span className="font-label-sm text-[12px] text-primary font-bold">Est</span>
          </div>
          <span className="font-label-sm text-[11px] text-on-surface-variant mt-2 block">
            Annualized ROI: 3.2 Years Payback
          </span>
        </div>

        {/* Battery Roundtrip Efficiency */}
        <div className="bg-surface-container p-5 rounded-2xl border border-secondary/40 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="font-label-sm text-[11px] text-on-surface-variant uppercase tracking-wider">
              Roundtrip ESS Health
            </span>
            <span className="p-2 rounded-xl bg-secondary/10 text-secondary">
              <Battery size={18} />
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-telemetry-display text-[32px] text-secondary font-bold">
              94.8%
            </span>
            <span className="font-label-sm text-[12px] text-secondary font-bold">Nominal</span>
          </div>
          <span className="font-label-sm text-[11px] text-on-surface-variant mt-2 block">
            1,240 Cycles | DOD clamped at 85%
          </span>
        </div>

        {/* Carbon Offset */}
        <div className="bg-surface-container p-5 rounded-2xl border border-tertiary/40 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="font-label-sm text-[11px] text-on-surface-variant uppercase tracking-wider">
              Carbon Offset Index
            </span>
            <span className="p-2 rounded-xl bg-tertiary/10 text-tertiary">
              <Leaf size={18} />
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-telemetry-display text-[32px] text-tertiary font-bold">
              14.8
            </span>
            <span className="font-telemetry-unit text-[14px] text-on-surface-variant">Tons CO₂e</span>
          </div>
          <span className="font-label-sm text-[11px] text-on-surface-variant mt-2 block">
            Equivalent to 380 trees planted
          </span>
        </div>
      </div>

      {/* Comparative Area Visualizer: Generation vs Facility Demand */}
      <div className="bg-surface-container-low rounded-2xl border border-[#222a3d] p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#222a3d]">
          <div>
            <h2 className="font-headline-sm text-[17px] text-on-surface font-bold flex items-center gap-2">
              <Zap size={18} className="text-primary" />
              Diurnal Curve: Solar Generation vs Industrial Load Profile
            </h2>
            <span className="font-body-sm text-[12px] text-on-surface-variant">
              Orange = Solar PV Production (kW) | Blue = Facility Consumption (kW) | Green = Battery Arbitrage
            </span>
          </div>
          <div className="flex items-center gap-4 text-[12px] font-label-sm">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-primary" /> Solar Harvest
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-secondary" /> Facility Demand
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-tertiary" /> Battery Arbitrage
            </span>
          </div>
        </div>

        {/* 24-Hour Bar / Timeline Visualizer */}
        <div className="grid grid-cols-6 md:grid-cols-12 gap-2 py-4">
          {(hourlyData.length > 0 ? hourlyData : [
            { hour: '00:00', solarYieldKw: 0, loadDemandKw: 45, batteryFlowKw: -20, tariffRateUsd: 0.14 },
            { hour: '02:00', solarYieldKw: 0, loadDemandKw: 42, batteryFlowKw: -18, tariffRateUsd: 0.14 },
            { hour: '04:00', solarYieldKw: 0, loadDemandKw: 48, batteryFlowKw: -22, tariffRateUsd: 0.14 },
            { hour: '06:00', solarYieldKw: 24.5, loadDemandKw: 55, batteryFlowKw: -15, tariffRateUsd: 0.14 },
            { hour: '08:00', solarYieldKw: 78.2, loadDemandKw: 68, batteryFlowKw: 10.2, tariffRateUsd: 0.14 },
            { hour: '10:00', solarYieldKw: 104.8, loadDemandKw: 72, batteryFlowKw: 22.5, tariffRateUsd: 0.14 },
            { hour: '12:00', solarYieldKw: 115.0, loadDemandKw: 65, batteryFlowKw: 28.0, tariffRateUsd: 0.14 },
            { hour: '14:00', solarYieldKw: 108.4, loadDemandKw: 58, batteryFlowKw: 24.0, tariffRateUsd: 0.36 },
            { hour: '16:00', solarYieldKw: 82.5, loadDemandKw: 62, batteryFlowKw: 12.0, tariffRateUsd: 0.36 },
            { hour: '18:00', solarYieldKw: 31.4, loadDemandKw: 70, batteryFlowKw: -30.0, tariffRateUsd: 0.36 },
            { hour: '20:00', solarYieldKw: 0, loadDemandKw: 64, batteryFlowKw: -25.0, tariffRateUsd: 0.36 },
            { hour: '22:00', solarYieldKw: 0, loadDemandKw: 50, batteryFlowKw: -20.0, tariffRateUsd: 0.14 },
          ]).map((pt, i) => {
            const solarHeight = Math.min(100, (pt.solarYieldKw / 120) * 100);
            const loadHeight = Math.min(100, (pt.loadDemandKw / 120) * 100);
            const isPeak = pt.tariffRateUsd > 0.25;

            return (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="h-44 w-full bg-surface-container rounded-xl p-1 flex items-end justify-center gap-1 relative overflow-hidden border border-[#222a3d]">
                  {isPeak && (
                    <div className="absolute top-1 left-0 right-0 text-center">
                      <span className="font-label-sm text-[8px] text-tertiary uppercase font-bold bg-tertiary/15 px-1 py-0.2 rounded">
                        PEAK
                      </span>
                    </div>
                  )}
                  {/* Solar Column */}
                  <div
                    className="w-2.5 bg-primary rounded-t transition-all duration-500 shadow-[0_0_8px_rgba(255,193,116,0.3)]"
                    style={{ height: `${solarHeight}%` }}
                    title={`Solar: ${pt.solarYieldKw} kW`}
                  />
                  {/* Load Column */}
                  <div
                    className="w-2.5 bg-secondary/80 rounded-t transition-all duration-500"
                    style={{ height: `${loadHeight}%` }}
                    title={`Load: ${pt.loadDemandKw} kW`}
                  />
                </div>
                <span className="font-label-sm text-[10px] text-on-surface-variant">
                  {pt.hour}
                </span>
                <span className="font-mono text-[9px] text-on-surface-variant font-bold">
                  {pt.solarYieldKw > 0 ? `${pt.solarYieldKw}k` : '-'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Historical Yield & Arbitrage Table */}
      <div className="bg-surface-container rounded-2xl border border-[#222a3d] p-6 shadow-md">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#222a3d]">
          <span className="font-headline-sm text-[16px] text-on-surface font-semibold">
            Historical Generation & Arbitrage Log
          </span>
          <span className="font-label-sm text-[11px] text-on-surface-variant">
            Exported to Directus ERP Ledger
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-[#222a3d] text-on-surface-variant font-label-sm text-[11px] uppercase">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Solar Yield</th>
                <th className="py-2.5 px-3">Self-Consumption</th>
                <th className="py-2.5 px-3">Grid Feed-In</th>
                <th className="py-2.5 px-3">Peak Shaved</th>
                <th className="py-2.5 px-3 text-right">Net ROI Performance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222a3d]/50 font-body-sm">
              {historyRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-surface-container-high transition-colors">
                  <td className="py-3 px-3 font-semibold text-on-surface">{row.date}</td>
                  <td className="py-3 px-3 font-telemetry-display text-primary font-bold">
                    {row.yieldKwh.toFixed(1)} kWh
                  </td>
                  <td className="py-3 px-3 font-telemetry-display text-on-surface">
                    {row.selfConsPct.toFixed(1)}%
                  </td>
                  <td className="py-3 px-3 font-telemetry-display text-tertiary">
                    +{row.gridExportKwh.toFixed(1)} kWh
                  </td>
                  <td className="py-3 px-3 font-telemetry-display text-tertiary font-bold">
                    ${row.peakSavedUsd.toFixed(2)}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span className="px-2 py-0.5 rounded bg-tertiary/15 text-tertiary font-label-sm text-[11px] font-bold">
                      {row.roiScore}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
