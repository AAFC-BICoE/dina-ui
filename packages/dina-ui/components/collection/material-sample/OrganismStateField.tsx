import {
  AutoSuggestTextField,
  DinaFormSection,
  FieldSpy,
  TextField,
  ToggleField,
  useDinaFormContext
} from "common-ui";
import { DeterminationField, ManagedAttributesEditor } from "../..";
import { DinaMessage } from "../../../intl/dina-ui-intl";
import { Organism } from "../../../types/collection-api";

/**
 * List of field names in the OrganismStateField component.
 * This should be updated when fields are added or removed in the PreparationField component.
 */
export const ORGANISM_FIELDS = [
  "lifeStage",
  "sex",
  "remarks",
  "dwcVernacularName",
  "determination",
  "isTarget",
  "managedAttributes"
] as const;

export interface OrganismStateFieldProps {
  index: number;
  individualEntry: boolean;
  useTargetOrganism?: boolean;
  namePrefix?: string;
  id?: string;
  visibleManagedAttributeKeys?: string[];

  onTargetChecked: (index: number) => void;
}

/** Form section for a single organism. */
export function OrganismStateField({
  index,
  namePrefix = "",
  individualEntry,
  onTargetChecked,
  visibleManagedAttributeKeys,
  useTargetOrganism
}: OrganismStateFieldProps) {
  const { readOnly } = useDinaFormContext();

  /** Applies name prefix to field props */
  function fieldProps(fieldName: (typeof ORGANISM_FIELDS)[number]) {
    return {
      name: `${namePrefix}${fieldName}`,
      // Don't use the prefix for the labels and tooltips:
      customName: fieldName
    };
  }

  const determinationFieldProps = fieldProps("determination");

  return (
    <DinaFormSection sectionName="organisms-general-section">
      <div className="organism-state-field">
        <div className="row">
          {individualEntry && !readOnly && useTargetOrganism && (
            <ToggleField
              {...fieldProps("isTarget")}
              className="col-sm-1"
              onChangeExternal={(checked) => {
                if (checked) {
                  onTargetChecked(index);
                }
              }}
            />
          )}
          <AutoSuggestTextField<Organism>
            className="col-sm-6"
            {...fieldProps("lifeStage")}
            customName="lifeStage"
            jsonApiBackend={{
              query: (search, ctx) => ({
                path: "collection-api/organism",
                filter: {
                  ...(ctx.values.group && { group: { EQ: ctx.values.group } }),
                  rsql: `lifeStage==${search}*`
                }
              }),
              option: (org) => org?.lifeStage
            }}
            blankSearchBackend={"json-api"}
          />
          <AutoSuggestTextField<Organism>
            className={individualEntry ? "col-sm-5" : "col-sm-6"}
            {...fieldProps("sex")}
            customName="sex"
            jsonApiBackend={{
              query: (search, ctx) => ({
                path: "collection-api/organism",
                filter: {
                  ...(ctx.values.group && { group: { EQ: ctx.values.group } }),
                  rsql: `sex==${search}*`
                }
              }),
              option: (org) => org?.sex
            }}
            blankSearchBackend={"json-api"}
          />
          <TextField
            {...fieldProps("remarks")}
            customName="organismRemarks"
            className="col-sm-12"
            multiLines={true}
          />
          <TextField
            {...fieldProps("dwcVernacularName")}
            customName="dwcVernacularName"
            className="col-sm-12"
          />
        </div>
        <ManagedAttributesEditor
          valuesPath={fieldProps("managedAttributes").name}
          managedAttributeApiPath="collection-api/managed-attribute"
          managedAttributeComponent="ORGANISM"
          attributeSelectorWidth={12}
          fieldSetProps={{
            legend: <DinaMessage id="organismManagedAttributes" />,
            className: "non-strip",
            sectionName: "organism-managed-attributes-section"
          }}
          managedAttributeOrderFieldName="organismManagedAttributesOrder"
          visibleAttributeKeys={visibleManagedAttributeKeys}
        />
        <FieldSpy<[]> fieldName={determinationFieldProps.name}>
          {(determinations) =>
            // Hide in read-only mode when there are no determinations:
            readOnly && !determinations?.length ? null : (
              <DeterminationField
                {...determinationFieldProps}
                visibleManagedAttributeKeys={visibleManagedAttributeKeys}
              />
            )
          }
        </FieldSpy>
      </div>
    </DinaFormSection>
  );
}
