import { KitsuResponse, KitsuResponseData } from "kitsu";
import React from "react";
import {
  JsonApiQuerySpec,
  QueryOptions,
  QueryState,
  useQuery
} from "./useQuery";

/** Query component props. */
export interface QueryProps<TData extends KitsuResponseData, TMeta> {
  onSuccess?: (response: KitsuResponse<TData, TMeta>) => void;
  query: JsonApiQuerySpec;
  options?: QueryOptions<TData, TMeta>;
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
) => React.ReactElement | null;

/** Back-end connected Query component. */
export function Query<TData extends KitsuResponseData, TMeta = undefined>({
  children,
  options,
  onSuccess = options?.onSuccess,
  query
}: QueryProps<TData, TMeta>) {
  const queryState = useQuery<TData, TMeta>(query, { ...options, onSuccess });
  return children(queryState);
}
