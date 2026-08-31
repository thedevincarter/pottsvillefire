import { Container, Title, Text } from "@mantine/core";
import { getMonthChecks, getCheckHistory, getAllApparatus, getAllCheckItems } from "@/lib/apparatus";
import { getOpenCheckMonths } from "@/lib/check-months";
import { currentMonthKey, nextMonthKey } from "@/lib/month";
import { ApparatusChecksList } from "./ApparatusChecksList";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Apparatus Checks | Pottsville Fire",
};

export default async function ApparatusChecksPage() {
  const currentMonth = currentMonthKey();
  const nextMonth = nextMonthKey(currentMonth);

  const [monthChecks, history, allApparatus, allCheckItems, openMonths] = await Promise.all([
    getMonthChecks(currentMonth),
    getCheckHistory(),
    getAllApparatus(),
    getAllCheckItems(),
    getOpenCheckMonths(),
  ]);

  // Next month's checklists only appear once an admin has opened them early.
  const nextMonthOpen = openMonths.find((m) => m.month === nextMonth) ?? null;
  const nextMonthChecks = nextMonthOpen ? await getMonthChecks(nextMonth) : [];

  return (
    <Container size="lg" pt="xl">
      <Title mb="xs">Apparatus Checks</Title>
      <Text c="dimmed" mb="xl">
        Monthly apparatus inspection checklists.
      </Text>
      <ApparatusChecksList
        currentMonth={currentMonth}
        monthChecks={monthChecks}
        nextMonth={nextMonth}
        nextMonthOpen={nextMonthOpen}
        nextMonthChecks={nextMonthChecks}
        history={history}
        allApparatus={allApparatus}
        allCheckItems={allCheckItems}
      />
    </Container>
  );
}
