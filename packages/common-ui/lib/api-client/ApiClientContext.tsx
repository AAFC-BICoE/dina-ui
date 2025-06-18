import { AxiosError, AxiosResponse } from "axios";
import { FormikErrors } from "formik";
import Kitsu, {
  GetParams,
  InputResource,
  KitsuResource,
  KitsuResourceLink,
  PersistedResource
} from "kitsu";
import { deserialise, error as kitsuError } from "kitsu-core";
import _, { map } from "lodash";
import React, { PropsWithChildren, useContext, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import { OperationsResponse } from "..";
import { serialize } from "../util/serialize";
import { ClientSideJoiner, ClientSideJoinSpec } from "./client-side-join";
import {
  FailedOperation,
  Operation,
  SuccessfulOperation
} from "./operations-types";
import DataLoader from "dataloader";
import { buildMemoryStorage, setupCache } from "axios-cache-interceptor";
import { ResourceObject } from "jsonapi-typescript";

export interface BulkGetOptions {
  apiBaseUrl?: string;
  joinSpecs?: ClientSideJoinSpec[];

  /** Return null for missing resource instead of throwing an Error. */
  returnNullForMissingResource?: boolean;
}

export interface BulkCreateResourcesOptions {
  apiBaseUrl?: string;
  resourceType: string;
  returnNullForMissingResource?: boolean;
}

export interface BulkUpdateResourcesOptions {
  apiBaseUrl?: string;
  resourceType: string;
  returnNullForMissingResource?: boolean;
}

export type BulkGetOperation =
  | SuccessfulOperation
  | FailedOperation
  // For replacing missing/deleted data with null locally:
  | { data: null; status: 404 };

export interface DoOperationsOptions {
  apiBaseUrl?: string;

  /** Return null for missing resource instead of throwing an Error. */
  returnNullForMissingResource?: boolean;

  overridePatchOperation?: boolean;

  /**
   * If true, the client will handle requests with only 1 request as a single request instead of an
   * operation. Default is false for now to keep the same behavior as before for backwards compatibility.
   */
  skipOperationForSingleRequest?: boolean;
}

/** Api client interface. */
export interface ApiClientI {
  /** Client to talk to the back-end API. */
  apiClient: Kitsu;

  /** Function to perform requests against a jsonpatch-compliant JSONAPI server. */
  doOperations: (
    operations: Operation[],
    options?: DoOperationsOptions
  ) => Promise<SuccessfulOperation[]>;

  /** Creates or updates one or multiple resources. */
  save: <TData extends KitsuResource = KitsuResource>(
    args: (SaveArgs | DeleteArgs)[],
    options?: DoOperationsOptions
  ) => Promise<PersistedResource<TData>[]>;

  /** Bulk GET operations: Run many find-by-id queries in a single HTTP request. */
  bulkGet: <T extends KitsuResource, TReturnNull extends boolean = false>(
    paths: readonly string[],
    options?: BulkGetOptions
  ) => Promise<
    (TReturnNull extends true
      ? PersistedResource<T> | null
      : PersistedResource<T>)[]
  >;

  bulkLoadResources: <
    T extends KitsuResource,
    TReturnNull extends boolean = false
  >(
    baseUrl,
    resourceType,
    ids: string[],
    returnNullForMissingResource?: boolean,
    skipBulkLoadForSingleRequest?: boolean
  ) => Promise<
    (TReturnNull extends true
      ? PersistedResource<T> | null
      : PersistedResource<T>)[]
  >;

  bulkCreateResources: (
    resources: InputResource<KitsuResource>[],
    options?: BulkCreateResourcesOptions
  ) => Promise<AxiosResponse>;

  bulkUpdateResources: (
    resources: InputResource<KitsuResource>[],
    options?: BulkUpdateResourcesOptions
  ) => Promise<AxiosResponse>;
}

/** Config for creating an API client. */
export interface ApiClientConfig {
  /** Back-end API base URL. */
  baseURL?: string;
  /** New Id generator. */
  newId?: () => string;
}

/** save function args. */
export interface SaveArgs<T extends KitsuResource = KitsuResource> {
  resource: T | InputResource<T>;
  type: string;
}

export interface DeleteArgs {
  delete: KitsuResourceLink | PersistedResource<any>;
}

/**
 * React Context that passes down the API client to Components.
 */
export const ApiClientContext = React.createContext<ApiClientI>(
  // Default value is undefined. This won't matter as long as the hook is called inside the context provider.
  undefined as any
);

export const ApiClientProvider = ApiClientContext.Provider;

export function ApiClientImplProvider({
  children,
  ...cfg
}: PropsWithChildren<ApiClientConfig> = {}) {
  const apiContext = useMemo(() => new ApiClientImpl(cfg), []);
  return <ApiClientProvider value={apiContext}>{children}</ApiClientProvider>;
}

/** Hook to get the Api Client Context */
export function useApiClient() {
  const ctx = useContext(ApiClientContext);
  if (!ctx) {
    throw new Error("No ApiClientContext available.");
  }
  return ctx;
}

export class ApiClientImpl implements ApiClientI {
  public apiClient: Kitsu;

  constructor(private cfg: ApiClientConfig = {}) {
    this.apiClient = new CustomDinaKitsu({
      baseURL: cfg.baseURL ?? "/api",
      headers: { "Crnk-Compact": "true" },
      pluralize: false,
      resourceCase: "none"
    });

    // Add caching support for one second since it's likely it's going to be same response.
    const ONE_SECOND = 1000;
    this.apiClient.axios = setupCache(this.apiClient.axios, {
      location: "client",
      storage: buildMemoryStorage(
        false, // clone data off
        ONE_SECOND, // cleanup interval in ms
        100 // maximum cache entries
      ),
      ttl: ONE_SECOND
    });

    // This part needs to happen after the cache is setup since it will override it.
    this.apiClient.axios?.interceptors?.response.use(
      (successResponse) => successResponse,
      makeAxiosErrorMoreReadable
    );

    // Bind the methods so context consumers can use object destructuring.
    this.doOperations = this.doOperations.bind(this);
    this.save = this.save.bind(this);
    this.bulkGet = this.bulkGet.bind(this);
    this.bulkLoadResources = this.bulkLoadResources.bind(this);
    this.bulkCreateResources = this.bulkCreateResources.bind(this);
    this.bulkUpdateResources = this.bulkUpdateResources.bind(this);
  }

  /**
   * Performs a write operation against a jsonpatch-compliant JSONAPI server.
   *
   * If a single request is provided, it will perform the request without the
   * operation directly. It will still return like an operation response. This is only enabled if
   * skipOperationForSingleRequest is set to true.
   */
  public async doOperations(
    operations: Operation[],
    {
      apiBaseUrl = "",
      returnNullForMissingResource,
      skipOperationForSingleRequest
    }: DoOperationsOptions = {}
  ): Promise<SuccessfulOperation[]> {
    // Check if no operations were provided and skip performing anything.
    if (operations.length === 0) {
      console.warn("Empty operation skipped... Returning empty array.");
      return [];
    }

    // Unwrap the configured axios instance from the Kitsu instance.
    const { axios } = this.apiClient;

    // This array will hold the responses from either the single or bulk request
    let responses: OperationsResponse | BulkGetOperation[] = [];

    // Depending on the number of requests being made determines if it's an operation or just a
    // single request.
    if (operations.length === 1 && skipOperationForSingleRequest) {
      // Single Request Only
      const operation = operations[0];

      // Request variables
      const url = `${apiBaseUrl}/${operation.path}`;
      const headers = {
        Accept: "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json",
        "Crnk-Compact": "true"
      };

      switch (operation.op.toUpperCase()) {
        case "GET":
          const getResponse = await axios.get(url, { headers });
          responses = [
            {
              data: getResponse?.data?.data,
              included: getResponse?.data?.included,
              status: getResponse?.status
            }
          ];
          break;
        case "POST":
          const postResponse = await axios.post(
            url,
            { data: operation.value },
            { headers }
          );
          responses = [
            {
              data: postResponse?.data?.data,
              included: postResponse?.data?.included,
              status: postResponse?.status
            }
          ];
          break;
        case "PATCH":
          const patchResponse = await axios.patch(
            url,
            { data: operation.value },
            { headers }
          );
          responses = [
            {
              data: patchResponse?.data?.data,
              included: patchResponse?.data?.included,
              status: patchResponse?.status
            }
          ];
          break;
        case "DELETE":
          const deleteResponse = await axios.delete(url, {
            headers: {
              "Content-Type": "application/vnd.api+json"
            }
          });
          responses = [
            {
              status: deleteResponse.status
            } as any
          ];
          break;
        default:
          throw new Error(`Unsupported single operation: ${operation.op}`);
      }
    } else {
      if (
        apiBaseUrl === "agent-api" &&
        ["POST", "PATCH"].includes(operations[0].op.toUpperCase())
      ) {
        switch (operations[0].op.toUpperCase()) {
          case "POST":
            // For agent-api, we need to do a bulk create
            const postResources: ResourceObject[] = operations
              .map((op) => op.value)
              .filter((value): value is ResourceObject => value !== undefined);
            const postResourceType = operations[0].path.split("/")[0];
            const postResponse = await this.bulkCreateResources(postResources, {
              apiBaseUrl,
              resourceType: postResourceType,
              returnNullForMissingResource
            });
            responses = postResponse.data.data.map((response) => ({
              data: response,
              included: [],
              status: postResponse.status
            }));

            break;
          case "PATCH":
            const patchResources: ResourceObject[] = operations
              .map((op) => op.value)
              .filter((value): value is ResourceObject => value !== undefined);
            const patchResourceType = operations[0].path.split("/")[0];
            const patchResponse = await this.bulkUpdateResources(
              patchResources,
              {
                apiBaseUrl,
                resourceType: patchResourceType,
                returnNullForMissingResource
              }
            );

            responses = patchResponse.data.data.map((response) => ({
              data: response,
              included: [],
              status: patchResponse.status
            }));

            break;
        }
      } else {
        const axiosResponse = await axios.patch(
          `${apiBaseUrl}/operations`,
          operations,
          {
            headers: {
              Accept: "application/json-patch+json",
              "Content-Type": "application/json-patch+json",
              "Crnk-Compact": "true"
            }
          }
        );

        responses = axiosResponse.data;
      }
    }

    // Optionally return null instead of throwing an error for missing resources:
    if (returnNullForMissingResource) {
      for (const i in responses) {
        // 404 Not Found or 410 Gone
        if ([404, 410].includes(responses[i].status)) {
          responses[i] = {
            data: null,
            status: 404
          };
        }
      }
      console.warn(responses);
    }

    // Check for errors. At least one error means that the entire request's transaction was
    // cancelled.
    const { errorMessage, fieldErrors, individualErrors } =
      getErrorMessages(responses);

    // If there is an error message, throw it.
    if (errorMessage || !_.isEmpty(fieldErrors)) {
      throw new DoOperationsError(
        errorMessage ?? "",
        fieldErrors,
        individualErrors
      );
    }

    // Return the successful jsonpatch response.
    return responses as SuccessfulOperation[];
  }

  /**
   * Creates or updates one or multiple resources.
   */
  public async save<TData extends KitsuResource = KitsuResource>(
    args: (SaveArgs | DeleteArgs)[],
    options?: DoOperationsOptions
  ): Promise<PersistedResource<TData>[]> {
    const deleteArgs = args.filter(
      (arg) => (arg as any).delete
    ) as DeleteArgs[];
    const saveArgs = args.filter((arg) => !(arg as any).delete) as SaveArgs[];

    // Serialize the resources to JSONAPI format.
    const serializePromises = saveArgs.map((saveArg) => serialize(saveArg));
    const serialized = await Promise.all(serializePromises);

    // Create the jsonpatch operations objects.
    const saveOperations = serialized.map<Operation>((jsonapiResource) => ({
      op: options?.overridePatchOperation
        ? "POST"
        : jsonapiResource.id
        ? "PATCH"
        : "POST",
      path: options?.overridePatchOperation
        ? jsonapiResource.type
        : jsonapiResource.id
        ? `${jsonapiResource.type}/${jsonapiResource.id}`
        : jsonapiResource.type,
      value: {
        ...jsonapiResource,
        id: String(jsonapiResource.id || this.cfg.newId?.() || uuidv4())
      }
    }));

    const deleteOperations = deleteArgs.map<Operation>((deleteArg) => ({
      op: "DELETE",
      path: `${deleteArg.delete.type}/${deleteArg.delete.id}`
    }));

    const operations = [...saveOperations, ...deleteOperations];

    // Do the operations request.
    const responses = await this.doOperations(operations, options);

    // Deserialize the responses to Kitsu format.
    const deserializePromises = responses.map((response) =>
      deserialise(response)
    );
    const deserialized = await Promise.all(deserializePromises);
    const kitsuResources = deserialized.map(({ data }) => data);

    return kitsuResources;
  }

  /**
   *  Bulk GET operations: Run many find-by-id queries in a single HTTP request.
   */
  public async bulkLoadResources(
    baseUrl: string,
    resourceType: string,
    ids: string[],
    returnNullForMissingResource?: boolean,
    skipBulkLoadForSingleRequest?: boolean
  ) {
    const requestBody = {
      data: ids.map((id) => ({
        type: resourceType,
        id: id
      }))
    };

    const { axios } = this.apiClient;

    try {
      const response =
        ids.length === 1 && skipBulkLoadForSingleRequest
          ? await axios.get(`${baseUrl}/${resourceType}/${ids[0]}`, {
              headers: {
                Accept: "application/vnd.api+json"
              }
            })
          : await axios.post(
              `${baseUrl}/${resourceType}/bulk-load`,
              requestBody,
              {
                headers: {
                  "Content-Type": "application/vnd.api+json; ext=bulk",
                  Accept: "application/vnd.api+json"
                }
              }
            );
      const jsonApiData = response.data.data;

      // flatten the attributes into the resource object if they exist
      if (jsonApiData[0].hasOwnProperty("attributes")) {
        const flattened = jsonApiData.map((resource: any) => {
          resource = {
            ..._.omit(resource, "attributes"),
            ...resource.attributes
          };
          return resource;
        });
        return flattened;
      } else {
        return jsonApiData;
      }
    } catch (error) {
      if (returnNullForMissingResource) {
        // returns a len(id) length array of nulls if any resource is not found
        console.error(
          `Error bulk loading resources from ${resourceType}`,
          error
        );
        return map(ids, () => null);
      } else {
        throw error;
      }
    }
  }

  public async bulkCreateResources(
    resources: ResourceObject[],
    options?: BulkCreateResourcesOptions
  ): Promise<AxiosResponse> {
    const { apiBaseUrl = "", resourceType } = options || {};
    const requestBody = {
      data: resources.map((resource) => ({
        ...resource
      }))
    };

    const { axios } = this.apiClient;

    try {
      const response = await axios.post(
        `${apiBaseUrl}/${resourceType}/bulk`,
        requestBody,
        {
          headers: {
            "Content-Type": "application/vnd.api+json; ext=bulk",
            Accept: "application/vnd.api+json"
          }
        }
      );
      return response;
    } catch (error) {
      console.error(`Error bulk creating resources for ${resourceType}`, error);
      throw error;
    }
  }

  public async bulkUpdateResources(
    resources: InputResource<KitsuResource>[],
    options?: BulkUpdateResourcesOptions
  ): Promise<AxiosResponse> {
    const { apiBaseUrl = "", resourceType } = options || {};
    const requestBody = {
      data: resources.map((resource) => ({
        ...resource
      }))
    };

    const { axios } = this.apiClient;

    try {
      const response = await axios.patch(
        `${apiBaseUrl}/${resourceType}/bulk`,
        requestBody,
        {
          headers: {
            "Content-Type": "application/vnd.api+json; ext=bulk",
            Accept: "application/vnd.api+json"
          }
        }
      );
      return response;
    } catch (error) {
      console.error(`Error bulk updating resources for ${resourceType}`, error);
      throw error;
    }
  }

  /** Bulk GET operations: Run many find-by-id queries in a single HTTP request. */
  public async bulkGet<
    T extends KitsuResource,
    TReturnNull extends boolean = false
  >(
    paths: string[],
    {
      apiBaseUrl = "",
      joinSpecs = [],
      returnNullForMissingResource
    }: BulkGetOptions = {}
  ) {
    // Don't do an empty operations request:
    if (!paths.length) {
      return [];
    }

    // Use DataLoader to avoid requesting the same ID multiple times,
    // which crnk-operations throws an error for:
    const batchLoader = new DataLoader<string, SuccessfulOperation>(
      async (uniquePaths) => {
        const getOperations = uniquePaths.map<Operation>((path) => ({
          op: "GET",
          path
        }));

        return await this.doOperations(getOperations, {
          apiBaseUrl,
          returnNullForMissingResource
        });
      }
    );

    const responses = await batchLoader.loadMany(paths);

    const resources: (TReturnNull extends true
      ? PersistedResource<T> | null
      : PersistedResource<T>)[] = (
      await Promise.all(responses.map(deserialise))
    ).map((res) => res.data);

    for (const joinSpec of joinSpecs) {
      await new ClientSideJoiner(this.bulkGet, resources, joinSpec).join();
    }

    return resources;
  }
}

export interface OperationError {
  index: number | string;
  errorMessage: string | null;
  fieldErrors: FormikErrors<any>;
}

/** Gets the error message as a string from the JSONAPI jsonpatch/operations response. */
export function getErrorMessages(
  operationsResponse: OperationsResponse | BulkGetOperation[]
): {
  errorMessage: string | null;
  fieldErrors: FormikErrors<any>;
  /** The error messages for each indivisual operation with the operation's index. */
  individualErrors: OperationError[];
} {
  // Filter down to just the error responses.
  const errorResponses = operationsResponse
    .map((res, index: number) => ({ index, response: res as FailedOperation }))
    .filter(({ response }) => !/2../.test(response?.status?.toString()));

  const individualErrors = errorResponses.map(({ response, index }) => {
    // Map the error responses to JsonApiErrors.
    // Ignore any error responses without an 'errors' field.
    const jsonApiErrors = _.compact(response.errors);

    // Convert the JsonApiErrors to an aggregated error string.
    const errorMessage =
      jsonApiErrors
        // Don't include field-level errors in the form-level error message:
        .filter((error) => !error.source?.pointer)
        .map(
          // The error message is the title + detail, but remove one if the other is missing
          ({ title, detail }) =>
            [title, detail].filter((s) => s?.trim()).join(": ")
        )
        .join("\n") || null;

    const fieldErrors = _.fromPairs(
      jsonApiErrors
        // Only include field-level errors in the fieldErrors:
        .filter((error) => error.source?.pointer && error.detail)
        .map((error) => [
          error.source?.pointer?.toString?.() ?? "",
          error.detail ?? ""
        ])
    );

    return { index, errorMessage, fieldErrors };
  });

  const overallErrorMessage =
    _.compact(individualErrors.map((it) => it.errorMessage)).join("\n") || null;
  const overallFieldErrors = individualErrors.reduce(
    (total, curr) => ({ ...total, ...curr.fieldErrors }),
    {}
  );

  // Return the error message if there is one, or null otherwise.
  return {
    errorMessage: overallErrorMessage,
    fieldErrors: overallFieldErrors,
    individualErrors
  };
}

/** Error class thrown by doOperations function. */
export class DoOperationsError extends Error {
  constructor(
    public message: string,
    public fieldErrors: FormikErrors<any> = {},
    public individualErrors: OperationError[] = [
      { errorMessage: message, fieldErrors, index: 0 }
    ]
  ) {
    super(message);
  }
}

/** Show more details in the Axios errors. */
export function makeAxiosErrorMoreReadable(error: AxiosError<any>) {
  if (error.isAxiosError) {
    let errorMessage = `${error.config?.url}: ${error.response?.statusText}`;

    // Special case: Make 502 "bad gateway" messages more user-friendly:
    if (error.response?.status === 502) {
      errorMessage = `Service unavailable:\n${errorMessage}`;
    }

    // Handle errors coming from Spring Boot:
    if (error.response?.data?.errors) {
      const jsonApiErrorResponse = {
        status: error.response.status,
        errors: error.response.data.errors
      };
      errorMessage +=
        "\n" + getErrorMessages([jsonApiErrorResponse]).errorMessage;
    }
    const err = new Error(errorMessage) as any;
    err.cause = error.response;
    throw err;
  }
  throw error;
}

export class CustomDinaKitsu extends Kitsu {
  /**
   * The default Kitsu 'get' method omits the last part of URLs with multiple slashes.
   * e.g. "seqdb-api/index-set/1/ngsindexes" becomes "seqdb-api/index-set/1".
   * Override the 'get' method so it works with our long URLs:
   */
  async get(path: string, params: GetParams = {}) {
    const { responseType, timeout, ...paramsNet } = _.omit(params, "header");
    try {
      const { data } = await this.axios.get(path, {
        headers: { ...this.headers, ...params.header },
        params: paramsNet,
        // paramsSerializer: (p) => query(p),
        responseType,
        timeout
      });

      const deserialized = await deserialise(data);

      // Omit relationships where: { data: null } because they do not deserialize properly:
      const relationships = deserialized?.data?.relationships;
      for (const key of _.keys(relationships)) {
        if (relationships?.[key]?.data === null) {
          delete relationships[key];
        }
      }

      return deserialized;
    } catch (E) {
      throw kitsuError(E);
    }
  }
}
