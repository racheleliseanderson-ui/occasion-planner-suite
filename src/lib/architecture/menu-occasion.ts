/**
 * Compatibility surface. Canonical contract lives in ./contract.
 * Keep this path so older imports continue to resolve.
 */
export {
  MENU_OCCASION_HANDOFF_MESSAGE,
  MENU_OCCASION_HANDOFF_STATUS_MESSAGE,
  MENU_OCCASION_HANDOFF_VERSION,
  buildMenuOccasionHandoff,
  validateMenuOccasionHandoff,
  mapMenuOccasionHandoffToOccasionInput,
  guestBandFromCount,
  type HandoffPacket,
} from "./contract";
