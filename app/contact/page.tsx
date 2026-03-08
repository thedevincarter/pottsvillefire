import { Anchor, Container, Stack, Text, Title } from "@mantine/core";

export const metadata = {
  title: "Contact | Pottsville Fire",
  description: "Contact the Pottsville Fire Department",
};

export default function ContactPage() {
  return (
    <Container size="xs" py="xl">
      <Title mb="xl">Contact Us</Title>

      <Stack gap="xl">
        <Stack gap={4}>
          <Text fw={600}>Phone</Text>
          <Anchor href="tel:4795186933" c="red.9">
            479-518-6933
          </Anchor>
        </Stack>

        <Stack gap={4}>
          <Text fw={600}>Address</Text>
          <Text>Central Fire Station</Text>
          <Text>80 2nd Street</Text>
          <Text>Pottsville, AR 72858</Text>
          <Text>United States</Text>
          <Anchor
            href="https://www.google.com/maps/search/?api=1&query=80+2nd+Street+Pottsville+AR+72858"
            target="_blank"
            rel="noopener noreferrer"
            c="red.9"
            mt={4}
          >
            See map: Google Maps
          </Anchor>
        </Stack>
      </Stack>
    </Container>
  );
}
