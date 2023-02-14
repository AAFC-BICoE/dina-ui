import DataLoader from "dataloader";
import { PersistedResource } from "kitsu";
import { get, set, zipWith } from "lodash";
import { ApiClientI } from "./ApiClientContext";

export interface ClientSideJoinSpec {
  apiBaseUrl?: string;
  idField: string;
  joinField: string;
  path: (resource: any) => string;
}

/**
 * Combines data across multiple back-end APIs from the UI code.
 * Create one instance of this class per join.
 */
export class ClientSideJoiner {
  /** DataLoader to batch find-by-id requests into a single HTTP request. */
  private joinLoader: DataLoader<string, PersistedResource<any> | null> =
    new DataLoader<string, PersistedResource<any> | null>(async (paths) => {
      const joinedResources = await this.bulkGet(paths, {
        apiBaseUrl: this.joinSpec.apiBaseUrl,
        returnNullForMissingResource: true
      });
      return joinedResources;
    });

  constructor(
    private bulkGet: ApiClientI["bulkGet"],
    private resources: any[],
    private joinSpec: ClientSideJoinSpec
  ) {}

  /** Fetches the joined data and joins it to the  */
  public async join() {
    // Only join on the resources that have the idField set:
    const baseResources = this.resources.filter((resource) =>
      get(resource, this.joinSpec.idField)
    );

    const paths = baseResources.map((resource) => this.joinSpec.path(resource));

    // Load the joined resources from the back-end:
    const joinedResources = await this.joinLoader.loadMany(paths);

    // Join the resources:
    zipWith(baseResources, joinedResources, (baseResource, joinedResource) => {
      // DataLoader#loadMany doesn't throw errors; throw here if there are any:
      if (joinedResource instanceof Error) {
        throw joinedResource;
      }

      // Otherwise attach the joined resource:
      set(baseResource, this.joinSpec.joinField, joinedResource);
    });
  }
}
