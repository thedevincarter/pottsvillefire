import { notFound } from "next/navigation";
import { Container } from "@mantine/core";
import { AdminRoute } from "@/app/components/auth/AdminRoute";
import { getCheck } from "@/lib/apparatus";
import { CheckPrintView } from "./CheckPrintView";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Print Apparatus Check | Pottsville Fire",
};

export default async function ApparatusCheckPrintPage({
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
    <AdminRoute>
      <Container size="md" pt="xl" pb="xl">
        <CheckPrintView check={check} />
      </Container>
    </AdminRoute>
  );
}
