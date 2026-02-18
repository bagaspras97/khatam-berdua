"use client";

import { useState } from "react";
import { DaySummary, ParticipantMissing } from "@/lib/types";
import { formatMissingRanges } from "@/lib/gap-utils";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Loader2,
  Lightbulb,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface MissingPagesAlertProps {
  readonly challengeId: string;
  readonly secretKey: string;
  readonly dailySummaries: DaySummary[];
  readonly participant1Name: string;
  readonly participant2Name: string;
  readonly today: string;
  readonly onUpdate: () => void;
}

type SolvingState = { day: number; debtOf: 1 | 2; solver: 1 | 2 } | null;

export default function MissingPagesAlert({
  challengeId,
  secretKey,
  dailySummaries,
  participant1Name,
  participant2Name,
  today,
  onUpdate,
}: MissingPagesAlertProps) {
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  const [solving, setSolving] = useState<SolvingState>(null);
  const [message, setMessage] = useState("");

  // Only show gaps from PAST days (strictly before today)
  const daysWithGaps = dailySummaries
    .filter((day) => day.missingPages && day.date < today)
    .sort((a, b) => a.dayNumber - b.dayNumber);

  if (daysWithGaps.length === 0) return null;

  const handleSolve = async (
    dayNumber: number,
    dayDate: string,
    debtOf: 1 | 2,
    solver: 1 | 2,
    missing: ParticipantMissing
  ) => {
    setSolving({ day: dayNumber, debtOf, solver });
    setMessage("");
    const fromPage = missing.ranges[0].from;
    const toPage = missing.ranges.at(-1)!.to;

    // Merge with any existing reading for debt owner on that day so the upsert
    // doesn't overwrite previously saved pages (e.g., P1 read 1-10, missing 11 →
    // save 1-11, not just 11).
    const dayData = dailySummaries.find((d) => d.date === dayDate);
    const existingRange = debtOf === 1 ? dayData?.participant1Range : dayData?.participant2Range;
    let mergedFrom = fromPage;
    let mergedTo = toPage;
    if (existingRange && existingRange !== "-") {
      const [ef, et] = existingRange.split("-").map(Number);
      if (ef && et) {
        mergedFrom = Math.min(mergedFrom, ef);
        mergedTo = Math.max(mergedTo, et);
      }
    }

    try {
      const res = await fetch(`/api/challenges/${challengeId}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret_key: secretKey,
          // Use debtOf (the owner of the debt) as participant_number so the
          // upsert key (challenge_id, participant_number, date) resolves the
          // correct gap — regardless of who physically reads it (solver).
          participant_number: debtOf,
          date: dayDate,
          from_page: mergedFrom,
          to_page: mergedTo,
          is_makeup: true,
          // actual_reader_number tracks who physically read the pages for stats
          actual_reader_number: solver,
          notes: `Makeup P${debtOf} dibaca oleh P${solver}: Hari ${dayNumber} (${fromPage}-${toPage})`,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        setMessage(`error:${data.error}`);
        setTimeout(() => setMessage(""), 5000);
        return;
      }

      setMessage("success:Hutang halaman terselesaikan!");
      onUpdate();
      setExpandedDay(null);
      setTimeout(() => setMessage(""), 2000);
    } catch {
      setMessage("error:Gagal menyimpan");
      setTimeout(() => setMessage(""), 5000);
    } finally {
      setSolving(null);
    }
  };

  const msgType = message.split(":")[0];
  const msgText = message.split(":").slice(1).join(":");

  return (
    <div className="overflow-hidden rounded-2xl border border-amber-200/80 bg-linear-to-br from-amber-50 to-amber-100/50 shadow-sm">
      <div className="p-5 sm:p-6">
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-amber-400 to-amber-500 text-white shadow-md shadow-amber-200/50">
            <AlertTriangle className="h-4.5 w-4.5" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-amber-800">
              Ada Halaman yang Terlewat
            </h3>
            <p className="mt-0.5 text-xs font-medium text-amber-600">
              {daysWithGaps.length} hari memiliki halaman yang belum terbaca
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {daysWithGaps.map((day) => {
            const missing = day.missingPages!;
            const isExpanded = expandedDay === day.dayNumber;

            return (
              <div
                key={day.dayNumber}
                className="overflow-hidden rounded-xl border border-amber-200/60 bg-white/80 backdrop-blur-sm"
              >
                {/* Accordion header */}
                <button
                  onClick={() => setExpandedDay(isExpanded ? null : day.dayNumber)}
                  className="flex w-full items-center justify-between p-3 text-left transition-colors hover:bg-amber-50/50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-700">
                      Hari {day.dayNumber}
                      <span className="ml-1.5 font-normal text-slate-400">{day.date}</span>
                    </p>
                    <p className="mt-0.5 truncate text-xs text-amber-600">
                      {missing.totalMissing} halaman belum terbaca
                    </p>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 shrink-0 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
                  )}
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-3 border-t border-amber-100 p-3">

                        {/* P1 debt */}
                        {missing.participant1Missing && (
                          <DebtBlock
                            label={`Hutang ${participant1Name}`}
                            missing={missing.participant1Missing}
                            debtOf={1}
                            dayNumber={day.dayNumber}
                            dayDate={day.date}
                            solving={solving}
                            participant1Name={participant1Name}
                            participant2Name={participant2Name}
                            onSolve={handleSolve}
                            dotColor="bg-emerald-500"
                          />
                        )}

                        {/* P2 debt */}
                        {missing.participant2Missing && (
                          <DebtBlock
                            label={`Hutang ${participant2Name}`}
                            missing={missing.participant2Missing}
                            debtOf={2}
                            dayNumber={day.dayNumber}
                            dayDate={day.date}
                            solving={solving}
                            participant1Name={participant1Name}
                            participant2Name={participant2Name}
                            onSolve={handleSolve}
                            dotColor="bg-rose-400"
                          />
                        )}

                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Message */}
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div
                className={`mt-3 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium ${
                  msgType === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-rose-200 bg-rose-50 text-rose-600"
                }`}
              >
                {msgType === "success" ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0" />
                )}
                {msgText}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ─── Debt Block Sub-component ─── */
function DebtBlock({
  label,
  missing,
  debtOf,
  dayNumber,
  dayDate,
  solving,
  participant1Name,
  participant2Name,
  onSolve,
  dotColor,
}: {
  readonly label: string;
  readonly missing: ParticipantMissing;
  readonly debtOf: 1 | 2;
  readonly dayNumber: number;
  readonly dayDate: string;
  readonly solving: SolvingState;
  readonly participant1Name: string;
  readonly participant2Name: string;
  readonly onSolve: (day: number, date: string, debtOf: 1 | 2, solver: 1 | 2, missing: ParticipantMissing) => void;
  readonly dotColor: string;
}) {
  const isSolvingThis = (solver: 1 | 2) =>
    solving?.day === dayNumber && solving.debtOf === debtOf && solving.solver === solver;
  const isAnySolving = solving?.day === dayNumber && solving.debtOf === debtOf;

  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-2.5">
      <div className="mb-1.5 flex items-center gap-1.5">
        <span className={`h-2 w-2 rounded-full ${dotColor}`} />
        <p className="text-xs font-bold text-slate-600">{label}</p>
        <span className="ml-auto text-[11px] font-medium text-amber-600">
          {formatMissingRanges(missing.ranges)}
          <span className="ml-1 text-amber-500">({missing.total} hal)</span>
        </span>
      </div>
      <p className="mb-2 text-[11px] text-slate-400">
        Hutang ini bisa diselesaikan oleh siapapun — pilih siapa yang akan membacanya:
      </p>
      <div className="grid grid-cols-2 gap-1.5">
        <button
          onClick={() => onSolve(dayNumber, dayDate, debtOf, 1, missing)}
          disabled={!!solving}
          className="flex items-center justify-center gap-1.5 rounded-lg bg-linear-to-r from-emerald-500 to-teal-500 px-2.5 py-2 text-[11px] font-bold text-white shadow-sm shadow-emerald-200/40 transition-all hover:shadow-md active:scale-[0.98] disabled:opacity-60"
        >
          {isSolvingThis(1) ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
          {participant1Name}
        </button>
        <button
          onClick={() => onSolve(dayNumber, dayDate, debtOf, 2, missing)}
          disabled={!!solving}
          className="flex items-center justify-center gap-1.5 rounded-lg bg-linear-to-r from-rose-400 to-rose-500 px-2.5 py-2 text-[11px] font-bold text-white shadow-sm shadow-rose-200/40 transition-all hover:shadow-md active:scale-[0.98] disabled:opacity-60"
        >
          {isSolvingThis(2) ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
          {participant2Name}
        </button>
      </div>
      {isAnySolving && (
        <p className="mt-1.5 text-center text-[10px] text-slate-400">Menyimpan...</p>
      )}
      {!isAnySolving && (
        <p className="mt-1.5 flex items-center gap-1 text-[10px] text-slate-400">
          <Lightbulb className="h-3 w-3 shrink-0" />
          Bacaan pengganti akan dicatat pada tanggal hari tersebut
        </p>
      )}
    </div>
  );
}
