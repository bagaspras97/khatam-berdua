"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChallengeWithProgress, ChallengeStats } from "@/lib/types";
import { computeStats } from "@/lib/stats";
import { getTodayJakarta, formatDateId } from "@/lib/date-utils";
import { TOTAL_PAGES, getDayTargets } from "@/lib/constants";
import { motion } from "framer-motion";
import {
  Loader2,
  AlertTriangle,
  ArrowLeft,
  Trophy,
  Clock,
  Flame,
  CheckCircle2,
} from "lucide-react";
import ProgressCard from "./components/progress-card";
import DayGrid from "./components/day-grid";
import ShareCard from "./components/share-card";
import MissingPagesAlert from "./components/missing-pages-alert";
import KhatamCelebration from "./components/khatam-celebration";

const fadeIn = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.45, ease: "easeOut" as const },
  }),
};

export default function ChallengeDashboard() {
  const params = useParams();
  const searchParams = useSearchParams();
  const challengeId = params.challengeId as string;
  const secretKey = searchParams.get("key") ?? "";

  // ?date=YYYY-MM-DD overrides "today" for testing (env NEXT_PUBLIC_DATE_OVERRIDE also works)
  const dateOverride = searchParams.get("date") ?? undefined;

  const [challenge, setChallenge] = useState<Omit<ChallengeWithProgress, "secret_key"> | null>(null);
  const [stats, setStats] = useState<ChallengeStats | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchChallenge = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/challenges/${challengeId}?key=${encodeURIComponent(secretKey)}`
      );
      const data = await res.json();

      if (!data.success) {
        setError(data.error || "Gagal mengambil data");
        return;
      }

      setChallenge(data.data);
      const withKey = { ...data.data, secret_key: "" } as ChallengeWithProgress;
      setStats(computeStats(withKey, dateOverride));
    } catch {
      setError("Terjadi kesalahan, coba lagi");
    } finally {
      setLoading(false);
    }
  }, [challengeId, secretKey, dateOverride]);

  useEffect(() => {
    if (challengeId && secretKey) {
      fetchChallenge();
    } else {
      setError("Challenge ID atau Secret Key tidak valid");
      setLoading(false);
    }
  }, [challengeId, secretKey, fetchChallenge]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-3"
        >
          <div className="relative">
            <div className="h-12 w-12 rounded-full bg-linear-to-br from-emerald-100 to-teal-100" />
            <Loader2 className="absolute inset-0 m-auto h-6 w-6 animate-spin text-emerald-600" />
          </div>
          <p className="text-sm font-medium text-slate-400">Memuat challenge...</p>
        </motion.div>
      </div>
    );
  }

  console.log(error, 'Error State');

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-8 text-center"
      >
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100">
          <AlertTriangle className="h-7 w-7 text-rose-500" />
        </div>
        <p className="text-base font-semibold text-slate-700">{error}</p>
        <Link
          href="/"
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 transition-colors hover:text-emerald-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke beranda
        </Link>
      </motion.div>
    );
  }

  console.log("Challenge Data:", challenge);

  if (!challenge || !stats) return null;

  const today = getTodayJakarta(dateOverride);
  const isKhatam = stats.percentComplete >= 100;

  // Calculate per-participant total targets across all days
  const p1TotalTarget = TOTAL_PAGES - Array.from({ length: challenge.duration_days }, (_, i) => getDayTargets(i + 1, challenge.duration_days).targetP2).reduce((a, b) => a + b, 0);
  const p2TotalTarget = TOTAL_PAGES - Array.from({ length: challenge.duration_days }, (_, i) => getDayTargets(i + 1, challenge.duration_days).targetP1).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-5">
      {/* Khatam celebration overlay */}
      {isKhatam && (
        <KhatamCelebration
          challengeId={challengeId}
          participant1Name={challenge.participant_1_name}
          participant2Name={challenge.participant_2_name}
          totalPagesRead={stats.totalPagesRead}
          participant1Total={stats.participant1Total}
          participant2Total={stats.participant2Total}
        />
      )}
      {/* Challenge Header */}
      <motion.div
        custom={0}
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        className="relative overflow-hidden rounded-2xl bg-linear-to-br from-emerald-600 via-emerald-500 to-teal-500 p-5 text-white shadow-xl shadow-emerald-200/40 sm:p-6"
      >
        {/* Decorative */}
        <div className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />

        <div className="relative">
          {/* Top: Names + Status */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-lg font-extrabold tracking-tight sm:text-xl">
                {challenge.participant_1_name} & {challenge.participant_2_name}
              </h2>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] text-emerald-100/90">
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDateId(challenge.start_date)}
                </span>
                <span className="opacity-40">·</span>
                <span>Hari ke-{stats.currentDay} dari {challenge.duration_days}</span>
              </div>
            </div>

            {isKhatam ? (
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-amber-400/90 px-3 py-1.5 text-xs font-bold text-amber-900 shadow-lg shadow-amber-500/20">
                <Trophy className="h-3.5 w-3.5" />
                Khatam!
              </span>
            ) : stats.isOnTrack ? (
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 text-xs font-bold backdrop-blur-sm">
                <CheckCircle2 className="h-3.5 w-3.5" />
                On Track
              </span>
            ) : (
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-amber-400/90 px-3 py-1.5 text-xs font-bold text-amber-900 shadow-lg shadow-amber-500/20">
                <Flame className="h-3.5 w-3.5" />
                Kejar Ketinggalan!
              </span>
            )}
          </div>

          {/* Hero metric + juz */}
          <div className="mt-5 mb-3 flex items-end justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold leading-none sm:text-4xl">
                {stats.percentComplete}%
              </span>
              <span className="text-sm text-emerald-100">
                {stats.totalPagesRead}
                <span className="text-emerald-200/60"> / {TOTAL_PAGES} hal</span>
              </span>
            </div>
            <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-bold backdrop-blur-sm">
              {Math.floor((stats.totalPagesRead * 30) / TOTAL_PAGES)}/30 juz
            </span>
          </div>

          {/* Progress bar */}
          <div className="relative h-3 overflow-hidden rounded-full bg-white/20">
            {/* Expected progress marker */}
            <div
              className="absolute top-0 h-full border-r-2 border-dashed border-white/50"
              style={{ left: `${Math.min((stats.expectedPages / TOTAL_PAGES) * 100, 100)}%` }}
            />
            {/* Actual progress */}
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${stats.percentComplete}%` }}
              transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
              className={`h-full rounded-full shadow-sm ${
                stats.isOnTrack ? "bg-white" : "bg-amber-300"
              }`}
            />
          </div>

          {/* Target context */}
          <p className="mt-2 text-[11px] text-emerald-100/70">
            Target s/d hari ini: {stats.expectedPages} hal
            {stats.isOnTrack
              ? " — ✓ Sudah sesuai target"
              : ` — kurang ${stats.expectedPages - stats.totalPagesRead} hal dari target`}
          </p>
        </div>
      </motion.div>

      {/* Individual Stats */}
      <div className="grid gap-3 grid-cols-2">
        {[
          {
            name: challenge.participant_1_name,
            total: stats.participant1Total,
            actualTotal: stats.participant1ActualTotal,
            target: p1TotalTarget,
            color: "emerald",
            gradient: "from-emerald-500 to-teal-500",
            bgLight: "bg-emerald-50",
            textColor: "text-emerald-700",
            barColor: "bg-emerald-400",
          },
          {
            name: challenge.participant_2_name,
            total: stats.participant2Total,
            actualTotal: stats.participant2ActualTotal,
            target: p2TotalTarget,
            color: "rose",
            gradient: "from-rose-400 to-rose-500",
            bgLight: "bg-rose-50",
            textColor: "text-rose-600",
            barColor: "bg-rose-400",
          },
        ].map((p, i) => (
          <motion.div
            key={p.name}
            custom={i + 1}
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            className="glass-card rounded-2xl p-4 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <div className={`h-2.5 w-2.5 rounded-full bg-linear-to-r ${p.gradient}`} />
              <p className="truncate text-sm font-semibold text-slate-500">{p.name}</p>
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className={`text-2xl font-extrabold ${p.textColor}`}>
                {p.total}
              </span>
              <span className="text-xs text-slate-400">/ {p.target}</span>
            </div>
            <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((p.total / p.target) * 100, 100)}%` }}
                transition={{ duration: 0.8, delay: 0.4 + i * 0.15 }}
                className={`h-full rounded-full ${p.barColor}`}
              />
            </div>
            {/* Show actual pages read if different from attributed total (makeup cross-reads) */}
            {p.actualTotal !== p.total && (
              <p className="mt-2 text-[10px] text-slate-400">
                Dibaca langsung:{" "}
                <span className="font-semibold text-slate-500">{p.actualTotal} hal</span>
              </p>
            )}
          </motion.div>
        ))}
      </div>

      {/* Missing Pages Alert */}
      <motion.div custom={3} variants={fadeIn} initial="hidden" animate="visible">
        <MissingPagesAlert
          challengeId={challengeId}
          secretKey={secretKey}
          dailySummaries={stats.dailySummaries}
          participant1Name={challenge.participant_1_name}
          participant2Name={challenge.participant_2_name}
          today={today}
          onUpdate={fetchChallenge}
        />
      </motion.div>

      {/* Today's Progress Input */}
      <motion.div custom={4} variants={fadeIn} initial="hidden" animate="visible">
        <ProgressCard
          challengeId={challengeId}
          secretKey={secretKey}
          participant1Name={challenge.participant_1_name}
          participant2Name={challenge.participant_2_name}
          date={today}
          startDate={challenge.start_date}
          durationDays={challenge.duration_days}
          dailySummaries={stats.dailySummaries}
          currentProgress={stats.dailySummaries.find((d) => d.date === today)}
          onUpdate={fetchChallenge}
        />
      </motion.div>

      {/* Day Grid */}
      <motion.div custom={5} variants={fadeIn} initial="hidden" animate="visible">
        <DayGrid
          dailySummaries={stats.dailySummaries}
          participant1Name={challenge.participant_1_name}
          participant2Name={challenge.participant_2_name}
          today={today}
          durationDays={challenge.duration_days}
        />
      </motion.div>

      {/* Share Card */}
      <motion.div custom={6} variants={fadeIn} initial="hidden" animate="visible">
        <ShareCard challengeId={challengeId} secretKey={secretKey} />
      </motion.div>
    </div>
  );
}
