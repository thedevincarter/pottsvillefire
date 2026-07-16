import { Container, Title } from "@mantine/core";
import { getChartData } from "@/lib/runs";
import { ChartsView } from "./ChartsView";

export const dynamic = "force-dynamic";

export default async function ChartsPage() {
  const data = await getChartData();

  return (
    <Container size="md" pt="xl" pb="xl">
      <Title mb="lg">Analytics</Title>
      <ChartsView data={data} />
    </Container>
  );
}
