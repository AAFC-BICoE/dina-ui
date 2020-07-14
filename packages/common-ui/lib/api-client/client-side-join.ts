import DataLoader from "dataloader";
import { PersistedResource } from "kitsu";
import { get } from "lodash";
import { ApiClientContextI } from "./ApiClientContext";

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
  private joinLoader: DataLoader<
    string,
    PersistedResource<any>
  > = new DataLoader<string, PersistedResource<any>>(async paths => {
    const joinedResources = await this.bulkGet(paths, {
      apiBaseUrl: this.joinSpec.apiBaseUrl,
      returnNullForMissingResource: true
    });
    return joinedResources;
  });

  constructor(
    private bulkGet: ApiClientContextI["bulkGet"],
    private resources: any[],
    private joinSpec: ClientSideJoinSpec
  ) {}

  /** Fetches the joined data and joins it to the  */
  public async join() {
    // Only join on the resources that have the idField set:
    const resourcesToJoin = this.resources.filter(resource =>
      get(resource, this.joinSpec.idField)
    );

    for (const resource of resourcesToJoin) {
      // Call "load" without awaiting so the DataLoader can batch together the
      // required IDs.
      this.joinLoader.load(this.joinSpec.path(resource));
    }

    for (const resource of resourcesToJoin) {
      // The first call to "await" in this loop dispatches the batched API request
      // for all the required joined resources:
      resource[this.joinSpec.joinField] = await this.joinLoader.load(
        this.joinSpec.path(resource)
      );
    }
  }
}
