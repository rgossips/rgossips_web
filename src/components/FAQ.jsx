"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "How does the platform work?",
    answer:
      "Our platform connects creators and brands through smart tools that streamline partnerships, content delivery, and real-time performance insights.",
  },
  {
    question: "Is there any subscription fee?",
    answer:
      "The platform is free to use. We may introduce premium features later, but the core experience will always remain accessible.",
  },
  {
    question: "How do I collaborate with influencers?",
    answer:
      "Explore influencer profiles, view detailed analytics, and send collaboration requests directly from their dashboard.",
  },
  {
    question: "Can I track the performance of my campaigns?",
    answer:
      "Absolutely! You get a live analytics dashboard with reach, engagement, conversion metrics, and more to measure performance.",
  },
];

export default function FaqSection() {
  return (
    <section className="w-full bg-white py-24 px-8">
      {/* Heading */}
      <div className="max-w-5xl mx-auto text-center mb-20">
        <h2 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight">
          Frequently Asked{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-600">
            Questions
          </span>
        </h2>
        <p className="text-gray-600 mt-6 text-lg md:text-xl max-w-3xl mx-auto">
          Everything you need to know about our platform and how it helps you
          grow.
        </p>
      </div>

      {/* FAQ Accordion */}
      <div className="max-w-[80%] mx-auto">
        <Accordion type="single" collapsible className="w-full space-y-8">
          {faqs.map((item, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="border-b border-gray-300 pb-6"
            >
              <AccordionTrigger className="text-xl md:text-2xl font-semibold text-gray-900 py-2 cursor-pointer">
                {item.question}
              </AccordionTrigger>

              <AccordionContent className="text-gray-600 text-lg md:text-xl leading-relaxed">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
