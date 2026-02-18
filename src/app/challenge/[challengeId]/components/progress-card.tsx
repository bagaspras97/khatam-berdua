"use client";

import { useState, useEffect, useRef } from "react";
import { DaySummary } from "@/lib/types";
import { getDayTargets } from "@/lib/constants";
import { getDayNumber } from "@/lib/date-utils";
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
  const [message, setMessage] = useState("");
  const [showInfo, setShowInfo] = useState(false);
  const [hasUserEdited, setHasUserEdited] = useState(false);
  const infoRef = useRef<HTMLDivElement>(null);
  // Track which (date, currentProgress) combination we last initialized from,
  // so makeup saves on OTHER days don't re-trigger a reset of today's inputs.
  const initKeyRef = useRef<string | null>(null);

  const dayNum = getDayNumber(startDate, date);
  const { targetP1, targetP2, expectedStart, expectedEnd } = getDayTargets(dayNum, durationDays);

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
          <p className="text-[11px] text-slate-400">{date} · Hari ke-{dayNum}</p>
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
                  Halaman akhir yang dapat diinput dibatasi sesuai target hari ini.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

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
          onSave={() => saveProgress(1, p1From, p1To)}
          color="emerald"
          disabled={isBeforeStart}
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
          onSave={() => saveProgress(2, p2From, p2To)}
          color="rose"
          disabled={isBeforeStart}
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
  onSave,
  color,
  disabled = false,
}: {
  readonly name: string;
  readonly fromPage: number;
  readonly toPage: number;
  readonly minPage: number;
  readonly maxPage: number;
  readonly onToChange: (v: number) => void;
  readonly totalPages: number;
  readonly saving: boolean;
  readonly onSave: () => void;
  readonly color: "emerald" | "rose";
  readonly disabled?: boolean;
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
      <p className={`mb-3 text-[11px] font-medium ${rangeLabelColor}`}>
        Target: hal {minPage}–{maxPage}
      </p>

      <div className="space-y-2.5">
        <div>
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Halaman Awal
          </label>
          <div className="w-full rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5 text-center text-base font-bold text-slate-500">
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
              disabled={toPage <= fromPage + 1}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Kurangi halaman"
            >
              <span className="text-xl font-bold">−</span>
            </button>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={toPage}
              onChange={(e) => {
                const v = Number.parseInt(e.target.value) || fromPage + 1;
                onToChange(v);
              }}
              onBlur={(e) => {
                const v = Number.parseInt(e.target.value) || fromPage + 1;
                onToChange(Math.min(Math.max(v, fromPage + 1), maxPage));
              }}
              className={`w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-center text-base font-bold transition-all focus:outline-none focus:ring-2 ${focusRing}`}
            />
            <button
              type="button"
              onClick={() => onToChange(Math.min(toPage + 1, maxPage))}
              disabled={toPage >= maxPage}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Tambah halaman"
            >
              <span className="text-xl font-bold">+</span>
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

      <button
        onClick={onSave}
        disabled={saving || disabled}
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
        ) : (
          <>
            <Save className="h-4 w-4" />
            Simpan
          </>
        )}
      </button>
    </div>
  );
}
