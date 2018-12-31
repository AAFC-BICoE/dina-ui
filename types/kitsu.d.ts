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
  }

  /** Parameter for requesting sparse fields. */
  export interface FieldsParam {
    [key: string]: string;
  }

  /** The response from a Kitsu GET request. */
  export interface KitsuResponse<TResource extends KitsuResource> {
    data: TResource[];
  }

  /** JSONAPI resource base attributes. */
  export interface KitsuResource {
    id: string;
    type: string;
  }

  export interface JsonApiErrorResponse {
    errors: JsonApiError[];
  }
  
  export interface JsonApiError {
    status?: string;
    title?: string;
    detail?: string;
  }
  
}
