"use client";

import { DaySummary } from "@/lib/types";
import { getDayTargets } from "@/lib/constants";
import { formatDateShort } from "@/lib/date-utils";
import { motion } from "framer-motion";
import { CalendarDays, CheckCircle2 } from "lucide-react";

interface DayGridProps {
  dailySummaries: DaySummary[];
  participant1Name: string;
  participant2Name: string;
  today: string;
  durationDays: number;
}

export default function DayGrid({
  dailySummaries,
  participant1Name,
  participant2Name,
  today,
  durationDays,
}: Readonly<DayGridProps>) {
  return (
    <div className="glass-card rounded-2xl p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-slate-700 to-slate-800 text-white shadow-md shadow-slate-300/40">
          <CalendarDays className="h-4.5 w-4.5" />
        </div>
        <h3 className="text-base font-bold text-slate-800">Progress Harian</h3>
      </div>

      {/* Legend */}
      <div className="mb-4 flex flex-wrap gap-4 text-xs font-medium text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-linear-to-r from-emerald-500 to-teal-500" />
          {participant1Name}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-linear-to-r from-rose-400 to-rose-500" />
          {participant2Name}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm border border-dashed border-slate-300 bg-slate-50" />
          Belum tercapai
        </span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-6 md:grid-cols-10">
        {dailySummaries.map((day, i) => {
          const isToday = day.date === today;
          const isPast = day.date < today;
          const isFuture = day.date > today;
          const { targetP1, targetP2 } = getDayTargets(day.dayNumber, durationDays);
          const p1Met = day.participant1Pages >= targetP1;
          const p2Met = day.participant2Pages >= targetP2;

          return (
            <motion.div
              key={day.date}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.02, duration: 0.3 }}
              className={`group relative rounded-xl p-2 text-center transition-all ${
                isToday
                  ? "border-2 border-emerald-400 bg-emerald-50 shadow-sm shadow-emerald-100 pulse-glow"
                  : isFuture
                    ? "border border-slate-100 bg-slate-50/50 opacity-40"
                    : "border border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm"
              }`}
            >
              {/* Day number */}
              <p className={`text-xs font-extrabold ${isToday ? "text-emerald-700" : "text-slate-600"}`}>
                {day.dayNumber}
              </p>

              {/* Date */}
              <p className="text-[9px] font-medium text-slate-400">
                {formatDateShort(day.date)}
              </p>

              {/* Mini progress bars */}
              <div className="mt-1.5 space-y-0.5">
                <div className="h-1 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full transition-all ${
                      p1Met ? "bg-emerald-500" : isPast && day.participant1Pages > 0 ? "bg-amber-400" : "bg-slate-200"
                    }`}
                    style={{
                      width: `${Math.min((day.participant1Pages / targetP1) * 100, 100)}%`,
                    }}
                  />
                </div>
                <div className="h-1 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full transition-all ${
                      p2Met ? "bg-rose-400" : isPast && day.participant2Pages > 0 ? "bg-amber-400" : "bg-slate-200"
                    }`}
                    style={{
                      width: `${Math.min((day.participant2Pages / targetP2) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>

              {/* Tooltip on hover */}
              <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden -translate-x-1/2 rounded-xl border border-slate-200 bg-white p-3 text-left shadow-xl group-hover:block">
                <p className="whitespace-nowrap text-xs font-bold text-slate-700">
                  Hari {day.dayNumber}
                </p>
                <div className="mt-1.5 space-y-1">
                  <p className="flex items-center gap-1.5 whitespace-nowrap text-xs text-emerald-600">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    {participant1Name}: {day.participant1Pages} hal ({day.participant1Range})
                  </p>
                  <p className="flex items-center gap-1.5 whitespace-nowrap text-xs text-rose-500">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-rose-400" />
                    {participant2Name}: {day.participant2Pages} hal ({day.participant2Range})
                  </p>
                </div>
              </div>

              {/* Completion checkmark */}
              {day.isComplete && (
                <div className="absolute -right-1 -top-1">
                  <CheckCircle2 className="h-3.5 w-3.5 fill-emerald-500 text-white" />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
