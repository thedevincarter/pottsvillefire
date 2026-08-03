import type { CheckResult } from "./apparatus";

export type CheckResultGroup = {
  key: string;
  header: string | null;
  items: CheckResult[];
};

// Results arrive ordered with each header's subitems directly after it, so
// grouping consecutive runs by parent is enough to rebuild the sections.
// Kept out of lib/apparatus.ts so client components can use it without
// pulling the service-role Supabase client into the browser bundle.
export function groupResults(results: CheckResult[]): CheckResultGroup[] {
  const groups: CheckResultGroup[] = [];
  for (const result of results) {
    const last = groups[groups.length - 1];
    if (last && last.key === (result.parentId ?? "__top")) {
      last.items.push(result);
    } else {
      groups.push({
        key: result.parentId ?? "__top",
        header: result.parentId ? result.parentLabel : null,
        items: [result],
      });
    }
  }
  return groups;
}
