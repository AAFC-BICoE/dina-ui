import {
  FieldsParam,
  FilterParam,
  GetParams,
  JsonApiErrorResponse,
  KitsuResponse,
  KitsuResponseData
} from "kitsu";
import { isUndefined, omitBy } from "lodash";
import React from "react";
import { ApiClientContext, ApiClientContextI } from "./ApiClientContext";

/** Query component props. */
interface QueryProps<TData extends KitsuResponseData, TMeta> {
  /** JSONAPI resource URL path. */
  path: string;

  /** Fields to include in the response data. */
  fields?: FieldsParam;

  /** Resource filter */
  filter?: FilterParam;

  /**
   * Sort order + attribute.
   * Examples:
   *  - name
   *  - -description
   */
  sort?: string;

  /** Included resources. */
  include?: string;

  /** Parameter for paginating listed data. */
  page?: any;

  children: QueryChildren<TData, TMeta>;
}

/** Query component state. */
interface QueryState<TData extends KitsuResponseData, TMeta> {
  loading: boolean;
  error?: JsonApiErrorResponse;
  response?: KitsuResponse<TData, TMeta>;
}

/**
 * Query component's "children" prop type.
 *
 * This component uses the render props pattern to pass data to children components.
 * See: https://reactjs.org/docs/render-props.html
 */
type QueryChildren<TData extends KitsuResponseData, TMeta> = (
  state: QueryState<TData, TMeta>
) => React.ReactNode;

/**
 * Performs a query against the backend JSONAPI web services and passes response data to children
 * components using the render props pattern.
 * See: https://reactjs.org/docs/render-props.html
 */
export class Query<
  TData extends KitsuResponseData,
  TMeta = undefined
> extends React.Component<QueryProps<TData, TMeta>, QueryState<TData, TMeta>> {
  static contextType = ApiClientContext;

  state = {
    loading: true
  };

  async componentDidMount() {
    const { path, fields, filter, sort, include, page } = this.props;
    const { apiClient } = this.context as ApiClientContextI;

    // Omit undefined values from the GET params, which would otherwise cause an invalid request.
    // e.g. /api/region?fields=undefined
    const getParams = omitBy<GetParams>(
      { fields, filter, sort, include, page },
      isUndefined
    );

    try {
      const response = await apiClient.get(path, getParams);
      this.setState({ loading: false, error: undefined, response });
    } catch (error) {
      this.setState({ loading: false, error });
    }
  }

  render() {
    return this.props.children(this.state);
  }
}
