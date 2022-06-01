import { NextApiHandler } from "next";

/** Provide the Keycloak config to the front-end code */
const keycloakJson: NextApiHandler = (_req, res) => {
  res.status(200).json({
    resource: process.env.KEYCLOAK_CLIENTID,
    realm: process.env.KEYCLOAK_REALM,
    "auth-server-url": process.env.KEYCLOAK_PUBLIC_URL
  });
};

export default keycloakJson;
