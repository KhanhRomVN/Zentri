import { FC, useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { History, Clock, Activity, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  parseISO,
  getYear,
  getMonth,
} from 'date-fns';

interface HistoryItem {
  url: string;
  title: string;
  time: number;
  duration: number;
}

interface ActivityInterval {
  hour: number;
  count: number;
}

interface TopWebsite {
  domain: string;
  count: number;
  duration: number;
  url: string;
}

interface HistoryStats {
  topWebsites: TopWebsite[];
  intervals: ActivityInterval[];
  totalVisits: number;
}

interface HistoryTabProps {
  email: string;
}

const HistoryCalendar: FC<{
  email: string;
  selectedDate: string;
  onDateSelect: (date: string) => void;
}> = ({ email, selectedDate, onDateSelect }) => {
  const [viewDate, setViewDate] = useState(parseISO(selectedDate));
  const [activityData, setActivityData] = useState<Record<string, { domainCount: number }>>({});

  useEffect(() => {
    const fetchDates = async () => {
      try {
        // @ts-ignore
        const result = await window.electron.ipcRenderer.invoke('email:get-history-dates', {
          email,
          month: getMonth(viewDate),
          year: getYear(viewDate),
        });
        if (result.success) {
          setActivityData(result.activity || {});
        }
      } catch (e) {
        console.error('Failed to fetch activity dates:', e);
      }
    };
    fetchDates();
  }, [email, viewDate]);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(viewDate));
    const end = endOfWeek(endOfMonth(viewDate));
    return eachDayOfInterval({ start, end });
  }, [viewDate]);

  const nextMonth = () => setViewDate(addMonths(viewDate, 1));
  const prevMonth = () => setViewDate(subMonths(viewDate, 1));

  return (
    <div className="flex flex-col gap-6 w-full p-4 bg-card/50 backdrop-blur-xl border-y border-border/50 shadow-xl overflow-hidden">
      {/* Calendar Header with navigation at corners */}
      <div className="flex items-center justify-between px-2">
        <button
          onClick={prevMonth}
          className="w-10 h-10 flex items-center justify-center bg-card/60 hover:bg-primary/20 rounded-xl transition-all text-muted-foreground/80 hover:text-primary active:scale-95 shadow-sm"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center">
          <h3 className="text-[14px] font-black uppercase tracking-tight text-foreground/90 leading-tight">
            {format(viewDate, 'MMMM')}
          </h3>
          <span className="text-[11px] font-bold text-muted-foreground/40 uppercase tracking-widest leading-none mt-1.5 font-mono">
            {format(viewDate, 'yyyy')}
          </span>
        </div>

        <button
          onClick={nextMonth}
          className="w-10 h-10 flex items-center justify-center bg-card/60 hover:bg-primary/20 rounded-xl transition-all text-muted-foreground/80 hover:text-primary active:scale-95 shadow-sm"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Grid - Standard padding restored */}
      <div className="grid grid-cols-7 gap-1">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
          <div
            key={i}
            className="h-10 flex items-center justify-center text-[11px] font-black text-muted-foreground/80 uppercase bg-card/60 rounded-sm shadow-sm"
          >
            {day}
          </div>
        ))}
        {days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const isSelected = isSameDay(day, parseISO(selectedDate));
          const isCurrentMonth = isSameMonth(day, viewDate);
          const activity = activityData?.[dateStr];

          return (
            <button
              key={day.toISOString()}
              onClick={() => onDateSelect(dateStr)}
              className={`
                aspect-square flex flex-col items-center justify-center transition-all relative group rounded-xl
                ${
                  isSelected
                    ? 'bg-primary/20 text-primary z-10 shadow-sm border border-primary/20'
                    : 'bg-background/20 hover:bg-primary/5 text-foreground/40 hover:text-primary'
                }
                ${!isCurrentMonth && !isSelected ? 'opacity-[0.05]' : ''}
              `}
            >
              <span
                className={`text-[13px] font-black font-mono tracking-tighter ${isSelected ? 'scale-110' : ''}`}
              >
                {format(day, 'd')}
              </span>

              {activity && activity.domainCount > 0 && (
                <div className="absolute top-1 right-1">
                  <span
                    className={`text-[8px] font-mono font-black ${isSelected ? 'text-primary/60' : 'text-primary/30'}`}
                  >
                    {activity.domainCount}
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const HistoryActivityChart: FC<{ intervals: ActivityInterval[] }> = ({ intervals }) => {
  const { t } = useTranslation();
  const chartData = useMemo(() => {
    if (!intervals || intervals.length === 0) {
      return Array.from({ length: 25 }, (_, i) => ({
        hour: i % 24,
        count: 0,
        label: `${(i % 24).toString().padStart(2, '0')}:00`,
      }));
    }
    const base = intervals.map((i) => ({
      ...i,
      label: `${i.hour.toString().padStart(2, '0')}:00`,
    }));
    base.push({ hour: 0, count: 0, label: '00:00' });
    return base;
  }, [intervals]);

  return (
    <div className="space-y-4">
      <div className="flex items-center px-1">
        <h3 className="text-[14px] font-black uppercase tracking-[0.1em] text-foreground/70">
          {t('email.history.activityChart')}
        </h3>
      </div>
      <div className="p-6 pb-2 bg-card/50 backdrop-blur-xl border border-border/50 rounded-2xl shadow-xl overflow-hidden">
        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="rgb(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="rgb(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="hour" hide />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-popover/90 backdrop-blur-xl border border-border/50 p-2 rounded-xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <p className="text-[10px] font-black text-primary uppercase tracking-wider mb-1">
                          {payload[0].payload.label}
                        </p>
                        <p className="text-[14px] font-bold text-foreground">
                          {payload[0].value}{' '}
                          <span className="text-[10px] font-medium text-muted-foreground ml-1">
                            visits
                          </span>
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
                cursor={{
                  stroke: 'rgb(var(--primary))',
                  strokeWidth: 1,
                  strokeDasharray: '4 4',
                  opacity: 0.5,
                }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="rgb(var(--primary))"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorVisits)"
                animationDuration={1500}
                isAnimationActive={true}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* X-Axis Labels */}
        <div className="flex justify-between px-4 mt-2 mb-2 pointer-events-none">
          {[0, 3, 6, 9, 12, 15, 18, 21, 0].map((h, i) => (
            <span key={i} className="text-[9px] font-mono font-black text-muted-foreground/30">
              {h.toString().padStart(2, '0')}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

const HistoryTab: FC<HistoryTabProps> = ({ email }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [stats, setStats] = useState<HistoryStats>({
    topWebsites: [],
    intervals: Array.from({ length: 24 }, (_, i) => ({ hour: i, count: 0 })),
    totalVisits: 0,
  });
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);

  const fetchHistory = async (date: string) => {
    setLoading(true);
    setError(null);
    try {
      // @ts-ignore
      const result = await window.electron.ipcRenderer.invoke('email:get-history', {
        email,
        date,
      });

      if (result.success) {
        setHistory(result.history);
        setStats(result.stats);
      } else {
        setError(result.error || 'Failed to load history');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (email) {
      fetchHistory(selectedDate);
    }
  }, [email, selectedDate]);

  const processedHistory = useMemo(() => {
    return history
      .filter((item) => {
        if (!selectedDomain) return true;
        try {
          const domain = new URL(item.url).hostname.replace('www.', '');
          return domain === selectedDomain;
        } catch {
          return false;
        }
      })
      .map((item) => {
        const date = new Date(item.time);
        return {
          ...item,
          timeLabel: format(date, 'HH:mm'),
          durationLabel: `${item.duration || 0}s`,
        };
      });
  }, [history, selectedDomain]);

  // Filter removed, we use all history since search is deleted
  const filteredHistory = processedHistory;

  return (
    <div className="w-full flex h-full overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500 bg-background/5">
      {/* Sidebar Section */}
      <aside className="w-[380px] flex flex-col gap-4 pb-10 border-r border-border/30 overflow-y-auto custom-scrollbar shrink-0 bg-background/20 relative">
        <div className="flex-shrink-0">
          <HistoryCalendar
            email={email}
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
          />
        </div>

        <div className="px-5 space-y-3">
          <div className="flex items-center px-1">
            <h3 className="text-[12px] font-black uppercase tracking-[0.1em] text-foreground/70">
              {t('email.history.topWebsites')}
            </h3>
          </div>
          <div className="flex flex-col gap-2">
            {stats.topWebsites.slice(0, 10).map((web) => (
              <div
                key={web.domain}
                onClick={() => setSelectedDomain(web.domain === selectedDomain ? null : web.domain)}
                className={`flex items-center gap-4 p-3 backdrop-blur-xl hover:bg-primary/5 rounded-2xl transition-all border group cursor-pointer shadow-sm text-left active:scale-[0.98] ${
                  selectedDomain === web.domain
                    ? 'bg-primary/10 border-primary/40 ring-1 ring-primary/20'
                    : 'bg-card/50 border-border/50 hover:border-primary/30'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-background/50 flex items-center justify-center group-hover:border-primary/20 transition-all overflow-hidden shrink-0 shadow-inner">
                  <img
                    src={`https://www.google.com/s2/favicons?domain=${web.domain}&sz=64`}
                    alt=""
                    className="w-5 h-5 transition-all"
                    onError={(e) => (e.currentTarget.src = 'https://zentri.node/favicon.ico')}
                  />
                </div>

                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-[13px] font-black text-foreground/90 truncate group-hover:text-primary transition-all leading-tight">
                    {web.domain}
                  </span>
                  <div className="flex items-center gap-3 mt-0.5">
                    <div className="flex items-center gap-1">
                      <Activity className="w-3 h-3 text-emerald-400/40" />
                      <span className="text-[10px] font-bold text-muted-foreground/40">
                        {web.count} visits
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-400/40" />
                      <span className="text-[10px] font-bold text-muted-foreground/40">
                        {web.duration && web.duration > 3600
                          ? `${Math.floor(web.duration / 3600)}h ${Math.floor((web.duration % 3600) / 60)}m`
                          : web.duration && web.duration > 60
                            ? `${Math.floor(web.duration / 60)}m ${web.duration % 60}s`
                            : `${web.duration || 0}s`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {stats.topWebsites.length === 0 && !loading && (
              <p className="text-[11px] text-muted-foreground/30 italic px-4 font-medium">
                No domain statistics available
              </p>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Container - BG matches sidebar */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative bg-background/20 ml-px">
        {/* Content Scroll Space */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pt-2 pb-8 px-6">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center gap-5 opacity-50">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-pulse" />
                <Loader2 className="w-12 h-12 animate-spin text-primary relative z-10" />
              </div>
              <span className="text-[11px] font-black tracking-[0.4em] uppercase text-primary/50">
                Decoding Chronicle...
              </span>
            </div>
          ) : error ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center gap-6">
              <div className="w-20 h-20 rounded-[2rem] bg-destructive/10 flex items-center justify-center text-destructive border border-destructive/10">
                <History className="w-10 h-10 opacity-50" />
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-black tracking-tight text-foreground/90">
                  {t('email.history.errorTitle')}
                </h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                  {error}
                </p>
              </div>
              <button
                onClick={() => fetchHistory(selectedDate)}
                className="px-8 py-3 bg-primary/10 text-primary rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-primary/20 transition-all border border-primary/20 active:scale-95"
              >
                Reset Interface
              </button>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center gap-8">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/10 blur-[100px] rounded-full" />
                <div className="relative w-32 h-32 rounded-[2.5rem] bg-muted/20 border border-border/50 flex items-center justify-center rotate-12 shadow-2xl">
                  <History className="w-16 h-16 text-muted-foreground/10 -rotate-12" />
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-black tracking-tight text-foreground/80">
                  {t('email.history.emptyTitle')}
                </h3>
                <p className="text-xs text-muted-foreground max-w-[280px] leading-relaxed mx-auto font-medium opacity-60">
                  {t('email.history.emptyDesc')}
                </p>
              </div>
            </div>
          ) : (
            <div className="max-w-5xl mx-auto space-y-8">
              <HistoryActivityChart intervals={stats.intervals} />

              <div className="space-y-4">
                <div className="flex items-center">
                  <h3 className="text-[13px] font-black uppercase tracking-[0.1em] text-foreground/70">
                    {t('email.history.detailedLog')}
                  </h3>
                </div>
                <div className="space-y-1">
                  {filteredHistory.map((item, i) => (
                    <div
                      key={i}
                      className="w-full flex items-center gap-4 px-3 py-2 hover:bg-primary/5 rounded-lg transition-all group/card cursor-default active:scale-[0.995]"
                    >
                      {/* Time */}
                      <div className="min-w-[60px] text-zinc-500 font-mono text-[12px] font-bold">
                        {item.timeLabel}
                      </div>

                      {/* Favicon */}
                      <div className="w-6 h-6 rounded flex items-center justify-center transition-all overflow-hidden shrink-0">
                        <img
                          src={`https://www.google.com/s2/favicons?domain=${new URL(item.url || 'https://zentri.node').hostname}&sz=64`}
                          alt=""
                          className="w-4 h-4 transition-transform group-hover/card:scale-110"
                          onError={(e) => (e.currentTarget.src = 'https://zentri.node/favicon.ico')}
                        />
                      </div>

                      {/* Title & URL Next to each other */}
                      <div className="flex-1 min-w-0 flex items-baseline gap-3">
                        <h4 className="text-[15px] font-bold text-foreground/90 truncate group-hover/card:text-primary transition-colors">
                          {item.title && item.title !== 'Untitled Page'
                            ? item.title
                            : new URL(item.url).hostname.replace('www.', '')}
                        </h4>
                        <span className="text-[11px] text-muted-foreground/30 font-medium truncate italic max-w-[300px]">
                          {item.url}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoryTab;
