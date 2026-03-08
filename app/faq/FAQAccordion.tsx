"use client";

import { Accordion } from "@mantine/core";

const faqs = [
  {
    question:
      "I do not live in Pottsville, why did I get a post card for fire dues?",
    answer:
      "The post card reminders are generated from the tax records of Pope County. If you notice on the address label above your name there is a number, that is a parcel number. If you are unsure about why you received a card, you can call the Pope County Assessors office at 479-968-7418 and they can give you the information on that parcel.",
  },
  {
    question: "I did not get a card in the mail, do I still pay fire dues?",
    answer:
      "Yes. If you are in the Pottsville fire district you can still mail a payment, or come to City Hall to pay fire dues without a post card. (cash or check)",
  },
  {
    question: "Where do I pay my Pottsville Fire Dues?",
    answer:
      "You can mail those payments to Pottsville City Hall 173 E Ash St Pottsville AR 72858.",
  },
];

export function FAQAccordion() {
  return (
    <Accordion variant="separated" multiple>
      {faqs.map((faq, i) => (
        <Accordion.Item key={i} value={String(i)}>
          <Accordion.Control>{faq.question}</Accordion.Control>
          <Accordion.Panel>{faq.answer}</Accordion.Panel>
        </Accordion.Item>
      ))}
    </Accordion>
  );
}
