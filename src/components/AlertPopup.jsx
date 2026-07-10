"use client";

// Compact, self-contained replacement for window.alert(). A plain fixed
// overlay (NOT a Radix portal) at a very high z-index, so it renders above
// everything — including other modals it may be triggered from inside
// (e.g. the z-[110] application-journey modal on the brand campaign page).
//
// Usage:
//   const [popup, setPopup] = useState(null); // string | {title,message,tone}
//   ...
//   setPopup("Your session expired. Please sign in again.");
//   <AlertPopup popup={popup} onClose={() => setPopup(null)} />
//
// `popup` may be a string (message) or { title, message, tone: "error" |
// "success" | "info" }. null/undefined hides it.
export default function AlertPopup({ popup, onClose }) {
  if (!popup) return null;
  const isObj = typeof popup === "object";
  const message = isObj ? popup.message : popup;
  const tone = (isObj && popup.tone) || "error";
  const title =
    (isObj && popup.title) ||
    (tone === "success" ? "Done" : tone === "info" ? "Heads up" : "Something went wrong");

  const accent =
    tone === "success"
      ? { ring: "bg-emerald-50", stroke: "#059669" }
      : tone === "info"
        ? { ring: "bg-blue-50", stroke: "#2563eb" }
        : { ring: "bg-rose-50", stroke: "#e11d48" };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:w-[320px] max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="p-5">
          <div className="flex items-start gap-3">
            <div className={`w-9 h-9 rounded-full ${accent.ring} flex items-center justify-center shrink-0`}>
              {tone === "success" ? (
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke={accent.stroke} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke={accent.stroke} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="13" />
                  <line x1="12" y1="16.5" x2="12" y2="16.5" />
                </svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-black text-slate-900 leading-snug">{title}</h3>
              {message && (
                <p className="text-[12px] text-slate-500 font-medium mt-1 leading-relaxed break-words">
                  {message}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-full mt-4 py-2.5 rounded-xl text-white text-sm font-bold cursor-pointer hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #9810fa 0%, #e60076 100%)" }}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
