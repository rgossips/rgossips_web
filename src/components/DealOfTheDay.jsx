import { useTranslations } from "next-intl";
import { Button } from "./ui/button";

const DealOfTheDay = () => {
  const t = useTranslations("DealOfTheDay");
  return (
    <div className="relative rounded-[40px] overflow-hidden shadow-xl group cursor-pointer">
      <img
        src="/assets/home/hero-travel.jpg"
        className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110"
        alt="Deal"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
        <div className="text-white">
          <h3 className="text-lg font-bold">{t("title")}</h3>
          <p className="text-xs opacity-80">{t("validTill")}</p>
        </div>
        <Button className="bg-white text-black hover:bg-slate-100 rounded-full font-bold px-6">
          {t("viewDeal")}
        </Button>
      </div>
    </div>
  );
};

export default DealOfTheDay;
