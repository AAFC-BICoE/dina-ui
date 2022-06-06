const isServer = typeof window === "undefined";

const Keycloak = isServer ? null : require("keycloak-js").default;

export const keycloakClient: typeof Keycloak | undefined = isServer
  ? undefined
  : Keycloak("/keycloak.json");
