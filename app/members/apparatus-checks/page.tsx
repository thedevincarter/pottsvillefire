import { Container, Title, Text } from "@mantine/core";
import { getMonthChecks, getCheckHistory, getApparatus, getAllApparatus, getAllCheckItems } from "@/lib/apparatus";
import { ApparatusChecksList } from "./ApparatusChecksList";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Apparatus Checks | Pottsville Fire",
};

function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default async function ApparatusChecksPage() {
  const currentMonth = getCurrentMonth();
  const [monthChecks, history, allApparatus, allCheckItems] = await Promise.all([
    getMonthChecks(currentMonth),
    getCheckHistory(),
    getAllApparatus(),
    getAllCheckItems(),
  ]);

  return (
    <Container size="lg" pt="xl">
      <Title mb="xs">Apparatus Checks</Title>
      <Text c="dimmed" mb="xl">
        Monthly apparatus inspection checklists.
      </Text>
      <ApparatusChecksList
        currentMonth={currentMonth}
        monthChecks={monthChecks}
        history={history}
        allApparatus={allApparatus}
        allCheckItems={allCheckItems}
      />
    </Container>
  );
}
