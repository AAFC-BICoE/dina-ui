import { ColumnDef, Row } from "@tanstack/react-table";
import classNames from "classnames";
import {
  FieldHeader,
  FieldSet,
  FormikButton,
  NumberField,
  ReactTable,
  ToggleField,
  useDinaFormContext,
  useFieldLabels
} from "common-ui";
import { FieldArray, useFormikContext } from "formik";
import _ from "lodash";
import { useEffect } from "react";
import { BulkEditTabWarning, OrganismStateField } from "../..";
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
              _.get(form.values, name) || [];

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
                        customName="organismsQuantity"
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

interface OrganismsTableProps {
  organismsQuantity: number;
  organisms: (Organism | null | undefined)[];
  namePrefix: string;
  onRemoveClick: (index: number) => void;
  onTargetChecked: (index: number) => void;
  onRowMove: (from: number, to: number) => void;
  useTargetOrganism: boolean;
}

function OrganismsTable({
  organismsQuantity,
  organisms,
  namePrefix,
  onRemoveClick,
  onTargetChecked,
  onRowMove,
  useTargetOrganism
}: OrganismsTableProps) {
  const { getFieldLabel } = useFieldLabels();
  const { isTemplate, readOnly } = useDinaFormContext();

  function handleRemoveClick(index: number) {
    onRemoveClick(index);
  }

  const tableColumns: ColumnDef<Organism>[] = [
    {
      id: "expander",
      header: () => null,
      cell: ({ row }) => <OrganismExpanderComponent row={row} />,
      size: 80
    },
    {
      id: "determination",
      cell: ({ row: { original: o } }) => {
        const primaryDet = o?.determination?.find((it) => it.isPrimary);
        const { scientificName, verbatimScientificName } = primaryDet ?? {};

        const cellText = verbatimScientificName || scientificName;
        return <span className="organism-determination-cell">{cellText}</span>;
      },
      header: () => <DinaMessage id="determinationPrimary" />
    },
    ...["lifeStage", "sex"].map<ColumnDef<Organism>>((accessorKey) => ({
      accessorKey,
      meta: { className: `${accessorKey}-cell` },
      header: () => (
        <FieldHeader name={getFieldLabel({ name: accessorKey }).fieldLabel} />
      )
    })),
    ...(readOnly
      ? []
      : [
          {
            id: "actionColumn",
            header: () => <></>,
            cell: ({ row: { index } }) => (
              <>
                {!isTemplate && !readOnly && (
                  <FormikButton
                    className="btn btn-dark remove-organism-button"
                    onClick={() => handleRemoveClick(index)}
                  >
                    <DinaMessage id="removeOrganism" />
                  </FormikButton>
                )}
              </>
            ),
            size: 200
          }
        ])
  ];

  if (useTargetOrganism) {
    const checkboxProps = {
      style: {
        display: "block",
        height: "20px",
        marginLeft: "15px",
        width: "20px"
      },
      type: "checkbox",
      readOnly: true
    };
    tableColumns.splice(1, 0, {
      header: () => <DinaMessage id="isTargetHeader" />,
      id: "isTarget",
      cell: ({ row: { original: o } }) => {
        const isTarget: boolean = o?.isTarget ?? false;
        const checkMark = <input {...checkboxProps} checked={isTarget} />;

        return <span className="organism-target-cell">{checkMark}</span>;
      }
    });
  }

  /** Only show up to the organismsQuantity number */
  const visibleTableData: Organism[] = [...new Array(organismsQuantity)].map(
    (_, index) => organisms[index] || { type: "organism", isTarget: false }
  );

  const expandAll = visibleTableData.reduce<Record<number, boolean>>(
    (prev, _, currIndex) => ({ ...prev, [currIndex]: true }),
    {}
  );

  /** Number-to-boolean map for when only the first organism is expanded. */
  const expandFirstOnly = {
    [0]: organismsQuantity === 1
  };

  const initialExpanded: Record<number, boolean> = readOnly
    ? expandAll
    : expandFirstOnly;

  return (
    <>
      <style>{`
        .rt-expandable, .rt-th:first-child {
          min-width: 4rem !important;
        }
      `}</style>
      <ReactTable<Organism>
        columns={tableColumns}
        enableDnd={!readOnly && !isTemplate}
        onRowMove={onRowMove}
        data={visibleTableData}
        enableSorting={false}
        getRowCanExpand={() => true}
        defaultExpanded={initialExpanded}
        renderSubComponent={({ row, index }) => {
          const isOdd = ((index ?? 0) + 1) % 2 === 1;

          // Add zebra striping to the subcomponent background:
          const backgroundColor = isOdd ? "rgba(0,0,0,0.03)" : undefined;

          return (
            <div className={isOdd ? "-odd" : ""} style={{ backgroundColor }}>
              <div className="p-3">
                <OrganismStateField
                  index={index ?? 0}
                  namePrefix={`${namePrefix}[${row.index}].`}
                  individualEntry={true}
                  useTargetOrganism={useTargetOrganism}
                  onTargetChecked={onTargetChecked}
                />
              </div>
            </div>
          );
        }}
        showPagination={false}
        className="-striped"
      />
    </>
  );
}

function OrganismExpanderComponent({ row }: { row: Row<Organism> }) {
  const { errors } = useFormikContext();

  const prefix = `organism[${row.index}]`;

  const isExpanded = row.getIsExpanded();

  const hasError =
    !_.isEmpty(_.get(errors, prefix)) ||
    _.keys(errors).some((key) => key.startsWith(prefix));

  return (
    <button
      className={classNames(
        "btn btn-light expand-organism",
        `${isExpanded ? "is" : "not"}-expanded`
      )}
      style={{ backgroundColor: "inherit" }}
      type="button"
      onClick={row.getToggleExpandedHandler()}
    >
      <div>
        <span className={`rt-expander ${isExpanded ? "-open" : false}`}>•</span>
      </div>
      {hasError && (
        <div className="text-danger is-invalid">
          ({<DinaMessage id="hasError" />})
        </div>
      )}
    </button>
  );
}
