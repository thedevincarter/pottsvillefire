// Fixed set of stations. Stored as the `value`, displayed as the `label`.
export const STATIONS = [
  { value: "central", label: "Central" },
  { value: "station_2", label: "Station 2" },
];

export function stationLabel(value: string | null): string {
  if (!value) return "";
  return STATIONS.find((s) => s.value === value)?.label ?? value;
}
