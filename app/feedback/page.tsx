import { Container, Title, Text } from "@mantine/core";
import { FeedbackForm } from "./FeedbackForm";

export const metadata = {
  title: "Feedback | Pottsville Fire",
  description: "Submit feedback to the Pottsville Fire Department",
};

export default function FeedbackPage() {
  return (
    <Container size="xs" py="xl">
      <Title mb="xs">Feedback</Title>
      <Text c="dimmed" mb="xl">
        We&apos;d love to hear from you.
      </Text>
      <FeedbackForm />
    </Container>
  );
}
