import { ReactNode, createContext, useEffect, useState } from "react";
import { useApiClient } from "../api-client/ApiClientContext";

// All the supported values from the Caddyfile.
const INSTANCE_CONFIG_MAP = {
  supportedLanguages: {
    apiField: "supported-languages-iso",
    defaultValue: "en"
  },
  instanceMode: {
    apiField: "instance-mode",
    defaultValue: "developer"
  },
  instanceName: {
    apiField: "instance-name",
    defaultValue: "AAFC"
  },
  instanceBannerColor: {
    apiField: "instance-banner-color",
    defaultValue: "#38414d"
  },
  supportedGeographicReferences: {
    apiField: "supported-geographic-references",
    defaultValue: "OSM"
  },
  tgnSearchBaseUrl: {
    apiField: "tgn-search-base-url",
    defaultValue: ""
  },
  scientificNamesSearchEndpoint: {
    apiField: "scientific-names-search-endpoint",
    defaultValue: "https://verifier.globalnames.org/api/v1/verifications/"
  },
  scientificNamesDatasetsEndpoint: {
    apiField: "scientific-names-datasets-endpoint",
    defaultValue: "https://verifier.globalnames.org/api/v1/data_sources"
  }
};

export type InstanceContextValue = {
  [K in keyof typeof INSTANCE_CONFIG_MAP]: string;
};

const DEFAULT_INSTANCE_CONFIG = Object.entries(INSTANCE_CONFIG_MAP).reduce(
  (acc, [key, { defaultValue }]) => {
    acc[key as keyof InstanceContextValue] = defaultValue;
    return acc;
  },
  {} as InstanceContextValue
);

export const InstanceContext = createContext<InstanceContextValue | null>(null);

/**
 * Parses the raw API response into our strongly-typed config object.
 * @param response The raw JSON response from the /instance.json endpoint.
 * @returns A fully populated instance configuration object.
 */
function parseInstanceResponse(response: any): InstanceContextValue {
  const config = { ...DEFAULT_INSTANCE_CONFIG };

  for (const key in INSTANCE_CONFIG_MAP) {
    const contextKey = key as keyof InstanceContextValue;
    const { apiField } = INSTANCE_CONFIG_MAP[contextKey];

    if (response?.[apiField]) {
      config[contextKey] = response[apiField];
    }
  }

  return config;
}

/**
 * Provides instance-specific configuration to all child components.
 * It fetches the configuration and handles loading and error states.
 */
export function InstanceProvider({ children }: { children: ReactNode }) {
  const { apiClient } = useApiClient();
  const [instanceConfig, setInstanceConfig] =
    useState<InstanceContextValue | null>(null);

  useEffect(() => {
    const fetchInstanceConfig = async () => {
      try {
        const response = await apiClient.get("/instance.json", {});
        setInstanceConfig(parseInstanceResponse(response));
      } catch (error) {
        console.error(
          "Failed to fetch instance config, using defaults.",
          error
        );
        setInstanceConfig(DEFAULT_INSTANCE_CONFIG);
      }
    };
    fetchInstanceConfig();
  }, [apiClient]);

  return (
    <InstanceContext.Provider value={instanceConfig}>
      {children}
    </InstanceContext.Provider>
  );
}
