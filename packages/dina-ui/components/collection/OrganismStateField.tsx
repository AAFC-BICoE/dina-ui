import { AutoSuggestTextField, FieldSet, TextField } from "common-ui";
import { InputResource } from "kitsu";
import { Organism } from "packages/dina-ui/types/collection-api/resources/Organism";
import { DinaMessage } from "../../intl/dina-ui-intl";
import { MaterialSample } from "../../types/collection-api";

/**
 * List of field names in the OrganismStateField component.
 * This should be updated when fields are added or removed in the PreparationField component.
 */
export const ORGANISM_FIELDS = [
  "lifeStage",
  "sex",
  "substrate",
  "remarks"
] as const;

/** Blank values for all organism fields. */
export const BLANK_ORGANISM: Required<
  Pick<InputResource<Organism>, typeof ORGANISM_FIELDS[number]>
> = Object.seal({
  lifeStage: null,
  sex: null,
  substrate: null,
  remarks: null
});

export interface OrganismStateFieldProps {
  className?: string;
  namePrefix?: string;
}

export function OrganismStateField({
  className,
  namePrefix = ""
}: OrganismStateFieldProps) {
  return (
    <FieldSet
      className={className}
      id="organism-state-section"
      legend={<DinaMessage id="organismState" />}
    >
      <div className="row">
        <TextField
          name={`${namePrefix}organism.lifeStage`}
          customName="lifeState"
        />
        <TextField name={`${namePrefix}organism.sex`} customName="sex" />
        <AutoSuggestTextField<MaterialSample>
          name="organism.substrate"
          customName="substrate"
          query={(searchValue, ctx) => ({
            path: "collection-api/material-sample",
            filter: {
              ...(ctx.values.group && { group: { EQ: ctx.values.group } }),
              rsql: `organism.substrate==*${searchValue}*`
            },
            include: "organism"
          })}
          suggestion={matSample => matSample.organism?.substrate ?? ""}
        />
        <TextField
          name={`${namePrefix}organism.remarks`}
          customName="remarks"
          multiLines={true}
        />
      </div>
    </FieldSet>
  );
}
