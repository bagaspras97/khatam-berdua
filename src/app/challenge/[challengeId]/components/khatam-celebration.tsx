"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Star, X } from "lucide-react";
import { TOTAL_PAGES } from "@/lib/constants";

interface KhatamCelebrationProps {
  challengeId: string;
  participant1Name: string;
  participant2Name: string;
  totalPagesRead: number;
  participant1Total: number;
  participant2Total: number;
}

const PARTICLE_COLORS = ["#fbbf24", "#34d399", "#60a5fa", "#f472b6", "#a78bfa", "#fb923c"];

type Particle = {
  id: number;
  x: number;
  size: number;
  delay: number;
  duration: number;
  color: string;
  rotation: number;
  isSquare: boolean;
};

// Deterministic particles to avoid hydration issues
function buildParticles(count: number): Particle[] {
  const particles: Particle[] = [];
  // Use a simple seeded-style sequence so SSR and client match
  for (let i = 0; i < count; i++) {
    const t = i / count;
    particles.push({
      id: i,
      x: (t * 97 + (i * 31) % 100) % 100,
      size: 6 + (i % 9),
      delay: (i * 0.07) % 2.5,
      duration: 2.5 + (i % 5) * 0.4,
      color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
      rotation: (i % 2 === 0 ? 1 : -1) * (120 + (i % 8) * 30),
      isSquare: i % 3 !== 0,
    });
  }
  return particles;
}

const PARTICLES = buildParticles(45);

export default function KhatamCelebration({
  challengeId,
  participant1Name,
  participant2Name,
  totalPagesRead,
  participant1Total,
  participant2Total,
}: KhatamCelebrationProps) {
  const storageKey = `khatam-celebrated-${challengeId}`;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const already = localStorage.getItem(storageKey);
    if (!already) {
      // Small delay so page content renders first
      const timer = setTimeout(() => setVisible(true), 600);
      return () => clearTimeout(timer);
    }
  }, [storageKey]);

  const dismiss = () => {
    localStorage.setItem(storageKey, "1");
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="khatam-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}
          onClick={dismiss}
        >
          {/* Confetti particles */}
          {PARTICLES.map((p) => (
            <motion.div
              key={p.id}
              className="pointer-events-none fixed"
              style={{
                left: `${p.x}vw`,
                top: -20,
                width: p.size,
                height: p.size,
                backgroundColor: p.color,
                borderRadius: p.isSquare ? "2px" : "50%",
              }}
              initial={{ y: -20, opacity: 1, rotate: 0 }}
              animate={{ y: "110vh", opacity: [1, 1, 0.7, 0], rotate: p.rotation }}
              transition={{
                duration: p.duration,
                delay: p.delay,
                ease: "linear",
                repeat: Infinity,
                repeatDelay: 0.5 + (p.id % 3) * 0.6,
              }}
            />
          ))}

          {/* Modal card */}
          <motion.div
            initial={{ scale: 0.7, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 260, damping: 22, delay: 0.05 }}
            className="relative z-10 w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Dismiss button */}
            <button
              onClick={dismiss}
              className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              aria-label="Tutup"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Trophy icon */}
            <div className="relative mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br from-amber-300 to-amber-500 shadow-lg shadow-amber-200/60">
              <motion.div
                animate={{ rotate: [0, -12, 12, -7, 7, 0] }}
                transition={{ duration: 0.9, delay: 0.5, ease: "easeInOut" }}
              >
                <Trophy className="h-10 w-10 text-white" />
              </motion.div>

              {/* Corner sparkle stars */}
              {(
                [
                  { top: -10, left: -10 },
                  { top: -10, right: -10 },
                  { bottom: -10, left: -10 },
                  { bottom: -10, right: -10 },
                ] as React.CSSProperties[]
              ).map((style, i) => (
                <motion.div
                  key={i}
                  className="absolute"
                  style={style}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: [0, 1.3, 1], opacity: [0, 1, 0.9] }}
                  transition={{ delay: 0.55 + i * 0.1, duration: 0.35 }}
                >
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                </motion.div>
              ))}
            </div>

            {/* Headline */}
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="text-2xl font-extrabold tracking-tight text-slate-800"
            >
              Alhamdulillah!
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="mt-1.5 text-lg font-bold text-amber-600"
            >
              Khatam Al-Qur&apos;an 🎉
            </motion.p>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45 }}
              className="mt-3 text-sm leading-relaxed text-slate-500"
            >
              <span className="font-semibold text-slate-700">{participant1Name}</span>
              {" & "}
              <span className="font-semibold text-slate-700">{participant2Name}</span>
              {" berhasil khatam bersama!"}
            </motion.p>

            {/* Per-participant stats */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
              className="mt-5 grid grid-cols-2 gap-3"
            >
              <div className="rounded-2xl bg-emerald-50 px-3 py-3">
                <p className="truncate text-xs font-medium text-emerald-600">{participant1Name}</p>
                <p className="mt-0.5 text-xl font-extrabold text-emerald-700">{participant1Total}</p>
                <p className="text-[10px] text-emerald-500">halaman</p>
              </div>
              <div className="rounded-2xl bg-rose-50 px-3 py-3">
                <p className="truncate text-xs font-medium text-rose-500">{participant2Name}</p>
                <p className="mt-0.5 text-xl font-extrabold text-rose-600">{participant2Total}</p>
                <p className="text-[10px] text-rose-400">halaman</p>
              </div>
            </motion.div>

            {/* Total pages */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.65 }}
              className="mt-3 rounded-2xl bg-amber-50 py-2.5"
            >
              <p className="text-sm font-bold text-amber-700">
                Total {totalPagesRead} / {TOTAL_PAGES} halaman ✓
              </p>
            </motion.div>

            {/* CTA button */}
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.75, type: "spring", stiffness: 300 }}
              onClick={dismiss}
              className="mt-6 w-full rounded-2xl bg-linear-to-r from-emerald-500 to-teal-500 py-3 text-sm font-bold text-white shadow-md shadow-emerald-200 transition-opacity hover:opacity-90 active:opacity-80"
            >
              Jazakallah Khairan 🤲
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
