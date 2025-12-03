import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

export default function ItineraryAccordion() {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Itinerary</h2>

      <Accordion type="single" collapsible>
        <AccordionItem value="day1">
          <AccordionTrigger>Day 1 – Arrival in Jim Corbett</AccordionTrigger>
          <AccordionContent>
            Arrive at Jim Corbett. Check into the resort. Enjoy welcome drinks,
            explore the property, and relax near the pool or river.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="day2">
          <AccordionTrigger>Day 2 – Jungle Safari</AccordionTrigger>
          <AccordionContent>
            Early morning jeep safari inside Jim Corbett National Park. Spot
            tigers, elephants, and birds. Afternoon local sightseeing and river
            walk.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="day3">
          <AccordionTrigger>Day 3 – Transfer to Nainital</AccordionTrigger>
          <AccordionContent>
            After breakfast, drive to Nainital. Visit Hanuman Garhi, Eco Cave
            Gardens, and enjoy a peaceful evening walk at Mall Road.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="day4">
          <AccordionTrigger>Day 4 – Nainital Lake Tour</AccordionTrigger>
          <AccordionContent>
            Visit Naini Lake, Bhimtal, Sattal, and Naukuchiatal. Enjoy boating,
            photos, and café visits. Perfect day for exploring lakes.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="day5">
          <AccordionTrigger>Day 5 – Transfer to Rishikesh</AccordionTrigger>
          <AccordionContent>
            Drive to Rishikesh. Visit Ram Jhula, Laxman Jhula, Beatles Ashram.
            Enjoy café hopping and Ganga ghats.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="day6">
          <AccordionTrigger>Day 6 – Adventure Activities</AccordionTrigger>
          <AccordionContent>
            Enjoy river rafting, bungee jumping, ziplining or cliff jumping
            depending on your preference. Evening Ganga Aarti at Triveni Ghat.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="day7">
          <AccordionTrigger>Day 7 – Departure</AccordionTrigger>
          <AccordionContent>
            Enjoy breakfast at the hotel. Check out and depart with beautiful
            memories of Uttarakhand.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
