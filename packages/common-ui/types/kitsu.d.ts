/// <reference types="node" />

import { AxiosInstance } from "axios";
import { SetRequired } from "type-fest";

declare module "kitsu" {
  // export default Kitsu;

  /** JSONAPI client. */
  export default class Kitsu {
    public axios: AxiosInstance;

    public headers: any;

    constructor(params: KitsuConstructorParams);

    public delete(...args: any[]): Promise<any>;

    public get<TData, TMeta = undefined>(
      path: string,
      params: GetParams
    ): Promise<KitsuResponse<TData, TMeta>>;

    public patch(...args: any[]): Promise<any>;

    public post(...args: any[]): Promise<any>;
  }

  /** Params for the Kitsu JSONAPI client's constructor */
  export interface KitsuConstructorParams {
    baseURL: string;
    headers?: any;
    pluralize?: boolean;
    camelCaseTypes?: boolean;
    resourceCase?: "kebab" | "snake" | "none";
  }

  /** Parameters for GET requests. */
  export interface GetParams {
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

    /** Vendor-specific parameter for paginating listed data. */
    page?: any;
  }

  /** Parameter for requesting sparse fields. */
  export interface FieldsParam {
    [key: string]: string;
  }

  /** Parameter for filtering listed data. */
  export type FilterParam = string | Record<string, string>;

  /** The response from a Kitsu GET request. */
  export interface KitsuResponse<
    TData extends KitsuResponseData,
    TMeta = undefined
  > {
    data: TData extends (infer R)[]
      ? PersistedResource<R>[]
      : PersistedResource<TData>;
    meta: TMeta;
  }

  /** The Kitsu response data can either be one resource or an array of resources. */
  export type KitsuResponseData = KitsuResource | KitsuResource[];

  /** JSONAPI resource base attributes. */
  export interface KitsuResource {
    id?: string;
    type: string;
  }

  export interface KitsuResourceLink {
    id: string | null;
    type: string;
  }

  /**
   * Makes the 'id' field required on a resource type and all of its relationships.
   * Used when assuming that data from the back-end always has the ID set.
   */
  export type PersistedResource<TData extends KitsuResource = KitsuResource> = {
    [P in keyof TData]: TData[P] extends KitsuResource
      ? PersistedResource<TData[P]>
      : TData[P] extends KitsuResource | undefined
      ? PersistedResource<TData[P]> | undefined
      : TData[P];
  } &
    Required<KitsuResource>;

  /**
   * Used when creating or updating a resource.
   * Makes the 'id' field optional on the main resource.
   * Makes the 'id' field required on linked resources.
   * 'type' must be defined.
   */
  export type InputResource<TData extends KitsuResource> = SetRequired<
    {
      [P in keyof TData]?: TData[P] extends KitsuResource | undefined
        ? Required<KitsuResourceLink> | undefined
        : TData[P];
    },
    "type"
  >;
}
