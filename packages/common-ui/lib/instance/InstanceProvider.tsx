import { ReactNode, createContext, useEffect, useState } from "react";
import { useApiClient } from "../api-client/ApiClientContext";

export interface InstanceContextI {
  supportedLanguages: string;
  instanceMode: string;
}

export const InstanceContext = createContext<InstanceContextI | undefined>(undefined);

export function InstanceProvider({ children }: { children: ReactNode }) {
  const { apiClient } = useApiClient();
  const [instanceJson, setInstanceJson] = useState<InstanceContextI>();

  useEffect(() => {
    const getInstanceJSON = async () => {
      try {
        const response = await apiClient.axios.get(`/instance.json`);
        if (response?.data) {
          setInstanceJson({
            supportedLanguages:
              response.data["supported-languages-iso"] ?? "en",
            instanceMode: response.data["instance-mode"] ?? "developer"
          });
        } else {
          setInstanceJson({
            supportedLanguages: "en",
            instanceMode: "developer"
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
