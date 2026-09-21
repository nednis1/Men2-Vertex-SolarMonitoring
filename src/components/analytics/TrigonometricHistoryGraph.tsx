'use client';

import React, { useState, useMemo } from 'react';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts';
import {
  Activity,
  Waves,
  Sun,
  Zap,
  RotateCw,
  Compass,
  Sliders,
  CheckCircle2,
  TrendingUp,
  Info,
  Calendar,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  HourlySolarPoint,
  calculateSinusoidalFit,
  calculateFourierDecomposition,
  calculatePolarCyclicalPoints,
  generateThreePhaseACWaveforms,
} from '@/lib/trigonometric-math';

// Default representative 24-hour diurnal dataset
const DEFAULT_HOURLY_DATA: HourlySolarPoint[] = [
  { hour: '00:00', hourDecimal: 0, solarYieldKw: 0, loadDemandKw: 42, batteryFlowKw: -20, gridExportKw: 0 },
  { hour: '01:00', hourDecimal: 1, solarYieldKw: 0, loadDemandKw: 40, batteryFlowKw: -18, gridExportKw: 0 },
  { hour: '02:00', hourDecimal: 2, solarYieldKw: 0, loadDemandKw: 39, batteryFlowKw: -18, gridExportKw: 0 },
  { hour: '03:00', hourDecimal: 3, solarYieldKw: 0, loadDemandKw: 41, batteryFlowKw: -19, gridExportKw: 0 },
  { hour: '04:00', hourDecimal: 4, solarYieldKw: 0, loadDemandKw: 45, batteryFlowKw: -20, gridExportKw: 0 },
  { hour: '05:00', hourDecimal: 5, solarYieldKw: 0, loadDemandKw: 50, batteryFlowKw: -22, gridExportKw: 0 },
  { hour: '06:00', hourDecimal: 6, solarYieldKw: 12.5, loadDemandKw: 56, batteryFlowKw: -12, gridExportKw: 0 },
  { hour: '07:00', hourDecimal: 7, solarYieldKw: 38.2, loadDemandKw: 62, batteryFlowKw: 4.5, gridExportKw: 0 },
  { hour: '08:00', hourDecimal: 8, solarYieldKw: 68.4, loadDemandKw: 68, batteryFlowKw: 12.0, gridExportKw: 5.4 },
  { hour: '09:00', hourDecimal: 9, solarYieldKw: 92.1, loadDemandKw: 72, batteryFlowKw: 22.0, gridExportKw: 12.2 },
  { hour: '10:00', hourDecimal: 10, solarYieldKw: 108.6, loadDemandKw: 74, batteryFlowKw: 28.5, gridExportKw: 18.0 },
  { hour: '11:00', hourDecimal: 11, solarYieldKw: 116.8, loadDemandKw: 70, batteryFlowKw: 30.0, gridExportKw: 24.5 },
  { hour: '12:00', hourDecimal: 12, solarYieldKw: 119.5, loadDemandKw: 66, batteryFlowKw: 32.0, gridExportKw: 29.8 },
  { hour: '13:00', hourDecimal: 13, solarYieldKw: 115.2, loadDemandKw: 68, batteryFlowKw: 28.0, gridExportKw: 26.2 },
  { hour: '14:00', hourDecimal: 14, solarYieldKw: 104.5, loadDemandKw: 72, batteryFlowKw: 22.0, gridExportKw: 18.5 },
  { hour: '15:00', hourDecimal: 15, solarYieldKw: 88.0, loadDemandKw: 75, batteryFlowKw: 14.0, gridExportKw: 9.0 },
  { hour: '16:00', hourDecimal: 16, solarYieldKw: 64.2, loadDemandKw: 73, batteryFlowKw: 5.0, gridExportKw: 0 },
  { hour: '17:00', hourDecimal: 17, solarYieldKw: 34.0, loadDemandKw: 70, batteryFlowKw: -15.0, gridExportKw: 0 },
  { hour: '18:00', hourDecimal: 18, solarYieldKw: 9.8, loadDemandKw: 68, batteryFlowKw: -28.0, gridExportKw: 0 },
  { hour: '19:00', hourDecimal: 19, solarYieldKw: 0, loadDemandKw: 66, batteryFlowKw: -30.0, gridExportKw: 0 },
  { hour: '20:00', hourDecimal: 20, solarYieldKw: 0, loadDemandKw: 62, batteryFlowKw: -28.0, gridExportKw: 0 },
  { hour: '21:00', hourDecimal: 21, solarYieldKw: 0, loadDemandKw: 56, batteryFlowKw: -25.0, gridExportKw: 0 },
  { hour: '22:00', hourDecimal: 22, solarYieldKw: 0, loadDemandKw: 50, batteryFlowKw: -22.0, gridExportKw: 0 },
  { hour: '23:00', hourDecimal: 23, solarYieldKw: 0, loadDemandKw: 45, batteryFlowKw: -20.0, gridExportKw: 0 },
];

