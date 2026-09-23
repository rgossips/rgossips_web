"use client";

// The undo side of blocking — without it a block is a one-way door.
//
// Mirrors the mobile screen of the same name. block-user resolves the display
// names server-side (the table holds only ids), so this renders exactly what
// it returns and never queries profiles itself.

import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Ban, Loader2, UserX } from "lucide-react";
import { useTranslations } from "next-intl";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { invokeAuthed } from "@/lib/invokeAuthed";

export default function BlockedAccounts({ onBack }) {
  const t = useTranslations("BlockedAccounts");
  const supabase = createClient();
  const { user } = useAuth();
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError("");
    try {
      const res = await invokeAuthed(supabase, "block-user", { action: "list" });
      if (res?.needsLogin) {
        setError(t("errorLoad"));
        return;
      }
      const { data, error: fnErr } = res;
      if (fnErr || !data?.success) {
        setError(data?.error || t("errorLoad"));
        return;
      }
      setBlocks(Array.isArray(data.blocks) ? data.blocks : []);
    } catch {
      setError(t("errorLoad"));
    } finally {
      setLoading(false);
    }
  }, [user?.id, supabase, t]);

  useEffect(() => {
    load();
  }, [load]);

  const unblock = async (userId) => {
    setBusyId(userId);
    setError("");
    try {
      const res = await invokeAuthed(supabase, "block-user", {
        action: "unblock",
        targetUserId: userId,
      });
      if (res?.needsLogin) {
        setError(t("errorUnblock"));
        return;
      }
      const { data, error: fnErr } = res;
      if (fnErr || !data?.success) {
        setError(data?.error || t("errorUnblock"));
        return;
      }
      setBlocks((prev) => prev.filter((b) => b.userId !== userId));
    } catch {
      setError(t("errorUnblock"));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 pb-28">
      <div className="flex items-center gap-3 mb-6">
        {onBack ? (
          <button
            onClick={onBack}
            aria-label={t("back")}
            className="w-9 h-9 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center text-gray-500 cursor-pointer"
          >
            <ArrowLeft size={16} />
          </button>
        ) : null}
        <h2 className="text-lg font-black text-gray-900">{t("title")}</h2>
      </div>

      {error ? (
        <p role="alert" className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
          {error}
        </p>
      ) : null}

      {loading ? (
        <div className="py-16 flex justify-center text-gray-400">
          <Loader2 size={20} className="animate-spin" />
        </div>
      ) : blocks.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-[2rem] p-10 text-center shadow-sm">
          <div className="w-12 h-12 mx-auto rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mb-4">
            <UserX size={22} />
          </div>
          <p className="text-sm font-black text-gray-800">{t("emptyTitle")}</p>
          <p className="mt-2 text-xs text-gray-500 leading-relaxed max-w-sm mx-auto">{t("emptyBody")}</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-[2rem] divide-y divide-gray-100 shadow-sm overflow-hidden">
          {blocks.map((b) => (
            <div key={b.userId} className="flex items-center gap-3 p-4 sm:p-5">
              {b.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={b.photo} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
                  <Ban size={16} />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{b.name}</p>
                {b.handle ? <p className="text-[11px] text-gray-400 truncate">@{b.handle}</p> : null}
              </div>
              <button
                onClick={() => unblock(b.userId)}
                disabled={busyId === b.userId}
                className="shrink-0 px-4 h-9 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:border-gray-300 inline-flex items-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {busyId === b.userId ? <Loader2 size={13} className="animate-spin" /> : null}
                {t("unblock")}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
