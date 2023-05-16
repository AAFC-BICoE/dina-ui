import {
  FieldSet,
  NumberField,
  ToggleField,
  useDinaFormContext
} from "common-ui";
import { FieldArray, useFormikContext } from "formik";
import { get } from "lodash";
import { useEffect } from "react";
import { BulkEditTabWarning, OrganismStateField, OrganismsTable } from "../..";
import { DinaMessage } from "../../../intl/dina-ui-intl";
import { ORGANISMS_COMPONENT_NAME } from "../../../types/collection-api";
import { Organism } from "../../../types/collection-api/resources/Organism";

export interface OrganismsFieldProps {
  /** Organism array field name. */
  name: string;
  /** FieldSet id */
  id?: string;

  /** Forwarded to ManagedAttributesEditor. */
  visibleManagedAttributeKeys?: string[];
}

export function OrganismsField({
  name,
  id,
  visibleManagedAttributeKeys
}: OrganismsFieldProps) {
  const { isTemplate, readOnly } = useDinaFormContext();

  const formik = useFormikContext<any>();
  /**
   * Update organism with isTarget flags when organismsQuantity changes
   */
  function updateOrganismArray() {
    formik.values.organism.length = formik.values.organismsQuantity;
    for (let idx = 0; idx <= formik.values.organismsQuantity; idx++) {
      if (formik.values.organism[idx]?.isTarget === true) {
        continue;
      }
      formik.setFieldValue(`${name}[${idx}].isTarget`, false);
    }
  }

  useEffect(() => {
    if (!readOnly && formik.values.useTargetOrganism) {
      updateOrganismArray();
    }
  }, [formik.values.organismsQuantity]);

  const useTargetOrganism = readOnly
    ? formik.values.organism?.some((organism) => organism?.isTarget)
    : formik.values.organism?.some((organism) => organism?.isTarget)
    ? true
    : false;

  if (useTargetOrganism) {
    formik.values.useTargetOrganism = useTargetOrganism;
  }

  return (
    <FieldSet
      id={id}
      className={ORGANISMS_COMPONENT_NAME}
      fieldName={name}
      legend={<DinaMessage id="organisms" />}
      componentName={ORGANISMS_COMPONENT_NAME}
    >
      <BulkEditTabWarning
        targetType="material-sample"
        fieldName={name}
        setDefaultValue={(ctx) => {
          // Auto-create the first organism:
          ctx.bulkEditFormRef?.current?.setFieldValue("organismsQuantity", 1);
          ctx.bulkEditFormRef?.current?.setFieldValue(name, [{}]);
        }}
        // Each Organism can only be attached to one Sample, so never show the Same Values warning,
        // because the bulk edited samples' Organisms should never be the same.
        showWarningWhenValuesAreTheSame={true}
      >
        <FieldArray name={name}>
          {({ form, remove, move }) => {
            const organisms: (Organism | null | undefined)[] =
              get(form.values, name) || [];

            const organismsQuantity = readOnly
              ? organisms.length
              : isTemplate
              ? 1
              : Number(form.values.organismsQuantity ?? 0);

            const organismsIndividualEntry = !!(
              form.values.organismsIndividualEntry ?? false
            );

            function removeOrganism(index: number) {
              remove(index);
              form.setFieldValue("organismsQuantity", organismsQuantity - 1);
            }

            /**
             * Reset all organisms isTarget field to false.
             *
             * This should be used when switching the editing mode (Individual Organism Entry)
             */
            function resetIsTargetFalse() {
              organisms.forEach((_, idx) => {
                form.setFieldValue(`${name}[${idx}].isTarget`, false);
              });
            }

            /**
             * Reset all organisms isTarget field to null.
             *
             * This should be used when switching the editing mode (Individual Organism Entry)
             */
            function resetIsTargetNull() {
              organisms.forEach((_, idx) => {
                form.setFieldValue(`${name}[${idx}].isTarget`, null);
              });
            }

            /**
             * When a target checkbox has been changed from false TO true.
             *
             * Since only one organism (or none) can be marked as a target, this method will
             * reset all the other toggles to false so there is only one marked as the target.
             *
             * @param index The toggle that was changed.
             */
            function targetChecked(index: number) {
              resetIsTargetFalse();
              form.setFieldValue(`${name}[${index}].isTarget`, true);
            }

            return (
              <div>
                {!isTemplate && (
                  <div className="row">
                    <div className="col-md-6 d-flex gap-3">
                      <NumberField
                        name="organismsQuantity"
                        className="flex-grow-1"
                        inputProps={{ type: "number" }}
                        min={0}
                      />
                      {!readOnly && (
                        <div className="d-flex">
                          <ToggleField
                            name="organismsIndividualEntry"
                            onChangeExternal={(checked) => {
                              if (checked === false) {
                                form.setFieldValue("useTargetOrganism", false);
                              }
                              resetIsTargetNull();
                            }}
                          />
                          <ToggleField
                            disableSwitch={!organismsIndividualEntry}
                            name="useTargetOrganism"
                            onChangeExternal={(checked) => {
                              if (checked) {
                                updateOrganismArray();
                                resetIsTargetFalse();
                              } else {
                                resetIsTargetNull();
                              }
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {organismsQuantity > 0 &&
                  (organismsIndividualEntry ? (
                    <OrganismsTable
                      useTargetOrganism={form.values.useTargetOrganism}
                      namePrefix={name}
                      organisms={organisms}
                      organismsQuantity={organismsQuantity}
                      onRemoveClick={removeOrganism}
                      onTargetChecked={targetChecked}
                      onRowMove={move}
                    />
                  ) : (
                    <OrganismStateField
                      index={0}
                      namePrefix={`${name}[0].`}
                      individualEntry={false}
                      onTargetChecked={targetChecked}
                      visibleManagedAttributeKeys={visibleManagedAttributeKeys}
                    />
                  ))}
              </div>
            );
          }}
        </FieldArray>
      </BulkEditTabWarning>
    </FieldSet>
  );
}
