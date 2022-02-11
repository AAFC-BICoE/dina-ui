import {
  AutoSuggestTextField,
  FieldSpy,
  TextField,
  useDinaFormContext
} from "common-ui";
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
  namePrefix = ""
}: OrganismStateFieldProps) {
  const { readOnly } = useDinaFormContext();

  /** Applies name prefix to field props */
  function fieldProps(fieldName: typeof ORGANISM_FIELDS[number]) {
    return {
      name: `${namePrefix}${fieldName}`,
      // Don't use the prefix for the labels and tooltips:
      customName: fieldName
    };
  }

  const determinationFieldProps = fieldProps("determination");

  return (
    <div className="organism-state-field">
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
      <FieldSpy<[]> fieldName={determinationFieldProps.name}>
        {determinations =>
          // Hide in read-only mode when there are no determinations:
          readOnly && !determinations?.length ? null : (
            <DeterminationField {...determinationFieldProps} />
          )
        }
      </FieldSpy>
    </div>
  );
}
