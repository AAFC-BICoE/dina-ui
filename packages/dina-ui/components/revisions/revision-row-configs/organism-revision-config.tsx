import { Organism } from "../../../types/collection-api";
import { RevisionRowConfig } from "../revision-row-config";
import { determinationRevision } from "./material-sample-revision-configs";

export const ORGANISM_REVISION_ROW_CONFIG: RevisionRowConfig<Organism> = {
  name: ({ id, determination, lifeStage }) => {
    const primaryDetermination =
      determination?.find((it) => it.isPrimary) ?? {};
    const name =
      primaryDetermination.verbatimScientificName ||
      primaryDetermination.scientificName;

    return <>{name || lifeStage || id}</>;
  },
  customValueCells: {
    determination: ({
      row: {
        original: { value }
      }
    }) => determinationRevision(value)
  }
};
