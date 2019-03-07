// JSONAPI types.

/** A sucessful response from a JSONAPI backend. */
export interface JsonApiResponse {
  data: JsonApiResource;
  status: 201;
}

/** A single entity in JSONAPI format. */
export interface JsonApiResource {
  id: number | string;
  type: string;
  attributes?: any;
  relationships?: any;
}

/**
 * JSONAPI error response.
 * See https://jsonapi.org/format/#errors
 */
export interface JsonApiErrorResponse {
  errors: JsonApiError[];
  status: number;
}

/**
 * JSONAPI error object.
 * See https://jsonapi.org/format/#error-objects
 */
export interface JsonApiError {
  id?: string;
  links?: any;
  status?: string;
  code?: string;
  title?: string;
  detail?: string;
  source?: any;
  meta?: any;
}

/** HTTP method used to specify a jsonpatch operation type. */
export type HttpMethod = "POST" | "PATCH" | "DELETE";

/**
 * A jsonpatch operation.
 *
 * See: https://github.com/json-api/json-api/blob/9c7a03dbc37f80f6ca81b16d444c960e96dd7a57/extensions/jsonpatch/index.md#-creating-resources
 */
export interface Operation {
  op: HttpMethod;
  path: string;
  value: JsonApiResource;
}

/**
 * A response from a JSONAPI jsonpatch backend.
 *
 * See: https://github.com/json-api/json-api/blob/9c7a03dbc37f80f6ca81b16d444c960e96dd7a57/extensions/jsonpatch/index.md#-responses
 */
export type OperationsResponse = Array<JsonApiResponse | JsonApiErrorResponse>;
