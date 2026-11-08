"use client";

import { useMemo, useState } from "react";
import { formatDuration } from "@/lib/utils";

type Day = { date: string; seconds: number };

type Props = {
  days: Day[];
  goalSeconds: number;
  today: string;
  totalActiveDays?: number;
  maxStreak?: number;
};

interface CalendarSlot {
  date: string;
  seconds: number;
  inMonth: boolean;
  isToday: boolean;
  level: number; // 0 to 4
}

interface MonthGroup {
  key: string;
  label: string;
  weeks: (CalendarSlot | null)[][]; // array of columns, each column has 7 slots
}

export default function StreakCalendar({
  days,
  goalSeconds,
  today,
  totalActiveDays,
  maxStreak,
}: Props) {
  const [hovered, setHovered] = useState<{
    date: string;
    seconds: number;
    x: number;
    y: number;
  } | null>(null);

  // Map seconds by date
  const secondsMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of days) {
      map.set(d.date, d.seconds);
    }
    return map;
  }, [days]);

  // Calculated active days & streak if not passed directly
  const computedStats = useMemo(() => {
    let activeCount = 0;
    let currentStreakRun = 0;
    let computedMaxStreak = 0;

    for (const d of days) {
      if (d.seconds > 0) {
        activeCount++;
        currentStreakRun++;
        if (currentStreakRun > computedMaxStreak) computedMaxStreak = currentStreakRun;
      } else {
        currentStreakRun = 0;
      }
    }

    return {
      activeDays: totalActiveDays !== undefined ? totalActiveDays : activeCount,
      streak: maxStreak !== undefined ? maxStreak : computedMaxStreak,
    };
  }, [days, totalActiveDays, maxStreak]);

  // Group into last 3 or 4 months ending with current month
  const monthGroups = useMemo<MonthGroup[]>(() => {
    if (!today) return [];

    const todayDate = new Date(`${today}T00:00:00`);
    const todayYear = todayDate.getFullYear();
    const todayMonth = todayDate.getMonth(); // 0-indexed

    // We will show the last 3 or 4 months (e.g., 3 months prior + current month = 4 months)
    const monthsToShow = 3; // e.g. Sep, Oct, Nov or Aug, Sep, Oct
    const groups: MonthGroup[] = [];

    for (let m = monthsToShow - 1; m >= 0; m--) {
      const targetMonthDate = new Date(todayYear, todayMonth - m, 1);
      const year = targetMonthDate.getFullYear();
      const month = targetMonthDate.getMonth();

      const monthName = targetMonthDate.toLocaleDateString("en-US", { month: "short" });
      const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`;

      // Total days in this month
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      // First day of week (0 = Sunday, ..., 6 = Saturday)
      const firstDayOfWeek = targetMonthDate.getDay();

      const weeks: (CalendarSlot | null)[][] = [];
      let currentWeek: (CalendarSlot | null)[] = [];

      // Fill empty slots before first day
      for (let i = 0; i < firstDayOfWeek; i++) {
        currentWeek.push(null);
      }

      // Fill days of the month
      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        const isFuture = dateStr > today;
        const seconds = secondsMap.get(dateStr) ?? 0;
        const isToday = dateStr === today;

        // Activity level 0 - 4
        let level = 0;
        if (!isFuture && seconds > 0) {
          if (seconds < 15 * 60) level = 1;
          else if (seconds < 30 * 60) level = 2;
          else if (seconds < 60 * 60) level = 3;
          else level = 4;
        }

        currentWeek.push({
          date: dateStr,
          seconds,
          inMonth: true,
          isToday,
          level,
        });

        if (currentWeek.length === 7) {
          weeks.push(currentWeek);
          currentWeek = [];
        }
      }

      // Fill remaining slots in last week
      if (currentWeek.length > 0) {
        while (currentWeek.length < 7) {
          currentWeek.push(null);
        }
        weeks.push(currentWeek);
      }

      groups.push({
        key: monthKey,
        label: monthName,
        weeks,
      });
    }

    return groups;
  }, [today, secondsMap]);

  const getCellColor = (slot: CalendarSlot) => {
    switch (slot.level) {
      case 4:
        return "bg-[#CEF432] border-[#CEF432]"; // Pure bright neon lime
      case 3:
        return "bg-[#a8dc1e] border-[#a8dc1e]"; // Vibrant lime
      case 2:
        return "bg-[#7aa612] border-[#7aa612]"; // Medium olive-lime
      case 1:
        return "bg-[#496608] border-[#496608]"; // Deep muted lime
      case 0:
      default:
        return "bg-[#161a22] border-transparent"; // Inactive midnight slate
    }
  };

  return (
    <div className="streak-heatmap-root relative">
      {/* Top stats matching user screenshot */}
      <div className="streak-heatmap-header flex items-center gap-7 text-[13px] text-slate-400 mb-4 select-none">
        <div>
          Total active days:{" "}
          <strong className="text-white font-bold ml-1 text-[14px]">
            {computedStats.activeDays}
          </strong>
        </div>
        <div>
          Max streak:{" "}
          <strong className="text-white font-bold ml-1 text-[14px]">
            {computedStats.streak}
          </strong>
        </div>
      </div>

      {/* Grid container with months */}
      <div className="streak-months-scroll overflow-x-auto pb-2">
        <div className="streak-months-container inline-flex items-start gap-4 p-1">
          {monthGroups.map((group) => (
            <div key={group.key} className="streak-month-block flex flex-col items-center">
              {/* Columns of 7 rows */}
              <div className="flex gap-[3.5px]">
                {group.weeks.map((col, colIdx) => (
                  <div key={colIdx} className="flex flex-col gap-[3.5px]">
                    {col.map((slot, rowIdx) => {
                      if (!slot) {
                        return (
                          <div
                            key={rowIdx}
                            className="w-[13px] h-[13px] rounded-[3px] opacity-0 pointer-events-none"
                            aria-hidden="true"
                          />
                        );
                      }

                      return (
                        <div
                          key={slot.date}
                          className={`w-[13px] h-[13px] rounded-[3px] transition-all duration-150 cursor-pointer ${getCellColor(
                            slot
                          )} ${
                            slot.isToday
                              ? "ring-1.5 ring-[#CEF432] ring-offset-1 ring-offset-[#08080C]"
                              : ""
                          }`}
                          onMouseEnter={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setHovered({
                              date: slot.date,
                              seconds: slot.seconds,
                              x: rect.left + rect.width / 2,
                              y: rect.top,
                            });
                          }}
                          onMouseLeave={() => setHovered(null)}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Month label below columns */}
              <span className="month-label mt-2.5 text-[12px] font-medium text-slate-400 select-none">
                {group.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Floating tooltip */}
      {hovered && (
        <div
          role="tooltip"
          className="fixed z-50 pointer-events-none -translate-x-1/2 -translate-y-full mb-2 px-2.5 py-1.5 rounded-md bg-[#1e232d] border border-[#2f3644] text-[11px] text-slate-200 shadow-xl whitespace-nowrap"
          style={{
            left: `${hovered.x}px`,
            top: `${hovered.y - 6}px`,
          }}
        >
          <div className="font-semibold text-white">
            {new Date(`${hovered.date}T00:00:00`).toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </div>
          <div className="text-slate-400 mt-0.5">
            {hovered.seconds > 0 ? (
              <span className="text-[#CEF432] font-medium">
                {formatDuration(hovered.seconds)} learned
              </span>
            ) : (
              "No learning activity"
            )}
          </div>
        </div>
      )}

      {/* Subtle bottom legend */}
      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
        <div className="flex items-center gap-1.5">
          <span>Less</span>
          <span className="w-2.5 h-2.5 rounded-[2px] bg-[#23272e]" />
          <span className="w-2.5 h-2.5 rounded-[2px] bg-[#15803d]" />
          <span className="w-2.5 h-2.5 rounded-[2px] bg-[#16a34a]" />
          <span className="w-2.5 h-2.5 rounded-[2px] bg-[#22c55e]" />
          <span className="w-2.5 h-2.5 rounded-[2px] bg-[#86efac]" />
          <span>More</span>
        </div>
        <span className="text-[11px] text-slate-500">Updated daily</span>
      </div>
    </div>
  );
}
