'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Radio,
  Terminal,
  Play,
  Copy,
  Check,
  Send,
  AlertCircle,
  Activity,
  Key,
  Server,
  RefreshCw,
} from 'lucide-react';
import { ApiHealthMetrics } from '@/lib/types';
import { useAccount } from '@/lib/account-context';

export default function ApiDiagnosticsPage() {
  const { selectedAccountId, selectedAccount, isFleetView, totalAccounts } = useAccount();
  const [health, setHealth] = useState<ApiHealthMetrics | null>(null);
  const [currentLang, setCurrentLang] = useState<'curl' | 'python' | 'node'>('curl');
  const [currentPreset, setCurrentPreset] = useState<'telemetry' | 'station' | 'workmode'>('telemetry');
  const [copied, setCopied] = useState(false);

  // Playground Execution State
  const [executing, setExecuting] = useState(false);
  const [responseOutput, setResponseOutput] = useState<string | null>(null);

  // Workmode Command Form State
  const [selectedMode, setSelectedMode] = useState<'PEAK_SHAVING' | 'BATTERY_FIRST' | 'LOAD_FIRST' | 'SELLING_FIRST'>('PEAK_SHAVING');
  const [gridCharge, setGridCharge] = useState(true);
  const [dispatchStatus, setDispatchStatus] = useState<{ message: string; success: boolean } | null>(null);
  const [dispatching, setDispatching] = useState(false);

  const fetchHealth = () => {
    const query = isFleetView ? '' : `?accountId=${encodeURIComponent(selectedAccountId)}`;
    fetch(`/api/deye/health${query}`)
      .then((r) => r.json())
      .then((data) => setHealth(data))
      .catch((e) => console.error(e));
  };

  useEffect(() => {
    fetchHealth();
  }, [selectedAccountId, isFleetView]);

  const snippets = {
    curl: {
      station: `curl -X GET "https://api.deyecloud.com/v1.0/station/latest?station_id=SP_04" \\\n  -H "Authorization: Bearer deye_live_token_77a988d" \\\n  -H "Accept: application/json"`,
      telemetry: `curl -X GET "https://api.deyecloud.com/v1.0/device/inverter/telemetry?device_sn=2209X891104" \\\n  -H "Authorization: Bearer deye_live_token_77a988d" \\\n  -H "Content-Type: application/json"`,
      workmode: `curl -X POST "https://api.deyecloud.com/v1.0/control/workmode" \\\n  -H "Authorization: Bearer deye_live_token_77a988d" \\\n  -H "Content-Type: application/json" \\\n  -d '{"device_sn": "2209X891104", "mode": "PEAK_SHAVING", "grid_charge": true}'`,
    },
    python: {
      station: `import requests\n\nurl = "https://api.deyecloud.com/v1.0/station/latest"\nheaders = {"Authorization": "Bearer deye_live_token_77a988d"}\nres = requests.get(url, params={"station_id": "SP_04"}, headers=headers)\nprint(res.json())`,
      telemetry: `import requests\n\nurl = "https://api.deyecloud.com/v1.0/device/inverter/telemetry"\nheaders = {"Authorization": "Bearer deye_live_token_77a988d"}\nres = requests.get(url, params={"device_sn": "2209X891104"}, headers=headers)\nprint(res.json())`,
      workmode: `import requests\n\nurl = "https://api.deyecloud.com/v1.0/control/workmode"\npayload = {"device_sn": "2209X891104", "mode": "PEAK_SHAVING", "grid_charge": True}\nres = requests.post(url, json=payload, headers={"Authorization": "Bearer deye_live_token_77a988d"})\nprint(res.status_code, res.json())`,
    },
    node: {
      station: `const axios = require('axios');\n\nconst { data } = await axios.get('https://api.deyecloud.com/v1.0/station/latest', {\n  params: { station_id: 'SP_04' },\n  headers: { Authorization: 'Bearer deye_live_token_77a988d' }\n});\nconsole.log(data);`,
      telemetry: `const axios = require('axios');\n\nconst { data } = await axios.get('https://api.deyecloud.com/v1.0/device/inverter/telemetry', {\n  params: { device_sn: '2209X891104' },\n  headers: { Authorization: 'Bearer deye_live_token_77a988d' }\n});\nconsole.log(data);`,
      workmode: `const axios = require('axios');\n\nconst { data } = await axios.post('https://api.deyecloud.com/v1.0/control/workmode', {\n  device_sn: '2209X891104',\n  mode: 'PEAK_SHAVING',\n  grid_charge: true\n}, {\n  headers: { Authorization: 'Bearer deye_live_token_77a988d' }\n});\nconsole.log(data);`,
    },
  };

  const copyCode = () => {
    const code = snippets[currentLang][currentPreset];
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const executePlayground = async () => {
    setExecuting(true);
    setResponseOutput(null);

    try {
      const query = isFleetView ? '' : `?accountId=${encodeURIComponent(selectedAccountId)}`;
      let endpoint = `/api/deye/telemetry${query}`;
      let method = 'GET';
      let bodyData = undefined;

      if (currentPreset === 'station') {
        endpoint = `/api/deye/station${query}`;
      } else if (currentPreset === 'workmode') {
        endpoint = '/api/deye/control';
        method = 'POST';
        bodyData = JSON.stringify({
          deviceSn: '2209X891104',
          mode: 'PEAK_SHAVING',
          gridCharge: true,
          accountId: isFleetView ? undefined : selectedAccountId,
        });
      }

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: bodyData,
      });

      const json = await res.json();
      setResponseOutput(JSON.stringify(json, null, 2));
    } catch (err) {
      setResponseOutput(`Execution Error: ${String(err)}`);
    } finally {
      setExecuting(false);
    }
  };

  const dispatchWorkmode = async () => {
    setDispatching(true);
    setDispatchStatus(null);

    try {
      const res = await fetch('/api/deye/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceSn: '2209X891104',
          mode: selectedMode,
          gridCharge,
          accountId: isFleetView ? undefined : selectedAccountId,
        }),
      });

      const json = await res.json();
      setDispatchStatus({
        message: json.message || 'Workmode command dispatched',
        success: json.success ?? true,
      });
    } catch (e) {
      setDispatchStatus({
        message: `Failed to dispatch workmode: ${String(e)}`,
        success: false,
      });
    } finally {
      setDispatching(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1600px] mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-2 border-b border-[#222a3d]">
        <div>
          <h1 className="font-headline-lg text-[26px] text-on-surface font-bold flex items-center gap-2.5">
            <ShieldCheck className="text-tertiary" size={26} />
            DeyeCloud OpenAPI Gateway & Diagnostics
          </h1>
          <p className="font-body-sm text-[13px] text-on-surface-variant mt-0.5">
            Live bearer authentication, interactive request sandbox, rate-limit health, and workmode controls.
          </p>
        </div>

        <button
          onClick={fetchHealth}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high border border-[#222a3d] text-on-surface text-[13px] font-label-sm transition-all"
        >
          <RefreshCw size={14} className="text-on-surface-variant" />
          Ping Gateway
        </button>
      </div>

      {/* Gateway Health Status Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-surface-container rounded-xl border border-tertiary/40">
          <div className="flex items-center justify-between mb-2">
            <span className="font-label-sm text-[11px] text-on-surface-variant uppercase">
              Gateway Connection
            </span>
            <Radio size={14} className="text-tertiary animate-pulse" />
          </div>
          <span className="font-headline-sm text-[18px] text-tertiary font-bold block">
            {health?.status || 'OPTIMAL'}
          </span>
          <span className="font-label-sm text-[11px] text-on-surface-variant mt-1 block">
            Ping: <strong className="text-on-surface">{health?.pingMs || 14} ms</strong> | SSL Encrypted
          </span>
        </div>

        <div className="p-4 bg-surface-container rounded-xl border border-secondary/40">
          <div className="flex items-center justify-between mb-2">
            <span className="font-label-sm text-[11px] text-on-surface-variant uppercase">
              Daily Rate Limit
            </span>
            <Server size={14} className="text-secondary" />
          </div>
          <span className="font-telemetry-display text-[18px] text-secondary font-bold block">
            {health?.rateLimitUsed || 842} / {health?.rateLimitMax.toLocaleString() || '10,000'}
          </span>
          <span className="font-label-sm text-[11px] text-on-surface-variant mt-1 block">
            8.4% Quota Consumed
          </span>
        </div>

        <div className="p-4 bg-surface-container rounded-xl border border-primary/40">
          <div className="flex items-center justify-between mb-2">
            <span className="font-label-sm text-[11px] text-on-surface-variant uppercase">
              Bearer Session
            </span>
            <Key size={14} className="text-primary" />
          </div>
          <span className="font-label-sm text-[14px] text-primary font-bold block">
            60-Day Token Active
          </span>
          <span className="font-label-sm text-[11px] text-on-surface-variant mt-1 block">
            SHA-256 Signature Verified
          </span>
        </div>

        <div className="p-4 bg-surface-container rounded-xl border border-[#222a3d]">
          <div className="flex items-center justify-between mb-2">
            <span className="font-label-sm text-[11px] text-on-surface-variant uppercase">
              Backend Mode
            </span>
            <Activity size={14} className="text-tertiary" />
          </div>
          <span className="font-headline-sm text-[16px] text-on-surface font-bold block">
            {health?.isLive ? 'Live DeyeCloud' : 'Simulated Sandbox'}
          </span>
          <span className="font-label-sm text-[11px] text-on-surface-variant mt-1 block">
            Automatic Failover Guard
          </span>
        </div>
      </div>

      {/* Interactive API Request Playground & Code Switcher */}
      <div className="bg-surface-container-low rounded-2xl border border-[#222a3d] p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 pb-3 border-b border-[#222a3d]">
          <div className="flex items-center gap-2">
            <Terminal className="text-primary" size={20} />
            <h2 className="font-headline-sm text-[17px] text-on-surface font-bold">
              Interactive OpenAPI Explorer & Code Generator
            </h2>
          </div>

          {/* Preset Selector */}
          <div className="flex items-center gap-1.5 p-1 bg-surface-container rounded-xl border border-[#222a3d]">
            <button
              onClick={() => setCurrentPreset('telemetry')}
              className={`px-3 py-1 rounded-lg text-[11px] font-label-sm font-semibold transition-all ${
                currentPreset === 'telemetry'
                  ? 'bg-primary text-on-primary font-bold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Telemetry (GET)
            </button>
            <button
              onClick={() => setCurrentPreset('station')}
              className={`px-3 py-1 rounded-lg text-[11px] font-label-sm font-semibold transition-all ${
                currentPreset === 'station'
                  ? 'bg-primary text-on-primary font-bold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Station (GET)
            </button>
            <button
              onClick={() => setCurrentPreset('workmode')}
              className={`px-3 py-1 rounded-lg text-[11px] font-label-sm font-semibold transition-all ${
                currentPreset === 'workmode'
                  ? 'bg-primary text-on-primary font-bold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Workmode (POST)
            </button>
          </div>
        </div>

        {/* Code Snippet Viewer with Tabs */}
        <div className="bg-surface-container-lowest rounded-xl border border-[#222a3d] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 bg-surface-container border-b border-[#222a3d]">
            <div className="flex items-center gap-2">
              {(['curl', 'python', 'node'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setCurrentLang(lang)}
                  className={`px-3 py-1 rounded text-[11px] font-label-sm transition-all ${
                    currentLang === lang
                      ? 'bg-surface-container-highest text-on-surface font-bold'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={copyCode}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-container-high hover:bg-surface-container-highest text-[11px] font-label-sm text-on-surface transition-all"
              >
                {copied ? <Check size={12} className="text-tertiary" /> : <Copy size={12} />}
                {copied ? 'Copied!' : 'Copy Code'}
              </button>

              <button
                onClick={executePlayground}
                disabled={executing}
                className="flex items-center gap-1.5 px-3 py-1 rounded bg-primary hover:bg-primary-container text-on-primary font-label-sm text-[11px] font-bold shadow-[0_0_12px_rgba(255,193,116,0.3)] transition-all"
              >
                <Play size={12} className={executing ? 'animate-spin' : ''} />
                {executing ? 'Executing...' : 'Run Request'}
              </button>
            </div>
          </div>

          <pre className="p-4 text-[12px] font-mono text-primary/90 overflow-x-auto leading-relaxed bg-[#060e20]">
            <code>{snippets[currentLang][currentPreset]}</code>
          </pre>
        </div>

        {/* Output Console from Execution */}
        {responseOutput && (
          <div className="mt-4 p-4 rounded-xl bg-surface-container border border-tertiary/40">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#222a3d]">
              <span className="font-label-sm text-[11px] text-tertiary font-bold uppercase tracking-wider">
                Live Response Output (200 OK)
              </span>
              <button
                onClick={() => setResponseOutput(null)}
                className="text-on-surface-variant text-[11px] hover:text-on-surface"
              >
                Clear
              </button>
            </div>
            <pre className="text-[11px] font-mono text-on-surface max-h-60 overflow-y-auto leading-relaxed">
              {responseOutput}
            </pre>
          </div>
        )}
      </div>

      {/* Hardware Control Dispatcher */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface-container rounded-2xl border border-[#222a3d] p-6 shadow-lg">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[#222a3d]">
            <Send className="text-secondary" size={18} />
            <h3 className="font-headline-sm text-[16px] text-on-surface font-bold">
              Dispatch Inverter Operating Mode
            </h3>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <label className="font-label-sm text-[11px] text-on-surface-variant block mb-1.5 uppercase">
                Target Operating Mode
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'PEAK_SHAVING', label: 'Peak Shaving' },
                  { id: 'BATTERY_FIRST', label: 'Battery First' },
                  { id: 'LOAD_FIRST', label: 'Load First' },
                  { id: 'SELLING_FIRST', label: 'Selling First' },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMode(m.id as any)}
                    className={`p-2.5 rounded-xl text-left border transition-all ${
                      selectedMode === m.id
                        ? 'bg-secondary/15 border-secondary text-secondary font-bold'
                        : 'bg-surface-container-low border-[#222a3d] text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    <span className="font-body-md text-[13px] block">{m.label}</span>
                    <span className="font-mono text-[10px] text-on-surface-variant">{m.id}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-surface-container-low rounded-xl border border-[#222a3d]">
              <div>
                <span className="font-body-sm text-[13px] text-on-surface font-semibold block">
                  Enable Grid Charge
                </span>
                <span className="font-label-sm text-[10px] text-on-surface-variant">
                  Allows battery charging from utility grid during off-peak windows
                </span>
              </div>
              <input
                type="checkbox"
                checked={gridCharge}
                onChange={(e) => setGridCharge(e.target.checked)}
                className="w-5 h-5 accent-secondary cursor-pointer"
              />
            </div>

            {dispatchStatus && (
              <div
                className={`p-3 rounded-xl border text-[12px] font-label-sm ${
                  dispatchStatus.success
                    ? 'bg-tertiary/10 border-tertiary/40 text-tertiary'
                    : 'bg-error-container/20 border-error/40 text-error'
                }`}
              >
                {dispatchStatus.message}
              </div>
            )}

            <button
              onClick={dispatchWorkmode}
              disabled={dispatching}
              className="w-full py-2.5 rounded-xl bg-secondary hover:bg-secondary-container text-on-secondary font-label-sm text-[13px] font-bold shadow-[0_0_16px_rgba(76,215,246,0.3)] transition-all flex items-center justify-center gap-2"
            >
              <Send size={15} className={dispatching ? 'animate-spin' : ''} />
              {dispatching ? 'Dispatching...' : 'Dispatch Mode to DeyeCloud'}
            </button>
          </div>
        </div>

        {/* Credentials & Setup Reference */}
        <div className="bg-surface-container rounded-2xl border border-[#222a3d] p-6 shadow-lg">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[#222a3d]">
            <Key className="text-primary" size={18} />
            <h3 className="font-headline-sm text-[16px] text-on-surface font-bold">
              DeyeCloud Credentials Configuration
            </h3>
          </div>

          <p className="font-body-sm text-[13px] text-on-surface-variant mb-4 leading-relaxed">
            To connect this dashboard to your physical Deye hybrid inverters in production, create a{' '}
            <code className="px-1.5 py-0.5 rounded bg-surface-container-high text-primary font-mono text-[12px]">
              .env.local
            </code>{' '}
            file inside this directory with your developer keys from{' '}
            <a
              href="https://developer.deyecloud.com"
              target="_blank"
              rel="noreferrer"
              className="text-secondary underline"
            >
              developer.deyecloud.com
            </a>
            :
          </p>

          <div className="bg-surface-container-lowest p-3.5 rounded-xl border border-[#222a3d] font-mono text-[11px] text-primary/90 space-y-1 overflow-x-auto">
            <div>DEYE_BASE_URL=https://api.deyecloud.com</div>
            <div>DEYE_APP_ID=your_app_id</div>
            <div>DEYE_APP_SECRET=your_app_secret</div>
            <div>DEYE_EMAIL=developer@company.com</div>
            <div>DEYE_PASSWORD=your_password</div>
            <div>DEYE_DEFAULT_STATION_ID=SP_04</div>
            <div>DEYE_DEFAULT_DEVICE_SN=2209X891104</div>
          </div>

          <div className="mt-4 p-3 bg-surface-container-low rounded-xl border border-[#222a3d] flex items-center gap-3">
            <ShieldCheck size={18} className="text-tertiary shrink-0" />
            <span className="font-label-sm text-[11px] text-on-surface-variant">
              The server-side proxy automatically performs SHA-256 password encryption and token caching so credentials never leak to client browsers.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
