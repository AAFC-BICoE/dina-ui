import React from "react";
import { ApiClientContext, ApiClientContextI } from "./ApiClientContext";

/** HTTP method used to specify a jsonpatch operation type. */
type HttpMethod = "POST" | "PATCH" | "DELETE";

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

/** A single entity in JSONAPI format. */
interface JsonApiResource {
  id: number | string;
  type: string;
  attributes?: any;
  relationships?: any;
}

/**
 * "Render props" values that are passed down to children components.
 */
interface OperationsRenderProps {
  doOperations: (operations: Operation[]) => void;
}

/**
 * Operations component's "children" prop type.
 */
type OperationsChildren = (
  renderProps: OperationsRenderProps
) => React.ReactNode;

/** Operations component props. */
interface OperationsProps {
  children: OperationsChildren;
}

/**
 * Provides an interface for performing write operations against the backend via render props.
 * See: https://reactjs.org/docs/render-props.html
 *
 * The backend must support the jsonpatch extension to JSONAPI.
 * See: https://github.com/json-api/json-api/blob/9c7a03dbc37f80f6ca81b16d444c960e96dd7a57/extensions/jsonpatch/index.md
 */
export class Operations extends React.Component<OperationsProps> {
  static contextType = ApiClientContext;

  /**
   * Performs write operations against the backend.
   *
   * @param operations the jsonpatch operations to perform
   */
  private async doOperations(operations: Operation[]) {
    // Unwrap the configured axios instance from the Kitsu instance.
    const {
      apiClient: { axios }
    } = this.context as ApiClientContextI;

    // Do the operations request.
    await axios.patch("operations", operations, {
      headers: {
        "Content-Type": "application/json-patch+json",
        Accept: "application/json-patch+json"
      }
    });
  }

  render() {
    return this.props.children({
      doOperations: ops => this.doOperations(ops)
    });
  }
}
