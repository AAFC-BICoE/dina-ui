/// <reference types="node" />

import { AxiosInstance } from "axios";

declare module "kitsu" {
  export default Kitsu;

  /** JSONAPI client. */
  declare class Kitsu {
    axios: AxiosInstance;

    constructor(params: KitsuConstructorParams);

    delete(...args: any[]): Promise<any>;

    get(path: string, params: GetParams): Promise<KitsuResponse>;

    patch(...args: any[]): Promise<any>;

    post(...args: any[]): Promise<any>;
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
  export interface FilterParam {
    [key: string]: string;
  }

  /** The response from a Kitsu GET request. */
  export interface KitsuResponse<
    TData extends KitsuResponseData,
    TMeta = undefined
  > {
    data: TData;
    meta: TMeta;
  }

  /** The Kitsu response data can either be one resource or an array of resources. */
  export type KitsuResponseData = KitsuResource | KitsuResource[];

  /** JSONAPI resource base attributes. */
  export interface KitsuResource {
    id?: string;
    type: string;
  }
}
