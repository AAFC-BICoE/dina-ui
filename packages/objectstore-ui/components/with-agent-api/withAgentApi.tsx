import { AuthenticatedApiClientProvider, createContextValue } from "common-ui";
import { ComponentType } from "react";

/** Get Random UUID */
function uuidv4(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, char => {
    const randomNumber = Math.floor(Math.random() * 16);
    // tslint:disable-next-line: no-bitwise
    const v = char === "x" ? randomNumber : (randomNumber & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function withAgentApi<T>(Component: ComponentType<T>) {
  const ctx = createContextValue({
    baseURL: "/agent-api/v1",
    getTempIdGenerator: () => uuidv4
  });

  return function AgentApiContext(props: T) {
    return (
      <AuthenticatedApiClientProvider apiContext={ctx}>
        <Component {...props} />
      </AuthenticatedApiClientProvider>
    );
  };
}
