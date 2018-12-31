import Kitsu, {
  FieldsParam,
  GetParams,
  JsonApiErrorResponse,
  KitsuResource,
  KitsuResponse
} from "kitsu";
import { isUndefined, omitBy } from "lodash";
import React from "react";

/** Query component props. */
interface QueryProps {
  /** JSONAPI resource URL path. */
  path: string;
  /** Fields to include in the response data. */
  fields?: FieldsParam;

  children: QueryChildren;
}

/** Query component state. */
interface QueryState {
  loading: boolean;
  error?: JsonApiErrorResponse;
  response?: KitsuResponse<KitsuResource>;
}

/**
 * Query component's "children" prop type.
 *
 * This component uses the render props pattern to pass data to children components.
 * See: https://reactjs.org/docs/render-props.html
 */
type QueryChildren = (state: QueryState) => React.ReactNode;

/** JSONAPI client. */
const apiClient = new Kitsu({
  baseURL: "/api",
  pluralize: false,
  resourceCase: "none",
  headers: {
    Authorization: "Basic cmVhZGVyOnJlYWRlcg=="
  }
});

/**
 * Performs a query against the backend JSONAPI web services and passes response data to children
 * components using the render props pattern.
 * See: https://reactjs.org/docs/render-props.html
 */
export class Query extends React.Component<QueryProps, QueryState> {
  state = {
    loading: true
  };

  async componentDidMount() {
    const { path, fields } = this.props;

    // Omit undefined values from the GET params, which would otherwise cause an invalid request.
    // e.g. /api/region?fields=undefined
    const getParams = omitBy<GetParams>({ fields }, isUndefined);

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
