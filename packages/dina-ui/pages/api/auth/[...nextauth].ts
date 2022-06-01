import NextAuth from "next-auth";
import KeycloakProvider from "next-auth/providers/keycloak";

export default NextAuth({
  providers: [
    KeycloakProvider({
      issuer: "https://keycloak.dina.local/realms/dina",
      clientId: "objectstore",
      clientSecret: ""
    })
  ],
  secret: "test"
});