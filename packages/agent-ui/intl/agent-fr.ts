import { COMMON_UI_MESSAGES_FR } from "common-ui/lib";
import { AGENT_MESSAGES_ENGLISH } from "./agent-en";

export const AGENT_MESSAGES_FRENCH: Partial<typeof AGENT_MESSAGES_ENGLISH> = {
  ...COMMON_UI_MESSAGES_FR,
  appTitle: "Agents"
};
