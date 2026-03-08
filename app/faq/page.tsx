import { Container, Title } from "@mantine/core";
import { FAQAccordion } from "./FAQAccordion";

export const metadata = {
  title: "FAQ | Pottsville Fire",
  description: "Frequently asked questions for the Pottsville Fire Department",
};

export default function FAQPage() {
  return (
    <Container size="sm" py="xl">
      <Title mb="xl">Frequently Asked Questions</Title>
      <FAQAccordion />
    </Container>
  );
}
