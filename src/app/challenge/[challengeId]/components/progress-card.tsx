"use client";

import { useState, useEffect, useRef } from "react";
import { DaySummary } from "@/lib/types";
import { getDayTargets } from "@/lib/constants";
import { getDayNumber, formatDateId, formatDateShort } from "@/lib/date-utils";
import { AnimatePresence, motion } from "framer-motion";
import {
  PenLine,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Info,
  X,
  Trash2,
} from "lucide-react";

interface ProgressCardProps {
  readonly challengeId: string;
  readonly secretKey: string;
  readonly participant1Name: string;
  readonly participant2Name: string;
  readonly date: string;
  readonly startDate: string;
  readonly durationDays: number;
  readonly dailySummaries: DaySummary[];
  readonly currentProgress?: DaySummary;
  readonly onUpdate: () => void;
}

export default function ProgressCard({
  challengeId,
  secretKey,
  participant1Name,
  participant2Name,
  date,
  startDate,
  durationDays,
  dailySummaries,
  currentProgress,
  onUpdate,
}: ProgressCardProps) {
  const [p1From, setP1From] = useState(1);
  const [p1To, setP1To] = useState(11);
  const [p2From, setP2From] = useState(12);
  const [p2To, setP2To] = useState(21);
  const [saving, setSaving] = useState<1 | 2 | null>(null);
  const [deleting, setDeleting] = useState<1 | 2 | null>(null);
  const [message, setMessage] = useState("");
  const [showInfo, setShowInfo] = useState(false);
  const [hasUserEdited, setHasUserEdited] = useState(false);
  const [alreadyReadInfo, setAlreadyReadInfo] = useState<{
    p1: { alreadyRead: boolean; day?: number; range?: string };
    p2: { alreadyRead: boolean; day?: number; range?: string };
  } | null>(null);
  const [showBacaTambahanModal, setShowBacaTambahanModal] = useState<1 | 2 | null>(null);
  const [selectedAdditionalDays, setSelectedAdditionalDays] = useState<number[]>([]);
  const infoRef = useRef<HTMLDivElement>(null);
  // Track which (date, currentProgress) combination we last initialized from,
  // so makeup saves on OTHER days don't re-trigger a reset of today's inputs.
  const initKeyRef = useRef<string | null>(null);

  const dayNum = getDayNumber(startDate, date);
  const { targetP1, targetP2, expectedStart, expectedEnd } = getDayTargets(dayNum, durationDays);

  // Calculate tomorrow's target
  const tomorrowDayNum = dayNum + 1;
  const isTomorrowValid = tomorrowDayNum <= durationDays;
  const tomorrowTargets = isTomorrowValid ? getDayTargets(tomorrowDayNum, durationDays) : null;
  
  // Calculate tomorrow's date
  const tomorrowDate = new Date(date + "T00:00:00Z");
  tomorrowDate.setUTCDate(tomorrowDate.getUTCDate() + 1);
  const tomorrowDateStr = tomorrowDate.toISOString().split("T")[0];

  // Check if today's pages were already read in previous days
  useEffect(() => {
    const p1MinPage = expectedStart;
    const p1MaxPage = expectedStart + targetP1 - 1;
    const p2MinPage = expectedStart + targetP1;
    const p2MaxPage = expectedEnd;

    let p1AlreadyRead = false;
    let p1Day: number | undefined;
    let p1Range: string | undefined;
    let p2AlreadyRead = false;
    let p2Day: number | undefined;
    let p2Range: string | undefined;

    for (const day of dailySummaries) {
      if (day.date >= date) continue; // Only check previous days

      // Check P1's target pages
      const p1RangeStr = day.participant1Range;
      if (p1RangeStr && p1RangeStr !== "-") {
        const [from, to] = p1RangeStr.split("-").map(Number);
        if (from && to && from <= p1MinPage && to >= p1MaxPage) {
          p1AlreadyRead = true;
          p1Day = day.dayNumber;
          p1Range = p1RangeStr;
          break; // Found it
        }
      }

      // Check P2's target pages
      const p2RangeStr = day.participant2Range;
      if (p2RangeStr && p2RangeStr !== "-") {
        const [from, to] = p2RangeStr.split("-").map(Number);
        if (from && to && from <= p2MinPage && to >= p2MaxPage) {
          p2AlreadyRead = true;
          p2Day = day.dayNumber;
          p2Range = p2RangeStr;
          break; // Found it
        }
      }
    }

    setAlreadyReadInfo({
      p1: { alreadyRead: p1AlreadyRead, day: p1Day, range: p1Range },
      p2: { alreadyRead: p2AlreadyRead, day: p2Day, range: p2Range },
    });
  }, [dailySummaries, date, expectedStart, expectedEnd, targetP1, targetP2]);

  useEffect(() => {
    // Build a key from the things that should actually trigger a re-init:
    // - date changes (navigated to different day)
    // - today's own saved progress changes (currentProgress for this date)
    const progressKey = currentProgress
      ? `${currentProgress.participant1Range}|${currentProgress.participant2Range}`
      : "none";
    const thisKey = `${date}:${progressKey}`;

    // If nothing that matters changed, don't touch the inputs.
    if (initKeyRef.current === thisKey && !hasUserEdited) return;
    // If user is mid-edit, don't override their input either.
    if (hasUserEdited) return;

    initKeyRef.current = thisKey;

    // Default: always use today's scheduled target pages.
    // Missing pages from skipped days are handled by MissingPagesAlert separately.
    setP1From(expectedStart);
    setP1To(expectedStart + targetP1 - 1);
    setP2From(expectedStart + targetP1);
    setP2To(expectedEnd);

    // If today's progress was already saved, load those values instead.
    if (currentProgress) {
      const p1Range = currentProgress.participant1Range;
      const p2Range = currentProgress.participant2Range;
      if (p1Range && p1Range !== "-") {
        const [from, to] = p1Range.split("-").map(Number);
        if (from && to) { setP1From(from); setP1To(to); }
      }
      if (p2Range && p2Range !== "-") {
        const [from, to] = p2Range.split("-").map(Number);
        if (from && to) { setP2From(from); setP2To(to); }
      }
    }
  }, [currentProgress, date, expectedStart, expectedEnd, targetP1, targetP2, hasUserEdited]);

  useEffect(() => {
    if (!showInfo) return;
    const handler = (e: MouseEvent) => {
      if (infoRef.current && !infoRef.current.contains(e.target as Node)) {
        setShowInfo(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showInfo]);

  // Find next available days that haven't been read yet
  const findAvailableDays = (participantNum: 1 | 2, limit: number = 3) => {
    const availableDays: Array<{ day: number; from: number; to: number }> = [];
    
    for (let checkDay = dayNum + 1; checkDay <= durationDays && availableDays.length < limit; checkDay++) {
      const { targetP1: dayP1, targetP2: dayP2, expectedStart: dayStart } = getDayTargets(checkDay, durationDays);
      
      let checkFrom: number;
      let checkTo: number;
      
      if (participantNum === 1) {
        checkFrom = dayStart;
        checkTo = dayStart + dayP1 - 1;
      } else {
        checkFrom = dayStart + dayP1;
        checkTo = dayStart + dayP1 + dayP2 - 1;
      }
      
      // Check if this target range was already read in previous days
      let alreadyRead = false;
      for (const day of dailySummaries) {
        if (day.date >= date) continue; // Only check previous days
        
        const rangeStr = participantNum === 1 ? day.participant1Range : day.participant2Range;
        if (rangeStr && rangeStr !== "-") {
          const [from, to] = rangeStr.split("-").map(Number);
          if (from && to && from <= checkFrom && to >= checkTo) {
            alreadyRead = true;
            break;
          }
        }
      }
      
      if (!alreadyRead) {
        availableDays.push({ day: checkDay, from: checkFrom, to: checkTo });
      }
    }
    
    return availableDays;
  };

  const saveProgress = async (
    participantNumber: 1 | 2,
    fromPage: number,
    toPage: number
  ) => {
    if (fromPage > toPage) {
      setMessage("error:Halaman awal tidak boleh lebih besar dari halaman akhir");
      setTimeout(() => setMessage(""), 5000);
      return;
    }

    // Validate range is within participant's target zone
    const minPage = participantNumber === 1 ? p1MinPage : p2MinPage;
    const maxPage = participantNumber === 1 ? p1MaxPage : p2MaxPage;
    
    if (fromPage < minPage || toPage > maxPage) {
      setMessage(`error:Halaman harus dalam range ${minPage}–${maxPage} untuk hari ini`);
      setTimeout(() => setMessage(""), 5000);
      return;
    }

    for (const day of dailySummaries) {
      if (day.date === date) continue;
      const range = participantNumber === 1 ? day.participant1Range : day.participant2Range;
      if (!range || range === "-") continue;
      const [prevFrom, prevTo] = range.split("-").map(Number);
      if (!prevFrom || !prevTo) continue;
      if (!(toPage < prevFrom || fromPage > prevTo)) {
        setMessage(`error:Halaman ${fromPage}–${toPage} sudah pernah dibaca di hari ${day.dayNumber} (${prevFrom}–${prevTo})`);
        setTimeout(() => setMessage(""), 6000);
        return;
      }
    }

    setSaving(participantNumber);
    setMessage("");

    try {
      const res = await fetch(`/api/challenges/${challengeId}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret_key: secretKey,
          participant_number: participantNumber,
          date,
          from_page: fromPage,
          to_page: toPage,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setMessage(`error:${data.error}`);
        setTimeout(() => setMessage(""), 5000);
        return;
      }

      setMessage("success:Tersimpan!");
      setHasUserEdited(false);
      onUpdate();
      setTimeout(() => setMessage(""), 2000);
    } catch {
      setMessage("error:Gagal menyimpan");
      setTimeout(() => setMessage(""), 5000);
    } finally {
      setSaving(null);
    }
  };

  const deleteProgress = async (participantNumber: 1 | 2) => {
    setDeleting(participantNumber);
    setMessage("");

    try {
      const res = await fetch(`/api/challenges/${challengeId}/progress`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret_key: secretKey,
          participant_number: participantNumber,
          date,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setMessage(`error:${data.error}`);
        setTimeout(() => setMessage(""), 5000);
        return;
      }

      setMessage("success:Data berhasil dihapus!");
      setHasUserEdited(false);
      onUpdate();
      setTimeout(() => setMessage(""), 2000);
    } catch {
      setMessage("error:Gagal menghapus data");
      setTimeout(() => setMessage(""), 5000);
    } finally {
      setDeleting(null);
    }
  };

  const p1MinPage = expectedStart;
  const p1MaxPage = expectedStart + targetP1 - 1;
  const p2MinPage = expectedStart + targetP1;
  const p2MaxPage = expectedEnd;

  const p1Pages = p1To - p1From + 1;
  const p2Pages = p2To - p2From + 1;
  const msgType = message.split(":")[0];
  const msgText = message.split(":").slice(1).join(":");
  const isBeforeStart = date < startDate;

  return (
    <div className="glass-card rounded-2xl p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-200/40">
          <PenLine className="h-4.5 w-4.5" />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-bold text-slate-800">Input Progress Hari Ini</h3>
          <p className="text-[11px] text-slate-400">{formatDateId(date)} · Hari ke-{dayNum}</p>
        </div>

        <div className="relative" ref={infoRef}>
          <button
            onClick={() => setShowInfo((v) => !v)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white/80 text-slate-400 transition-colors hover:border-emerald-300 hover:text-emerald-600"
            aria-label="Info target harian"
          >
            <Info className="h-4 w-4" />
          </button>

          <AnimatePresence>
            {showInfo && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-10 z-50 w-64 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/60"
              >
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-bold text-slate-700">Target Hari ke-{dayNum}</p>
                  <button
                    onClick={() => setShowInfo(false)}
                    className="rounded-lg p-0.5 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      <span className="text-xs font-semibold text-emerald-800">{participant1Name}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-extrabold text-emerald-700">{p1MinPage}–{p1MaxPage}</p>
                      <p className="text-[10px] text-emerald-500">{targetP1} halaman</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-rose-50 px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-rose-400" />
                      <span className="text-xs font-semibold text-rose-800">{participant2Name}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-extrabold text-rose-600">{p2MinPage}–{p2MaxPage}</p>
                      <p className="text-[10px] text-rose-400">{targetP2} halaman</p>
                    </div>
                  </div>
                </div>

                <p className="mt-3 text-[10px] leading-relaxed text-slate-400">
                  💡 Input progress bacaan untuk hari ini. Jika halaman hari ini sudah terbaca sebelumnya, gunakan fitur "Baca Tambahan" untuk mencatat bacaan tambahan.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Already read warning */}
      {alreadyReadInfo && (alreadyReadInfo.p1.alreadyRead || alreadyReadInfo.p2.alreadyRead) && (
        <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-100">
              <Info className="h-3.5 w-3.5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-blue-800">Halaman Hari Ini Sudah Terbaca</h4>
              <div className="mt-1.5 space-y-2 text-xs text-blue-700">
                {alreadyReadInfo.p1.alreadyRead && (
                  <div className="flex items-center justify-between">
                    <p>
                      <strong>{participant1Name}:</strong> Sudah dibaca di Hari {alreadyReadInfo.p1.day} (hal {alreadyReadInfo.p1.range})
                    </p>
                    <button
                      onClick={() => {
                        setShowBacaTambahanModal(1);
                        setSelectedAdditionalDays([]);
                      }}
                      className="ml-3 rounded-lg border border-indigo-300 bg-white px-3 py-1.5 text-[11px] font-bold text-indigo-700 transition-all hover:border-indigo-400 hover:bg-indigo-50 active:scale-95"
                    >
                      📖 Baca Tambahan
                    </button>
                  </div>
                )}
                {alreadyReadInfo.p2.alreadyRead && (
                  <div className="flex items-center justify-between">
                    <p>
                      <strong>{participant2Name}:</strong> Sudah dibaca di Hari {alreadyReadInfo.p2.day} (hal {alreadyReadInfo.p2.range})
                    </p>
                    <button
                      onClick={() => {
                        setShowBacaTambahanModal(2);
                        setSelectedAdditionalDays([]);
                      }}
                      className="ml-3 rounded-lg border border-indigo-300 bg-white px-3 py-1.5 text-[11px] font-bold text-indigo-700 transition-all hover:border-indigo-400 hover:bg-indigo-50 active:scale-95"
                    >
                      📖 Baca Tambahan
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <ParticipantInput
          name={participant1Name}
          fromPage={p1From}
          toPage={p1To}
          minPage={p1MinPage}
          maxPage={p1MaxPage}
          onToChange={(v) => { setHasUserEdited(true); setP1To(Math.min(Math.max(v, p1From + 1), p1MaxPage)); }}
          totalPages={p1Pages}
          saving={saving === 1}
          deleting={deleting === 1}
          onSave={() => saveProgress(1, p1From, p1To)}
          onDelete={() => deleteProgress(1)}
          color="emerald"
          disabled={isBeforeStart}
          alreadyRead={alreadyReadInfo?.p1.alreadyRead ?? false}
          hasSavedProgress={!!(currentProgress?.participant1Range && currentProgress.participant1Range !== "-")}
        />

        <ParticipantInput
          name={participant2Name}
          fromPage={p2From}
          toPage={p2To}
          minPage={p2MinPage}
          maxPage={p2MaxPage}
          onToChange={(v) => { setHasUserEdited(true); setP2To(Math.min(Math.max(v, p2From + 1), p2MaxPage)); }}
          totalPages={p2Pages}
          saving={saving === 2}
          deleting={deleting === 2}
          onSave={() => saveProgress(2, p2From, p2To)}
          onDelete={() => deleteProgress(2)}
          color="rose"
          disabled={isBeforeStart}
          alreadyRead={alreadyReadInfo?.p2.alreadyRead ?? false}
          hasSavedProgress={!!(currentProgress?.participant2Range && currentProgress.participant2Range !== "-")}
        />
      </div>

      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div
              className={`mt-4 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium ${
                msgType === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : msgType === "info"
                  ? "border-blue-200 bg-blue-50 text-blue-700"
                  : "border-rose-200 bg-rose-50 text-rose-600"
              }`}
            >
              {msgType === "success" ? (
                <CheckCircle2 className="h-4 w-4 shrink-0" />
              ) : msgType === "info" ? (
                <Info className="h-4 w-4 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0" />
              )}
              {msgText}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tomorrow's Target - Simple & Clean */}
      {isTomorrowValid ? (
        <div className="mt-5 rounded-xl border border-slate-200 bg-white/60 p-4 backdrop-blur-sm">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-700">Target Besok</span>
              <span className="text-xs text-slate-400">· {formatDateShort(tomorrowDateStr)}</span>
            </div>
            <span className="text-xs font-medium text-slate-500">
              Hari {tomorrowDayNum} · {tomorrowTargets!.targetP1 + tomorrowTargets!.targetP2} hal
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-emerald-50/60 px-3 py-2.5">
              <p className="mb-1 text-[10px] font-medium text-emerald-600">
                {participant1Name}
              </p>
              <p className="text-sm font-bold text-emerald-800">
                {tomorrowTargets!.expectedStart}–{tomorrowTargets!.expectedStart + tomorrowTargets!.targetP1 - 1}
              </p>
              <p className="mt-0.5 text-[10px] text-emerald-600/70">{tomorrowTargets!.targetP1} hal</p>
            </div>
            <div className="rounded-lg bg-rose-50/60 px-3 py-2.5">
              <p className="mb-1 text-[10px] font-medium text-rose-600">
                {participant2Name}
              </p>
              <p className="text-sm font-bold text-rose-800">
                {tomorrowTargets!.expectedStart + tomorrowTargets!.targetP1}–{tomorrowTargets!.expectedEnd}
              </p>
              <p className="mt-0.5 text-[10px] text-rose-600/70">{tomorrowTargets!.targetP2} hal</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-5 rounded-xl border border-slate-200 bg-white/60 p-6 text-center backdrop-blur-sm">
          <p className="text-3xl">🎉</p>
          <p className="mt-2 text-sm font-semibold text-slate-700">Ini adalah hari terakhir!</p>
          <p className="mt-1 text-sm text-slate-400">Tidak ada target untuk esok hari</p>
        </div>
      )}

      {/* Baca Tambahan Modal */}
      <AnimatePresence>
        {showBacaTambahanModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBacaTambahanModal(null)}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            />
            
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">
                      📖 Baca Tambahan
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      {showBacaTambahanModal === 1 ? participant1Name : participant2Name}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowBacaTambahanModal(null)}
                    className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="px-6 py-4">
                  <p className="mb-4 text-sm text-slate-600">
                    Pilih hari mana yang ingin kamu baca hari ini:
                  </p>

                  <div className="space-y-2">
                    {findAvailableDays(showBacaTambahanModal, 3).map((availableDay) => {
                      const isSelected = selectedAdditionalDays.includes(availableDay.day);
                      
                      return (
                        <button
                          key={availableDay.day}
                          onClick={() => {
                            setSelectedAdditionalDays(prev =>
                              isSelected
                                ? prev.filter(d => d !== availableDay.day)
                                : [...prev, availableDay.day].sort((a, b) => a - b)
                            );
                          }}
                          className={`w-full rounded-lg border-2 p-4 text-left transition-all ${
                            isSelected
                              ? "border-indigo-400 bg-indigo-50 shadow-md"
                              : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {/* Checkbox */}
                            <div
                              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-all ${
                                isSelected
                                  ? "border-indigo-500 bg-indigo-500"
                                  : "border-slate-300 bg-white"
                              }`}
                            >
                              {isSelected && (
                                <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>

                            {/* Day Info */}
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-slate-800">
                                  Hari {availableDay.day}
                                </span>
                                <span className="text-xs text-slate-500">
                                  {availableDay.to - availableDay.from + 1} halaman
                                </span>
                              </div>
                              <p className="mt-0.5 text-xs font-medium text-slate-600">
                                Halaman {availableDay.from}–{availableDay.to}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}

                    {findAvailableDays(showBacaTambahanModal, 3).length === 0 && (
                      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center">
                        <p className="text-sm text-slate-500">
                          Semua hari berikutnya sudah terbaca
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex gap-2 border-t border-slate-200 px-6 py-4">
                  <button
                    onClick={() => setShowBacaTambahanModal(null)}
                    className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 transition-all hover:bg-slate-50 active:scale-95"
                  >
                    Batal
                  </button>
                  <button
                    onClick={() => {
                      if (selectedAdditionalDays.length === 0) return;
                      
                      const participantNum = showBacaTambahanModal;
                      const availableDays = findAvailableDays(participantNum, 3);
                      const selectedDaysData = availableDays.filter(d => selectedAdditionalDays.includes(d.day));
                      
                      if (selectedDaysData.length > 0) {
                        const firstDay = selectedDaysData[0];
                        const lastDay = selectedDaysData[selectedDaysData.length - 1];
                        
                        if (participantNum === 1) {
                          setP1From(firstDay.from);
                          setP1To(lastDay.to);
                        } else {
                          setP2From(firstDay.from);
                          setP2To(lastDay.to);
                        }
                        
                        setHasUserEdited(true);
                        setMessage(`info:✨ Target diset untuk ${selectedDaysData.length} hari tambahan: ${selectedDaysData.map(d => `Hari ${d.day}`).join(", ")}`);
                        setTimeout(() => setMessage(""), 8000);
                      }
                      
                      setShowBacaTambahanModal(null);
                      setSelectedAdditionalDays([]);
                    }}
                    disabled={selectedAdditionalDays.length === 0}
                    className="flex-1 rounded-lg bg-linear-to-r from-indigo-500 to-purple-500 px-4 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:shadow-lg active:scale-95 disabled:opacity-50"
                  >
                    Simpan ({selectedAdditionalDays.length} hari)
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Participant Input Sub-component ─── */
function ParticipantInput({
  name,
  fromPage,
  toPage,
  minPage,
  maxPage,
  onToChange,
  totalPages,
  saving,
  deleting,
  onSave,
  onDelete,
  color,
  disabled = false,
  alreadyRead = false,
  hasSavedProgress = false,
}: {
  readonly name: string;
  readonly fromPage: number;
  readonly toPage: number;
  readonly minPage: number;
  readonly maxPage: number;
  readonly onToChange: (v: number) => void;
  readonly totalPages: number;
  readonly saving: boolean;
  readonly deleting: boolean;
  readonly onSave: () => void;
  readonly onDelete: () => void;
  readonly color: "emerald" | "rose";
  readonly disabled?: boolean;
  readonly alreadyRead?: boolean;
  readonly hasSavedProgress?: boolean;
}) {
  const isEmerald = color === "emerald";
  const dotColor = isEmerald ? "bg-emerald-500" : "bg-rose-400";
  const focusRing = isEmerald
    ? "focus:border-emerald-400 focus:ring-emerald-100"
    : "focus:border-rose-300 focus:ring-rose-100";
  const totalBg = isEmerald ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-600";
  const btnGradient = isEmerald
    ? "from-emerald-500 to-teal-500 shadow-emerald-200/40"
    : "from-rose-400 to-rose-500 shadow-rose-200/40";
  const rangeLabelColor = isEmerald ? "text-emerald-600" : "text-rose-500";

  return (
    <div className="rounded-xl border border-slate-100 bg-white/70 p-4">
      <div className="mb-1 flex items-center gap-2">
        <div className={`h-2.5 w-2.5 rounded-full ${dotColor}`} />
        <span className="text-sm font-bold text-slate-700">{name}</span>
      </div>
      <p className={`mb-2 text-[11px] font-medium ${rangeLabelColor}`}>
        Target Hari Ini: hal {minPage}–{maxPage}
      </p>

      <div className="space-y-2.5">
        <div>
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Halaman Awal
          </label>
          <div className="w-full rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-center text-base font-bold text-slate-500">
            {fromPage}
          </div>
        </div>

        <div className="flex justify-center">
          <ArrowRight className="h-4 w-4 rotate-90 text-slate-300" />
        </div>

        <div>
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Halaman Akhir <span className="normal-case text-slate-300">(maks {maxPage})</span>
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onToChange(Math.max(toPage - 1, fromPage + 1))}
              disabled={toPage <= fromPage + 1 || alreadyRead}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Kurangi halaman"
            >
              <span className="text-lg font-bold leading-none">−</span>
            </button>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={toPage}
              readOnly={alreadyRead}
              onChange={(e) => {
                const v = Number.parseInt(e.target.value) || fromPage + 1;
                onToChange(v);
              }}
              onBlur={(e) => {
                const v = Number.parseInt(e.target.value) || fromPage + 1;
                onToChange(Math.min(Math.max(v, fromPage + 1), maxPage));
              }}
              className={`w-full rounded-lg border border-slate-200 ${alreadyRead ? 'bg-slate-100' : 'bg-white'} px-3 py-2 text-center text-base font-bold transition-all focus:outline-none focus:ring-2 ${focusRing} ${alreadyRead ? 'cursor-not-allowed' : ''}`}
            />
            <button
              type="button"
              onClick={() => onToChange(Math.min(toPage + 1, maxPage))}
              disabled={toPage >= maxPage || alreadyRead}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Tambah halaman"
            >
              <span className="text-lg font-bold leading-none">+</span>
            </button>
          </div>
        </div>

        <div className={`rounded-lg px-3 py-2 text-center ${totalBg}`}>
          <span className="text-xs font-medium text-slate-400">Total: </span>
          <span className="text-sm font-extrabold">
            {Math.max(totalPages, 0)} halaman
          </span>
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={onSave}
        disabled={saving || disabled || alreadyRead}
        className={`mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r ${btnGradient} px-3 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:shadow-lg active:scale-[0.98] disabled:opacity-60`}
      >
        {saving ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Menyimpan...
          </>
        ) : disabled ? (
          <>
            <Save className="h-4 w-4" />
            Belum Dimulai
          </>
        ) : alreadyRead ? (
          <>
            <Save className="h-4 w-4" />
            Sudah Terbaca
          </>
        ) : (
          <>
            <Save className="h-4 w-4" />
            Simpan
          </>
        )}
      </button>

      {/* Reset Button - only show if progress is saved for today */}
      {hasSavedProgress && !disabled && (
        <button
          onClick={onDelete}
          disabled={deleting}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-rose-300 bg-white px-3 py-2 text-sm font-bold text-rose-600 transition-all hover:bg-rose-50 hover:border-rose-400 active:scale-[0.98] disabled:opacity-60"
        >
          {deleting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Menghapus...
            </>
          ) : (
            <>
              <Trash2 className="h-4 w-4" />
              Reset Data Hari Ini
            </>
          )}
        </button>
      )}
    </div>
  );
}
