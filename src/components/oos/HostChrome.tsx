import type { ReactNode } from "react";
import { HouseBar } from "./HouseBar";

/**
 * Shared chrome. Kept as a thin alias so every route renders the single-row
 * Northern Lantern House bar.
 */
export function HostChrome(props: {
  trailing?: ReactNode;
  showPrint?: boolean;
  onPrint?: () => void;
}) {
  return <HouseBar {...props} />;
}
