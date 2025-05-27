import { ReactNode, createContext, useEffect, useState } from "react";
import { useApiClient } from "../api-client/ApiClientContext";

export interface InstanceContextI {
  supportedLanguages: string;
  instanceMode: string;
  instanceName: string;
  supportedGeographicReferences: string;
  tgnSearchBaseUrl?: string;
  scientificNamesSearchEndpoint?: string;
  scientificNamesDatasetsEndpoint?: string;
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
              : "AAFC",
            supportedGeographicReferences: !!response[
              "supported-geographic-references"
            ]
              ? response["supported-geographic-references"]
              : "OSM",
            tgnSearchBaseUrl: !!response["tgn-search-base-url"]
              ? response["tgn-search-base-url"]
              : "",
            scientificNamesSearchEndpoint: !!response[
              "scientific-names-search-endpoint"
            ]
              ? response["scientific-names-search-endpoint"]
              : "https://verifier.globalnames.org/api/v1/verifications/",
            scientificNamesDatasetsEndpoint: !!response[
              "scientific-names-datasets-endpoint"
            ]
              ? response["scientific-names-datasets-endpoint"]
              : "https://verifier.globalnames.org/api/v1/data_sources"
          });
        } else {
          setInstanceJson({
            supportedLanguages: "en",
            instanceMode: "developer",
            instanceName: "AAFC",
            supportedGeographicReferences: "OSM",
            tgnSearchBaseUrl: ""
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
