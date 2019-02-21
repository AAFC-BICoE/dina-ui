import Kitsu from "kitsu";
import React from "react";
import { Operation, OperationsResponse } from "./jsonapi-types";

/** Api context interface. */
export interface ApiClientContextI {
  /** Client to talk to the back-end API. */
  apiClient: Kitsu;
  /** Function to perform requests against a jsonpatch */
  doOperations: (operations: Operation[]) => Promise<OperationsResponse>;
}

/**
 * React context that passes down a single API client to subscribed components.
 */
export const ApiClientContext = React.createContext<ApiClientContextI>(
  undefined
);

/**
 * Creates the value of the API client context. The app should only need to call this function
 * once to initialize the context.
 */
export function createContextValue(): ApiClientContextI {
  const apiClient = new Kitsu({
    baseURL: "/api",
    pluralize: false,
    resourceCase: "none"
  });

  async function doOperations(
    operations: Operation[]
  ): Promise<OperationsResponse> {
    // Unwrap the configured axios instance from the Kitsu instance.
    const { axios } = apiClient;

    // Do the operations request.
    const axiosResponse = await axios.patch("operations", operations, {
      headers: {
        Accept: "application/json-patch+json",
        "Content-Type": "application/json-patch+json"
      }
    });

    return axiosResponse.data;
  }

  return {
    apiClient,
    doOperations
  };
}
