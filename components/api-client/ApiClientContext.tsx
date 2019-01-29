import Kitsu from "kitsu";
import React from "react";

/** Api context interface. */
export interface ApiClientContextI {
  apiClient: Kitsu;
}

/**
 * React context that passes down a single API client to subscribed components.
 */
export const ApiClientContext = React.createContext<ApiClientContextI>(
  undefined
);
