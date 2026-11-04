import { cn } from "@/lib/utils";

type Day = { date: string; seconds: number };

export default function StreakCalendar({
  days,
  goalSeconds,
  today,
}: {
  days: Day[];
  goalSeconds: number;
  today: string;
}) {
  return (
    <div>
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((d) => {
          const met = d.seconds >= goalSeconds;
          const some = d.seconds > 0;
          return (
            <div
              key={d.date}
              title={`${d.date}: ${Math.round(d.seconds / 60)} min`}
              className={cn(
                "flex aspect-square items-center justify-center rounded-md text-[10px]",
                met
                  ? "bg-stone-900 text-white"
                  : some
                    ? "bg-stone-400 text-white"
                    : "bg-stone-200 text-stone-500",
                d.date === today && "ring-2 ring-offset-1 ring-stone-900"
              )}
            >
              {Number(d.date.slice(8, 10))}
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex items-center gap-3 text-xs text-stone-600">
        <span className="flex items-center gap-1">
        <span className="h-3 w-3 rounded-sm bg-stone-900" /> Goal reached
        </span>
        <span className="flex items-center gap-1">
        <span className="h-3 w-3 rounded-sm bg-stone-400" /> Learning activity
        </span>
        <span className="flex items-center gap-1">
        <span className="h-3 w-3 rounded-sm bg-stone-200" /> No activity
        </span>
      </div>
    </div>
  );
}
