import { Container, Title, Text } from "@mantine/core";
import { ApplyForm } from "./ApplyForm";

export const metadata = {
  title: "Apply | Pottsville Fire",
  description: "Apply to join the Pottsville Fire Department",
};

export default function ApplyPage() {
  return (
    <Container size="md" py="xl">
      <Title mb="xs">Apply</Title>
      <Text c="dimmed" mb="xl">
        Fill out the form below and we&apos;ll be in touch.
      </Text>
      <ApplyForm />
    </Container>
  );
}
