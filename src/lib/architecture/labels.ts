export function titleCase(value: string | undefined | null): string {
  return String(value ?? "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function scoreBand(score: number): "strong" | "workable" | "fragile" {
  if (score >= 80) return "strong";
  if (score >= 60) return "workable";
  return "fragile";
}

export function dimensionLabel(key: string): string {
  const map: Record<string, string> = {
    balance: "Balance",
    makeAhead: "Make Ahead",
    serviceFit: "Service Fit",
    equipmentFit: "Equipment Fit",
    hostFreedom: "Host Freedom",
  };
  return map[key] || titleCase(key);
}

export function roleLabel(role: string): string {
  const map: Record<string, string> = {
    welcome: "Welcome",
    anchor: "Anchor",
    contrast: "Contrast",
    relief: "Relief",
    finish: "Finish",
  };
  return map[role] || titleCase(role);
}
