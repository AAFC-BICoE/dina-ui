import Kitsu from "kitsu";
import React from "react";

/** Api context interface. */
export interface ApiContextI {
  apiClient: Kitsu;
}

/**
 * React context that passes down a single API client to subscribed components.
 */
export const ApiContext = React.createContext<ApiContextI>(undefined);
