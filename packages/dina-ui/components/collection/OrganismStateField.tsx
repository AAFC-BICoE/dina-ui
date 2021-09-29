import { AutoSuggestTextField, FieldSet, filterBy, TextField } from "common-ui";
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
        <div className="col-md-6">
          <div className="row">
            <div className="col-md-6">
              <AutoSuggestTextField<MaterialSample>
                name={`${namePrefix}organism.lifeStage`}
                customName="lifeStage"
                query={(_, _ctx) => ({
                  path: "collection-api/material-sample",
                  include: "organism"
                })}
                suggestion={matSample => matSample.organism?.lifeStage ?? ""}
                alwaysShowSuggestions={true}
              />
            </div>
            <div className="col-md-6">
              <AutoSuggestTextField<MaterialSample>
                name={`${namePrefix}organism.sex`}
                customName="sex"
                query={(_, _ctx) => ({
                  path: "collection-api/material-sample",
                  include: "organism"
                })}
                suggestion={matSample => matSample.organism?.sex ?? ""}
                alwaysShowSuggestions={true}
              />
            </div>
          </div>
          <AutoSuggestTextField<MaterialSample>
            name={`${namePrefix}organism.substrate`}
            customName="substrate"
            query={(_, _ctx) => ({
              path: "collection-api/material-sample",
              include: "organism"
            })}
            suggestion={matSample => matSample.organism?.substrate ?? ""}
            alwaysShowSuggestions={true}
          />
        </div>
        <div className="col-md-6">
          <TextField
            name={`${namePrefix}organism.remarks`}
            customName="remarks"
            multiLines={true}
          />
        </div>
      </div>
    </FieldSet>
  );
}
