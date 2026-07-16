import { Container, Loader, Stack } from "@mantine/core";

export default function MembersLoading() {
  return (
    <Container size="sm" pt="xl">
      <Stack align="center" py="xl">
        <Loader color="red" />
      </Stack>
    </Container>
  );
}
