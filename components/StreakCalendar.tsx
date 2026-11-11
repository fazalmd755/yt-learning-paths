"use client";

import { useMemo, useState } from "react";
import { formatDuration } from "@/lib/utils";

type Day = { date: string; seconds: number };

type Props = {
  days: Day[];
  goalSeconds?: number;
  today: string;
  totalActiveDays?: number;
  maxStreak?: number;
  totalSecondsLearned?: number;
};

interface CalendarSlot {
  date: string;
  seconds: number;
  isToday: boolean;
  level: number; // 0 to 4
}

interface MonthGroup {
  key: string;
  label: string;
  weeks: (CalendarSlot | null)[][]; // array of 7-row columns
}

export default function StreakCalendar({
  days,
  today,
  totalActiveDays,
  maxStreak,
  totalSecondsLearned,
}: Props) {
  const [hovered, setHovered] = useState<{
    date: string;
    seconds: number;
    x: number;
    y: number;
  } | null>(null);

  const secondsMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of days) {
      map.set(d.date, d.seconds);
    }
    return map;
  }, [days]);

  // Compute total active days and streak if not provided
  const computedStats = useMemo(() => {
    let activeCount = 0;
    let currentStreakRun = 0;
    let computedMaxStreak = 0;
    let totalSec = 0;

    for (const d of days) {
      totalSec += d.seconds;
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
      totalSeconds: totalSecondsLearned !== undefined ? totalSecondsLearned : totalSec,
    };
  }, [days, totalActiveDays, maxStreak, totalSecondsLearned]);

  // LeetCode-style Month Groups (last 6 months up to today)
  const monthGroups = useMemo<MonthGroup[]>(() => {
    if (!today) return [];

    const todayDate = new Date(`${today}T00:00:00`);
    const todayYear = todayDate.getFullYear();
    const todayMonth = todayDate.getMonth();

    const monthsToShow = 12;
    const groups: MonthGroup[] = [];

    for (let m = monthsToShow - 1; m >= 0; m--) {
      const targetMonthDate = new Date(todayYear, todayMonth - m, 1);
      const year = targetMonthDate.getFullYear();
      const month = targetMonthDate.getMonth();

      const monthName = targetMonthDate.toLocaleDateString("en-US", { month: "short" });
      const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`;

      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const firstDayOfWeek = targetMonthDate.getDay(); // 0 = Sun

      const weeks: (CalendarSlot | null)[][] = [];
      let currentWeek: (CalendarSlot | null)[] = [];

      // Offset empty padding before day 1
      for (let i = 0; i < firstDayOfWeek; i++) {
        currentWeek.push(null);
      }

      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        const isFuture = dateStr > today;

        // If day is in future: DO NOT RENDER future block!
        if (isFuture) {
          // Push null for future days so we don't draw future blocks
          currentWeek.push(null);
        } else {
          const seconds = secondsMap.get(dateStr) ?? 0;
          const isToday = dateStr === today;

          // Activity levels: 0 (none), 1 (1-15m), 2 (15-30m), 3 (30-60m), 4 (>60m)
          let level = 0;
          if (seconds > 0) {
            if (seconds < 15 * 60) level = 1;
            else if (seconds < 30 * 60) level = 2;
            else if (seconds < 60 * 60) level = 3;
            else level = 4;
          }

          currentWeek.push({
            date: dateStr,
            seconds,
            isToday,
            level,
          });
        }

        if (currentWeek.length === 7) {
          // Only add week if at least one day in it is valid or in month
          weeks.push(currentWeek);
          currentWeek = [];
        }
      }

      // If trailing days left in currentWeek
      if (currentWeek.length > 0) {
        while (currentWeek.length < 7) {
          currentWeek.push(null);
        }
        weeks.push(currentWeek);
      }

      // Filter out completely empty future weeks in the current month
      const activeWeeks = weeks.filter((wk) => wk.some((slot) => slot !== null));

      groups.push({
        key: monthKey,
        label: monthName,
        weeks: activeWeeks.length > 0 ? activeWeeks : weeks,
      });
    }

    return groups;
  }, [today, secondsMap]);

  const getCellColor = (slot: CalendarSlot) => {
    switch (slot.level) {
      case 4:
        return "bg-[#86efac]"; // Bright mint green
      case 3:
        return "bg-[#22c55e]"; // Vibrant green
      case 2:
        return "bg-[#16a34a]"; // Medium emerald
      case 1:
        return "bg-[#15803d]"; // Deep green
      case 0:
      default:
        return "bg-[#282b33]"; // LeetCode dark square
    }
  };

  const totalHours = Math.round(computedStats.totalSeconds / 3600);

  return (
    <div className="leetcode-heatmap-card">
      {/* Header matching user's LeetCode screenshot */}
      <div className="leetcode-heatmap-header">
        <div className="leetcode-header-left">
          <strong>
            {totalHours > 0
              ? `${totalHours} hrs study time`
              : `${computedStats.activeDays} active days`}
          </strong>
          <span> in the past one year</span>
          <span className="leetcode-info-dot" title="Activity tracks total study time logged per day">
            ⓘ
          </span>
        </div>

        <div className="leetcode-header-right">
          <span className="leetcode-stat-pill">
            Total active days: <strong>{computedStats.activeDays}</strong>
          </span>
          <span className="leetcode-stat-pill">
            Max streak: <strong>{computedStats.streak}</strong>
          </span>
        </div>
      </div>

      {/* Month clusters grid */}
      <div className="leetcode-grid-scroll">
        <div className="leetcode-months-wrap">
          {monthGroups.map((group) => (
            <div key={group.key} className="leetcode-month-col">
              {/* Columns of 7 rows */}
              <div className="leetcode-month-grid">
                {group.weeks.map((col, colIdx) => (
                  <div key={colIdx} className="leetcode-week-col">
                    {col.map((slot, rowIdx) => {
                      if (!slot) {
                        return (
                          <div
                            key={rowIdx}
                            className="leetcode-slot-empty"
                            aria-hidden="true"
                          />
                        );
                      }

                      return (
                        <div
                          key={slot.date}
                          className={`leetcode-slot ${getCellColor(slot)} ${
                            slot.isToday ? "leetcode-slot-today" : ""
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

              {/* Month label at bottom */}
              <span className="leetcode-month-label">{group.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Hover tooltip */}
      {hovered && (
        <div
          role="tooltip"
          className="leetcode-tooltip"
          style={{
            left: `${hovered.x}px`,
            top: `${hovered.y - 8}px`,
          }}
        >
          <div className="leetcode-tooltip-date">
            {new Date(`${hovered.date}T00:00:00`).toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </div>
          <div className="leetcode-tooltip-detail">
            {hovered.seconds > 0 ? (
              <span className="text-emerald-400 font-semibold">
                {formatDuration(hovered.seconds)} studied
              </span>
            ) : (
              "No activity"
            )}
          </div>
        </div>
      )}

      {/* Bottom subtle legend */}
      <div className="leetcode-heatmap-footer">
        <div className="leetcode-legend">
          <span>Less</span>
          <span className="legend-box bg-[#282b33]" />
          <span className="legend-box bg-[#15803d]" />
          <span className="legend-box bg-[#16a34a]" />
          <span className="legend-box bg-[#22c55e]" />
          <span className="legend-box bg-[#86efac]" />
          <span>More</span>
        </div>
        <span className="leetcode-footer-hint">Live daily tracking</span>
      </div>
    </div>
  );
}
