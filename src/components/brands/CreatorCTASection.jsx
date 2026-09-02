import { MessageCircle, Instagram, Hash } from "lucide-react";
import { useTranslations } from "next-intl";

// Public-facing contact targets. wa.me uses E.164 without the leading +.
const WHATSAPP_URL = "https://wa.me/918802907907";
const INSTAGRAM_URL = "https://www.instagram.com/rgossips.agency/";

export function CreatorCTASection() {
  const t = useTranslations("BrandsCreatorCTASection");
  return (
    <>
      <section className="w-full px-4 lg:px-6 text-center lg:hidden pb-20">
        <h2 className="text-xl font-black bg-gradient-to-r from-[#6A66C9] to-[#9B5FC4] bg-clip-text text-transparent">
          {t("heading")}
        </h2>

        <p className="text-sm text-[#6B6785] mt-2">
          {t("subheading")}
        </p>

        <div className="mt-8 flex flex-col gap-4">
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-green-500 text-white font-medium py-3 rounded-full hover:bg-green-600 transition cursor-pointer"
          >
            <MessageCircle size={18} />
            {t("talkToUs")}
          </a>

          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 border border-gray-300 text-gray-700 py-3 rounded-full hover:bg-gray-50 transition cursor-pointer"
          >
            <Instagram size={18} />
            {t("followUs")}
          </a>
        </div>

        <div className="mt-10 flex flex-col items-center text-[#9C97B8] text-xs gap-2">
          <div className="flex items-center gap-2">
            <Hash size={14} />
            <span>Recentgossips</span>
          </div>

          <p>{t("copyright")}</p>
        </div>
      </section>

      <div className="w-full max-w-5xl mx-auto p-4 pb-20 hidden lg:block">
        {/* Main Container */}
        {/* Closing band — the reference: navy #131E45, a gradient hairline along
            the top, a soft radial wash, heading left and two buttons right. */}
        <div className="relative flex flex-wrap items-center justify-between gap-8 overflow-hidden rounded-[26px] bg-[#131E45] px-6 py-9 text-white lg:px-[42px]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-[30%]"
            style={{
              background:
                "radial-gradient(40% 70% at 88% 20%, rgba(70,103,174,.75), transparent 70%), radial-gradient(40% 70% at 12% 90%, rgba(31,80,143,.6), transparent 70%)",
            }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-[3px]"
            style={{ background: "var(--bx-grad)" }}
          />

          <div className="relative min-w-0">
            <h2 className="m-0 text-[29px] font-bold leading-tight tracking-[-0.9px]">
              {t("heading")}
            </h2>
            <p className="mt-[7px] text-[13.5px] text-white/[.72]">{t("subheading")}</p>
          </div>

          <div className="relative flex flex-wrap items-center gap-3">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl px-[22px] py-3.5 text-[13.5px] font-semibold text-white shadow-[0_10px_24px_rgba(79,121,198,.4)] transition hover:brightness-110"
              style={{ background: "var(--bx-grad)" }}
            >
              <MessageCircle size={17} />
              {t("whatsappUs")}
            </a>

            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/35 bg-transparent px-[22px] py-3.5 text-[13.5px] font-semibold text-white transition hover:bg-white/[.12]"
            >
              <Instagram size={17} />
              {t("followUsButton")}
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
