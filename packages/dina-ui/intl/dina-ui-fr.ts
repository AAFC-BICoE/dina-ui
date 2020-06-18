import { COMMON_UI_MESSAGES_FR } from "common-ui";
import { DINAUI_MESSAGES_ENGLISH } from "./dina-ui-en";

export const DINAUI_MESSAGES_FRENCH: Partial<typeof DINAUI_MESSAGES_ENGLISH> = {
  ...COMMON_UI_MESSAGES_FR,
  appTitle: "DINA (fr)"
};
