/// <reference types="node" />

declare module "kitsu" {
  export default Kitsu;

  declare class Kitsu {
    constructor(params: KitsuConstructorParams);

    delete(...args: any[]): Promise<any>;

    get(path: string): Promise<KitsuResponse>;

    patch(...args: any[]): Promise<any>;

    post(...args: any[]): Promise<any>;
  }

  export interface KitsuConstructorParams {
    baseURL: string;
    headers?: any;
    pluralize?: boolean;
    camelCaseTypes?: boolean;
    resourceCase?: "kebab" | "snake" | "none";
  }

  export interface KitsuResponse<TResource extends KitsuResource> {
    data: TResource[];
  }

  export interface KitsuResource {
    id: string;
    type: string;
  }
}
