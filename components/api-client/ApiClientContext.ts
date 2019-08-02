import Kitsu, { KitsuResource } from "kitsu";
import { deserialise } from "kitsu-core";
import React from "react";
import { serialize } from "../../util/serialize";
import {
  JsonApiErrorResponse,
  JsonApiResponse,
  Operation,
  OperationsResponse
} from "./jsonapi-types";

/** Api context interface. */
export interface ApiClientContextI {
  /** Client to talk to the back-end API. */
  apiClient: Kitsu;

  /** Function to perform requests against a jsonpatch-compliant JSONAPI server. */
  doOperations: (operations: Operation[]) => Promise<JsonApiResponse[]>;

  /** Creates or updates one or multiple resources. */
  save: (saveArgs: SaveArgs[]) => Promise<KitsuResource[]>;
}

/** save function args. */
export interface SaveArgs {
  resource: KitsuResource;
  type: string;
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

  /**
   * Performs a write operation against a jsonpatch-compliant JSONAPI server.
   */
  async function doOperations(
    operations: Operation[]
  ): Promise<JsonApiResponse[]> {
    // Unwrap the configured axios instance from the Kitsu instance.
    const { axios } = apiClient;

    // Do the operations request.
    const axiosResponse = await axios.patch("operations", operations, {
      headers: {
        Accept: "application/json-patch+json",
        "Content-Type": "application/json-patch+json"
      }
    });

    // Check for errors. At least one error means that the entire request's transaction was
    // cancelled.
    const errorMessage = getErrorMessage(axiosResponse.data);

    // If there is an error message, throw it.
    if (errorMessage) {
      throw new Error(errorMessage);
    }

    // Return the successful jsonpatch response.
    return axiosResponse.data;
  }

  /**
   * Creates or updates one or multiple resources.
   */
  async function save(saveArgs: SaveArgs[]): Promise<KitsuResource[]> {
    // Serialize the resources to JSONAPI format.
    const serializePromises = saveArgs.map(saveArg => serialize(saveArg));
    const serialized = await Promise.all(serializePromises);

    // Temp ID iterator. This is not persisted on the back-end as the actual database ID.
    let idIterator = -100;

    // Create the jsonpatch oeprations objects.
    const operations = serialized.map<Operation>(jsonapiResource => ({
      op: jsonapiResource.id ? "PATCH" : "POST",
      path: jsonapiResource.id
        ? `${jsonapiResource.type}/${jsonapiResource.id}`
        : jsonapiResource.type,
      value: { ...jsonapiResource, id: jsonapiResource.id || idIterator-- }
    }));

    // Do the operations request.
    const responses = await doOperations(operations);

    // Deserialize the responses to Kitsu format.
    const deserializePromises = responses.map(response =>
      deserialise(response)
    );
    const deserialized = await Promise.all(deserializePromises);
    const kitsuResources = deserialized.map(({ data }) => data);

    return kitsuResources;
  }

  return {
    apiClient,
    doOperations,
    save
  };
}

/** Gets the error message as a string from the JSONAPI jsonpatch/operations response. */
function getErrorMessage(
  operationsResponse: OperationsResponse
): string | null {
  // Filter down to just the error responses.
  const errorResponses = operationsResponse.filter(
    ({ status }) => !/2../.test(status.toString())
  ) as JsonApiErrorResponse[];

  // Map the error responses to JsonApiErrors.
  const jsonApiErrors = errorResponses.map(response => response.errors);

  // Convert the JsonApiErrors to an aggregated error string.
  const message = jsonApiErrors
    .map(errors =>
      errors.map(({ title, detail }) => `${title}: ${detail}`).join("\n")
    )
    .join("\n");

  // Return the error message if there is one, or null otherwise.
  return message || null;
}
