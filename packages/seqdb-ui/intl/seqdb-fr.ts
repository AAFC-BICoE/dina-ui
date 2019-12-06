import { COMMON_UI_MESSAGES_FR } from "common-ui";
import { SEQDB_MESSAGES_ENGLISH } from "./seqdb-en";

/**
 * French translation of SeqDB English messages
 */
export const SEQDB_MESSAGES_FRENCH: Partial<typeof SEQDB_MESSAGES_ENGLISH> = {
  ...COMMON_UI_MESSAGES_FR,
  appTitle: "Sequence Database (fr)"
};
