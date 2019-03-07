import { GetParams, KitsuResponse, KitsuResponseData } from "kitsu";
import { isEqual, isUndefined, omitBy } from "lodash";
import React from "react";
import { ApiClientContext, ApiClientContextI } from "./ApiClientContext";
import { JsonApiErrorResponse } from "./jsonapi-types";

/** Attributes that compose a JsonApi query. */
interface JsonApiQuerySpec extends GetParams {
  path: string;
}

/** Query component props. */
interface QueryProps<TData extends KitsuResponseData, TMeta> {
  query: JsonApiQuerySpec;
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
  public static contextType = ApiClientContext;

  public state = {
    loading: true
  };

  public async componentDidMount(): Promise<void> {
    // Fetch the data when the component is mounted.
    await this.fetchData();
  }

  public async componentDidUpdate(
    prevProps: Readonly<QueryProps<TData, TMeta>>
  ) {
    // Only re-fetch the data if the query prop was changed.
    if (!isEqual(prevProps.query, this.props.query)) {
      this.setState({ loading: true });
      await this.fetchData();
    }
  }

  public render() {
    return this.props.children(this.state);
  }

  private async fetchData(): Promise<void> {
    const { path, fields, filter, sort, include, page } = this.props.query;
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
}
