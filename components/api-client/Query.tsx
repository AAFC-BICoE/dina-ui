import { KitsuResponseData } from "kitsu";
import React from "react";
import { JsonApiQuerySpec, QueryState, useQuery } from "./useQuery";

/** Query component props. */
export interface QueryProps<TData extends KitsuResponseData, TMeta> {
  query: JsonApiQuerySpec;
  children: QueryChildren<TData, TMeta>;
}

/**
 * Query component's "children" prop type.
 *
 * This component uses the render props pattern to pass data to children components.
 * See: https://reactjs.org/docs/render-props.html
 */
type QueryChildren<TData extends KitsuResponseData, TMeta> = (
  state: QueryState<TData, TMeta>
) => React.ReactElement;

/** Back-end connected Query component. */
export function Query<TData extends KitsuResponseData, TMeta = undefined>({
  children,
  query
}: QueryProps<TData, TMeta>) {
  const queryState = useQuery<TData, TMeta>(query);
  return children(queryState);
}
