import { StationSummary, InverterTelemetry, HourlyEnergyPoint, ApiHealthMetrics } from './types';

// Deterministic subtle fluctuation helper
function jitter(base: number, percent: number = 0.03): number {
  const variation = (Math.random() * 2 - 1) * (base * percent);
  return parseFloat((base + variation).toFixed(2));
}

export function getMockStationSummary(): StationSummary {
  const solar = jitter(108.4, 0.04);
  const load = jitter(58.2, 0.03);
  const batterySoc = jitter(94.2, 0.005);
  // Remaining solar charges battery and exports to grid
  const batteryPower = jitter(22.5, 0.05);
  const gridPower = parseFloat((solar - load - batteryPower).toFixed(2));

  return {
    stationId: 'SP_04',
    name: 'SunPeak Industrial Array #04 - 120kW Hybrid',
    capacityKw: 120.0,
    liveSolarPowerKw: solar,
    dailyYieldKwh: 486.2,
    totalYieldMwh: 142.8,
    batterySoc: Math.min(100, Math.max(0, batterySoc)),
    batteryPowerKw: batteryPower,
    gridPowerKw: gridPower,
    loadPowerKw: load,
    status: 'ONLINE',
    lastUpdated: new Date().toISOString(),
  };
}

export function getMockInverterTelemetry(): InverterTelemetry {
  const pv1V = jitter(584.2, 0.01);
  const pv1I = jitter(98.4, 0.02);
  const pv1P = parseFloat(((pv1V * pv1I) / 1000).toFixed(2));

  const pv2V = jitter(578.8, 0.01);
  const pv2I = jitter(88.6, 0.02);
  const pv2P = parseFloat(((pv2V * pv2I) / 1000).toFixed(2));

  return {
    deviceSn: '2209X891104',
    model: 'SUN-120K-SG01HP3-EU-AM2',
    firmwareVersion: 'Ver 1.4.2-Deye-C',
    connectionStatus: 'ONLINE',
    efficiencyPct: jitter(98.4, 0.002),
    heatsinkTempC: jitter(46.8, 0.02),
    ambientTempC: jitter(29.4, 0.01),
    powerFactor: 0.99,
    thdPct: jitter(1.64, 0.03),
    gridFrequencyHz: jitter(60.01, 0.002),
    mpptStrings: [
      { stringId: 'MPPT-1 (South Array)', voltageV: pv1V, currentA: pv1I, powerKw: pv1P },
      { stringId: 'MPPT-2 (West Array)', voltageV: pv2V, currentA: pv2I, powerKw: pv2P },
    ],
    phases: [
      { phase: 'L1', voltageV: jitter(230.8, 0.005), currentA: jitter(156.4, 0.02), frequencyHz: 60.01 },
      { phase: 'L2', voltageV: jitter(229.4, 0.005), currentA: jitter(154.8, 0.02), frequencyHz: 60.01 },
      { phase: 'L3', voltageV: jitter(231.2, 0.005), currentA: jitter(155.9, 0.02), frequencyHz: 60.01 },
    ],
    totalActivePowerKw: parseFloat((pv1P + pv2P).toFixed(2)),
    totalReactivePowerKvar: 4.2,
    todayEnergyKwh: 486.2,
    totalEnergyMwh: 142.8,
    runningHours: 8420,
    activeWorkMode: 'PEAK_SHAVING',
    gridChargeEnabled: true,
    activeFaults: [
      {
        id: 'ALM-0941',
        code: 'W08_GRID_VOLT_SURGE',
        severity: 'WARNING',
        title: 'Utility Grid Voltage Fluctuation',
        description: 'Phase L3 momentarily spiked to 244V; automatically clamped within nominal IEEE 1547 tolerances.',
        timestamp: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
        resolved: false,
      },
      {
        id: 'ALM-0812',
        code: 'I02_TOU_WINDOW_START',
        severity: 'INFO',
        title: 'Peak Tariff Window Triggered',
        description: 'Shifted to battery discharge mode to shave peak grid tariff from $0.34/kWh down to self-generation.',
        timestamp: new Date(Date.now() - 118 * 60 * 1000).toISOString(),
        resolved: true,
      },
    ],
  };
}

export function getMockHourlyEnergyPoints(): HourlyEnergyPoint[] {
  const hours = [
    '00:00', '02:00', '04:00', '06:00', '08:00', '10:00',
    '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'
  ];

  return hours.map((hour, idx) => {
    let solarYield = 0;
    if (idx >= 3 && idx <= 8) {
      // Daytime curve peak around noon
      const peakFactor = Math.sin(((idx - 3) / 6) * Math.PI);
      solarYield = parseFloat((peakFactor * 115.0).toFixed(1));
    }
    const loadDemand = parseFloat((45 + (idx >= 4 && idx <= 9 ? 25 : 10) + Math.random() * 5).toFixed(1));
    const tariffRate = (idx >= 7 && idx <= 10) ? 0.36 : 0.14; // Peak tariff in late afternoon/evening
    const batteryFlow = solarYield > loadDemand ? parseFloat(((solarYield - loadDemand) * 0.6).toFixed(1)) : -parseFloat(((loadDemand - solarYield) * 0.5).toFixed(1));
    const gridFlow = parseFloat((solarYield - loadDemand - batteryFlow).toFixed(1));

    return {
      hour,
      solarYieldKw: solarYield,
      loadDemandKw: loadDemand,
      batteryFlowKw: batteryFlow,
      gridFlowKw: gridFlow,
      tariffRateUsd: tariffRate,
    };
  });
}

export function getMockApiHealth(): ApiHealthMetrics {
  return {
    gatewayUrl: 'https://api.deyecloud.com/v1.0',
    region: 'Asia-Pacific / Global',
    isLive: false,
    status: 'OPTIMAL',
    pingMs: 14,
    rateLimitUsed: 842,
    rateLimitMax: 10000,
    tokenExpiresAt: new Date(Date.now() + 58 * 24 * 3600 * 1000).toISOString(),
    lastChecked: new Date().toISOString(),
  };
}
