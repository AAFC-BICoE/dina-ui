import Kitsu, { KitsuResource, KitsuResponse } from "kitsu";
import React from "react";

/** Query component props. */
interface QueryProps {
  path: string;
  children: QueryChildren;
}

/** Query component state. */
interface QueryState {
  response?: KitsuResponse<KitsuResource>;
  loading: boolean;
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
  resourceCase: "none"
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
    const response = await apiClient.get(this.props.path);
    this.setState({ loading: false, response });
  }

  render() {
    return this.props.children(this.state);
  }
}
