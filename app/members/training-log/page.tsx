import { Container, Title, Text } from "@mantine/core";
import { getTrainings, getTrainingFormOptions } from "@/lib/trainings";
import { TrainingLogTable } from "./TrainingLogTable";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Training Log | Pottsville Fire",
};

export default async function TrainingLogPage() {
  const [trainings, formOptions] = await Promise.all([
    getTrainings(),
    getTrainingFormOptions(),
  ]);

  return (
    <Container size="lg" pt="xl">
      <Title mb="xs">Training Log</Title>
      <Text c="dimmed" mb="xl">
        Training sessions and attendance records.
      </Text>
      <TrainingLogTable initialTrainings={trainings} formOptions={formOptions} />
    </Container>
  );
}
