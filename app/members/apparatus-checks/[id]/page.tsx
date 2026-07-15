import { notFound } from "next/navigation";
import { Container } from "@mantine/core";
import { getCheck } from "@/lib/apparatus";
import { CheckForm } from "./CheckForm";

export const dynamic = "force-dynamic";

export default async function ApparatusCheckPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const check = await getCheck(id);

  if (!check) {
    notFound();
  }

  return (
    <Container size="sm" pt="xl" pb="xl">
      <CheckForm check={check} />
    </Container>
  );
}
