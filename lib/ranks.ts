// Client-safe rank constants. Rank lives on profiles.rank as free text; these
// are the canonical values the admin user manager writes.
export const RANKS = [
  "Chief",
  "Assistant Chief",
  "Captain",
  "Lieutenant",
  "Firefighter",
  "Proby",
] as const;

// Officers — every rank above firefighter. They can triage maintenance
// requests (change status, reassign) just like admins can.
export const OFFICER_RANKS: string[] = [
  "Chief",
  "Assistant Chief",
  "Captain",
  "Lieutenant",
];

export function isOfficerRank(rank: string | null | undefined): boolean {
  return !!rank && OFFICER_RANKS.includes(rank);
}
