'use client';

import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Zap,
  Radio,
  Cpu,
  Shield,
  Layers,
  Globe,
  Sliders,
  ChevronRight,
  ExternalLink,
  Power,
  X,
  Server,
} from 'lucide-react';
import { AccountSummary, PlantInfo, DeviceInfo } from '@/lib/types';
import { useAccount } from '@/lib/account-context';

export default function AccountsManagementPage() {
  const { refreshAccounts: refreshContextAccounts } = useAccount();
  const [accounts, setAccounts] = useState<AccountSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  // Add Account Modal State
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '',
    baseUrl: 'https://eu1-developer.deyecloud.com',
    appId: '',
    appSecret: '',
    email: '',
    password: '',
  });
  const [adding, setAdding] = useState(false);
  const [addMessage, setAddMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // Add Plant Modal State
  const [showAddPlantModal, setShowAddPlantModal] = useState(false);
  const [selectedAccountIdForPlant, setSelectedAccountIdForPlant] = useState('');
  const [plantForm, setPlantForm] = useState({
    stationId: '',
    stationName: '',
    installedCapacityKw: 120,
    address: '',
    inverterSn1: '',
    inverterModel1: 'SUN-120K-SG01HP3-EU-AM2',
    inverterKw1: 120,
    inverterSn2: '',
    inverterModel2: 'SUN-120K-SG01HP3-EU-AM2',
    inverterKw2: 120,
    loggerSn: '',
  });
  const [savingPlant, setSavingPlant] = useState(false);

  const fetchAccounts = async () => {
    try {
      const res = await fetch('/api/deye/accounts');
      if (res.ok) {
        const json = await res.json();
        setAccounts(json.accounts || []);
      }
    } catch (e) {
      console.error('Failed to load accounts:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleSyncAccount = async (accountId: string) => {
    setSyncingId(accountId);
    try {
      const res = await fetch('/api/deye/accounts/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId }),
      });
      if (res.ok) {
        await fetchAccounts();
        await refreshContextAccounts();
      }
    } catch (e) {
      console.error('Sync error:', e);
    } finally {
      setSyncingId(null);
    }
  };

  const handleToggleAccount = async (account: AccountSummary) => {
    try {
      const newEnabled = account.status === 'OFFLINE';
      const res = await fetch('/api/deye/accounts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: account.id, enabled: newEnabled }),
      });
      if (res.ok) {
        await fetchAccounts();
        await refreshContextAccounts();
      }
    } catch (e) {
      console.error('Toggle error:', e);
    }
  };

  const handleDeleteAccount = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the account "${name}" and all its registered plants?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/deye/accounts?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await fetchAccounts();
        await refreshContextAccounts();
      }
    } catch (e) {
      console.error('Delete error:', e);
    }
  };

  const handleAddAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    setAddMessage(null);

    try {
      const res = await fetch('/api/deye/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm),
      });

      const json = await res.json();
      if (!res.ok) {
        setAddMessage({ text: json.error || 'Failed to add account', isError: true });
        setAdding(false);
        return;
      }

      setAddMessage({
        text: `Successfully added account! Auto-discovered ${json.plantsDiscovered} plant(s) and ${json.devicesDiscovered} device(s).`,
        isError: false,
      });

      await fetchAccounts();
      await refreshContextAccounts();
      setTimeout(() => {
        setShowAddAccountModal(false);
        setAddForm({
          name: '',
          baseUrl: 'https://eu1-developer.deyecloud.com',
          appId: '',
          appSecret: '',
          email: '',
          password: '',
        });
        setAddMessage(null);
      }, 1500);
    } catch (err) {
      setAddMessage({ text: String(err), isError: true });
    } finally {
      setAdding(false);
    }
  };

  const handleAddPlantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPlant(true);

    const devices: DeviceInfo[] = [];
    if (plantForm.inverterSn1) {
      devices.push({
        deviceSn: plantForm.inverterSn1.trim(),
        deviceType: 'INVERTER',
        name: `${plantForm.stationName} Inverter #1`,
        model: plantForm.inverterModel1,
        ratedKw: Number(plantForm.inverterKw1) || 120,
        loggerSn: plantForm.loggerSn || undefined,
        status: 'ONLINE',
      });
    }
    if (plantForm.inverterSn2) {
      devices.push({
        deviceSn: plantForm.inverterSn2.trim(),
        deviceType: 'INVERTER',
        name: `${plantForm.stationName} Inverter #2`,
        model: plantForm.inverterModel2,
        ratedKw: Number(plantForm.inverterKw2) || 120,
        loggerSn: plantForm.loggerSn || undefined,
        status: 'ONLINE',
      });
    }
    if (plantForm.loggerSn) {
      devices.push({
        deviceSn: plantForm.loggerSn.trim(),
        deviceType: 'LOGGER',
        name: `${plantForm.stationName} Data Logger`,
        model: 'Deye Smart Data Logger',
        status: 'ONLINE',
      });
    }

    const newPlant: PlantInfo = {
      stationId: plantForm.stationId.trim(),
      stationName: plantForm.stationName.trim(),
      installedCapacityKw: Number(plantForm.installedCapacityKw) || 120,
      address: plantForm.address || 'Facility Site',
      devices,
    };

    try {
      const res = await fetch('/api/deye/plants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: selectedAccountIdForPlant,
          plant: newPlant,
        }),
      });

      if (res.ok) {
        setShowAddPlantModal(false);
        await fetchAccounts();
        await refreshContextAccounts();
        setPlantForm({
          stationId: '',
          stationName: '',
          installedCapacityKw: 120,
          address: '',
          inverterSn1: '',
          inverterModel1: 'SUN-120K-SG01HP3-EU-AM2',
          inverterKw1: 120,
          inverterSn2: '',
          inverterModel2: 'SUN-120K-SG01HP3-EU-AM2',
          inverterKw2: 120,
          loggerSn: '',
        });
      }
    } catch (err) {
      console.error('Error adding plant:', err);
    } finally {
      setSavingPlant(false);
    }
  };

  // Compute fleet totals
  const totalAccountsCount = accounts.length;
  const activeAccountsCount = accounts.filter((a) => a.status !== 'OFFLINE').length;
  let totalPlants = 0;
  let totalInverters = 0;
  let totalLoggers = 0;
  let totalCapacity = 0;

  for (const acc of accounts) {
    totalPlants += acc.plants.length;
    totalInverters += acc.inverterCount;
    totalLoggers += acc.loggerCount;
    totalCapacity += acc.capacityKw;
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1600px] mx-auto pb-16">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-2 border-b border-[#222a3d]">
        <div>
          <h1 className="font-headline-lg text-[26px] text-on-surface font-bold flex items-center gap-2.5">
            <Building2 className="text-primary" size={26} />
            Fleet & Plant Operations Manager
          </h1>
          <p className="font-body-sm text-[13px] text-on-surface-variant mt-0.5">
            Dynamic DeyeCloud account registry, automatic plant discovery, and multi-inverter hierarchy.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddAccountModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-bold text-[13px] shadow-[0_0_16px_rgba(245,158,11,0.35)] transition-all"
          >
            <Plus size={16} />
            Add Deye Account
          </button>
        </div>
      </div>

      {/* Fleet Overview KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 w-full">
        <div className="bg-surface-container p-4 rounded-xl border border-[#222a3d]">
          <span className="font-label-sm text-[11px] text-on-surface-variant uppercase tracking-wider block mb-1">
            Registered Accounts
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="font-telemetry-display text-[26px] text-primary font-bold">
              {activeAccountsCount}
            </span>
            <span className="text-[12px] text-on-surface-variant">/ {totalAccountsCount} Active</span>
          </div>
        </div>

        <div className="bg-surface-container p-4 rounded-xl border border-[#222a3d]">
          <span className="font-label-sm text-[11px] text-on-surface-variant uppercase tracking-wider block mb-1">
            Discovered Plants
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="font-telemetry-display text-[26px] text-secondary font-bold">
              {totalPlants}
            </span>
            <span className="text-[12px] text-on-surface-variant">Solar Arrays</span>
          </div>
        </div>

        <div className="bg-surface-container p-4 rounded-xl border border-[#222a3d]">
          <span className="font-label-sm text-[11px] text-on-surface-variant uppercase tracking-wider block mb-1">
            Hybrid Inverters
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="font-telemetry-display text-[26px] text-tertiary font-bold">
              {totalInverters}
            </span>
            <span className="text-[12px] text-on-surface-variant">Active Units</span>
          </div>
        </div>

        <div className="bg-surface-container p-4 rounded-xl border border-[#222a3d]">
          <span className="font-label-sm text-[11px] text-on-surface-variant uppercase tracking-wider block mb-1">
            Data Loggers
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="font-telemetry-display text-[26px] text-on-surface font-bold">
              {totalLoggers}
            </span>
            <span className="text-[12px] text-on-surface-variant">Gateways</span>
          </div>
        </div>

        <div className="bg-surface-container p-4 rounded-xl border border-[#222a3d]">
          <span className="font-label-sm text-[11px] text-on-surface-variant uppercase tracking-wider block mb-1">
            Total Fleet Capacity
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="font-telemetry-display text-[26px] text-primary font-bold">
              {totalCapacity.toFixed(0)}
            </span>
            <span className="text-[12px] text-on-surface-variant">kWp</span>
          </div>
        </div>
      </div>

      {/* Accounts List & Plants Tree */}
      <div className="flex flex-col gap-6">
        {accounts.map((account) => {
          const isLive = account.isLive;
          const isSyncing = syncingId === account.id;

          return (
            <div
              key={account.id}
              className="bg-surface-container-low border border-[#222a3d] rounded-2xl p-6 shadow-xl relative overflow-hidden"
            >
              {/* Account Card Header */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#222a3d]">
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 mt-0.5">
                    <Building2 size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h2 className="font-headline-md text-[19px] text-on-surface font-bold">
                        {account.name}
                      </h2>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-label-sm font-bold border ${
                          account.status === 'ONLINE'
                            ? 'bg-tertiary/10 text-tertiary border-tertiary/30'
                            : account.status === 'SIMULATED'
                            ? 'bg-secondary/10 text-secondary border-secondary/30'
                            : 'bg-on-surface/10 text-on-surface-variant border-[#222a3d]'
                        }`}
                      >
                        {account.status === 'ONLINE'
                          ? '● Live DeyeCloud'
                          : account.status === 'SIMULATED'
                          ? '● Realistic Simulation'
                          : '○ Disabled'}
                      </span>
                      {account.autoDiscovered && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-label-sm bg-primary/10 text-primary border border-primary/20">
                          Auto-Discovered
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-[12px] text-on-surface-variant flex-wrap font-mono">
                      <span>ID: {account.id}</span>
                      <span>·</span>
                      <span>Plants: {account.plants.length}</span>
                      <span>·</span>
                      <span>Inverters: {account.inverterCount}</span>
                      <span>·</span>
                      <span>Loggers: {account.loggerCount}</span>
                      <span>·</span>
                      <span>Capacity: {account.capacityKw} kWp</span>
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="flex items-center gap-2.5 flex-wrap">
                  <button
                    onClick={() => handleSyncAccount(account.id)}
                    disabled={isSyncing}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high border border-[#222a3d] text-on-surface text-[12px] font-semibold transition-colors disabled:opacity-50"
                  >
                    <RefreshCw size={14} className={isSyncing ? 'animate-spin text-primary' : ''} />
                    {isSyncing ? 'Syncing...' : 'Auto-Discover Plants'}
                  </button>

                  <button
                    onClick={() => {
                      setSelectedAccountIdForPlant(account.id);
                      setShowAddPlantModal(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high border border-[#222a3d] text-secondary text-[12px] font-semibold transition-colors"
                  >
                    <Plus size={14} />
                    Add Plant
                  </button>

                  <button
                    onClick={() => handleToggleAccount(account)}
                    title={account.status === 'OFFLINE' ? 'Enable Account' : 'Disable Account'}
                    className={`p-2 rounded-lg border transition-colors ${
                      account.status === 'OFFLINE'
                        ? 'bg-surface-container text-on-surface-variant border-[#222a3d] hover:text-tertiary'
                        : 'bg-tertiary/10 text-tertiary border-tertiary/30 hover:bg-tertiary/20'
                    }`}
                  >
                    <Power size={15} />
                  </button>

                  <button
                    onClick={() => handleDeleteAccount(account.id, account.name)}
                    title="Delete Account"
                    className="p-2 rounded-lg bg-surface-container text-on-surface-variant hover:text-error hover:bg-error/10 border border-[#222a3d] transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {/* Plants & Hardware Under this Account */}
              <div className="mt-5 flex flex-col gap-4">
                <span className="font-label-sm text-[11px] uppercase tracking-wider text-on-surface-variant font-bold">
                  Registered Plants & Attached Hardware
                </span>

                {account.plants.length === 0 ? (
                  <div className="p-6 bg-surface-container rounded-xl border border-dashed border-[#222a3d] text-center">
                    <p className="text-[13px] text-on-surface-variant mb-2">
                      No plants discovered yet for this account.
                    </p>
                    <button
                      onClick={() => handleSyncAccount(account.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-primary/10 text-primary text-[12px] font-bold"
                    >
                      <RefreshCw size={13} />
                      Run Auto-Discovery Now
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {account.plants.map((plant) => (
                      <div
                        key={plant.stationId}
                        className="bg-surface-container p-4 rounded-xl border border-[#222a3d]/80 flex flex-col gap-3"
                      >
                        {/* Plant Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <Zap className="text-primary shrink-0" size={18} />
                            <div>
                              <span className="font-body-md text-[14px] text-on-surface font-bold">
                                {plant.stationName}
                              </span>
                              <span className="font-mono text-[11px] text-primary ml-2">
                                ID: {plant.stationId}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface text-[11px] font-bold">
                              {plant.installedCapacityKw} kWp Installed
                            </span>
                            <span className="text-[11px] text-on-surface-variant">
                              {plant.devices.length} Devices
                            </span>
                          </div>
                        </div>

                        {/* Devices List Table */}
                        <div className="overflow-x-auto mt-1">
                          <table className="w-full text-left text-[12px]">
                            <thead>
                              <tr className="border-b border-[#222a3d]/60 text-on-surface-variant uppercase text-[10px]">
                                <th className="py-1.5 px-2">Type</th>
                                <th className="py-1.5 px-2">Device Name</th>
                                <th className="py-1.5 px-2">Serial Number</th>
                                <th className="py-1.5 px-2">Model</th>
                                <th className="py-1.5 px-2">Rating</th>
                                <th className="py-1.5 px-2 text-right">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#222a3d]/40 font-body-sm">
                              {plant.devices.map((device) => {
                                const isInverter = device.deviceType === 'INVERTER';
                                return (
                                  <tr key={device.deviceSn} className="hover:bg-surface-container-high/50">
                                    <td className="py-2 px-2">
                                      <span
                                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                          isInverter
                                            ? 'bg-secondary/10 text-secondary'
                                            : 'bg-primary/10 text-primary'
                                        }`}
                                      >
                                        {isInverter ? <Cpu size={11} /> : <Radio size={11} />}
                                        {device.deviceType}
                                      </span>
                                    </td>
                                    <td className="py-2 px-2 font-semibold text-on-surface">
                                      {device.name}
                                    </td>
                                    <td className="py-2 px-2 font-mono text-on-surface-variant">
                                      {device.deviceSn}
                                    </td>
                                    <td className="py-2 px-2 text-on-surface-variant">
                                      {device.model || 'Deye Standard'}
                                    </td>
                                    <td className="py-2 px-2 text-on-surface-variant font-mono">
                                      {isInverter ? `${device.ratedKw || 120} kW` : 'Gateway'}
                                    </td>
                                    <td className="py-2 px-2 text-right">
                                      <span className="inline-flex items-center gap-1 text-tertiary font-bold text-[11px]">
                                        <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
                                        {device.status}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: Add DeyeCloud Account */}
      {showAddAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-surface-container-low border border-[#222a3d] rounded-2xl max-w-xl w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setShowAddAccountModal(false)}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface p-1 rounded-lg"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2.5 mb-1">
              <Building2 className="text-primary" size={22} />
              <h3 className="font-headline-md text-[18px] text-on-surface font-bold">
                Add DeyeCloud Account
              </h3>
            </div>
            <p className="text-[12px] text-on-surface-variant mb-4">
              Enter your DeyeCloud Developer Application credentials. The system will automatically discover all plants, inverters, and loggers registered under this account.
            </p>

            <form onSubmit={handleAddAccountSubmit} className="flex flex-col gap-3.5">
              <div>
                <label className="text-[11px] font-label-sm uppercase tracking-wider text-on-surface-variant block mb-1">
                  Account Display Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Account Name or user@example.com"
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container border border-[#222a3d] text-on-surface text-[13px] focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-[11px] font-label-sm uppercase tracking-wider text-on-surface-variant block mb-1">
                  Cloud Gateway Region
                </label>
                <select
                  value={addForm.baseUrl}
                  onChange={(e) => setAddForm({ ...addForm, baseUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container border border-[#222a3d] text-on-surface text-[13px] focus:outline-none focus:border-primary"
                >
                  <option value="https://eu1-developer.deyecloud.com">
                    Asia-Pacific / Philippines / Europe (https://eu1-developer.deyecloud.com)
                  </option>
                  <option value="https://api.deyecloud.com">
                    Global Default (https://api.deyecloud.com)
                  </option>
                  <option value="https://us1-developer.deyecloud.com">
                    Americas (https://us1-developer.deyecloud.com)
                  </option>
                  <option value="https://india-developer.deyecloud.com">
                    India (https://india-developer.deyecloud.com)
                  </option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-label-sm uppercase tracking-wider text-on-surface-variant block mb-1">
                    App ID
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 202609171070002"
                    value={addForm.appId}
                    onChange={(e) => setAddForm({ ...addForm, appId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-surface-container border border-[#222a3d] text-on-surface text-[13px] focus:outline-none focus:border-primary font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-label-sm uppercase tracking-wider text-on-surface-variant block mb-1">
                    App Secret
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="AppSecret token"
                    value={addForm.appSecret}
                    onChange={(e) => setAddForm({ ...addForm, appSecret: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-surface-container border border-[#222a3d] text-on-surface text-[13px] focus:outline-none focus:border-primary font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-label-sm uppercase tracking-wider text-on-surface-variant block mb-1">
                    Deye Account Email
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="registered_email@deye.com"
                    value={addForm.email}
                    onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-surface-container border border-[#222a3d] text-on-surface text-[13px] focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-label-sm uppercase tracking-wider text-on-surface-variant block mb-1">
                    Account Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Deye password"
                    value={addForm.password}
                    onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-surface-container border border-[#222a3d] text-on-surface text-[13px] focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {addMessage && (
                <div
                  className={`p-3 rounded-lg text-[12px] ${
                    addMessage.isError
                      ? 'bg-error/10 text-error border border-error/20'
                      : 'bg-tertiary/10 text-tertiary border border-tertiary/20'
                  }`}
                >
                  {addMessage.text}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 mt-3 pt-3 border-t border-[#222a3d]">
                <button
                  type="button"
                  onClick={() => setShowAddAccountModal(false)}
                  className="px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-[13px] font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adding}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-[13px] font-bold shadow-[0_0_14px_rgba(245,158,11,0.3)] disabled:opacity-50"
                >
                  <RefreshCw size={14} className={adding ? 'animate-spin' : ''} />
                  {adding ? 'Connecting & Auto-Discovering...' : 'Save & Auto-Discover'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add Plant Manually */}
      {showAddPlantModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-surface-container-low border border-[#222a3d] rounded-2xl max-w-xl w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setShowAddPlantModal(false)}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface p-1 rounded-lg"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2.5 mb-1">
              <Plus className="text-secondary" size={22} />
              <h3 className="font-headline-md text-[18px] text-on-surface font-bold">
                Add Solar Plant & Hardware
              </h3>
            </div>
            <p className="text-[12px] text-on-surface-variant mb-4">
              Manually register a solar array with multiple hybrid inverters and data loggers.
            </p>

            <form onSubmit={handleAddPlantSubmit} className="flex flex-col gap-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-label-sm uppercase tracking-wider text-on-surface-variant block mb-1">
                    Station / Plant Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Warehouse Rooftop Array"
                    value={plantForm.stationName}
                    onChange={(e) => setPlantForm({ ...plantForm, stationName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-surface-container border border-[#222a3d] text-on-surface text-[13px] focus:outline-none focus:border-secondary"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-label-sm uppercase tracking-wider text-on-surface-variant block mb-1">
                    Station ID
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SP_W1"
                    value={plantForm.stationId}
                    onChange={(e) => setPlantForm({ ...plantForm, stationId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-surface-container border border-[#222a3d] text-on-surface text-[13px] focus:outline-none focus:border-secondary font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-label-sm uppercase tracking-wider text-on-surface-variant block mb-1">
                    Total Capacity (kWp)
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="120"
                    value={plantForm.installedCapacityKw}
                    onChange={(e) =>
                      setPlantForm({ ...plantForm, installedCapacityKw: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-surface-container border border-[#222a3d] text-on-surface text-[13px] focus:outline-none focus:border-secondary"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-label-sm uppercase tracking-wider text-on-surface-variant block mb-1">
                    Site Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Building C Rooftop"
                    value={plantForm.address}
                    onChange={(e) => setPlantForm({ ...plantForm, address: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-surface-container border border-[#222a3d] text-on-surface text-[13px] focus:outline-none focus:border-secondary"
                  />
                </div>
              </div>

              {/* Inverter 1 */}
              <div className="p-3 bg-surface-container rounded-xl border border-[#222a3d]">
                <span className="text-[11px] font-bold text-secondary uppercase block mb-2">
                  Inverter #1
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Serial Number (e.g. 2408124366)"
                    value={plantForm.inverterSn1}
                    onChange={(e) => setPlantForm({ ...plantForm, inverterSn1: e.target.value })}
                    className="px-2.5 py-1.5 rounded-lg bg-surface-container-high border border-[#222a3d] text-[12px] font-mono"
                  />
                  <input
                    type="number"
                    placeholder="Rated kW (e.g. 120)"
                    value={plantForm.inverterKw1}
                    onChange={(e) =>
                      setPlantForm({ ...plantForm, inverterKw1: Number(e.target.value) })
                    }
                    className="px-2.5 py-1.5 rounded-lg bg-surface-container-high border border-[#222a3d] text-[12px]"
                  />
                </div>
              </div>

              {/* Inverter 2 */}
              <div className="p-3 bg-surface-container rounded-xl border border-[#222a3d]">
                <span className="text-[11px] font-bold text-secondary uppercase block mb-2">
                  Inverter #2 (Optional)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Serial Number (e.g. 2408270126)"
                    value={plantForm.inverterSn2}
                    onChange={(e) => setPlantForm({ ...plantForm, inverterSn2: e.target.value })}
                    className="px-2.5 py-1.5 rounded-lg bg-surface-container-high border border-[#222a3d] text-[12px] font-mono"
                  />
                  <input
                    type="number"
                    placeholder="Rated kW (e.g. 120)"
                    value={plantForm.inverterKw2}
                    onChange={(e) =>
                      setPlantForm({ ...plantForm, inverterKw2: Number(e.target.value) })
                    }
                    className="px-2.5 py-1.5 rounded-lg bg-surface-container-high border border-[#222a3d] text-[12px]"
                  />
                </div>
              </div>

              {/* Logger */}
              <div>
                <label className="text-[11px] font-label-sm uppercase tracking-wider text-on-surface-variant block mb-1">
                  Data Logger Serial Number (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 2408L009142"
                  value={plantForm.loggerSn}
                  onChange={(e) => setPlantForm({ ...plantForm, loggerSn: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container border border-[#222a3d] text-on-surface text-[13px] focus:outline-none focus:border-secondary font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 mt-3 pt-3 border-t border-[#222a3d]">
                <button
                  type="button"
                  onClick={() => setShowAddPlantModal(false)}
                  className="px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-[13px] font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPlant}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-secondary hover:bg-secondary/90 text-on-secondary text-[13px] font-bold shadow-[0_0_14px_rgba(76,215,246,0.3)] disabled:opacity-50"
                >
                  {savingPlant ? 'Saving Plant...' : 'Save Plant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
