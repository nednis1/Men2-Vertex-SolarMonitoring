'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Sun,
  Zap,
  BatteryCharging,
  Building2,
  Cpu,
  ArrowUpRight,
  ArrowDownRight,
  RotateCw,
  SlidersHorizontal,
  ShieldCheck,
  Power,
  RefreshCw,
  Globe,
  Layers,
  Radio,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { StationSummary, AggregatedFleetSummary, FleetMatrixNode } from '@/lib/types';
import { useAccount } from '@/lib/account-context';

export default function EnergyFlowDashboard() {
  const {
    selectedAccountId,
    isFleetView,
    selectedAccount,
    selectedStationId,
    setSelectedStationId,
    selectedPlant,
    totalAccounts,
    liveAccountsCount,
  } = useAccount();

  const [station, setStation] = useState<StationSummary | null>(null);
  const [fleetAggregate, setFleetAggregate] = useState<AggregatedFleetSummary | null>(null);
  const [nodes, setNodes] = useState<FleetMatrixNode[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [forceCharge, setForceCharge] = useState(false);
  const [exportLimiter, setExportLimiter] = useState(false);
  const [manualPolling, setManualPolling] = useState(false);
  const [isPlantBarCollapsed, setIsPlantBarCollapsed] = useState(false);

  const fetchTelemetry = useCallback(async () => {
    try {
      if (isFleetView) {
        // Fetch fleet aggregate across all accounts
        const res = await fetch('/api/deye/aggregate');
        if (res.ok) {
          const json: AggregatedFleetSummary = await res.json();
          setFleetAggregate(json);
          setNodes(json.nodes || []);
          setIsLive(json.isLive);
        }
      } else {
        // Fetch specific account station summary
        const stationParam = selectedStationId !== 'ALL' ? `&station_id=${encodeURIComponent(selectedStationId)}` : '';
        const res = await fetch(`/api/deye/station?accountId=${encodeURIComponent(selectedAccountId)}${stationParam}`);
        if (res.ok) {
          const json = await res.json();
          setStation(json.data);
          setIsLive(json.isLive);

          // Build nodes for all inverters in the selected account's plants with paired loggers
          if (selectedAccount?.plants && selectedAccount.plants.length > 0) {
            const accNodes: FleetMatrixNode[] = [];
            const targetPlants = selectedStationId !== 'ALL'
              ? selectedAccount.plants.filter((p) => p.stationId === selectedStationId)
              : selectedAccount.plants;

            for (const plant of targetPlants) {
              const inverters = plant.devices.filter((d) => d.deviceType === 'INVERTER');
              const loggers = plant.devices.filter((d) => d.deviceType === 'LOGGER');
              const kwPerInv =
                (json.data?.liveSolarPowerKw || 0) / (inverters.length || 1);

              for (let i = 0; i < inverters.length; i++) {
                const device = inverters[i];
                const matchingLogger =
                  loggers.find((l) => l.deviceSn === device.loggerSn) ||
                  loggers[i] ||
                  loggers[0];

                accNodes.push({
                  accountId: selectedAccountId,
                  accountName: selectedAccount.name,
                  stationName: plant.stationName,
                  stationId: plant.stationId,
                  deviceSn: device.deviceSn,
                  deviceType: 'INVERTER',
                  model: device.model || 'Deye Inverter',
                  ratedKw: device.ratedKw || 50,
                  loggerSn: device.loggerSn || matchingLogger?.deviceSn,
                  loggerStatus: matchingLogger?.status || 'ONLINE',
                  liveSolarPowerKw: kwPerInv,
                  dailyYieldKwh: json.data?.dailyYieldKwh || 0,
                  gridPowerKw: json.data?.gridPowerKw || 0,
                  consumptionPowerKw: json.data?.loadPowerKw || 0,
                  batterySoc: json.data?.batterySoc || 0,
                  mode: 'PEAK SHAVING',
                  status: device.status === 'ONLINE' ? 'ONLINE' : 'STANDBY',
                  isLive: json.isLive,
                });
              }
            }
            setNodes(accNodes);
          } else if (json.data) {
            setNodes([
              {
                accountId: selectedAccountId,
                accountName: selectedAccount?.name || 'Selected Site',
                stationName: json.data.name,
                stationId: json.data.stationId,
                deviceSn: json.deviceSn || '2408124366',
                deviceType: 'INVERTER',
                model: 'SUN-120K-SG01HP3-EU-AM2',
                liveSolarPowerKw: json.data.liveSolarPowerKw,
                batterySoc: json.data.batterySoc,
                mode: 'PEAK SHAVING',
                status: json.data.status === 'ONLINE' ? 'ONLINE' : 'FAULT',
                isLive: json.isLive,
              },
            ]);
          }
        }
      }
    } catch (e) {
      console.error('Error fetching telemetry:', e);
    } finally {
      setLoading(false);
    }
  }, [isFleetView, selectedAccountId, selectedAccount, selectedStationId]);

  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 3500);
    return () => clearInterval(interval);
  }, [fetchTelemetry]);

  const triggerManualPoll = async () => {
    setManualPolling(true);
    await fetchTelemetry();
    setTimeout(() => setManualPolling(false), 800);
  };

  // Compute live values depending on fleet vs single-account view
  const solarKw = isFleetView
    ? fleetAggregate?.totalSolarPowerKw ?? 0
    : station?.liveSolarPowerKw ?? 0;

  const loadKw = isFleetView
    ? fleetAggregate?.totalLoadPowerKw ?? 0
    : station?.loadPowerKw ?? 0;

  const batterySoc = isFleetView
    ? fleetAggregate?.avgBatterySoc ?? 0
    : station?.batterySoc ?? 0;

  const batteryKw = isFleetView
    ? fleetAggregate?.totalBatteryPowerKw ?? 0
    : station?.batteryPowerKw ?? 0;

  const gridKw = isFleetView
    ? fleetAggregate?.netGridPowerKw ?? 0
    : station?.gridPowerKw ?? 0;

  const totalCapacity = isFleetView
    ? fleetAggregate?.totalCapacityKw ?? 0
    : selectedPlant
    ? selectedPlant.installedCapacityKw
    : station?.capacityKw ?? (selectedAccount?.capacityKw ?? 0);

  const dailyYield = isFleetView
    ? fleetAggregate?.totalDailyYieldKwh ?? 0
    : station?.dailyYieldKwh ?? 0;

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1600px] mx-auto pb-12">
      {/* Top Banner with Fleet KPI Cards */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-2 border-b border-[#222a3d]">
        <div>
          <h1 className="font-headline-lg text-[26px] text-on-surface font-bold flex items-center gap-2.5">
            {isFleetView ? (
              <Globe className="text-primary" size={26} />
            ) : selectedPlant ? (
              <Building2 className="text-primary" size={26} />
            ) : (
              <Zap className="text-primary" size={26} />
            )}
            {isFleetView
              ? 'Multi-Account Energy Flow & Fleet Synoptics'
              : selectedPlant
              ? `${selectedPlant.stationName} · Plant Synoptics`
              : `Live Synoptics · ${selectedAccount?.name || 'Selected Site'}`}
          </h1>
          <p className="font-body-sm text-[13px] text-on-surface-variant mt-0.5">
            {isFleetView
              ? `Simultaneous multi-site energy flow across ${totalAccounts} configured DeyeCloud accounts.`
              : selectedPlant
              ? `Real-time hybrid inverter synoptic loop for ${selectedPlant.stationName} (${selectedPlant.installedCapacityKw} kWp) under ${selectedAccount?.name}.`
              : 'Real-time hybrid inverter synoptic loop, power balancing, and storage distribution.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={triggerManualPoll}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high border border-[#222a3d] text-on-surface text-[13px] font-label-sm transition-all"
          >
            <RefreshCw size={14} className={manualPolling ? 'animate-spin text-primary' : 'text-on-surface-variant'} />
            {isFleetView ? 'Poll All Accounts' : selectedPlant ? `Poll ${selectedPlant.stationName}` : 'Poll Inverter'}
          </button>
          <span
            className={`px-3 py-1 rounded-full text-[11px] font-label-sm font-bold border ${
              isLive
                ? 'bg-tertiary/10 text-tertiary border-tertiary/30'
                : 'bg-primary/10 text-primary border-primary/30'
            }`}
          >
            {isLive ? '● Live DeyeCloud' : '● Simulation / Synced'}
          </span>
        </div>
      </div>

      {/* Dynamic Plant Switcher Bar (Collapsible) */}
      {!isFleetView && selectedAccount && (selectedAccount.plants?.length || 0) > 0 && (
        isPlantBarCollapsed ? (
          /* Collapsed Minimal Plant Indicator */
          <div className="flex items-center justify-between p-2 px-3.5 bg-surface-container/50 rounded-xl border border-[#222a3d] transition-all">
            <div className="flex items-center gap-2 text-xs truncate">
              <Building2 size={15} className="text-primary shrink-0" />
              <span className="text-on-surface-variant font-label-sm uppercase tracking-wider text-[11px]">Active Plant:</span>
              <span className="font-semibold text-on-surface truncate">
                {selectedPlant ? selectedPlant.stationName : `All Plants (${selectedAccount.plants?.length})`}
              </span>
              <span className="text-[10.5px] text-on-surface-variant font-mono shrink-0">
                ({selectedPlant ? `${selectedPlant.installedCapacityKw} kWp` : `${selectedAccount.capacityKw} kWp`})
              </span>
            </div>
            <button
              onClick={() => setIsPlantBarCollapsed(false)}
              className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-semibold px-2.5 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high border border-[#222a3d] transition-colors shrink-0 cursor-pointer"
            >
              <span>Switch Plant</span>
              <ChevronDown size={13} />
            </button>
          </div>
        ) : (
          /* Expanded Full Plant Switcher Bar */
          <div className="flex items-center gap-2 p-2 bg-surface-container/60 rounded-xl border border-[#222a3d] overflow-x-auto transition-all">
            <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-label-sm uppercase tracking-wider text-on-surface-variant shrink-0">
              <Building2 size={15} className="text-primary" />
              <span>Select Plant:</span>
            </div>

            <button
              onClick={() => setSelectedStationId('ALL')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 flex items-center gap-2 ${
                selectedStationId === 'ALL'
                  ? 'bg-primary text-surface-container-lowest font-bold shadow-md'
                  : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
              }`}
            >
              <span>All Plants ({selectedAccount.plants?.length})</span>
              <span className="text-[10px] opacity-80">{selectedAccount.capacityKw} kWp</span>
            </button>

            {selectedAccount.plants?.map((plant) => {
              const isPlantActive = selectedStationId === plant.stationId;
              return (
                <button
                  key={plant.stationId}
                  onClick={() => setSelectedStationId(plant.stationId)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 flex items-center gap-2 ${
                    isPlantActive
                      ? 'bg-primary text-surface-container-lowest font-bold shadow-md'
                      : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isPlantActive ? 'bg-surface-container-lowest' : 'bg-emerald-400'
                    }`}
                  ></span>
                  <span>{plant.stationName}</span>
                  <span className="text-[10px] opacity-80">
                    ({plant.installedCapacityKw} kWp ·{' '}
                    {plant.devices.filter((d) => d.deviceType === 'INVERTER').length} Inv)
                  </span>
                </button>
              );
            })}

            {/* Collapse Button */}
            <button
              onClick={() => setIsPlantBarCollapsed(true)}
              className="ml-auto p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors shrink-0 flex items-center gap-1 text-[11px]"
              title="Collapse plant picker bar"
              aria-label="Collapse plant picker bar"
            >
              <span className="hidden sm:inline text-[10.5px]">Fold</span>
              <ChevronUp size={14} />
            </button>
          </div>
        )
      )}

      {/* 5 Primary Telemetry Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 w-full">
        {/* PV Live Yield */}
        <div className="bg-surface-container p-4 rounded-xl border border-[#222a3d] relative overflow-hidden group hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="font-label-sm text-[11px] text-on-surface-variant uppercase tracking-wider">
              {isFleetView ? 'Total PV Harvest' : 'PV Live Harvest'}
            </span>
            <span className="flex items-center text-[10px] font-bold text-tertiary bg-tertiary/10 px-1.5 py-0.5 rounded">
              {totalCapacity} kWp Fleet
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-telemetry-display text-[28px] text-primary leading-none font-bold">
              {solarKw.toFixed(1)}
            </span>
            <span className="font-telemetry-unit text-[14px] text-on-surface-variant">kW</span>
          </div>
          <span className="font-label-sm text-[11px] text-on-surface-variant mt-2 block">
            Daily: {dailyYield.toFixed(1)} kWh
          </span>
        </div>

        {/* Battery Storage */}
        <div className="bg-surface-container p-4 rounded-xl border border-[#222a3d] relative overflow-hidden group hover:border-secondary/40 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="font-label-sm text-[11px] text-on-surface-variant uppercase tracking-wider">
              {isFleetView ? 'Fleet Battery ESS' : 'Battery Storage'}
            </span>
            <span className="text-[10px] font-bold text-secondary bg-secondary/10 px-1.5 py-0.5 rounded">
              Charging
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-telemetry-display text-[28px] text-secondary leading-none font-bold">
              {batterySoc.toFixed(1)}
            </span>
            <span className="font-telemetry-unit text-[14px] text-on-surface-variant">% SOC</span>
          </div>
          <span className="font-label-sm text-[11px] text-on-surface-variant mt-2 block">
            Flow: +{batteryKw.toFixed(1)} kW
          </span>
        </div>

        {/* Facility Load */}
        <div className="bg-surface-container p-4 rounded-xl border border-[#222a3d] relative overflow-hidden group hover:border-[#ffddb8]/40 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="font-label-sm text-[11px] text-on-surface-variant uppercase tracking-wider">
              {isFleetView ? 'Total Facility Load' : 'Facility Demand'}
            </span>
            <span className="text-[10px] font-bold text-on-surface bg-surface-container-highest px-1.5 py-0.5 rounded">
              Demand
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-telemetry-display text-[28px] text-on-surface leading-none font-bold">
              {loadKw.toFixed(1)}
            </span>
            <span className="font-telemetry-unit text-[14px] text-on-surface-variant">kW</span>
          </div>
          <span className="font-label-sm text-[11px] text-on-surface-variant mt-2 block">
            100% Self-Powered
          </span>
        </div>

        {/* Grid Interconnection */}
        <div className="bg-surface-container p-4 rounded-xl border border-[#222a3d] relative overflow-hidden group hover:border-tertiary/40 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="font-label-sm text-[11px] text-on-surface-variant uppercase tracking-wider">
              {isFleetView ? 'Net Grid Dispatch' : 'Grid Interconnect'}
            </span>
            <span className="text-[10px] font-bold text-tertiary bg-tertiary/10 px-1.5 py-0.5 rounded">
              Exporting
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-telemetry-display text-[28px] text-tertiary leading-none font-bold">
              +{gridKw.toFixed(1)}
            </span>
            <span className="font-telemetry-unit text-[14px] text-on-surface-variant">kW</span>
          </div>
          <span className="font-label-sm text-[11px] text-on-surface-variant mt-2 block">
            Synced (60.01 Hz)
          </span>
        </div>

        {/* Accounts / Node Health */}
        <div className="bg-surface-container p-4 rounded-xl border border-[#222a3d] relative overflow-hidden group hover:border-tertiary/40 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="font-label-sm text-[11px] text-on-surface-variant uppercase tracking-wider">
              {isFleetView ? 'Connected Accounts' : 'Inverter Health'}
            </span>
            <span className="text-[10px] font-bold text-tertiary bg-tertiary/10 px-1.5 py-0.5 rounded">
              Active
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-telemetry-display text-[28px] text-tertiary leading-none font-bold">
              {isFleetView ? totalAccounts : '100'}
            </span>
            <span className="font-telemetry-unit text-[14px] text-on-surface-variant">
              {isFleetView ? 'Accounts' : '%'}
            </span>
          </div>
          <span className="font-label-sm text-[11px] text-on-surface-variant mt-2 block">
            {isFleetView ? `${nodes.length} Inverter Nodes Active` : '0 Fault Alarms'}
          </span>
        </div>
      </div>

      {/* Central Synoptic Diagram & Interactive Controls */}
      <div className="bg-surface-container-low rounded-2xl border border-[#222a3d] p-6 lg:p-8 shadow-xl relative">
        <div className="flex items-center justify-between mb-6 pb-3 border-b border-[#222a3d]">
          <div className="flex items-center gap-2">
            <Cpu className="text-primary" size={20} />
            <h2 className="font-headline-md text-[18px] text-on-surface font-semibold">
              {isFleetView
                ? 'Multi-Site Aggregated Energy Flow Architecture'
                : selectedPlant
                ? `Energy Flow · ${selectedPlant.stationName} (${selectedPlant.installedCapacityKw} kWp)`
                : `Energy Flow · ${selectedAccount?.name || 'Inverter Hub'}`}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setForceCharge(!forceCharge)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-label-sm font-semibold transition-all ${
                forceCharge
                  ? 'bg-secondary text-on-secondary shadow-[0_0_12px_rgba(76,215,246,0.5)]'
                  : 'bg-surface-container text-secondary hover:bg-surface-container-high border border-secondary/40'
              }`}
            >
              <BatteryCharging size={14} />
              Force Grid Charge
            </button>
            <button
              onClick={() => setExportLimiter(!exportLimiter)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-label-sm font-semibold transition-all ${
                exportLimiter
                  ? 'bg-primary text-on-primary shadow-[0_0_12px_rgba(255,193,116,0.5)]'
                  : 'bg-surface-container text-primary hover:bg-surface-container-high border border-primary/40'
              }`}
            >
              <SlidersHorizontal size={14} />
              Zero-Export Limiter
            </button>
          </div>
        </div>

        {/* Synoptic Diagram Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center py-6">
          {/* Left Column: Solar PV Array */}
          <div className="flex flex-col items-center">
            <div className="w-52 p-4 bg-surface-container rounded-2xl border-2 border-primary/60 shadow-[0_0_20px_rgba(255,193,116,0.2)] flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-3">
                <Sun size={26} />
              </div>
              <span className="font-label-sm text-[11px] text-on-surface-variant uppercase tracking-wider">
                {isFleetView ? 'Combined PV Generation' : 'Solar PV Generation'}
              </span>
              <span className="font-telemetry-display text-[26px] text-primary font-bold my-1">
                {solarKw.toFixed(1)} kW
              </span>
              <span className="text-[11px] text-on-surface-variant">
                {totalCapacity.toFixed(0)} kWp Total Array Capacity
              </span>
            </div>
          </div>

          {/* Center Column: Core Hybrid Inverter Hub / Fleet Engine */}
          <div className="flex flex-col items-center">
            <div className="w-68 p-6 bg-surface-container-high rounded-3xl border-2 border-[#4cd7f6]/80 shadow-[0_0_30px_rgba(76,215,246,0.25)] flex flex-col items-center text-center relative">
              <div className="absolute -top-3 px-3 py-0.5 rounded-full bg-secondary text-on-secondary font-label-sm text-[10px] font-bold uppercase tracking-wider">
                {isFleetView ? 'Multi-Site Hub' : selectedPlant ? 'Plant Hybrid Hub' : 'Core Hybrid Hub'}
              </div>
              <div className="w-14 h-14 rounded-2xl bg-secondary/15 flex items-center justify-center text-secondary mb-3 mt-1">
                <Cpu size={32} />
              </div>
              <span className="font-headline-sm text-[17px] text-on-surface font-bold">
                {isFleetView
                  ? 'Deye Multi-Account Fleet'
                  : selectedPlant
                  ? selectedPlant.stationName
                  : 'Deye Hybrid Inverter'}
              </span>
              <span className="font-label-sm text-[11px] text-secondary font-mono mt-0.5">
                {isFleetView
                  ? `${totalAccounts} Accounts · ${nodes.length} Inverters`
                  : selectedPlant
                  ? `Station ID: ${selectedPlant.stationId} · ${nodes.length} Inverters`
                  : `SN: ${nodes[0]?.deviceSn || '2209X891104'}`}
              </span>
              <div className="w-full grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-[#222a3d]">
                <div className="bg-surface-container p-2 rounded-lg">
                  <span className="font-label-sm text-[10px] text-on-surface-variant block">
                    Efficiency
                  </span>
                  <span className="font-telemetry-display text-[15px] text-tertiary font-bold">
                    98.4%
                  </span>
                </div>
                <div className="bg-surface-container p-2 rounded-lg">
                  <span className="font-label-sm text-[10px] text-on-surface-variant block">
                    {isFleetView ? 'Active Sites' : 'Core Temp'}
                  </span>
                  <span className="font-telemetry-display text-[15px] text-on-surface font-bold">
                    {isFleetView ? `${totalAccounts} Sites` : '46.8°C'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: 3 Output Sinks (Battery, Load, Grid) */}
          <div className="flex flex-col gap-4">
            {/* Battery ESS Node */}
            <div className="p-3.5 bg-surface-container rounded-xl border border-secondary/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary">
                  <BatteryCharging size={20} />
                </div>
                <div>
                  <span className="font-body-md text-[13px] font-semibold text-on-surface block">
                    {isFleetView ? 'Combined Battery Fleet' : 'Storage Battery (ESS)'}
                  </span>
                  <span className="font-label-sm text-[11px] text-on-surface-variant">
                    {batterySoc.toFixed(1)}% Avg SOC | LiFePO4
                  </span>
                </div>
              </div>
              <span className="font-telemetry-display text-[16px] text-secondary font-bold">
                +{batteryKw.toFixed(1)} kW
              </span>
            </div>

            {/* Facility Demand Node */}
            <div className="p-3.5 bg-surface-container rounded-xl border border-[#222a3d] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#2d3449] flex items-center justify-center text-on-surface">
                  <Building2 size={20} />
                </div>
                <div>
                  <span className="font-body-md text-[13px] font-semibold text-on-surface block">
                    {isFleetView ? 'Total Facility Demand' : 'Industrial Facility Load'}
                  </span>
                  <span className="font-label-sm text-[11px] text-on-surface-variant">
                    Machine Lines & Operations
                  </span>
                </div>
              </div>
              <span className="font-telemetry-display text-[16px] text-on-surface font-bold">
                {loadKw.toFixed(1)} kW
              </span>
            </div>

            {/* Utility Grid Dispatch */}
            <div className="p-3.5 bg-surface-container rounded-xl border border-tertiary/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-tertiary/10 flex items-center justify-center text-tertiary">
                  <Zap size={20} />
                </div>
                <div>
                  <span className="font-body-md text-[13px] font-semibold text-on-surface block">
                    {isFleetView ? 'Net Utility Grid Feed-In' : 'Utility Grid Dispatch'}
                  </span>
                  <span className="font-label-sm text-[11px] text-on-surface-variant">
                    Synced In-Phase @ 60.01 Hz
                  </span>
                </div>
              </div>
              <span className="font-telemetry-display text-[16px] text-tertiary font-bold">
                +{gridKw.toFixed(1)} kW
              </span>
            </div>
          </div>
        </div>

        {/* Real-time Balancing Footer Metrics */}
        <div className="mt-4 pt-4 border-t border-[#222a3d] grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex items-center justify-between p-3 bg-surface-container rounded-lg">
            <span className="font-label-sm text-[11px] text-on-surface-variant">
              Grid Interconnection Sync
            </span>
            <span className="font-label-sm text-[11px] text-tertiary font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-tertiary" /> In-Phase (Δ0.02°)
            </span>
          </div>
          <div className="flex items-center justify-between p-3 bg-surface-container rounded-lg">
            <span className="font-label-sm text-[11px] text-on-surface-variant">
              Fleet Voltage Balance
            </span>
            <span className="font-telemetry-display text-[12px] text-on-surface font-semibold">
              5.4 V (0.92%) Nominal
            </span>
          </div>
          <div className="flex items-center justify-between p-3 bg-surface-container rounded-lg">
            <span className="font-label-sm text-[11px] text-on-surface-variant">
              Daily Generation Total
            </span>
            <span className="font-label-sm text-[11px] text-tertiary font-bold">
              {dailyYield.toFixed(1)} kWh Generated
            </span>
          </div>
        </div>
      </div>

      {/* Connected Fleet Arrays & Inverter Status Table */}
      <div className="bg-surface-container rounded-xl border border-[#222a3d] p-5 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <span className="font-headline-sm text-[16px] text-on-surface font-semibold">
              {isFleetView
                ? 'Connected Multi-Account Fleet Matrix & Inverter Nodes'
                : `Inverters for ${selectedAccount?.name || 'Selected Site'}`}
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary">
              {nodes.length} Inverter Nodes
            </span>
          </div>
          <span className="font-label-sm text-[11px] text-tertiary font-bold">
            {nodes.length} / {nodes.length} Nodes Active
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-[#222a3d] text-on-surface-variant font-label-sm text-[11px] uppercase">
                <th className="py-2.5 px-3">Account / Facility</th>
                <th className="py-2.5 px-3">Plant Station</th>
                <th className="py-2.5 px-3">Inverter Hardware</th>
                <th className="py-2.5 px-3">Connected Logger</th>
                <th className="py-2.5 px-3">Live Harvest</th>
                <th className="py-2.5 px-3">Daily Yield</th>
                <th className="py-2.5 px-3">Battery SOC</th>
                <th className="py-2.5 px-3">Operating Mode</th>
                <th className="py-2.5 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222a3d]/50 font-body-sm">
              {nodes.map((node, index) => {
                return (
                  <tr key={`${node.accountId}-${node.deviceSn}-${index}`} className="hover:bg-surface-container-high transition-colors">
                    <td className="py-3 px-3">
                      <span className="font-semibold text-on-surface block leading-tight">
                        {node.accountName}
                      </span>
                      <span className="font-mono text-[10px] text-primary">
                        {node.accountId}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-on-surface font-medium">
                      {node.stationName}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5 font-semibold text-on-surface">
                        <Cpu size={14} className="text-secondary flex-shrink-0" />
                        <span>{node.model}</span>
                      </div>
                      <span className="font-mono text-[11px] text-on-surface-variant block mt-0.5">
                        SN: {node.deviceSn} · {node.ratedKw ? `${node.ratedKw} kW` : '100 kW'}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      {node.loggerSn ? (
                        <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-surface-container-highest/60 border border-[#222a3d]">
                          <Radio size={12} className={node.loggerStatus === 'ONLINE' ? 'text-tertiary' : 'text-on-surface-variant'} />
                          <div className="flex flex-col">
                            <span className="font-mono text-[11px] text-on-surface font-medium leading-none">
                              {node.loggerSn}
                            </span>
                            <span className="text-[9px] text-tertiary font-bold leading-none mt-0.5">
                              {node.loggerStatus || 'ONLINE'}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-on-surface-variant/60 text-[11px] italic">Built-in / Direct</span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-telemetry-display text-primary font-bold text-[14px]">
                      {node.liveSolarPowerKw.toFixed(1)} kW
                    </td>
                    <td className="py-3 px-3 font-telemetry-display text-on-surface font-medium">
                      {node.dailyYieldKwh ? `${node.dailyYieldKwh.toFixed(1)} kWh` : '--'}
                    </td>
                    <td className="py-3 px-3 font-telemetry-display text-secondary">
                      {node.batterySoc ? `${node.batterySoc.toFixed(1)}%` : '--'}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded bg-primary-container/20 text-primary text-[11px] font-label-sm font-bold">
                        {node.mode}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className="inline-flex items-center gap-1.5 text-tertiary font-label-sm text-[11px] font-bold">
                        <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
                        {node.isLive ? 'Live Cloud' : 'Online'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
