/// <reference types="node" />

declare module "kitsu" {
  export default Kitsu;

  /** JSONAPI client. */
  declare class Kitsu {
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
    fields?: FieldsParam;
    filter?: FilterParam;
    sort?: string;
    include?: string;
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
  export interface KitsuResponse<TData extends KitsuResponseData> {
    data: TData;
  }

  /** The Kitsu response data acn either be one resource or an array of resources. */
  export type KitsuResponseData = KitsuResource | KitsuResource[];

  /** JSONAPI resource base attributes. */
  export interface KitsuResource {
    id: string;
    type: string;
  }

  /**
   * JSONAPI error response.
   * See https://jsonapi.org/format/#errors
   */
  export interface JsonApiErrorResponse {
    errors: JsonApiError[];
  }

  /**
   * JSONAPI error object.
   * See https://jsonapi.org/format/#error-objects
   */
  export interface JsonApiError {
    id?: string
    links?: any
    status?: string;
    code?: string;
    title?: string;
    detail?: string;
    source?: any;
    meta?: any;
  }
}
