import { KeycloakInstance } from "keycloak-js";

const Keycloak = typeof window === "undefined" ? null : require("keycloak-js");

export const keycloakClient: KeycloakInstance | undefined =
  typeof window === "undefined" ? undefined : Keycloak("/keycloak.json");
