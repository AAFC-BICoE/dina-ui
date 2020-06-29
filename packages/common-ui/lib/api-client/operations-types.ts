import { DocWithData, DocWithErrors, ResourceObject } from "jsonapi-typescript";

/** A sucessful jsonpath operation. */
export interface SuccessfulOperation extends DocWithData {
  status: number;
}

/** A failed jsonpatch operation */
export interface FailedOperation extends DocWithErrors {
  status: number;
}

/** HTTP verb used to specify a jsonpatch operation type. */
export type OperationVerb = "GET" | "POST" | "PATCH" | "DELETE";

/**
 * A jsonpatch operation.
 *
 * See: https://github.com/json-api/json-api/blob/9c7a03dbc37f80f6ca81b16d444c960e96dd7a57/extensions/jsonpatch/index.md#-creating-resources
 */
export interface Operation {
  op: OperationVerb;
  path: string;
  value?: ResourceObject;
}

/**
 * A response from a JSONAPI jsonpatch backend.
 *
 * See: https://github.com/json-api/json-api/blob/9c7a03dbc37f80f6ca81b16d444c960e96dd7a57/extensions/jsonpatch/index.md#-responses
 */
export type OperationsResponse = Array<SuccessfulOperation | FailedOperation>;

export interface MetaWithTotal {
  totalResourceCount: number;
}

export interface LimitOffsetPageSpec {
  limit: number;
  offset: number;
}
