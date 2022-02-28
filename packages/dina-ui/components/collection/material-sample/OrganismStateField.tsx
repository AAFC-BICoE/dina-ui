import {
  AutoSuggestTextField,
  FieldSpy,
  TextField,
  useDinaFormContext,
  ToggleField
} from "common-ui";
import { DeterminationField } from "..";
import { Organism } from "../../../types/collection-api";

/**
 * List of field names in the OrganismStateField component.
 * This should be updated when fields are added or removed in the PreparationField component.
 */
export const ORGANISM_FIELDS = [
  "lifeStage",
  "sex",
  "remarks",
  "determination",
  "isTarget"
] as const;

export interface OrganismStateFieldProps {
  individualEntry: boolean;
  namePrefix?: string;
  id?: string;
}

/** Form section for a single organism. */
export function OrganismStateField({
  namePrefix = "",
  individualEntry
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
      <div className="row">
        {individualEntry && (
          <ToggleField
            {...fieldProps("isTarget")}
            className="primary-determination-button"
            // onChangeExternal={checked => {
            //  if (checked) {
            //
            //  }
            // }}
          />
        )}
        <AutoSuggestTextField<Organism>
          className="col-sm-6"
          {...fieldProps("lifeStage")}
          query={(search, ctx) => ({
            path: "collection-api/organism",
            filter: {
              ...(ctx.values.group && { group: { EQ: ctx.values.group } }),
              rsql: `lifeStage==${search}*`
            }
          })}
          suggestion={org => org.lifeStage}
          alwaysShowSuggestions={true}
        />
        <AutoSuggestTextField<Organism>
          className="col-sm-6"
          {...fieldProps("sex")}
          query={(search, ctx) => ({
            path: "collection-api/organism",
            filter: {
              ...(ctx.values.group && { group: { EQ: ctx.values.group } }),
              rsql: `sex==${search}*`
            }
          })}
          suggestion={org => org.sex}
          alwaysShowSuggestions={true}
        />
        <TextField
          {...fieldProps("remarks")}
          customName="organismRemarks"
          className="col-sm-12"
          multiLines={true}
        />
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
