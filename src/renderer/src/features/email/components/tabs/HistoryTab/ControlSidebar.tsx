import { FC, useState, useEffect, useMemo } from 'react';
import { memo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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

interface ActivityInterval {
  hour: number;
  count: number;
}

interface ControlSidebarProps {
  email: string;
  selectedDate: string;
  onDateSelect: (date: string) => void;
  topWebsites: TopWebsite[];
  selectedDomain: string | null;
  onDomainSelect: (domain: string | null) => void;
}

// ─── HistoryCalendar ──────────────────────────────────────────────────────────

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
    <div className="px-3 pt-3 pb-2">
      {/* Nav */}
      <div className="flex items-center justify-between mb-3 px-1">
        <button
          onClick={prevMonth}
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-primary/10 text-muted-foreground/60 hover:text-primary transition-all active:scale-95"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="text-center">
          <p className="text-[13px] font-bold text-foreground/90 leading-tight">
            {format(viewDate, 'MMMM')}
          </p>
          <p className="text-[10px] font-mono text-muted-foreground/40 tracking-widest">
            {format(viewDate, 'yyyy')}
          </p>
        </div>
        <button
          onClick={nextMonth}
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-primary/10 text-muted-foreground/60 hover:text-primary transition-all active:scale-95"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div
            key={i}
            className="h-6 flex items-center justify-center text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider"
          >
            {d}
          </div>
        ))}
        {days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const isSelected = isSameDay(day, parseISO(selectedDate));
          const isCurrentMonth = isSameMonth(day, viewDate);
          const activity = activityData?.[dateStr];
          const hasData = !!activity?.domainCount && activity.domainCount > 0;

          return (
            <button
              key={day.toISOString()}
              onClick={() => {
                console.log('[DEBUG] HistoryCalendar date clicked:', dateStr, 'current selectedDate:', selectedDate);
                onDateSelect(dateStr);
              }}
              className={`
                relative aspect-square flex flex-col items-center justify-center rounded-lg transition-all text-[13px] font-mono font-bold
                ${
                  isSelected
                    ? 'bg-primary/20 text-primary border border-primary/30'
                    : hasData
                      ? 'text-foreground/80 hover:bg-primary/5 hover:text-primary'
                      : 'text-foreground/20 hover:bg-card/40 hover:text-foreground/50'
                }
                ${!isCurrentMonth && !isSelected ? 'opacity-20' : ''}
              `}
            >
              {format(day, 'd')}
              {hasData && !isSelected && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary/40" />
              )}
              {hasData && isSelected && (
                <span className="text-[9px] text-primary/60 font-mono leading-none mt-0.5">
                  {activity.domainCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ─── DomainSidebar ────────────────────────────────────────────────────────────

const DomainSidebar: FC<{
  topWebsites: TopWebsite[];
  selectedDomain: string | null;
  onDomainSelect: (domain: string | null) => void;
}> = ({ topWebsites, selectedDomain, onDomainSelect }) => {
  return (
    <>
      {/* Domain list */}
      {topWebsites.length > 0 && (
        <div className="flex flex-col py-1">
          <div className="px-4 py-1.5">
            <span className="text-[11px] font-black uppercase tracking-[0.1em] text-muted-foreground/30">
              Top domains
            </span>
          </div>
          {topWebsites.slice(0, 8).map((site) => {
            const isActive = selectedDomain === site.domain;
            return (
              <button
                key={site.domain}
                onClick={() => onDomainSelect(isActive ? null : site.domain)}
                className={`flex items-center gap-2.5 px-4 py-2 transition-colors text-left ${
                  isActive ? 'bg-primary/10' : 'hover:bg-card/40'
                }`}
              >
                <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 bg-card/80 border border-border/30 overflow-hidden">
                  <img
                    src={`https://www.google.com/s2/favicons?domain=${site.domain}&sz=32`}
                    alt=""
                    className="w-3.5 h-3.5"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
                <span
                  className={`text-[14px] flex-1 truncate ${isActive ? 'text-primary font-semibold' : 'text-muted-foreground/70'}`}
                >
                  {site.domain}
                </span>
                <span className="text-[13px] font-mono text-muted-foreground/30">{site.count}</span>
              </button>
            );
          })}
        </div>
      )}
    </>
  );
};

// ─── ControlSidebar ───────────────────────────────────────────────────────────

const ControlSidebar: FC<ControlSidebarProps> = ({
  email,
  selectedDate,
  onDateSelect,
  topWebsites,
  selectedDomain,
  onDomainSelect,
}) => {
  return (
    <aside className="w-[320px] flex flex-col border-r border-border overflow-y-auto custom-scrollbar shrink-0 bg-background/20">
      {/* Calendar */}
      <div className="border-b border-border/20">
        <HistoryCalendar
          email={email}
          selectedDate={selectedDate}
          onDateSelect={onDateSelect}
        />
      </div>

      {/* Domain list */}
      <DomainSidebar
        topWebsites={topWebsites}
        selectedDomain={selectedDomain}
        onDomainSelect={onDomainSelect}
      />
    </aside>
  );
};

export default memo(ControlSidebar);