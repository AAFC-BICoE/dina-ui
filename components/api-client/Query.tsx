import Kitsu, {
  FieldsParam,
  FilterParam,
  GetParams,
  JsonApiErrorResponse,
  KitsuResponse,
  KitsuResponseData,
  PageParam
} from "kitsu";
import { isUndefined, omitBy } from "lodash";
import React from "react";

/** Query component props. */
interface QueryProps<TData extends KitsuResponseData> {
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

  /**
   * Included resources.
   */
  include?: string;

  /** Parameter for paginating listed data. */
  page?: PageParam;

  children: QueryChildren<TData>;
}

/** Query component state. */
interface QueryState<TData extends KitsuResponseData> {
  loading: boolean;
  error?: JsonApiErrorResponse;
  response?: KitsuResponse<TData>;
}

/**
 * Query component's "children" prop type.
 *
 * This component uses the render props pattern to pass data to children components.
 * See: https://reactjs.org/docs/render-props.html
 */
type QueryChildren<TData extends KitsuResponseData> = (
  state: QueryState<TData>
) => React.ReactNode;

/** JSONAPI client. */
const apiClient = new Kitsu({
  baseURL: "/api",
  pluralize: false,
  resourceCase: "none"
});

/**
 * Performs a query against the backend JSONAPI web services and passes response data to children
 * components using the render props pattern.
 * See: https://reactjs.org/docs/render-props.html
 */
export class Query<TData extends KitsuResponseData> extends React.Component<
  QueryProps<TData>,
  QueryState<TData>
> {
  state = {
    loading: true
  };

  async componentDidMount() {
    const { path, fields, filter, sort, include, page } = this.props;

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
