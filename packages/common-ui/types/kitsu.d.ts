/// <reference types="node" />

import { AxiosInstance } from "axios";
import { JsonValue, SetRequired } from "type-fest";
import { ResponseType } from "axios";
import { SimpleSearchFilter } from "../lib/util/simpleSearchFilterBuilder";

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

  /** Kitsu JSONAPI client constructor parameters. */
  export interface KitsuConstructorParams {
    baseURL: string;
    headers?: any;
    pluralize?: boolean;
    camelCaseTypes?: boolean;
    resourceCase?: "kebab" | "snake" | "none";
    /**
     * Serializes GET parameters to a query string. String values select built-in
     * serializers and function values provide custom serialization.
     */
    query?:
      | "traditional"
      | "modern"
      | ((params: Record<string, any>) => string);
  }

  /** Parameters for GET requests. */
  export interface GetParams {
    /** Fields to include in response data. */
    fields?: FieldsParam;

    /** Resource filter */
    filter?: FilterParam;

    /** FIQL filter */
    fiql?: string;

    /** Sort order and attribute, e.g. "name" or "-description". */
    sort?: string;

    /** Included resources. */
    include?: string;

    /**
     * Computationally expensive fields can be requested per resource type
     * e.g. { "material-sample": "hierarchy,targetDetermination" }
     */
    optfields?: FieldsParam;

    /** Parameter for paginating listed data. */
    page?: any;

    /** Custom request headers. */
    header?: {};

    /** Expected response type such as "json" or "text". */
    responseType?: ResponseType;

    /** Milliseconds before the request aborts from timeout. */
    timeout?: number;
  }

  /** Parameter for requesting sparse fields. */
  export interface FieldsParam {
    [key: string]: string;
  }

  /** Filter parameter built with SimpleSearchFilterBuilder. */
  export type FilterParam =
    | string
    | SimpleSearchFilter
    | Record<string, JsonValue>;

  /** Kitsu GET request response. */
  export interface KitsuResponse<
    TData extends KitsuResponseData,
    TMeta = undefined
  > {
    data: TData extends (infer R)[]
      ? PersistedResource<R>[]
      : PersistedResource<TData>;
    meta: TMeta;
  }

  /** Response data containing a single resource or an array of resources. */
  export type KitsuResponseData = KitsuResource | KitsuResource[];

  /** JSONAPI resource base attributes. */
  export interface KitsuResource {
    id?: string;
    type: string;
  }

  export type KitsuResourceLink =
    // Linking to a resource:
    | {
        id: string;
        type: string;
      }
    // Un-linking a resource:
    | {
        id: null;
        type?: string;
      };

  /** Requires the ID field on a resource and its relationships. */
  export type PersistedResource<TData extends KitsuResource = KitsuResource> = {
    [P in keyof TData]: TData[P] extends KitsuResource
      ? PersistedResource<TData[P]>
      : TData[P] extends KitsuResource | undefined
      ? PersistedResource<TData[P]> | undefined
      : TData[P];
  } & Required<KitsuResource>;

  /**
   * Requires the ID field on linked resources but makes it optional
   * on the main resource. Requires the type field.
   */
  export type InputResource<TData extends KitsuResource> = SetRequired<
    {
      [P in keyof TData]?: NonNullable<TData[P]> extends KitsuResource
        ? KitsuResourceLink
        : TData[P];
    },
    "type"
  >;
}
