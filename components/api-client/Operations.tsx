import React from "react";
import { ApiClientContext, ApiClientContextI } from "./ApiClientContext";
import { Operation, OperationsResponse } from "./jsonapi-types";

/**
 * "Render props" values that are passed down to children components.
 */
interface OperationsRenderProps {
  loading: boolean;
  response?: OperationsResponse;
  doOperations: (operations: Operation[]) => Promise<void>;
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

/** Operations component state. */
interface OperationsState {
  loading: boolean;
  response?: OperationsResponse;
}

/**
 * Provides an interface for performing write operations against the backend via render props.
 * See: https://reactjs.org/docs/render-props.html
 *
 * The backend must support the jsonpatch extension to JSONAPI.
 * See: https://github.com/json-api/json-api/blob/9c7a03dbc37f80f6ca81b16d444c960e96dd7a57/extensions/jsonpatch/index.md
 */
export class Operations extends React.Component<
  OperationsProps,
  OperationsState
> {
  static contextType = ApiClientContext;

  state: OperationsState = {
    loading: false
  };

  /**
   * Performs write operations against the backend.
   *
   * @param operations the jsonpatch operations to perform
   */
  private async doOperations(operations: Operation[]): Promise<void> {
    // Unwrap the configured axios instance from the Kitsu instance.
    const {
      apiClient: { axios }
    } = this.context as ApiClientContextI;

    // Do the operations request.
    this.setState({ loading: true, response: undefined });
    try {
      const axiosResponse = await axios.patch("operations", operations, {
        headers: {
          "Content-Type": "application/json-patch+json",
          Accept: "application/json-patch+json"
        }
      });
      this.setState({ loading: false, response: axiosResponse.data });
    } catch(error) {
      // Unknown errors thrown by axios.patch will be caught here.
      // Validation errors are included in the operations response, and not caught here.
      this.setState({ loading: false });
      throw error;
    }
  }

  render() {
    const { loading, response } = this.state;

    return this.props.children({
      doOperations: ops => this.doOperations(ops),
      loading,
      response
    });
  }
}
