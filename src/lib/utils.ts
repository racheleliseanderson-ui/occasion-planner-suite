import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function aisleLabel(aisle: string): string {
  const map: Record<string, string> = {
    produce: "Produce",
    protein: "Butcher / protein",
    "dairy-eggs": "Dairy & eggs",
    deli: "Deli",
    bakery: "Bakery",
    pantry: "Pantry",
    spices: "Spices",
    frozen: "Frozen",
    beverages: "Beverages",
    other: "Other",
  };
  return map[aisle] || aisle;
}

export function downloadText(filename: string, body: string, type = "text/plain") {
  const blob = new Blob([body], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
