"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { generateSecretKey, getTodayJakarta } from "@/lib/date-utils";
import { DURATION_PRESETS, DEFAULT_CHALLENGE_DURATION } from "@/lib/constants";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  KeyRound,
  Users,
  CalendarDays,
  Clock,
  ShieldCheck,
  RefreshCw,
  ArrowRight,
  BookOpen,
  Share2,
  PenLine,
  BarChart3,
  AlertCircle,
  Loader2,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

export default function HomePage() {
  return (
    <div className="space-y-8">
      {/* Tagline */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="py-3 text-center sm:py-5"
      >
        <p className="text-2xl font-extrabold tracking-tight text-slate-800 sm:text-3xl">
          mulai <span className="relative inline-block italic font-light text-slate-400">bersama</span>,
        </p>
        <p className="mt-0.5 text-2xl font-extrabold tracking-tight text-slate-800 sm:text-3xl">
          khatam <span className="italic font-light text-amber-400">bersama</span>.
        </p>
        <div className="mx-auto mt-4 h-px w-10 rounded-full bg-slate-200" />
      </motion.div>

      {/* Two columns on desktop */}
      <div className="grid gap-5 md:grid-cols-2">
        <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible">
          <CreateChallengeCard />
        </motion.div>
        <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible">
          <AccessChallengeCard />
        </motion.div>
      </div>

      {/* How it works */}
      <motion.section
        custom={3}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="glass-card rounded-2xl p-6 shadow-sm"
      >
        <h3 className="mb-5 text-center text-lg font-bold text-slate-800">Bagaimana Cara Kerjanya?</h3>

        <div className="grid gap-4 sm:grid-cols-2">
          {[
            {
              step: 1,
              icon: Sparkles,
              title: "Buat Challenge",
              desc: "Masukkan nama kamu dan pasangan, tentukan tanggal mulai",
              color: "from-emerald-500 to-teal-500",
            },
            {
              step: 2,
              icon: Share2,
              title: "Bagikan Akses",
              desc: "Kirim Challenge ID & Secret Key ke pasangan",
              color: "from-slate-700 to-slate-800",
            },
            {
              step: 3,
              icon: PenLine,
              title: "Catat Bacaan",
              desc: "Setiap hari, input halaman yang sudah dibaca",
              color: "from-amber-400 to-amber-500",
            },
            {
              step: 4,
              icon: BarChart3,
              title: "Pantau Progress",
              desc: "Lihat statistik bersama sampai khatam 604 halaman (30 juz)!",
              color: "from-rose-400 to-rose-500",
            },
          ].map(({ step, icon: Icon, title, desc, color }) => (
            <motion.div
              key={step}
              whileHover={{ y: -2 }}
              className="flex items-start gap-3 rounded-xl border border-slate-100 bg-white/70 p-4 transition-shadow hover:shadow-md"
            >
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-linear-to-br ${color} text-white shadow-sm`}
              >
                <Icon className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-700">
                  <span className="mr-1 text-slate-400">{step}.</span> {title}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>
    </div>
  );
}

/* ─── Create Challenge Card ─── */
function CreateChallengeCard() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    participant_1_name: "",
    participant_2_name: "",
    start_date: "",
    secret_key: generateSecretKey(),
    duration_days: DEFAULT_CHALLENGE_DURATION,
  });

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const today = getTodayJakarta();
      if (form.start_date < today) {
        setError("Tanggal mulai tidak boleh di masa lalu");
        setTimeout(() => setError(""), 5000);
        setLoading(false);
        return;
      }

      const res = await fetch("/api/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || "Gagal membuat challenge");
        setTimeout(() => setError(""), 5000);
        return;
      }

      const challengeId = data.data.id;
      router.push(`/challenge/${challengeId}?key=${form.secret_key}`);
    } catch {
      setError("Terjadi kesalahan, coba lagi");
      setTimeout(() => setError(""), 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card group rounded-2xl p-6 shadow-sm transition-shadow hover:shadow-lg">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-200/50">
          <Sparkles className="h-5 w-5" />
        </div>
        <h3 className="text-lg font-bold text-slate-800">Buat Challenge Baru</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Participant 1 */}
        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-slate-600">
            <Users className="h-3.5 w-3.5 text-emerald-500" />
            Nama Pembaca 1
          </label>
          <input
            type="text"
            required
            maxLength={50}
            className="w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm transition-all placeholder:text-slate-300 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            placeholder="Contoh: Ahmad"
            value={form.participant_1_name}
            onChange={(e) => setForm({ ...form, participant_1_name: e.target.value })}
          />
        </div>

        {/* Participant 2 */}
        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-slate-600">
            <Users className="h-3.5 w-3.5 text-rose-400" />
            Nama Pembaca 2
          </label>
          <input
            type="text"
            required
            maxLength={50}
            className="w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm transition-all placeholder:text-slate-300 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            placeholder="Contoh: Fatimah"
            value={form.participant_2_name}
            onChange={(e) => setForm({ ...form, participant_2_name: e.target.value })}
          />
        </div>

        {/* Start date */}
        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-slate-600">
            <CalendarDays className="h-3.5 w-3.5 text-amber-500" />
            Tanggal Mulai
          </label>
          <input
            type="date"
            required
            min={getTodayJakarta()}
            className="w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm transition-all focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            value={form.start_date}
            onChange={(e) => setForm({ ...form, start_date: e.target.value })}
          />
          <p className="mt-1.5 text-[11px] text-slate-400">Hanya bisa memilih hari ini atau tanggal yang akan datang</p>
        </div>

        {/* Duration */}
        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-slate-600">
            <Clock className="h-3.5 w-3.5 text-teal-500" />
            Durasi Challenge
          </label>
          <select
            required
            className="w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm transition-all focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            value={form.duration_days}
            onChange={(e) => setForm({ ...form, duration_days: Number(e.target.value) })}
          >
            {DURATION_PRESETS.map((preset) => (
              <option key={preset.days} value={preset.days}>
                {preset.label}
              </option>
            ))}
          </select>
          <p className="mt-1.5 text-[11px] text-slate-400">
            Total 604 halaman akan dibagi merata sesuai durasi
          </p>
        </div>

        {/* Secret key */}
        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-slate-600">
            <ShieldCheck className="h-3.5 w-3.5 text-slate-500" />
            Secret Key
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              required
              minLength={4}
              maxLength={32}
              className="flex-1 rounded-xl border border-slate-200 bg-white/80 px-4 py-2.5 font-mono text-sm transition-all focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              value={form.secret_key}
              onChange={(e) => setForm({ ...form, secret_key: e.target.value })}
            />
            <button
              type="button"
              onClick={() => setForm({ ...form, secret_key: generateSecretKey() })}
              className="flex items-center justify-center rounded-xl border border-slate-200 px-3 py-2.5 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-1.5 text-[11px] text-slate-400">Simpan key ini! Digunakan untuk akses challenge</p>
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="group/btn flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-emerald-600 to-teal-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-200/50 transition-all hover:shadow-xl hover:shadow-emerald-200/50 active:scale-[0.98] disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Membuat...
            </>
          ) : (
            <>
              Buat Challenge
              <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-0.5" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}

/* ─── Access Challenge Card ─── */
function AccessChallengeCard() {
  const router = useRouter();
  const [challengeId, setChallengeId] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAccess = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/challenges/${challengeId.trim()}?key=${encodeURIComponent(secretKey.trim())}`);
      const data = await res.json();

      if (!data.success) {
        setError(data.error || "Challenge tidak ditemukan");
        setTimeout(() => setError(""), 5000);
        return;
      }

      router.push(`/challenge/${challengeId.trim()}?key=${encodeURIComponent(secretKey.trim())}`);
    } catch {
      setError("Terjadi kesalahan, coba lagi");
      setTimeout(() => setError(""), 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card group rounded-2xl p-6 shadow-sm transition-shadow hover:shadow-lg">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-slate-700 to-slate-800 text-white shadow-md shadow-slate-300/50">
          <KeyRound className="h-5 w-5" />
        </div>
        <h3 className="text-lg font-bold text-slate-800">Akses Challenge</h3>
      </div>

      <form onSubmit={handleAccess} className="space-y-4">
        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-slate-600">
            <BookOpen className="h-3.5 w-3.5 text-emerald-500" />
            Challenge ID
          </label>
          <input
            type="text"
            required
            className="w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-2.5 font-mono text-sm transition-all placeholder:text-slate-300 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            placeholder="Paste challenge ID di sini"
            value={challengeId}
            onChange={(e) => setChallengeId(e.target.value)}
          />
        </div>

        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-slate-600">
            <ShieldCheck className="h-3.5 w-3.5 text-slate-500" />
            Secret Key
          </label>
          <input
            type="text"
            required
            className="w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-2.5 font-mono text-sm transition-all placeholder:text-slate-300 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            placeholder="Masukkan secret key"
            value={secretKey}
            onChange={(e) => setSecretKey(e.target.value)}
          />
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="submit"
          disabled={loading}
          className="group/btn flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-slate-800 to-slate-700 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-slate-300/50 transition-all hover:shadow-xl hover:shadow-slate-300/50 active:scale-[0.98] disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Memverifikasi...
            </>
          ) : (
            <>
              Masuk ke Challenge
              <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-0.5" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