interface TrigonometricHistoryGraphProps {
  data?: HourlySolarPoint[];
  installedCapacityKw?: number;
  compact?: boolean;
}

export function TrigonometricHistoryGraph({
  data = DEFAULT_HOURLY_DATA,
  installedCapacityKw = 120,
  compact = false,
}: TrigonometricHistoryGraphProps) {
  const [activeTab, setActiveTab] = useState<'sinusoidal' | 'fourier' | 'polar' | 'waveform'>('sinusoidal');
  const [acVoltage, setAcVoltage] = useState(230);
  const [acCurrent, setAcCurrent] = useState(85);
  const [powerFactor, setPowerFactor] = useState(0.98);

  // 1. Sinusoidal Fit
  const fitResults = useMemo(() => {
    return calculateSinusoidalFit(data, installedCapacityKw);
  }, [data, installedCapacityKw]);

  // 2. Fourier Decomposition
  const fourierData = useMemo(() => {
    return calculateFourierDecomposition(data);
  }, [data]);

  // 3. Polar Cyclical Data
  const polarData = useMemo(() => {
    return calculatePolarCyclicalPoints(data);
  }, [data]);

  // 4. Three-Phase AC Waveform
  const acResults = useMemo(() => {
    return generateThreePhaseACWaveforms(acVoltage, acCurrent, 60.0, powerFactor, 64);
  }, [acVoltage, acCurrent, powerFactor]);

  return (
    <Card className="w-full border-border/60 bg-card/80 shadow-xs">
      <CardHeader className="pb-4 border-b border-border/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">
                <Waves className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg font-bold">
                  Trigonometric History & Waveform Analytics
                </CardTitle>
                <CardDescription className="text-xs">
                  Sinusoidal diurnal curve fitting, Fourier harmonic series, 24h polar radar cycle, and 3-phase AC waveforms.
                </CardDescription>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-cyan-500/30 text-cyan-500 bg-cyan-500/10 font-mono text-xs">
              R² = {fitResults.rSquared} Fit
            </Badge>
            <Badge variant="outline" className="border-amber-500/30 text-amber-500 bg-amber-500/10 font-mono text-xs">
              PSH: {fitResults.peakSunHours}h
            </Badge>
          </div>
        </div>

        {/* Subsystem Tabs */}
        <div className="pt-3">
          <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-full">
            <TabsList className="bg-muted/50 p-1 rounded-xl h-auto border border-border/50 inline-flex w-fit max-w-full overflow-x-auto">
              <TabsTrigger value="sinusoidal" className="text-xs gap-1.5 px-3 py-1.5">
                <Sun className="h-3.5 w-3.5 text-amber-500" />
                <span>Sinusoidal Curve Fit</span>
              </TabsTrigger>
              <TabsTrigger value="fourier" className="text-xs gap-1.5 px-3 py-1.5">
                <Waves className="h-3.5 w-3.5 text-cyan-500" />
                <span>Fourier Harmonics (24h)</span>
              </TabsTrigger>
              <TabsTrigger value="polar" className="text-xs gap-1.5 px-3 py-1.5">
                <Compass className="h-3.5 w-3.5 text-indigo-500" />
                <span>24h Polar / Radar Cycle</span>
              </TabsTrigger>
              <TabsTrigger value="waveform" className="text-xs gap-1.5 px-3 py-1.5">
                <Activity className="h-3.5 w-3.5 text-emerald-500" />
                <span>3-Phase AC Phasor</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        {/* ============================================================ */}
        {/* TAB 1: SINUSOIDAL DIURNAL CURVE FIT                          */}
        {/* ============================================================ */}
        {activeTab === 'sinusoidal' && (
          <div className="space-y-6">
            {/* KPI Metric Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-card border border-border/60">
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono block">
                  Sinusoidal Goodness R²
                </span>
                <span className="text-xl font-bold font-mono text-cyan-500">
                  {fitResults.rSquared}
                </span>
                <span className="text-[10px] text-muted-foreground block mt-0.5">
                  High Clear-Sky Correlation
                </span>
              </div>

              <div className="p-3 rounded-xl bg-card border border-border/60">
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono block">
                  Peak Sun Hours (PSH)
                </span>
                <span className="text-xl font-bold font-mono text-amber-500">
                  {fitResults.peakSunHours} h
                </span>
                <span className="text-[10px] text-muted-foreground block mt-0.5">
                  Standard 1 kW/m² Insolation
                </span>
              </div>

              <div className="p-3 rounded-xl bg-card border border-border/60">
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono block">
                  Solar Noon Phase Shift Δθ
                </span>
                <span className="text-xl font-bold font-mono text-foreground">
                  {fitResults.phaseShiftHours > 0 ? `+${fitResults.phaseShiftHours}` : fitResults.phaseShiftHours} h
                </span>
                <span className="text-[10px] text-muted-foreground block mt-0.5">
                  Offset from 12:00 Solar Zenith
                </span>
              </div>

              <div className="p-3 rounded-xl bg-card border border-border/60">
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono block">
                  Harvest Model Efficiency
                </span>
                <span className="text-xl font-bold font-mono text-emerald-500">
                  {fitResults.harvestEfficiencyPct}%
                </span>
                <span className="text-[10px] text-muted-foreground block mt-0.5">
                  Of Theoretical Clear-Sky Area
                </span>
              </div>
            </div>

            {/* Recharts Area / Line Chart for Sinusoidal Fit */}
            <div className="h-[320px] w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={fitResults.theoreticalPoints} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="solarActualGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="clearSkyGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="opacity-15" />
                  <XAxis dataKey="hour" stroke="currentColor" className="text-[10px] opacity-60" />
                  <YAxis stroke="currentColor" className="text-[10px] opacity-60" unit="kW" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(23, 31, 51, 0.95)',
                      borderRadius: '0.75rem',
                      border: '1px solid rgba(255,255,255,0.1)',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Area
                    type="monotone"
                    dataKey="actualSolarKw"
                    name="Actual Measured PV (kW)"
                    stroke="#f59e0b"
                    strokeWidth={2.5}
                    fill="url(#solarActualGradient)"
                  />
                  <Line
                    type="monotone"
                    dataKey="sinusoidalClearSkyKw"
                    name="Theoretical Half-Sine P(t) (kW)"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="residualKw"
                    name="Fit Residual Δ (kW)"
                    stroke="#a855f7"
                    strokeWidth={1.5}
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="p-3 rounded-xl bg-muted/40 border border-border/50 text-xs text-muted-foreground flex items-center gap-2">
              <Info className="h-4 w-4 text-cyan-500 shrink-0" />
              <span>
                <strong>Mathematical Model:</strong> P(t) = Pmax · sin(π(t - trise) / (tset - trise)). 
                Deviations from the half-sine curve highlight morning fog, inverter thermal power de-rating, or cloud transients.
              </span>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 2: FOURIER HARMONIC DECOMPOSITION                        */}
        {/* ============================================================ */}
        {activeTab === 'fourier' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-card border border-border/60">
              <div>
                <span className="text-xs font-semibold text-foreground">
                  Discrete Fourier Decomposition of 24-Hour Cycle
                </span>
                <p className="text-[11px] text-muted-foreground">
                  Fundamental frequency ω₀ = 2π/24h plus 12-hour (2ω) and 8-hour (3ω) diurnal harmonics.
                </p>
              </div>
              <Badge variant="outline" className="text-cyan-500 border-cyan-500/30 bg-cyan-500/10 font-mono text-xs w-fit">
                Harmonics k = 1, 2, 3
              </Badge>
            </div>

            <div className="h-[320px] w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={fourierData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="opacity-15" />
                  <XAxis dataKey="hour" stroke="currentColor" className="text-[10px] opacity-60" />
                  <YAxis stroke="currentColor" className="text-[10px] opacity-60" unit="kW" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(23, 31, 51, 0.95)',
                      borderRadius: '0.75rem',
                      border: '1px solid rgba(255,255,255,0.1)',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Line
                    type="monotone"
                    dataKey="actualSolarKw"
                    name="Actual Harvest (kW)"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="fundamentalHarmonicKw"
                    name="k=1 Fundamental Diurnal Wave (kW)"
                    stroke="#06b6d4"
                    strokeWidth={2.5}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="secondHarmonicKw"
                    name="k=2 12-Hour Asymmetry Wave (kW)"
                    stroke="#a855f7"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="fourierReconstructedKw"
                    name="Fourier Reconstructed Series (kW)"
                    stroke="#10b981"
                    strokeWidth={2}
                    strokeDasharray="2 2"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-card border border-border/60">
                <span className="font-semibold text-foreground block">k=1 Fundamental</span>
                <span className="text-[11px] text-muted-foreground mt-0.5 block">
                  Captures primary diurnal daylight vs nocturnal cycle.
                </span>
              </div>
              <div className="p-3 rounded-xl bg-card border border-border/60">
                <span className="font-semibold text-foreground block">k=2 Semi-Diurnal</span>
                <span className="text-[11px] text-muted-foreground mt-0.5 block">
                  Captures sharp daytime peak vs flat nighttime baseline.
                </span>
              </div>
              <div className="p-3 rounded-xl bg-card border border-border/60">
                <span className="font-semibold text-foreground block">Phase Alignment</span>
                <span className="text-[11px] text-muted-foreground mt-0.5 block">
                  Load Fundamental matches solar peak within 1.2h.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 3: 24-HOUR POLAR / RADAR CYCLICAL GRAPH                  */}
        {/* ============================================================ */}
        {activeTab === 'polar' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-card border border-border/60">
              <div>
                <span className="text-xs font-semibold text-foreground">
                  360-Degree Circular Phasor: Diurnal Lobe vs Load
                </span>
                <p className="text-[11px] text-muted-foreground">
                  Top (0°): Midnight | Right (90°): 06:00 Sunrise | Bottom (180°): 12:00 Solar Noon Peak | Left (270°): 18:00 Sunset.
                </p>
              </div>
              <Badge variant="outline" className="text-indigo-500 border-indigo-500/30 bg-indigo-500/10 font-mono text-xs w-fit">
                Polar Coordinates (r, θ)
              </Badge>
            </div>

            <div className="h-[360px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={polarData}>
                  <PolarGrid stroke="currentColor" className="opacity-20" />
                  <PolarAngleAxis dataKey="hourLabel" stroke="currentColor" className="text-[10px] opacity-70" />
                  <PolarRadiusAxis angle={30} domain={[0, 140]} stroke="currentColor" className="text-[9px] opacity-50" />
                  <Radar
                    name="Solar Generation (kW)"
                    dataKey="solarHarvestRadius"
                    stroke="#f59e0b"
                    fill="#f59e0b"
                    fillOpacity={0.35}
                  />
                  <Radar
                    name="Industrial Load Demand (kW)"
                    dataKey="loadDemandRadius"
                    stroke="#6366f1"
                    fill="#6366f1"
                    fillOpacity={0.2}
                  />
                  <Radar
                    name="Battery Energy Flow (kW)"
                    dataKey="batteryRadius"
                    stroke="#06b6d4"
                    fill="#06b6d4"
                    fillOpacity={0.25}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(23, 31, 51, 0.95)',
                      borderRadius: '0.75rem',
                      border: '1px solid rgba(255,255,255,0.1)',
                      fontSize: '12px',
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              The polar radar chart visualizes the distinct southern lobe of solar generation around 180° (Noon), with the load expanding during working hours and battery storage smoothing the evening transition.
            </p>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 4: 3-PHASE AC INSTANTANEOUS WAVEFORMS & PHASORS          */}
        {/* ============================================================ */}
        {activeTab === 'waveform' && (
          <div className="space-y-6">
            {/* Interactive Waveform Parameters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-card border border-border/60">
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                  Grid RMS Phase Voltage: {acVoltage} V
                </label>
                <input
                  type="range"
                  min="200"
                  max="260"
                  step="1"
                  value={acVoltage}
                  onChange={(e) => setAcVoltage(Number(e.target.value))}
                  className="w-full accent-primary cursor-pointer"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                  RMS Load Current: {acCurrent} A
                </label>
                <input
                  type="range"
                  min="20"
                  max="150"
                  step="1"
                  value={acCurrent}
                  onChange={(e) => setAcCurrent(Number(e.target.value))}
                  className="w-full accent-primary cursor-pointer"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                  Power Factor cos(φ): {powerFactor} (Phase: {acResults.metrics.phaseAngleDeg}°)
                </label>
                <input
                  type="range"
                  min="0.80"
                  max="1.00"
                  step="0.01"
                  value={powerFactor}
                  onChange={(e) => setPowerFactor(Number(e.target.value))}
                  className="w-full accent-primary cursor-pointer"
                />
              </div>
            </div>

            {/* Instantaneous Sine Waves Chart */}
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={acResults.waveform} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="opacity-15" />
                  <XAxis dataKey="timeMs" stroke="currentColor" className="text-[10px] opacity-60" unit="ms" />
                  <YAxis stroke="currentColor" className="text-[10px] opacity-60" unit="V" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(23, 31, 51, 0.95)',
                      borderRadius: '0.75rem',
                      border: '1px solid rgba(255,255,255,0.1)',
                      fontSize: '12px',
                    }}
                  />
                  <ReferenceLine y={0} stroke="currentColor" className="opacity-30" />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Line
                    type="monotone"
                    dataKey="voltagePhaseA"
                    name="Phase A: Vm·sin(ωt) [0°]"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="voltagePhaseB"
                    name="Phase B: Vm·sin(ωt - 120°)"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="voltagePhaseC"
                    name="Phase C: Vm·sin(ωt + 120°)"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="currentA"
                    name="Phase A Current: Im·sin(ωt - φ)"
                    stroke="#f59e0b"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Power Triangle & Phasor Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-card border border-border/60">
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block">
                  Active Power P
                </span>
                <span className="text-lg font-bold font-mono text-emerald-500">
                  {acResults.metrics.activePowerKw} kW
                </span>
                <span className="text-[10px] text-muted-foreground block mt-0.5">
                  P = √3 · V · I · cos(φ)
                </span>
              </div>

              <div className="p-3 rounded-xl bg-card border border-border/60">
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block">
                  Reactive Power Q
                </span>
                <span className="text-lg font-bold font-mono text-amber-500">
                  {acResults.metrics.reactivePowerKvar} kVAR
                </span>
                <span className="text-[10px] text-muted-foreground block mt-0.5">
                  Q = √3 · V · I · sin(φ)
                </span>
              </div>

              <div className="p-3 rounded-xl bg-card border border-border/60">
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block">
                  Apparent Power S
                </span>
                <span className="text-lg font-bold font-mono text-cyan-500">
                  {acResults.metrics.apparentPowerKva} kVA
                </span>
                <span className="text-[10px] text-muted-foreground block mt-0.5">
                  S = √(P² + Q²)
                </span>
              </div>

              <div className="p-3 rounded-xl bg-card border border-border/60">
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block">
                  Grid Synchronicity
                </span>
                <span className="text-lg font-bold font-mono text-foreground">
                  60.00 Hz
                </span>
                <span className="text-[10px] text-emerald-500 block mt-0.5">
                  Phase Locked (0.18% VUF)
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
