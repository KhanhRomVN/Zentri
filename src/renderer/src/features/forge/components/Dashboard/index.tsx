/**
 * FORGE Dashboard — tổng quan toàn bộ platforms.
 * Bao gồm: statBox (tổng platforms, sessions, accounts, tỉ lệ sống TB)
 * và grid PlatformCard với favicon, title, dòng 2 tóm tắt.
 */

import { useState, useEffect } from 'react';
import { LayoutGrid, Users, Activity, Gauge } from 'lucide-react';
import { Platform } from '../../types';
import PlatformCard from '../PlatformCard';
import {
  fetchDashboardStats,
  fetchPlatformStats,
  type DashboardStats,
  type PlatformStats,
} from '../../services/forgeService';

interface DashboardProps {
  platforms: Platform[];
  isLoading?: boolean;
  onSelectPlatform: (platformId: string) => void;
}

const Dashboard = ({ platforms, isLoading, onSelectPlatform }: DashboardProps) => {
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [platformStatsMap, setPlatformStatsMap] = useState<Record<string, PlatformStats>>({});

  // Fetch dashboard stats
  useEffect(() => {
    let cancelled = false;
    fetchDashboardStats().then((stats) => {
      if (!cancelled) setDashboardStats(stats);
    });
    return () => {
      cancelled = true;
    };
  }, [platforms.length]);

  // Fetch per-platform stats
  useEffect(() => {
    let cancelled = false;
    const loadPlatformStats = async () => {
      const map: Record<string, PlatformStats> = {};
      await Promise.all(
        platforms.map(async (platform) => {
          try {
            const stats = await fetchPlatformStats(platform.id);
            map[platform.id] = stats;
          } catch (err) {
            console.error(`[Dashboard] Failed to fetch stats for ${platform.id}:`, err);
          }
        }),
      );
      if (!cancelled) setPlatformStatsMap(map);
    };
    loadPlatformStats();
    return () => {
      cancelled = true;
    };
  }, [platforms]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full opacity-40">
        <span className="text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">
          Loading platforms...
        </span>
      </div>
    );
  }

  if (platforms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
          <svg
            className="w-6 h-6 text-muted-foreground"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <rect x="3" y="3" width="7" height="9" rx="1.5" />
            <rect x="14" y="3" width="7" height="5" rx="1.5" />
            <rect x="14" y="12" width="7" height="9" rx="1.5" />
            <rect x="3" y="16" width="7" height="5" rx="1.5" />
          </svg>
        </div>
        <h4 className="text-sm font-bold mb-1">Chưa có nền tảng nào</h4>
        <p className="text-xs text-muted-foreground max-w-[280px]">
          Thêm nền tảng đầu tiên bằng nút "+" ở sidebar để bắt đầu quản lý.
        </p>
      </div>
    );
  }

  const formatRate = (rate: number): string => `${Math.round(rate)}%`;

  return (
    <div className="p-6 h-full overflow-y-auto">
      {/* Header */}
      <div className="mb-5">
        <h2 className="text-xl font-bold font-head">Tổng quan nền tảng</h2>
        <p className="text-xs text-muted-foreground mt-1">
          {platforms.length} nền tảng đang được quản lý
        </p>
      </div>

      {/* StatBoxes */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="p-4 bg-card border border-border rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <LayoutGrid className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Nền tảng
            </span>
          </div>
          <div className="text-2xl font-bold">{dashboardStats?.totalPlatforms ?? '—'}</div>
        </div>
        <div className="p-4 bg-card border border-border rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-blue-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Phiên
            </span>
          </div>
          <div className="text-2xl font-bold">{dashboardStats?.totalSessions ?? '—'}</div>
        </div>
        <div className="p-4 bg-card border border-border rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-emerald-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Account
            </span>
          </div>
          <div className="text-2xl font-bold">{dashboardStats?.totalAccounts ?? '—'}</div>
        </div>
        <div className="p-4 bg-card border border-border rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Gauge className="w-4 h-4 text-amber-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Tỉ lệ sống
            </span>
          </div>
          <div className="text-2xl font-bold">
            {dashboardStats ? formatRate(dashboardStats.avgSurvivalRate) : '—'}
          </div>
        </div>
      </div>

      {/* Platform cards grid */}
      <div className="grid grid-cols-4 gap-3">
        {platforms.map((platform) => (
          <PlatformCard
            key={platform.id}
            platform={platform}
            stats={platformStatsMap[platform.id]}
            onSelectPlatform={onSelectPlatform}
          />
        ))}
      </div>
    </div>
  );
};

export default Dashboard;