'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Zap,
  Sliders,
  TrendingUp,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Sun,
  BatteryCharging,
  Radio,
  Building2,
} from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    {
      label: 'Energy Flow & Fleet',
      href: '/',
      icon: Zap,
    },
    {
      label: 'Accounts & Plants',
      href: '/accounts',
      icon: Building2,
    },
    {
      label: 'Hardware Telemetry',
      href: '/hardware-telemetry',
      icon: Sliders,
    },
    {
      label: 'Yield & Arbitrage',
      href: '/yield-arbitrage',
      icon: TrendingUp,
    },
    {
      label: 'API & Diagnostics',
      href: '/api-diagnostics',
      icon: ShieldCheck,
    },
  ];

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-surface-container-lowest z-50 flex flex-col justify-between shadow-[0_1px_8px_rgba(0,0,0,0.4)] border-r border-[#171f33] transition-all duration-300 ${
        collapsed ? 'w-20' : 'w-72'
      }`}
    >
      <div className="flex flex-col">
        {/* Brand Header */}
        <div className="h-16 px-4 flex items-center justify-between bg-surface-container-low border-b border-[#171f33]">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse shrink-0" />
            {!collapsed && (
              <span className="font-headline-sm text-[18px] uppercase tracking-wider text-primary truncate">
                Deye<span className="text-secondary">Cloud</span>
              </span>
            )}
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            aria-label="Toggle navigation"
            className="p-1.5 rounded text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Section Title */}
        {!collapsed && (
          <div className="px-5 pt-4 pb-2">
            <span className="font-label-sm text-[11px] text-on-surface-variant uppercase tracking-widest">
              Mission Control
            </span>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="flex flex-col gap-1.5 px-3 pt-2">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/' && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-all ${
                  isActive
                    ? 'bg-primary-container text-on-primary-container font-semibold shadow-[0_0_14px_rgba(245,158,11,0.35)]'
                    : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                }`}
              >
                <Icon
                  size={19}
                  className={isActive ? 'text-on-primary-container' : 'text-primary/80'}
                />
                {!collapsed && (
                  <span className="font-body-md text-[14px] truncate">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Fleet Matrix Card (Visible when expanded) */}
      {!collapsed ? (
        <div className="p-4 m-3 bg-surface-container-low rounded-xl border border-[#222a3d]/60 shadow-lg">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#222a3d]/50">
            <span className="font-label-sm text-[11px] text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5">
              <Radio size={12} className="text-tertiary animate-pulse" /> Fleet Matrix
            </span>
            <span className="font-label-sm text-[11px] text-tertiary font-bold">18/18 Online</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-surface-container p-2.5 rounded-lg">
              <span className="font-label-sm text-[10px] text-on-surface-variant block mb-0.5">
                Harvest
              </span>
              <div className="flex items-baseline gap-1">
                <span className="font-telemetry-display text-[17px] text-primary leading-tight font-bold">
                  1.84
                </span>
                <span className="font-telemetry-unit text-[11px] text-on-surface-variant">MW</span>
              </div>
            </div>
            <div className="bg-surface-container p-2.5 rounded-lg">
              <span className="font-label-sm text-[10px] text-on-surface-variant block mb-0.5">
                Storage
              </span>
              <div className="flex items-baseline gap-1">
                <span className="font-telemetry-display text-[17px] text-secondary leading-tight font-bold">
                  94.2
                </span>
                <span className="font-telemetry-unit text-[11px] text-on-surface-variant">%</span>
              </div>
            </div>
          </div>
          <div className="mt-2.5 pt-2 flex items-center justify-between text-on-surface-variant border-t border-[#222a3d]/40">
            <span className="font-label-sm text-[11px]">Grid Dispatch</span>
            <span className="font-label-sm text-[11px] text-tertiary-fixed-dim font-bold">
              +640 kW
            </span>
          </div>
        </div>
      ) : (
        <div className="p-2 flex flex-col items-center gap-2 pb-4">
          <div className="w-2.5 h-2.5 rounded-full bg-tertiary animate-ping" />
        </div>
      )}
    </aside>
  );
}
