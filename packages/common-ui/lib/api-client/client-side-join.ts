import DataLoader from "dataloader";
import { PersistedResource } from "kitsu";
import _ from "lodash";
import { ApiClientI } from "./ApiClientContext";

export interface ClientSideJoinSpec {
  apiBaseUrl?: string;
  idField: string;
  joinField: string;
  parser?: any;
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
      _.get(resource, this.joinSpec.idField)
    );

    const paths = baseResources.map((resource) => this.joinSpec.path(resource));

    // Load the joined resources from the back-end:
    let joinedResources = await this.joinLoader.loadMany(paths);
    if (this.joinSpec.parser) {
      // Parse the joined resources if a parser is provided:
      joinedResources = joinedResources.map((resource) =>
        resource ? this.joinSpec.parser(resource) : null
      );
    }

    // Join the resources:
    _.zipWith(
      baseResources,
      joinedResources,
      (baseResource, joinedResource) => {
        // DataLoader#loadMany doesn't throw errors; throw here if there are any:
        if (joinedResource instanceof Error) {
          throw joinedResource;
        }

        // Otherwise attach the joined resource:
        _.set(baseResource, this.joinSpec.joinField, joinedResource);
      }
    );
  }
}
