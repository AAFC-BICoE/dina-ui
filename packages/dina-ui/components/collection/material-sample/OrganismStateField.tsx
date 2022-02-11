import { AutoSuggestTextField, TextField } from "common-ui";
import { DeterminationField } from "..";
import { MaterialSample } from "../../../types/collection-api";

/**
 * List of field names in the OrganismStateField component.
 * This should be updated when fields are added or removed in the PreparationField component.
 */
export const ORGANISM_FIELDS = [
  "lifeStage",
  "sex",
  "remarks",
  "determination"
] as const;

export interface OrganismStateFieldProps {
  namePrefix?: string;
  id?: string;
}

/** Form section for a single organism. */
export function OrganismStateField({
  namePrefix = "",
  id = "organism-state-section"
}: OrganismStateFieldProps) {
  /** Applies name prefix to field props */
  function fieldProps(fieldName: typeof ORGANISM_FIELDS[number]) {
    return {
      name: `${namePrefix}${fieldName}`,
      // Don't use the prefix for the labels and tooltips:
      customName: fieldName
    };
  }

  return (
    <div id={id}>
      <div className="row mx-0">
        <div className="col-md-6">
          <AutoSuggestTextField<MaterialSample>
            {...fieldProps("lifeStage")}
            query={(_, _ctx) => ({
              path: "collection-api/material-sample",
              include: "organism"
            })}
            suggestion={matSample =>
              matSample.organism?.map(it => it?.lifeStage)
            }
            alwaysShowSuggestions={true}
          />
          <AutoSuggestTextField<MaterialSample>
            {...fieldProps("sex")}
            query={(_, _ctx) => ({
              path: "collection-api/material-sample",
              include: "organism"
            })}
            suggestion={matSample => matSample.organism?.map(it => it?.sex)}
            alwaysShowSuggestions={true}
          />
        </div>
        <div className="col-md-6">
          <TextField {...fieldProps("remarks")} multiLines={true} />
        </div>
      </div>
      <DeterminationField {...fieldProps("determination")} />
    </div>
  );
}
