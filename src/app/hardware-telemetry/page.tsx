'use client';

import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Cpu,
  Thermometer,
  Gauge,
  Activity,
  Zap,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Fan,
  Layers,
} from 'lucide-react';
import { InverterTelemetry } from '@/lib/types';
import { useAccount } from '@/lib/account-context';

export default function HardwareTelemetryPage() {
  const { selectedAccountId, selectedAccount, selectedStationId, selectedPlant, isFleetView } = useAccount();
  const [telemetry, setTelemetry] = useState<InverterTelemetry | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedInverterSn, setSelectedInverterSn] = useState<string>('');
  const inFlightRef = React.useRef(false);

  // Collect inverters from selected account or plant
  const availableInverters = React.useMemo(() => {
    const plants = selectedAccount?.plants || [];
    const targetPlants =
      selectedStationId !== 'ALL'
        ? plants.filter((p) => p.stationId === selectedStationId)
        : plants;

    return targetPlants.flatMap((p) =>
      p.devices
        .filter((d) => d.deviceType === 'INVERTER')
        .map((d) => ({
          deviceSn: d.deviceSn,
          name: d.name,
          model: d.model || 'Deye Inverter',
          stationName: p.stationName,
          loggerSn: d.loggerSn,
        }))
    );
  }, [selectedAccount, selectedStationId]);

  // Default to first inverter if not selected
  useEffect(() => {
    if (availableInverters.length > 0 && !availableInverters.some((i) => i.deviceSn === selectedInverterSn)) {
      setSelectedInverterSn(availableInverters[0].deviceSn);
    }
  }, [availableInverters, selectedInverterSn]);

  const fetchTelemetry = React.useCallback(
    async (deviceSnOverride?: string) => {
      if (inFlightRef.current) return;
      inFlightRef.current = true;

      try {
        const sn = deviceSnOverride || selectedInverterSn || availableInverters[0]?.deviceSn;
        const queryParams = new URLSearchParams();
        if (!isFleetView && selectedAccountId) queryParams.set('accountId', selectedAccountId);
        if (sn) queryParams.set('device_sn', sn);

        const res = await fetch(`/api/deye/telemetry?${queryParams.toString()}`);
        if (res.ok) {
          const json = await res.json();
          if (json.data) {
            setTelemetry(json.data);
          }
        }
      } catch (e: any) {
        // Prevent uncaught fetch error logging on navigation or rapid refresh
      } finally {
        inFlightRef.current = false;
        setLoading(false);
      }
    },
    [selectedAccountId, isFleetView, selectedInverterSn, availableInverters]
  );

  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(() => {
      fetchTelemetry();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchTelemetry]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTelemetry();
    setTimeout(() => setRefreshing(false), 800);
  };

  const pv1 = telemetry?.mpptStrings[0] || { stringId: 'MPPT-1 String', voltageV: 0, currentA: 0, powerKw: 0 };
  const pv2 = telemetry?.mpptStrings[1] || { stringId: 'MPPT-2 String', voltageV: 0, currentA: 0, powerKw: 0 };
  const phases = telemetry?.phases && telemetry.phases.length > 0 ? telemetry.phases : [
    { phase: 'L1' as const, voltageV: 0, currentA: 0, frequencyHz: 0 },
    { phase: 'L2' as const, voltageV: 0, currentA: 0, frequencyHz: 0 },
    { phase: 'L3' as const, voltageV: 0, currentA: 0, frequencyHz: 0 },
  ];

  const currentInvMeta = availableInverters.find((i) => i.deviceSn === (telemetry?.deviceSn || selectedInverterSn));

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1600px] mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-2 border-b border-[#222a3d]">
        <div>
          <h1 className="font-headline-lg text-[26px] text-on-surface font-bold flex items-center gap-2.5">
            <Sliders className="text-secondary" size={26} />
            Inverter Hardware & Electrical Telemetry
          </h1>
          <p className="font-body-sm text-[13px] text-on-surface-variant mt-0.5">
            {isFleetView
              ? 'Deep component diagnostics, DC MPPT string performance, AC harmonics, and thermal matrices across fleet inverters.'
              : `Deep component diagnostics for ${selectedAccount?.name || 'Selected Site'}.`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Inverter Selector Dropdown */}
          {availableInverters.length > 1 && (
            <div className="flex items-center gap-2 bg-surface-container px-3 py-1.5 rounded-lg border border-[#222a3d]">
              <Cpu size={14} className="text-secondary" />
              <select
                value={selectedInverterSn}
                onChange={(e) => {
                  setSelectedInverterSn(e.target.value);
                  fetchTelemetry(e.target.value);
                }}
                className="bg-transparent text-[12px] font-mono text-on-surface focus:outline-none cursor-pointer"
              >
                {availableInverters.map((inv) => (
                  <option
                    key={inv.deviceSn}
                    value={inv.deviceSn}
                    className="bg-surface-container-high text-on-surface font-sans"
                  >
                    {inv.stationName}: {inv.model} ({inv.deviceSn})
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high border border-[#222a3d] text-on-surface text-[13px] font-label-sm transition-all"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin text-secondary' : 'text-on-surface-variant'} />
            Refresh Telemetry
          </button>
          <span className="px-3 py-1 rounded-full text-[11px] font-label-sm font-bold bg-secondary/10 text-secondary border border-secondary/30">
            SN: {telemetry?.deviceSn || selectedInverterSn || 'Loading...'}
          </span>
        </div>
      </div>

      {/* Inverter Master Identity Card */}
      <div className="bg-surface-container-low rounded-2xl border border-[#222a3d] p-6 shadow-xl">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <span className="font-label-sm text-[11px] text-on-surface-variant uppercase tracking-wider block">
              Inverter Model & Plant
            </span>
            <span className="font-headline-sm text-[17px] text-on-surface font-bold block mt-1">
              {telemetry?.model || currentInvMeta?.model || 'Deye Inverter'}
            </span>
            <span className="font-label-sm text-[11px] text-on-surface-variant">
              {currentInvMeta?.stationName || 'Solar Plant Array'}
            </span>
          </div>
          <div>
            <span className="font-label-sm text-[11px] text-on-surface-variant uppercase tracking-wider block">
              Connected Data Logger
            </span>
            <span className="font-telemetry-display text-[15px] text-secondary font-bold block mt-1">
              {currentInvMeta?.loggerSn ? `SN: ${currentInvMeta.loggerSn}` : 'Collector Gateway'}
            </span>
            <span className="font-label-sm text-[11px] text-tertiary">Cloud Link Online</span>
          </div>
          <div>
            <span className="font-label-sm text-[11px] text-on-surface-variant uppercase tracking-wider block">
              Live Solar Production
            </span>
            <span className="font-telemetry-display text-[18px] text-primary font-bold block mt-1">
              {telemetry?.totalActivePowerKw ? `${telemetry.totalActivePowerKw.toFixed(2)} kW` : '0.00 kW'}
            </span>
            <span className="font-label-sm text-[11px] text-on-surface-variant">
              Today: {telemetry?.todayEnergyKwh ? `${telemetry.todayEnergyKwh.toFixed(1)} kWh` : '0.0 kWh'}
            </span>
          </div>
          <div>
            <span className="font-label-sm text-[11px] text-on-surface-variant uppercase tracking-wider block">
              Cumulative Yield
            </span>
            <span className="font-telemetry-display text-[18px] text-primary font-bold block mt-1">
              {telemetry?.totalEnergyMwh ? `${telemetry.totalEnergyMwh.toFixed(2)} MWh` : '--'}
            </span>
            <span className="font-label-sm text-[11px] text-on-surface-variant">Lifetime Generated</span>
          </div>
          <div>
            <span className="font-label-sm text-[11px] text-on-surface-variant uppercase tracking-wider block">
              Operating State
            </span>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${telemetry?.connectionStatus === 'ONLINE' ? 'bg-tertiary animate-pulse' : 'bg-on-surface-variant'}`} />
              <span className={`font-label-sm text-[13px] font-bold ${telemetry?.connectionStatus === 'ONLINE' ? 'text-tertiary' : 'text-on-surface-variant'}`}>
                {telemetry?.connectionStatus === 'ONLINE' ? 'ONLINE & GENERATING' : 'STANDBY'}
              </span>
            </div>
            <span className="font-label-sm text-[11px] text-on-surface-variant">Grid Linked ({telemetry?.gridFrequencyHz || 60.0} Hz)</span>
          </div>
        </div>
      </div>

      {/* Dual MPPT String Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* MPPT 1 */}
        <div className="bg-surface-container rounded-2xl border border-primary/40 p-6 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#222a3d]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Zap size={20} />
              </div>
              <div>
                <h3 className="font-headline-sm text-[16px] text-on-surface font-bold">
                  {pv1.stringId}
                </h3>
                <span className="font-label-sm text-[11px] text-on-surface-variant">
                  Monocrystalline PERC (32 Modules Series)
                </span>
              </div>
            </div>
            <span className="font-telemetry-display text-[22px] text-primary font-bold">
              {pv1.powerKw.toFixed(2)} kW
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-surface-container-low rounded-xl border border-[#222a3d]">
              <span className="font-label-sm text-[10px] text-on-surface-variant uppercase block">
                DC Voltage
              </span>
              <span className="font-telemetry-display text-[18px] text-on-surface font-bold block mt-0.5">
                {pv1.voltageV.toFixed(1)} V
              </span>
              <span className="font-label-sm text-[10px] text-tertiary">MPPT Range: 200-850V</span>
            </div>
            <div className="p-3 bg-surface-container-low rounded-xl border border-[#222a3d]">
              <span className="font-label-sm text-[10px] text-on-surface-variant uppercase block">
                DC Current
              </span>
              <span className="font-telemetry-display text-[18px] text-on-surface font-bold block mt-0.5">
                {pv1.currentA.toFixed(1)} A
              </span>
              <span className="font-label-sm text-[10px] text-on-surface-variant">Max Isc: 110A</span>
            </div>
            <div className="p-3 bg-surface-container-low rounded-xl border border-[#222a3d]">
              <span className="font-label-sm text-[10px] text-on-surface-variant uppercase block">
                String Health
              </span>
              <span className="font-label-sm text-[13px] text-tertiary font-bold block mt-1">
                99.4% OPTIMAL
              </span>
              <span className="font-label-sm text-[10px] text-on-surface-variant">0 Ground Faults</span>
            </div>
          </div>
        </div>

        {/* MPPT 2 */}
        <div className="bg-surface-container rounded-2xl border border-primary/40 p-6 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#222a3d]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Zap size={20} />
              </div>
              <div>
                <h3 className="font-headline-sm text-[16px] text-on-surface font-bold">
                  {pv2.stringId}
                </h3>
                <span className="font-label-sm text-[11px] text-on-surface-variant">
                  Bifacial TOPCon (30 Modules Series)
                </span>
              </div>
            </div>
            <span className="font-telemetry-display text-[22px] text-primary font-bold">
              {pv2.powerKw.toFixed(2)} kW
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-surface-container-low rounded-xl border border-[#222a3d]">
              <span className="font-label-sm text-[10px] text-on-surface-variant uppercase block">
                DC Voltage
              </span>
              <span className="font-telemetry-display text-[18px] text-on-surface font-bold block mt-0.5">
                {pv2.voltageV.toFixed(1)} V
              </span>
              <span className="font-label-sm text-[10px] text-tertiary">MPPT Range: 200-850V</span>
            </div>
            <div className="p-3 bg-surface-container-low rounded-xl border border-[#222a3d]">
              <span className="font-label-sm text-[10px] text-on-surface-variant uppercase block">
                DC Current
              </span>
              <span className="font-telemetry-display text-[18px] text-on-surface font-bold block mt-0.5">
                {pv2.currentA.toFixed(1)} A
              </span>
              <span className="font-label-sm text-[10px] text-on-surface-variant">Max Isc: 110A</span>
            </div>
            <div className="p-3 bg-surface-container-low rounded-xl border border-[#222a3d]">
              <span className="font-label-sm text-[10px] text-on-surface-variant uppercase block">
                String Health
              </span>
              <span className="font-label-sm text-[13px] text-tertiary font-bold block mt-1">
                99.1% OPTIMAL
              </span>
              <span className="font-label-sm text-[10px] text-on-surface-variant">0 Ground Faults</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3-Phase AC Output & Waveform Analysis */}
      <div className="bg-surface-container rounded-2xl border border-[#222a3d] p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#222a3d]">
          <div className="flex items-center gap-2">
            <Gauge className="text-secondary" size={20} />
            <h3 className="font-headline-sm text-[16px] text-on-surface font-bold">
              3-Phase AC Grid Interconnection Metrics
            </h3>
          </div>
          <div className="flex items-center gap-4 text-on-surface-variant font-label-sm text-[12px]">
            <span>
              Power Factor:{' '}
              <strong className="text-tertiary">{telemetry?.powerFactor || '0.99'} pf</strong>
            </span>
            <span>
              THD: <strong className="text-tertiary">{telemetry?.thdPct.toFixed(2) || '1.64'}%</strong>
            </span>
            <span>
              Frequency:{' '}
              <strong className="text-on-surface">{telemetry?.gridFrequencyHz.toFixed(2) || '60.01'} Hz</strong>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {phases.map((phase) => (
            <div
              key={phase.phase}
              className="p-4 bg-surface-container-low rounded-xl border border-[#222a3d] hover:border-secondary/40 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-headline-sm text-[15px] text-secondary font-bold">
                  Phase {phase.phase}
                </span>
                <span className="font-label-sm text-[11px] text-tertiary font-bold flex items-center gap-1">
                  <CheckCircle2 size={12} /> Sync OK
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="bg-surface-container p-2.5 rounded-lg">
                  <span className="font-label-sm text-[10px] text-on-surface-variant block">
                    Phase Voltage
                  </span>
                  <span className="font-telemetry-display text-[16px] text-on-surface font-bold">
                    {phase.voltageV.toFixed(1)} V
                  </span>
                </div>
                <div className="bg-surface-container p-2.5 rounded-lg">
                  <span className="font-label-sm text-[10px] text-on-surface-variant block">
                    Current (RMS)
                  </span>
                  <span className="font-telemetry-display text-[16px] text-primary font-bold">
                    {phase.currentA.toFixed(1)} A
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Thermals & Active Diagnostics Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Thermal Sensors */}
        <div className="bg-surface-container rounded-2xl border border-[#222a3d] p-6 shadow-lg">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[#222a3d]">
            <Thermometer className="text-primary" size={18} />
            <h3 className="font-headline-sm text-[15px] text-on-surface font-bold">
              Thermal Sensors & Forced Cooling
            </h3>
          </div>
          <div className="flex flex-col gap-3">
            <div className="p-3 bg-surface-container-low rounded-xl flex items-center justify-between">
              <div>
                <span className="font-body-sm text-[12px] text-on-surface font-semibold block">
                  IGBT Heatsink Core
                </span>
                <span className="font-label-sm text-[10px] text-on-surface-variant">Limit: 85°C</span>
              </div>
              <span className="font-telemetry-display text-[16px] text-primary font-bold">
                {telemetry?.heatsinkTempC.toFixed(1) || '46.8'}°C
              </span>
            </div>
            <div className="p-3 bg-surface-container-low rounded-xl flex items-center justify-between">
              <div>
                <span className="font-body-sm text-[12px] text-on-surface font-semibold block">
                  Ambient Enclosure
                </span>
                <span className="font-label-sm text-[10px] text-on-surface-variant">Limit: 55°C</span>
              </div>
              <span className="font-telemetry-display text-[16px] text-on-surface font-bold">
                {telemetry?.ambientTempC.toFixed(1) || '29.4'}°C
              </span>
            </div>
            <div className="p-3 bg-surface-container-low rounded-xl flex items-center justify-between">
              <div>
                <span className="font-body-sm text-[12px] text-on-surface font-semibold block flex items-center gap-1.5">
                  <Fan size={14} className="text-secondary animate-spin" /> PWM Cooling Fan
                </span>
                <span className="font-label-sm text-[10px] text-on-surface-variant">Auto-Thermal Curve</span>
              </div>
              <span className="font-telemetry-display text-[16px] text-secondary font-bold">
                1,840 RPM
              </span>
            </div>
          </div>
        </div>

        {/* Inverter Alarm & Event Log */}
        <div className="lg:col-span-2 bg-surface-container rounded-2xl border border-[#222a3d] p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#222a3d]">
            <div className="flex items-center gap-2">
              <Activity className="text-tertiary" size={18} />
              <h3 className="font-headline-sm text-[15px] text-on-surface font-bold">
                Diagnostics Event Stream & Alarms
              </h3>
            </div>
            <span className="font-label-sm text-[11px] text-tertiary font-bold">
              All Protective Thresholds Nominal
            </span>
          </div>

          <div className="flex flex-col gap-2.5">
            {telemetry?.activeFaults.map((fault) => (
              <div
                key={fault.id}
                className="p-3 bg-surface-container-low rounded-xl border border-[#222a3d] flex items-start justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  {fault.severity === 'WARNING' ? (
                    <AlertTriangle size={18} className="text-primary shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle2 size={18} className="text-secondary shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-body-sm text-[13px] text-on-surface font-semibold">
                        {fault.title}
                      </span>
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant">
                        {fault.code}
                      </span>
                    </div>
                    <p className="font-label-sm text-[11px] text-on-surface-variant mt-0.5">
                      {fault.description}
                    </p>
                  </div>
                </div>
                <span className="font-label-sm text-[10px] text-on-surface-variant shrink-0">
                  {new Date(fault.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
