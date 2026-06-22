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
import _ from "lodash";
import React, { PropsWithChildren, useContext, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import { OperationsResponse } from "..";
import { serialize } from "../util/serialize";
import {
  normalizeJsonApiPointer,
  formatJsonApiErrorMessage
} from "../util/jsonApiErrorNormalization";
import { ClientSideJoiner, ClientSideJoinSpec } from "./client-side-join";
import {
  FailedOperation,
  Operation,
  SuccessfulOperation
} from "./operations-types";
import DataLoader from "dataloader";
import { buildMemoryStorage, setupCache } from "axios-cache-interceptor";

export interface BulkGetOptions {
  apiBaseUrl?: string;
  joinSpecs?: ClientSideJoinSpec[];

  /** Return null for missing resource instead of throwing an Error. */
  returnNullForMissingResource?: boolean;
}

export interface BulkLoadResourcesOptions {
  apiBaseUrl: string;
  resourceType: string;
  include?: string[];

  /**
   * Certain fields are optional since they are computational expensive and not always needed.
   * They can be defined per resource type.
   *
   * e.g.: { "material-sample": ["hierarchy"] }
   */
  optfields?: { [resourceType: string]: string[] };

  returnNullForMissingResource?: boolean;
}

export interface BulkDeleteResourcesOptions {
  apiBaseUrl: string;
  resourceType: string;
}

export interface BulkCreateResourcesOptions {
  apiBaseUrl: string;
  resourceType: string;
}

export interface BulkUpdateResourcesOptions {
  apiBaseUrl: string;
  resourceType: string;
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

  bulkLoadResources: (
    ids: string[],
    options?: BulkLoadResourcesOptions
  ) => Promise<AxiosResponse>;

  bulkCreateResources: (
    resources: InputResource<KitsuResource>[],
    options?: BulkCreateResourcesOptions
  ) => Promise<AxiosResponse>;

  bulkUpdateResources: (
    resources: InputResource<KitsuResource>[],
    options?: BulkUpdateResourcesOptions
  ) => Promise<AxiosResponse>;

  bulkDeleteResources: (
    ids: string[],
    options?: BulkDeleteResourcesOptions
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
    (this.apiClient.axios as any) = setupCache(this.apiClient.axios, {
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
    this.bulkDeleteResources = this.bulkDeleteResources.bind(this);
  }

  /**
   * Performs a write operation against a jsonpatch-compliant JSONAPI server.
   */
  public async doOperations(
    operations: Operation[],
    { apiBaseUrl = "", returnNullForMissingResource }: DoOperationsOptions = {}
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
    const resourceType = operations[0].path.split("/").filter(Boolean)[0];

    // Depending on the number of requests being made determines if it's an operation or just a
    // single request.
    if (operations.length === 1) {
      // Single Request Only
      const operation = operations[0];

      // Request variables
      const url = `${apiBaseUrl}/${operation.path}`;
      const headers = {
        Accept: "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json",
        "Crnk-Compact": "true"
      };
      try {
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
      } catch (error: any) {
        // If it's a 404 or 410 and returnNullForMissingResource, return null.
        if (
          returnNullForMissingResource &&
          (error.cause.data.errors[0].status.includes("404") ||
            error.cause.data.errors[0].status.includes("410"))
        ) {
          responses = [
            {
              data: null,
              status: 404
            }
          ];
        } else {
          // extract JSON:API errors from response so getErrorMessages can parse them and throw a DoOperationsError with the correct field errors.
          const responseData = error?.cause?.data ?? error?.response?.data;
          if (responseData?.errors) {
            responses = [
              {
                status: error?.cause?.status ?? error?.response?.status ?? 422,
                errors: responseData.errors
              }
            ];
          } else {
            throw error;
          }
        }
      }
    } else {
      try {
        switch (operations[0].op.toUpperCase()) {
          case "GET":
            const includeSet = new Set<string>();
            const optfieldsMap: Record<string, string[]> = {};

            const ids = operations.map((operation) => {
              // Split path by "?"
              const pathParts = operation.path.split("?");

              // Parse query params if they exist
              if (pathParts.length > 1) {
                const queryParams = new URLSearchParams(pathParts[1]);

                // Handle include
                const includePart = queryParams.get("include");
                if (includePart) {
                  includePart.split(",").forEach((includeItem) => {
                    includeSet.add(includeItem);
                  });
                }

                // Handle optfields[type]=fields
                queryParams.forEach((value, key) => {
                  const optfieldsMatch = key.match(/^optfields\[(.+)\]$/);
                  if (optfieldsMatch) {
                    const type = optfieldsMatch[1];
                    if (!optfieldsMap[type]) {
                      optfieldsMap[type] = [];
                    }
                    value.split(",").forEach((field) => {
                      if (!optfieldsMap[type].includes(field)) {
                        optfieldsMap[type].push(field);
                      }
                    });
                  }
                });
              }

              // Extract the ID from before the '?' by splitting by '/' and getting the second item
              return pathParts[0].split("/").filter(Boolean)[1];
            });

            const include: string[] | undefined =
              includeSet.size > 0 ? [...includeSet] : undefined;
            const optfields =
              Object.keys(optfieldsMap).length > 0 ? optfieldsMap : undefined;

            const getResponse = await this.bulkLoadResources(ids, {
              apiBaseUrl,
              resourceType,
              include,
              optfields,
              returnNullForMissingResource
            });
            responses = getResponse.data.data.map((response) => ({
              data: response,
              included: getResponse.data.included,
              status: response ? getResponse.status : 404
            }));
            break;

          case "DELETE":
            const deleteIds = operations.map((operation) => {
              // Split path by "?"
              const pathParts = operation.path.split("/");

              // Extract the ID from before the '?' by splitting by '/' and getting the second item
              return pathParts[1];
            });

            const deleteResponse = await this.bulkDeleteResources(deleteIds, {
              apiBaseUrl,
              resourceType
            });

            responses = deleteIds.map(() => ({
              status: deleteResponse.status
            })) as any;
            break;

          case "POST":
            const postResources: InputResource<KitsuResource>[] = operations
              .map((op) => op.value)
              .filter(
                (value): value is InputResource<KitsuResource> =>
                  value !== undefined
              );
            const postResponse = await this.bulkCreateResources(postResources, {
              apiBaseUrl,
              resourceType
            });
            responses = postResponse.data.data.map((response) => ({
              data: response,
              included: postResponse.data.included,
              status: response ? postResponse.status : 404
            }));

            break;
          case "PATCH":
            const patchResources: InputResource<KitsuResource>[] = operations
              .map((op) => op.value)
              .filter(
                (value): value is InputResource<KitsuResource> =>
                  value !== undefined
              );
            const patchResponse = await this.bulkUpdateResources(
              patchResources,
              {
                apiBaseUrl,
                resourceType
              }
            );

            responses = patchResponse.data.data.map((response) => ({
              data: response,
              included: patchResponse.data.included,
              status: response ? patchResponse.status : 404
            }));

            break;
        }
      } catch (error: any) {
        // bulk ops throw AxiosErrors on non-2xx responses
        // extract JSON:API errors from response so getErrorMessages can parse them and throw a DoOperationsError with the correct field errors.
        const responseData = error?.cause?.data ?? error?.response?.data;
        if (responseData?.errors) {
          responses = [
            {
              status: error?.cause?.status ?? error?.response?.status ?? 422,
              errors: responseData.errors
            }
          ];
        } else {
          throw error;
        }
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

    const deleteOperations = deleteArgs.map<Operation>((deleteArg) => ({
      op: "DELETE",
      path: `${deleteArg.delete.type}/${deleteArg.delete.id}`
    }));

    const postOperations: any = [];
    const patchOperations: any = [];

    for (const jsonapiResource of serialized) {
      if (jsonapiResource.id) {
        patchOperations.push({
          op: "PATCH",
          path: `${jsonapiResource.type}/${jsonapiResource.id}`,
          value: {
            ...jsonapiResource,
            id: String(jsonapiResource.id || this.cfg.newId?.() || uuidv4())
          }
        });
      } else {
        postOperations.push({
          op: "POST",
          path: jsonapiResource.type,
          value: {
            ...jsonapiResource,
            id: String(jsonapiResource.id || this.cfg.newId?.() || uuidv4())
          }
        });
      }
    }

    // only do the operations if there are any.
    const postResponses = postOperations.length
      ? await this.doOperations(postOperations, options)
      : [];
    const patchResponses = patchOperations.length
      ? await this.doOperations(patchOperations, options)
      : [];
    const deleteResponses = deleteOperations.length
      ? await this.doOperations(deleteOperations, options)
      : [];

    // Deserialize the responses to Kitsu format.
    const deserializedPostPromises = postResponses.map((response) =>
      deserialise(response)
    );
    const deserializedPatchPromises = patchResponses.map((response) =>
      deserialise(response)
    );
    const deserializedDeletePromises = deleteResponses.map((response) =>
      deserialise(response)
    );
    const deserialized = await Promise.all([
      ...deserializedPostPromises,
      ...deserializedPatchPromises,
      ...deserializedDeletePromises
    ]);
    const kitsuResources = deserialized.map(({ data }) => data);
    return kitsuResources;
  }

  /**
   * Bulk load resources by their IDs.
   * @param ids - The IDs of the resources to load.
   * @param options - Options for the bulk load operation.
   */
  public async bulkLoadResources(
    ids: string[],
    {
      apiBaseUrl,
      resourceType,
      include,
      optfields,
      returnNullForMissingResource = false
    }: BulkLoadResourcesOptions
  ) {
    const { axios } = this.apiClient;
    const params = new URLSearchParams();

    // Handle include parameter.
    if (include && include.length > 0) {
      params.append("include", include.join(","));
    }

    // Handle optional field parameters.
    if (optfields && Object.keys(optfields).length > 0) {
      for (const [type, fields] of Object.entries(optfields)) {
        params.append(`optfields[${type}]`, fields.join(","));
      }
    }

    // Construct the URL for the bulk-load endpoint.
    const url = `${apiBaseUrl}/${resourceType}/bulk-load${
      params.toString() ? `?${params.toString()}` : ""
    }`;

    let response: AxiosResponse = undefined as any;
    const missingIds: string[] = [];
    const originalIds = [...ids]; // Keep the original IDs for later reference.

    // run this max 3 times, worst case is 410 error, then 404 error, then success.
    for (let i = 0; i < 3; i++) {
      const requestBody = {
        data: ids.map((id) => ({
          type: resourceType,
          id: id
        }))
      };
      try {
        response = await axios.post(url, requestBody, {
          headers: {
            "Content-Type": "application/vnd.api+json; ext=bulk",
            Accept: "application/vnd.api+json"
          }
        });
        break;
      } catch (error) {
        // if returnNullForMissingResource is true, we will handle the error
        // by returning null for the missing resources instead of throwing an error.
        if (returnNullForMissingResource) {
          const errors = error.cause.data.errors;
          const missingIdsThisRun = errors.map((err: any) =>
            err.source.pointer.split("/").at(-1)
          );
          missingIds.push(...missingIdsThisRun);
          ids = ids.filter((id) => !missingIds.includes(id));
        } else {
          throw error;
        }
      }
    }

    let responseCounter = 0;
    const newResponseData: any[] = [];

    // Deserialize the response data.
    (response as AxiosResponse).data = deserialise(
      (response as AxiosResponse).data
    );

    // If there are missing IDs, we need to fill in the gaps with nulls.
    if (missingIds.length != 0) {
      for (const id of originalIds) {
        if (missingIds.includes(id)) {
          newResponseData.push(null);
        } else {
          newResponseData.push(response?.data.data[responseCounter]);
          responseCounter++;
        }
      }

      (response as AxiosResponse).data.data = newResponseData;
      return response;
    }

    (response as AxiosResponse).data = deserialise(
      (response as AxiosResponse).data
    );
    return response;
  }

  /**
   * Bulk create resources.
   * @param resources - The resources to create.
   * @param options - Options for the bulk create operation.
   */
  public async bulkCreateResources(
    resources: InputResource<KitsuResource>[],
    { apiBaseUrl, resourceType }: BulkCreateResourcesOptions
  ): Promise<AxiosResponse> {
    const requestBody = {
      data: resources.map((resource) => ({
        ...resource
      }))
    };

    const { axios } = this.apiClient;

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
    response.data = deserialise(response.data);
    return response;
  }

  /**
   * Bulk update resources.
   * @param resources - The resources to update.
   * @param options - Options for the bulk update operation.
   */
  public async bulkUpdateResources(
    resources: InputResource<KitsuResource>[],
    { apiBaseUrl, resourceType }: BulkUpdateResourcesOptions
  ): Promise<AxiosResponse> {
    const requestBody = {
      data: resources.map((resource) => ({
        ...resource
      }))
    };

    const { axios } = this.apiClient;

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
    response.data = deserialise(response.data);
    return response;
  }

  /**
   * Bulk delete resources.
   * @param ids - The IDs of the resources to delete.
   * @param options - Options for the bulk delete operation.
   */
  public async bulkDeleteResources(
    ids: string[],
    { apiBaseUrl, resourceType }: BulkDeleteResourcesOptions
  ) {
    const data = {
      data: ids.map((id) => ({
        type: resourceType,
        id: id
      }))
    };

    const { axios } = this.apiClient;

    const response = await axios.delete(`${apiBaseUrl}/${resourceType}/bulk`, {
      data: data,
      headers: {
        "Content-Type": "application/vnd.api+json; ext=bulk",
        Accept: "application/vnd.api+json"
      }
    });

    return response;
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
        .map((error) => {
          const pointer = error.source?.pointer?.toString?.() ?? "";
          const fieldName = normalizeJsonApiPointer(pointer) || pointer;
          const message = formatJsonApiErrorMessage(error.title, error.detail);
          return [fieldName, message];
        })
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
    // If the error is a 404 or 410, and the endpoint is "bulk-load", throw full error for handling in function.
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

function normalizeId(obj: any): void {
  if (obj && typeof obj === "object") {
    if (!obj.id && obj.uuid) {
      obj.id = obj.uuid;
      delete obj.uuid;
    }
  }
}

export class CustomDinaKitsu extends Kitsu {
  /**
   * The default Kitsu 'get' method omits the last part of URLs with multiple slashes.
   * e.g. "seqdb-api/index-set/1/ngsindexes" becomes "seqdb-api/index-set/1".
   * Override the 'get' method so it works with our long URLs:
   */
  async get(path: string, params: GetParams = {}) {
    const { responseType, timeout, ...paramsNet } = _.omit(params, "header");

    // Trim spaces from comma-separated include values
    if (paramsNet.include) {
      paramsNet.include = (paramsNet.include as string)
        .split(",")
        .map((s) => s.trim())
        .join(",");
    }

    // Trim spaces for fields values.
    if (paramsNet.fields) {
      paramsNet.fields = _.mapValues(paramsNet.fields, (value) =>
        value
          .split(",")
          .map((s) => s.trim())
          .join(",")
      );
    }

    // Trim spaces for optField values.
    if (paramsNet.optfields) {
      paramsNet.optfields = _.mapValues(paramsNet.optfields, (value) =>
        value
          .split(",")
          .map((s) => s.trim())
          .join(",")
      );
    }

    try {
      const { data } = await this.axios.get(path, {
        headers: { ...this.headers, ...params.header },
        params: paramsNet,
        responseType,
        timeout
      });

      const deserialized = await deserialise(data);

      // Get the list of requested includes
      const requestedIncludes = (params.include as string)?.split(",") ?? [];

      // Handle both single object and array responses
      const items = Array.isArray(deserialized.data)
        ? deserialized.data
        : [deserialized.data];

      const rawItems = Array.isArray(data?.data) ? data.data : [data?.data];

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const rawRelationships = rawItems[i]?.relationships ?? {};

        for (const key of requestedIncludes) {
          // Already resolved at top level, skip
          if (item[key] !== undefined) continue;

          const relData = rawRelationships[key]?.data;
          if (!relData) continue;

          // Promote stub(s) to top level
          if (Array.isArray(relData)) {
            item[key] = relData.map((r: any) => ({
              ...r,
              id: r.id,
              type: r.type
            }));
          } else {
            item[key] = { ...relData, id: relData.id, type: relData.type };
          }
        }

        // Normalize uuid to id on the item itself and any promoted relationships
        normalizeId(item);
        for (const key of requestedIncludes) {
          if (item[key]) {
            if (Array.isArray(item[key])) {
              item[key].forEach(normalizeId);
            } else {
              normalizeId(item[key]);
            }
          }
        }

        // Remove the raw relationships object Kitsu leaves behind when
        // it cannot resolve relationships via included
        delete item?.relationships;
      }

      return deserialized;
    } catch (E) {
      throw kitsuError(E);
    }
  }
}
