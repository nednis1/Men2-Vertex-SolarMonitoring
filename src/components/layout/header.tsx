'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Sun,
  ChevronDown,
  Bell,
  Clock,
  Activity,
  CheckCircle2,
  AlertTriangle,
  User,
  Globe,
  Radio,
  Check,
  Zap,
  Settings,
  Building2,
} from 'lucide-react';
import Link from 'next/link';
import { useAccount } from '@/lib/account-context';

interface HeaderProps {
  currentStationName?: string;
  isLiveApi?: boolean;
  pingMs?: number;
}

export function Header({
  currentStationName,
  isLiveApi = false,
  pingMs = 14,
}: HeaderProps) {
  const {
    accounts,
    selectedAccountId,
    setSelectedAccountId,
    selectedAccount,
    selectedStationId,
    setSelectedStationId,
    selectedPlant,
    selectAccountAndPlant,
    isFleetView,
    totalAccounts,
    liveAccountsCount,
  } = useAccount();

  const [utcTime, setUtcTime] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [expandedAccounts, setExpandedAccounts] = useState<Record<string, boolean>>({});
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isAccountExpanded = (accId: string) => {
    if (expandedAccounts[accId] !== undefined) {
      return expandedAccounts[accId];
    }
    // Default to expanded for active account or if there's only 1 account
    return selectedAccountId === accId || accounts.length === 1;
  };

  const toggleAccountExpand = (accId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedAccounts((prev) => ({
      ...prev,
      [accId]: !isAccountExpanded(accId),
    }));
  };

  const toggleExpandAll = () => {
    const allExpanded = accounts.every((a) => isAccountExpanded(a.id));
    const nextState: Record<string, boolean> = {};
    accounts.forEach((a) => {
      nextState[a.id] = !allExpanded;
    });
    setExpandedAccounts(nextState);
  };

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toISOString().substring(11, 19) + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowAccountDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayTitle = isFleetView
    ? `Global Fleet Aggregate (${totalAccounts} Accounts)`
    : selectedPlant
    ? `${selectedPlant.stationName}`
    : selectedAccount?.name || currentStationName || 'Facility Array';

  return (
    <header className="fixed top-0 left-72 right-0 h-16 bg-surface-container-lowest/90 backdrop-blur-xl z-40 border-b border-[#171f33] shadow-[0_1px_8px_rgba(0,0,0,0.25)]">
      <div className="h-16 w-full px-6 flex items-center justify-between">
        {/* Left: Account & Station Selector */}
        <div className="flex items-center gap-4">
          {/* Account Selector Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowAccountDropdown(!showAccountDropdown)}
              className="flex items-center gap-2.5 px-3.5 py-1.5 bg-surface-container hover:bg-surface-container-high rounded-lg border border-[#222a3d] cursor-pointer transition-colors text-left"
            >
              {isFleetView ? (
                <Globe className="text-primary" size={18} />
              ) : selectedPlant ? (
                <Building2 className="text-primary" size={18} />
              ) : (
                <Sun className="text-primary" size={18} />
              )}
              <div className="flex flex-col">
                <span className="font-body-md text-[13px] text-on-surface font-semibold truncate max-w-[280px]">
                  {displayTitle}
                </span>
                {!isFleetView && selectedPlant && selectedAccount && (
                  <span className="text-[10px] text-on-surface-variant leading-none truncate max-w-[280px]">
                    {selectedAccount.name} · {selectedPlant.installedCapacityKw} kWp
                  </span>
                )}
              </div>
              <ChevronDown
                className={`text-on-surface-variant transition-transform duration-200 ${
                  showAccountDropdown ? 'rotate-180' : ''
                }`}
                size={15}
              />
            </button>

            {/* Dropdown Menu */}
            {showAccountDropdown && (
              <div className="absolute left-0 mt-2 w-92 bg-surface-container-low border border-[#222a3d] rounded-xl shadow-2xl p-2.5 z-50">
                <div className="px-2 py-1 text-[10px] font-label-sm uppercase tracking-wider text-on-surface-variant border-b border-[#222a3d]/70 mb-1.5 flex items-center justify-between">
                  <span>Monitor Accounts & Plants</span>
                  <div className="flex items-center gap-2.5">
                    {accounts.some((a) => (a.plants?.length || 0) > 0) && (
                      <button
                        onClick={toggleExpandAll}
                        className="text-[10px] font-semibold text-primary hover:underline lowercase cursor-pointer"
                      >
                        {accounts.every((a) => isAccountExpanded(a.id)) ? 'collapse all' : 'expand all'}
                      </button>
                    )}
                    <span className="text-primary font-bold">{totalAccounts} Configured</span>
                  </div>
                </div>

                {/* Fleet / All Accounts Option */}
                <button
                  onClick={() => {
                    setSelectedAccountId('ALL');
                    setShowAccountDropdown(false);
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-lg transition-colors text-left ${
                    isFleetView
                      ? 'bg-primary/15 text-primary border border-primary/30'
                      : 'hover:bg-surface-container text-on-surface'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Globe size={16} className={isFleetView ? 'text-primary' : 'text-on-surface-variant'} />
                    <div>
                      <span className="font-body-sm text-[13px] font-semibold block leading-tight">
                        All Accounts (Fleet Aggregate)
                      </span>
                      <span className="font-label-sm text-[11px] text-on-surface-variant block">
                        Simultaneous multi-site telemetry
                      </span>
                    </div>
                  </div>
                  {isFleetView && <Check size={16} className="text-primary" />}
                </button>

                <div className="my-1.5 border-t border-[#222a3d]/50" />

                {/* Individual Accounts & Collapsible Plants */}
                <div className="flex flex-col gap-1.5 max-h-80 overflow-y-auto pr-0.5">
                  {accounts.map((acc) => {
                    const isAccountActive = selectedAccountId === acc.id;
                    const plantCount = acc.plants?.length || 0;
                    const isExpanded = isAccountExpanded(acc.id);

                    return (
                      <div
                        key={acc.id}
                        className="flex flex-col rounded-lg bg-surface-container/30 border border-[#222a3d]/50 overflow-hidden transition-all"
                      >
                        {/* Account Header with Selection and Collapse/Expand Toggle */}
                        <div className="flex items-center justify-between p-1 hover:bg-surface-container/60 transition-colors">
                          <button
                            onClick={() => {
                              selectAccountAndPlant(acc.id, 'ALL');
                              setShowAccountDropdown(false);
                            }}
                            className={`flex-1 flex items-center gap-2 p-1.5 rounded-md transition-colors text-left min-w-0 ${
                              isAccountActive && selectedStationId === 'ALL'
                                ? 'bg-primary/15 text-primary'
                                : 'text-on-surface'
                            }`}
                            title={`Select all plants in ${acc.name}`}
                          >
                            <Zap
                              size={15}
                              className={isAccountActive ? 'text-primary shrink-0' : 'text-on-surface-variant shrink-0'}
                            />
                            <div className="truncate flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="font-body-sm text-[12.5px] font-semibold truncate block">
                                  {acc.name}
                                </span>
                                <span
                                  className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider shrink-0 ${
                                    acc.isLive
                                      ? 'bg-tertiary/15 text-tertiary'
                                      : 'bg-primary/10 text-primary'
                                  }`}
                                >
                                  {acc.isLive ? 'Live' : 'Sim'}
                                </span>
                              </div>
                              <span className="font-label-sm text-[10.5px] text-on-surface-variant block truncate">
                                {plantCount} Plant{plantCount !== 1 ? 's' : ''} · {acc.inverterCount} Inv · {acc.capacityKw} kWp
                              </span>
                            </div>
                            {isAccountActive && selectedStationId === 'ALL' && (
                              <Check size={14} className="text-primary shrink-0 mr-1" />
                            )}
                          </button>

                          {/* Dedicated Expand/Collapse Chevron Button */}
                          {plantCount > 0 && (
                            <button
                              onClick={(e) => toggleAccountExpand(acc.id, e)}
                              className="p-1.5 rounded-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors shrink-0 flex items-center gap-1"
                              title={isExpanded ? 'Collapse plants' : `Expand ${plantCount} plants`}
                              aria-label={isExpanded ? 'Collapse plants' : `Expand ${plantCount} plants`}
                            >
                              <span className="text-[10px] text-on-surface-variant/80 font-mono">
                                {plantCount}
                              </span>
                              <ChevronDown
                                size={14}
                                className={`transition-transform duration-200 ${
                                  isExpanded ? 'rotate-180 text-primary' : ''
                                }`}
                              />
                            </button>
                          )}
                        </div>

                        {/* Collapsible Plant Sub-Items */}
                        {isExpanded && plantCount > 0 && (
                          <div className="pl-3.5 pr-1.5 pb-2 pt-1 flex flex-col gap-1 border-t border-[#222a3d]/40 bg-surface-container-low/50">
                            <div className="text-[9.5px] font-label-sm uppercase tracking-wider text-on-surface-variant/70 pl-2 pb-0.5 flex items-center justify-between">
                              <span>Pick Plant</span>
                              <span className="text-[9px] text-on-surface-variant">{plantCount} Discovered</span>
                            </div>
                            {acc.plants.map((plant) => {
                              const isPlantSelected = isAccountActive && selectedStationId === plant.stationId;
                              return (
                                <button
                                  key={plant.stationId}
                                  onClick={() => {
                                    selectAccountAndPlant(acc.id, plant.stationId);
                                    setShowAccountDropdown(false);
                                  }}
                                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md transition-colors text-left text-xs ${
                                    isPlantSelected
                                      ? 'bg-primary/20 text-primary font-semibold border border-primary/40'
                                      : 'hover:bg-surface-container text-on-surface/90 border border-transparent'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 truncate">
                                    <Building2
                                      size={13}
                                      className={isPlantSelected ? 'text-primary shrink-0' : 'text-on-surface-variant shrink-0'}
                                    />
                                    <span className="truncate">{plant.stationName}</span>
                                    <span className="text-[10px] text-on-surface-variant shrink-0">
                                      {plant.installedCapacityKw} kWp
                                    </span>
                                  </div>
                                  {isPlantSelected && <Check size={13} className="text-primary shrink-0" />}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Footer Shortcut to Accounts Management */}
                <div className="mt-1 pt-1.5 border-t border-[#222a3d]/70">
                  <Link
                    href="/accounts"
                    onClick={() => setShowAccountDropdown(false)}
                    className="w-full flex items-center justify-center gap-2 p-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary font-semibold text-[12px] transition-colors"
                  >
                    <Settings size={13} />
                    Manage Accounts & Plants
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Multi-Account Status Badge */}
          <div className="hidden xl:flex items-center gap-2 px-3 py-1 rounded-full bg-tertiary/10 border border-tertiary/20">
            <span className="w-2 h-2 rounded-full bg-tertiary animate-ping" />
            <span className="font-label-sm text-[11px] text-tertiary font-semibold">
              {liveAccountsCount > 0
                ? `${liveAccountsCount} / ${totalAccounts} Accounts Live (${pingMs}ms)`
                : `Multi-Account Synced (${totalAccounts} Sites Active)`}
            </span>
          </div>
        </div>

        {/* Right: Clock, Notifications, Profile */}
        <div className="flex items-center gap-4">
          {/* UTC Clock */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded bg-surface-container text-on-surface-variant border border-[#222a3d]/50">
            <Clock size={15} className="text-primary/70" />
            <span className="font-label-sm text-[12px] text-on-surface tracking-wider">
              {utcTime || '14:28:09 UTC'}
            </span>
          </div>

          {/* Notifications Button */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              aria-label="Telemetry Notifications"
              className="relative p-2 rounded-lg bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high border border-[#222a3d]/50 transition-colors"
            >
              <Bell size={18} />
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary font-label-sm text-[9px] font-bold text-on-primary">
                {totalAccounts}
              </span>
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-surface-container-low border border-[#222a3d] rounded-xl shadow-2xl p-3 z-50">
                <div className="flex items-center justify-between pb-2 border-b border-[#222a3d] mb-2">
                  <span className="font-label-sm text-[11px] uppercase tracking-wider text-on-surface-variant">
                    Fleet Telemetry Alerts
                  </span>
                  <span className="font-label-sm text-[10px] text-primary">{totalAccounts} Accounts</span>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="p-2 bg-surface-container rounded-lg border-l-2 border-primary">
                    <span className="font-body-sm text-[12px] font-semibold text-on-surface block">
                      Concurrent Polling Active
                    </span>
                    <span className="font-label-sm text-[10px] text-on-surface-variant">
                      Monitoring {totalAccounts} DeyeCloud accounts simultaneously via JSON registry.
                    </span>
                  </div>
                  <div className="p-2 bg-surface-container rounded-lg border-l-2 border-tertiary">
                    <span className="font-body-sm text-[12px] font-semibold text-on-surface block">
                      {selectedAccount ? `${selectedAccount.name} Connected` : accounts[0]?.name ? `${accounts[0].name} Connected` : 'Gateway Telemetry Connected'}
                    </span>
                    <span className="font-label-sm text-[10px] text-on-surface-variant">
                      Gateway responding with active hybrid inverter telemetry.
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-3 pl-2 border-l border-[#222a3d]">
            <div className="text-right hidden sm:block">
              <span className="font-body-sm text-[13px] text-on-surface font-semibold block leading-tight">
                Fleet Operations
              </span>
              <span className="font-label-sm text-[11px] text-on-surface-variant block">
                Multi-Account Admin
              </span>
            </div>
            <div className="w-9 h-9 rounded-full bg-surface-container-high border border-primary/50 flex items-center justify-center text-primary font-bold shadow-[0_0_8px_rgba(255,193,116,0.3)]">
              FO
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
