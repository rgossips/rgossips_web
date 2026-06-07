"use client";

import React from "react";
import { X } from "lucide-react";

// Reusable payment gateway picker. Used by the pricing page (subscription
// upgrades) and the service-orders page (advance + final payments).
// Caller supplies a title/subtitle pair and an onPick(gateway) callback;
// gateway is one of "razorpay" | "stripe".
export default function GatewayPickerModal({ title, subtitle, onCancel, onPick }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full sm:w-[420px] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden">
        <div className="flex items-start justify-between px-5 pt-5 pb-3">
          <div>
            <h3 className="text-base font-black text-slate-900">{title}</h3>
            {subtitle && (
              <p className="text-[11px] text-slate-400 font-semibold mt-0.5">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onCancel}
            aria-label="Close"
            type="button"
            className="p-1.5 -mr-1.5 hover:bg-slate-100 rounded-lg cursor-pointer text-slate-400 hover:text-slate-600"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        <div className="px-5 pb-5 space-y-2.5">
          <GatewayOption
            onClick={() => onPick("razorpay")}
            logo={<RazorpayLogo />}
            title="Razorpay"
            tagline="UPI · Cards · Netbanking · Wallets"
            accent="border-[#0c2451]/15 hover:border-[#0c2451]/40 hover:bg-[#0c2451]/5"
          />
          <GatewayOption
            onClick={() => onPick("stripe")}
            logo={<StripeLogo />}
            title="Stripe"
            tagline="International cards · Apple Pay · Google Pay"
            accent="border-[#635BFF]/15 hover:border-[#635BFF]/40 hover:bg-[#635BFF]/5"
          />

          <p className="text-[10px] text-slate-400 text-center pt-2 leading-relaxed">
            You'll go to a secure checkout and return here when you're done.
          </p>
        </div>
      </div>
    </div>
  );
}

function GatewayOption({ onClick, logo, title, tagline, accent }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-4 p-4 rounded-2xl bg-white border-2 ${accent} cursor-pointer transition-all text-left`}
    >
      <div className="w-14 h-14 bg-slate-50 rounded-xl flex items-center justify-center shrink-0">
        {logo}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-black text-slate-900">{title}</p>
        <p className="text-[11px] text-slate-500 font-semibold mt-0.5 truncate">{tagline}</p>
      </div>
      <span className="text-slate-300 text-lg">›</span>
    </button>
  );
}

// Inline brand marks so we don't add image assets. Reasonable
// approximations of each gateway's wordmark in the correct brand colour.
function StripeLogo() {
  return (
    <svg viewBox="0 0 60 24" className="w-12 h-auto" aria-label="Stripe">
      <path
        fill="#635BFF"
        d="M59.5 14.34c0-4.27-2.07-7.64-6.02-7.64-3.96 0-6.36 3.37-6.36 7.6 0 5.02 2.83 7.56 6.89 7.56 1.98 0 3.48-.45 4.61-1.08v-3.37c-1.13.57-2.43.92-4.08.92-1.62 0-3.05-.57-3.23-2.54h8.14c.01-.22.05-1.1.05-1.45zm-8.23-1.58c0-1.89 1.15-2.67 2.21-2.67 1.02 0 2.11.78 2.11 2.67h-4.32zM39.27 6.7c-1.63 0-2.68.77-3.26 1.3l-.22-1.03h-3.66v19.43l4.16-.88.01-4.72c.6.43 1.49 1.05 2.95 1.05 2.99 0 5.71-2.4 5.71-7.7-.02-4.84-2.78-7.45-5.69-7.45zm-1 11.45c-.98 0-1.56-.35-1.96-.78l-.02-6.17c.43-.48 1.03-.81 1.98-.81 1.52 0 2.57 1.7 2.57 3.87 0 2.22-1.04 3.89-2.57 3.89zM30.95 5.74V2.34l-4.17.88V6.6l4.17-.86zm-4.17 1.24h4.17v14.66h-4.17V6.98zM23.85 8.18l-.27-1.2h-3.59v14.66h4.16V11.71c.98-1.28 2.64-1.05 3.15-.87V6.98c-.53-.19-2.47-.55-3.45 1.2zM15.34 3.34l-4.06.86-.02 13.32c0 2.46 1.85 4.28 4.31 4.28 1.36 0 2.36-.25 2.91-.55v-3.4c-.53.22-3.16 1-3.16-1.46v-5.94h3.16V6.98h-3.16l.02-3.64zM4.21 11.26c0-.65.53-.9 1.41-.9 1.26 0 2.85.38 4.11 1.06V7.49c-1.37-.55-2.73-.76-4.11-.76C2.24 6.73 0 8.49 0 11.43c0 4.59 6.31 3.86 6.31 5.83 0 .76-.66 1.01-1.59 1.01-1.37 0-3.13-.57-4.51-1.32v3.96c1.53.66 3.07.94 4.51.94 3.45 0 5.83-1.7 5.83-4.68 0-4.96-6.34-4.08-6.34-5.91z"
      />
    </svg>
  );
}

function RazorpayLogo() {
  return (
    <svg viewBox="0 0 90 24" className="w-12 h-auto" aria-label="Razorpay">
      <path fill="#3395FF" d="M22.1 0L14.4 18.4l4.6-9.3-9.3 1.8L7 24l15.1-3.2L29.9 1.7 22.1 0z" />
      <path
        fill="#0c2451"
        d="M37.1 9.4c1.6 0 2.8.5 3.5 1.3v-1h2.7v11h-2.7v-1c-.7.8-1.9 1.3-3.5 1.3-2.6 0-4.7-2.4-4.7-5.8 0-3.4 2.1-5.8 4.7-5.8zm.6 9.2c1.5 0 2.6-1 2.6-2.5v-1.7c0-1.5-1.1-2.5-2.6-2.5-1.7 0-2.7 1.4-2.7 3.4s1 3.3 2.7 3.3zm12.5-7.2v-2.7h-2.7v11h2.7v-5.9c0-1.4.9-2.4 2.2-2.4.5 0 1 .1 1.4.4V9.4c-1.5 0-2.9.7-3.6 2zm10.7-2c3.4 0 5.7 2.3 5.7 5.8 0 3.5-2.3 5.8-5.7 5.8s-5.7-2.3-5.7-5.8c0-3.5 2.3-5.8 5.7-5.8zm0 9.2c1.7 0 2.9-1.4 2.9-3.4s-1.2-3.4-2.9-3.4-2.9 1.4-2.9 3.4 1.2 3.4 2.9 3.4zm14.8-9.2c2.6 0 4.7 2.4 4.7 5.8s-2.1 5.8-4.7 5.8c-1.6 0-2.8-.5-3.5-1.3v5.3h-2.7V9.7h2.7v1c.7-.8 1.9-1.3 3.5-1.3zm-.6 9.2c1.7 0 2.7-1.4 2.7-3.4s-1-3.4-2.7-3.4c-1.5 0-2.6 1-2.6 2.5v1.7c0 1.6 1.1 2.6 2.6 2.6z"
      />
    </svg>
  );
}
