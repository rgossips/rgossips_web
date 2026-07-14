import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { useTranslations } from "next-intl";

export default function ItineraryAccordion() {
  const t = useTranslations("ItenaryAccordian");
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">{t("heading")}</h2>

      <Accordion type="single" collapsible>
        <AccordionItem value="day1">
          <AccordionTrigger>{t("day1.title")}</AccordionTrigger>
          <AccordionContent>
            {t("day1.body")}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="day2">
          <AccordionTrigger>{t("day2.title")}</AccordionTrigger>
          <AccordionContent>
            {t("day2.body")}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="day3">
          <AccordionTrigger>{t("day3.title")}</AccordionTrigger>
          <AccordionContent>
            {t("day3.body")}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="day4">
          <AccordionTrigger>{t("day4.title")}</AccordionTrigger>
          <AccordionContent>
            {t("day4.body")}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="day5">
          <AccordionTrigger>{t("day5.title")}</AccordionTrigger>
          <AccordionContent>
            {t("day5.body")}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="day6">
          <AccordionTrigger>{t("day6.title")}</AccordionTrigger>
          <AccordionContent>
            {t("day6.body")}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="day7">
          <AccordionTrigger>{t("day7.title")}</AccordionTrigger>
          <AccordionContent>
            {t("day7.body")}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
