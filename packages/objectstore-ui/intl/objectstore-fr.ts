import { COMMON_UI_MESSAGES_FR } from "common-ui";
import { OBJECTSTORE_MESSAGES_ENGLISH } from "./objectstore-en";

export const OBJECTSTORE_MESSAGES_FRENCH: Partial<
  typeof OBJECTSTORE_MESSAGES_ENGLISH
> = {
  ...COMMON_UI_MESSAGES_FR,
  appTitle: "Object Store (fr)"
};
