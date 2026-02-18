"use client";

import { useState } from "react";
import {
  Share2,
  Copy,
  CheckCircle2,
  Link2,
  ShieldCheck,
  BookOpen,
} from "lucide-react";

interface ShareCardProps {
  challengeId: string;
  secretKey: string;
}

export default function ShareCard({ challengeId, secretKey }: ShareCardProps) {
  const [copied, setCopied] = useState<"id" | "key" | "link" | null>(null);

  const currentUrl =
    typeof globalThis.window !== "undefined"
      ? `${globalThis.window.location.origin}/challenge/${challengeId}?key=${encodeURIComponent(secretKey)}`
      : "";

  const copyToClipboard = async (text: string, type: "id" | "key" | "link") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    }
  };

  const items = [
    {
      type: "id" as const,
      label: "Challenge ID",
      value: challengeId,
      icon: BookOpen,
    },
    {
      type: "key" as const,
      label: "Secret Key",
      value: secretKey,
      icon: ShieldCheck,
    },
    {
      type: "link" as const,
      label: "Link Langsung",
      value: currentUrl,
      icon: Link2,
      isSmall: true,
    },
  ];

  return (
    <div className="glass-card rounded-2xl p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 text-white shadow-md shadow-slate-300/40">
          <Share2 className="h-4.5 w-4.5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-800">Bagikan Challenge</h3>
          <p className="text-[11px] text-slate-400">Kirim info ini ke pasangan kamu</p>
        </div>
      </div>

      <div className="space-y-3">
        {items.map(({ type, label, value, icon: Icon, isSmall }) => (
          <div key={type}>
            <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <Icon className="h-3 w-3" />
              {label}
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 overflow-hidden rounded-xl border border-slate-100 bg-slate-50/80 px-3.5 py-2.5">
                <code
                  className={`block truncate font-mono text-slate-600 ${
                    isSmall ? "text-[11px]" : "text-sm"
                  }`}
                >
                  {value}
                </code>
              </div>
              <button
                onClick={() => copyToClipboard(value, type)}
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all ${
                  copied === type
                    ? "border-emerald-200 bg-emerald-50 text-emerald-600"
                    : "border-slate-200 bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                }`}
              >
                {copied === type ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
