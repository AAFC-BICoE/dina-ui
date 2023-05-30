import { Organism } from "../../../types/collection-api";
import { RevisionRowConfig, RevisionRowConfig8 } from "../revision-row-config";
import { determinationRevision } from "./material-sample-revision-configs";

export const ORGANISM_REVISION_ROW_CONFIG: RevisionRowConfig8<Organism> = {
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
