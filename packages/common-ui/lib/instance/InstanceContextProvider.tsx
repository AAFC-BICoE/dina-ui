import { ReactNode, createContext, useEffect, useState } from "react";
import { useApiClient } from "../api-client/ApiClientContext";

export interface InstanceContextI {
  supportedLanguages: string;
  instanceMode: string;
  instanceName: string;
}

export const InstanceContext = createContext<InstanceContextI | undefined>(
  undefined
);

export const InstanceContextProvider = InstanceContext.Provider;

export function DefaultInstanceContextProvider({
  children
}: {
  children: ReactNode;
}) {
  const { apiClient } = useApiClient();
  const [instanceJson, setInstanceJson] = useState<InstanceContextI>();

  useEffect(() => {
    const getInstanceJSON = async () => {
      try {
        const response = await apiClient.get("/instance.json", {});
        if (response) {
          setInstanceJson({
            supportedLanguages: !!response["supported-languages-iso"]
              ? response["supported-languages-iso"]
              : "en",
            instanceMode: !!response["instance-mode"]
              ? response["instance-mode"]
              : "developer",
            instanceName: !!response["instance-name"]
              ? response["instance-name"]
              : "AAFC"
          });
        } else {
          setInstanceJson({
            supportedLanguages: "en",
            instanceMode: "developer",
            instanceName: "AAFC"
          });
        }
      } catch (error) {
        console.error(error);
      }
    };
    getInstanceJSON();
  }, []);
  return (
    <InstanceContext.Provider value={instanceJson}>
      {children}
    </InstanceContext.Provider>
  );
}
