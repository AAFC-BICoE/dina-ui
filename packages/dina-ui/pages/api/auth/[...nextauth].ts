import NextAuth from "next-auth";
import KeycloakProvider from "next-auth/providers/keycloak";

export default NextAuth({
  providers: [
    KeycloakProvider({
      clientId: "objectstore",
      clientSecret: "",
      issuer: "http://keycloak.local:8080/realms/dina/"
    })
  ]
});