"use client";

import React from "react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";

// Reusable payment gateway picker. Used by the pricing page (subscription
// upgrades) and the service-orders page (advance + final payments).
// Caller supplies a title/subtitle pair and an onPick(gateway) callback;
// gateway is one of "razorpay" | "stripe".
export default function GatewayPickerModal({ title, subtitle, onCancel, onPick }) {
  const t = useTranslations("GatewayPickerModal");
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
            aria-label={t("closeLabel")}
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
            tagline={t("razorpay.tagline")}
            accent="border-[#0c2451]/15 hover:border-[#0c2451]/40 hover:bg-[#0c2451]/5"
          />
          <GatewayOption
            onClick={() => onPick("stripe")}
            logo={<StripeLogo />}
            title="Stripe"
            tagline={t("stripe.tagline")}
            accent="border-[#635BFF]/15 hover:border-[#635BFF]/40 hover:bg-[#635BFF]/5"
          />

          <p className="text-[10px] text-slate-400 text-center pt-2 leading-relaxed">
            {t("secureCheckoutNote")}
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

// Official Razorpay wordmark — inlined from
// https://accounts.razorpay.com/assets/razorpay/logo-light.svg
// (mirrored into the bundle rather than fetched at runtime so the
// modal never depends on Razorpay's CDN being reachable).
function RazorpayLogo() {
  return (
    <svg viewBox="0 0 1896 401" fill="#072654" className="w-12 h-auto" aria-label="Razorpay" xmlns="http://www.w3.org/2000/svg">
      <path fill="#3395FF" d="M122.63 105.7l-15.75 57.97 90.15-58.3-58.96 219.98 59.88.05L285.05.48" />
      <path d="M25.6 232.92L.8 325.4h122.73l50.22-188.13L25.6 232.92m426.32-81.42c-3 11.15-8.78 19.34-17.4 24.57-8.6 5.22-20.67 7.84-36.25 7.84h-49.5l17.38-64.8h49.5c15.56 0 26.25 2.6 32.05 7.9 5.8 5.3 7.2 13.4 4.22 24.6m51.25-1.4c6.3-23.4 3.7-41.4-7.82-54-11.5-12.5-31.68-18.8-60.48-18.8H324.4l-66.5 248.1h53.67l26.8-100h35.2c7.9 0 14.12 1.3 18.66 3.8 4.55 2.6 7.22 7.1 8.04 13.6l9.58 82.6h57.5l-9.32-77c-1.9-17.2-9.77-27.3-23.6-30.3 17.63-5.1 32.4-13.6 44.3-25.4a92.6 92.6 0 0 0 24.44-42.5m130.46 86.4c-4.5 16.8-11.4 29.5-20.73 38.4-9.34 8.9-20.5 13.3-33.52 13.3-13.26 0-22.25-4.3-27-13-4.76-8.7-4.92-21.3-.5-37.8 4.42-16.5 11.47-29.4 21.17-38.7 9.7-9.3 21.04-13.95 34.06-13.95 13 0 21.9 4.5 26.4 13.43 4.6 8.97 4.7 21.8.2 38.5zm23.52-87.8l-6.72 25.1c-2.9-9-8.53-16.2-16.85-21.6-8.34-5.3-18.66-8-30.97-8-15.1 0-29.6 3.9-43.5 11.7-13.9 7.8-26.1 18.8-36.5 33-10.4 14.2-18 30.3-22.9 48.4-4.8 18.2-5.8 34.1-2.9 47.9 3 13.9 9.3 24.5 19 31.9 9.8 7.5 22.3 11.2 37.6 11.2a82.4 82.4 0 0 0 35.2-7.7 82.11 82.11 0 0 0 28.4-21.2l-7 26.16h51.9L709.3 149h-52zm238.65 0H744.87l-10.55 39.4h87.82l-116.1 100.3-9.92 37h155.8l10.55-39.4h-94.1l117.88-101.8m142.4 52c-4.67 17.4-11.6 30.48-20.75 39-9.15 8.6-20.23 12.9-33.24 12.9-27.2 0-36.14-17.3-26.86-51.9 4.6-17.2 11.56-30.13 20.86-38.84 9.3-8.74 20.57-13.1 33.82-13.1 13 0 21.78 4.33 26.3 13.05 4.52 8.7 4.48 21.67-.13 38.87m30.38-80.83c-11.95-7.44-27.2-11.16-45.8-11.16-18.83 0-36.26 3.7-52.3 11.1a113.09 113.09 0 0 0-41 32.06c-11.3 13.9-19.43 30.2-24.42 48.8-4.9 18.53-5.5 34.8-1.7 48.73 3.8 13.9 11.8 24.6 23.8 32 12.1 7.46 27.5 11.17 46.4 11.17 18.6 0 35.9-3.74 51.8-11.18 15.9-7.48 29.5-18.1 40.8-32.1 11.3-13.94 19.4-30.2 24.4-48.8 5-18.6 5.6-34.84 1.8-48.8-3.8-13.9-11.7-24.6-23.6-32.05m185.1 40.8l13.3-48.1c-4.5-2.3-10.4-3.5-17.8-3.5-11.9 0-23.3 2.94-34.3 8.9-9.46 5.06-17.5 12.2-24.3 21.14l6.9-25.9-15.07.06h-37l-47.7 176.7h52.63l24.75-92.37c3.6-13.43 10.08-24 19.43-31.5 9.3-7.53 20.9-11.3 34.9-11.3 8.6 0 16.6 1.97 24.2 5.9m146.5 41.1c-4.5 16.5-11.3 29.1-20.6 37.8-9.3 8.74-20.5 13.1-33.5 13.1s-21.9-4.4-26.6-13.2c-4.8-8.85-4.9-21.6-.4-38.36 4.5-16.75 11.4-29.6 20.9-38.5 9.5-8.97 20.7-13.45 33.7-13.45 12.8 0 21.4 4.6 26 13.9 4.6 9.3 4.7 22.2.28 38.7m36.8-81.4c-9.75-7.8-22.2-11.7-37.3-11.7-13.23 0-25.84 3-37.8 9.06-11.95 6.05-21.65 14.3-29.1 24.74l.18-1.2 8.83-28.1h-51.4l-13.1 48.9-.4 1.7-54 201.44h52.7l27.2-101.4c2.7 9.02 8.2 16.1 16.6 21.22 8.4 5.1 18.77 7.63 31.1 7.63 15.3 0 29.9-3.7 43.75-11.1 13.9-7.42 25.9-18.1 36.1-31.9 10.2-13.8 17.77-29.8 22.6-47.9 4.9-18.13 5.9-34.3 3.1-48.45-2.85-14.17-9.16-25.14-18.9-32.9m174.65 80.65c-4.5 16.7-11.4 29.5-20.7 38.3-9.3 8.86-20.5 13.27-33.5 13.27-13.3 0-22.3-4.3-27-13-4.8-8.7-4.9-21.3-.5-37.8 4.4-16.5 11.42-29.4 21.12-38.7 9.7-9.3 21.05-13.94 34.07-13.94 13 0 21.8 4.5 26.4 13.4 4.6 8.93 4.63 21.76.15 38.5zm23.5-87.85l-6.73 25.1c-2.9-9.05-8.5-16.25-16.8-21.6-8.4-5.34-18.7-8-31-8-15.1 0-29.68 3.9-43.6 11.7-13.9 7.8-26.1 18.74-36.5 32.9-10.4 14.16-18 30.3-22.9 48.4-4.85 18.17-5.8 34.1-2.9 47.96 2.93 13.8 9.24 24.46 19 31.9 9.74 7.4 22.3 11.14 37.6 11.14 12.3 0 24.05-2.56 35.2-7.7a82.3 82.3 0 0 0 28.33-21.23l-7 26.18h51.9l47.38-176.7h-51.9zm269.87.06l.03-.05h-31.9c-1.02 0-1.92.05-2.85.07h-16.55l-8.5 11.8-2.1 2.8-.9 1.4-67.25 93.68-13.9-109.7h-55.08l27.9 166.7-61.6 85.3h54.9l14.9-21.13c.42-.62.8-1.14 1.3-1.8l17.4-24.7.5-.7 77.93-110.5 65.7-93 .1-.06h-.03z" />
    </svg>
  );
}

