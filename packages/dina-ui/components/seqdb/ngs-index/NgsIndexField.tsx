import { ColumnDef, Row } from "@tanstack/react-table";
import {
  DateField,
  DinaForm,
  FieldHeader,
  FieldSet,
  FieldSpy,
  FormikButton,
  NumberField,
  OnFormikSubmit,
  ReactTable,
  SelectField,
  TextField,
  useDinaFormContext
} from "common-ui";
import { FormikContextType } from "formik";
import _ from "lodash";
import { NgsIndex } from "packages/dina-ui/types/seqdb-api";
import { ReactNode, useState } from "react";
import * as yup from "yup";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";

export interface NgsIndexFieldProps {
  wrapContent?: (content: ReactNode) => ReactNode;
  onRemoveNgsIndex: (ngsIndex: NgsIndex) => void;
}

const fieldName = "ngsIndexes";
const NGS_INDEX_COMPONENT_NAME = "ngs-index-component";

const DIRECTION_OPTIONS = [
  {
    label: "I5",
    value: "I5"
  },
  {
    label: "I7",
    value: "I7"
  },
  {
    label: "FORWARD",
    value: "FORWARD"
  },
  {
    label: "REVERSE",
    value: "REVERSE"
  }
];

export function NgsIndexField({
  wrapContent = (content) => content,
  onRemoveNgsIndex
}: NgsIndexFieldProps) {
  const { readOnly } = useDinaFormContext();
  const { formatMessage } = useDinaIntl();

  const [ngsIndexToEdit, setNgsIndexToEdit] = useState<
    "NEW" | { index: number } | null
  >(null);

  const isEditing = !!ngsIndexToEdit;

  function openRowEditor(row: Row<NgsIndex>) {
    row.getToggleExpandedHandler()();
    setNgsIndexToEdit({ index: row.index });
  }

  function removeNgsIndex(formik: FormikContextType<NgsIndex>, index: number) {
    setNgsIndexToEdit(null);
    const ngsIndexes = formik.getFieldMeta<NgsIndex[]>(fieldName).value ?? [];
    onRemoveNgsIndex(ngsIndexes[index]);
    // Remove the item at the index:
    formik.setFieldValue(fieldName, [
      ...ngsIndexes.slice(0, index),
      ...ngsIndexes.slice(index + 1)
    ]);
  }

  const buttonProps = () => ({ disabled: isEditing, style: { width: "7rem" } });

  const ngsIndexColumns: ColumnDef<NgsIndex>[] = [
    {
      accessorKey: "name",
      header: () => <FieldHeader name={formatMessage("field_name")} />
    },
    {
      accessorKey: "lotNumber",
      header: () => <FieldHeader name={formatMessage("field_lotNumber")} />
    },
    {
      accessorKey: "direction",
      header: () => <FieldHeader name={formatMessage("field_direction")} />
    },
    {
      accessorKey: "purification",
      header: () => <FieldHeader name={formatMessage("field_purification")} />
    },
    ...(readOnly
      ? []
      : [
          {
            id: "action",
            size: 270,
            cell: ({ row }) => (
              <div className={`d-flex gap-3`}>
                <FormikButton
                  className="btn btn-primary edit-button"
                  buttonProps={buttonProps}
                  onClick={() => openRowEditor(row)}
                >
                  <DinaMessage id="editButtonText" />
                </FormikButton>
                <FormikButton
                  className="btn btn-danger remove-button"
                  buttonProps={buttonProps}
                  onClick={(_, form) => removeNgsIndex(form, row.index)}
                >
                  <DinaMessage id="remove" />
                </FormikButton>
              </div>
            )
          }
        ])
  ];

  return (
    <FieldSet
      legend={<DinaMessage id="ngsIndexes" />}
      id={NGS_INDEX_COMPONENT_NAME}
      fieldName={fieldName}
      componentName={NGS_INDEX_COMPONENT_NAME}
      sectionName="ngs-index-add-section"
    >
      {wrapContent(
        <FieldSpy fieldName={fieldName}>
          {(value, { form }) => {
            const ngsIndexes = (value ?? []) as NgsIndex[];

            const hasNgsIndexs = !!ngsIndexes.length;

            async function saveNgsIndex(savedNgsIndex: NgsIndex) {
              if (ngsIndexToEdit === "NEW" || !ngsIndexToEdit) {
                form.setFieldValue(fieldName, [...ngsIndexes, savedNgsIndex]);
              } else {
                form.setFieldValue(
                  fieldName,
                  ngsIndexes.map((ngsIndex, index) =>
                    index === ngsIndexToEdit?.index ? savedNgsIndex : ngsIndex
                  )
                );
              }
              setNgsIndexToEdit(null);
            }

            return (
              <>
                {hasNgsIndexs && (
                  <ReactTable<NgsIndex>
                    columns={ngsIndexColumns}
                    sort={[{ id: "date", desc: true }]}
                    data={ngsIndexes}
                    showPagination={false}
                    className="-striped mb-2"
                    getRowCanExpand={() => true}
                    renderSubComponent={({ row }) => (
                      <div className="m-2">
                        <NgsIndexSubForm
                          ngsIndexToEdit={row.original}
                          onSaveNgsIndex={(newNgsIndex) => {
                            row.getToggleExpandedHandler()();
                            return saveNgsIndex(newNgsIndex);
                          }}
                          onCancelClick={
                            hasNgsIndexs
                              ? () => {
                                  setNgsIndexToEdit(null);
                                  row.getToggleExpandedHandler()();
                                }
                              : undefined
                          }
                        />
                      </div>
                    )}
                  />
                )}
                {readOnly ? null : !hasNgsIndexs || ngsIndexToEdit === "NEW" ? (
                  <NgsIndexSubForm
                    onSaveNgsIndex={(newNgsIndex) => {
                      return saveNgsIndex(newNgsIndex);
                    }}
                    onCancelClick={
                      hasNgsIndexs ? () => setNgsIndexToEdit(null) : undefined
                    }
                  />
                ) : (
                  <FormikButton
                    className="btn btn-primary mb-3 add-new-button"
                    buttonProps={buttonProps}
                    onClick={() => setNgsIndexToEdit("NEW")}
                  >
                    <DinaMessage id="addNew" />
                  </FormikButton>
                )}
              </>
            );
          }}
        </FieldSpy>
      )}
    </FieldSet>
  );
}

export interface NgsIndexSubFormProps {
  onSaveNgsIndex: (ngsIndex: NgsIndex) => Promise<void>;
  onCancelClick?: () => void;
  ngsIndexToEdit?: NgsIndex;
}

export const ngsIndexSchema = yup.object({
  name: yup.string().required()
});

export function NgsIndexSubForm({
  onSaveNgsIndex,
  onCancelClick,
  ngsIndexToEdit
}: NgsIndexSubFormProps) {
  function disableEnterToSubmitOuterForm(e) {
    // Pressing enter should not submit the outer form:
    if (e.keyCode === 13 && e.target.tagName !== "TEXTAREA") {
      e.preventDefault();
      // TODO Submit inner form.
    }
  }

  /** Applies name prefix to field props */
  function fieldProps(fieldNm: keyof NgsIndex) {
    return {
      name: fieldNm,
      customName: fieldNm
    };
  }

  const submitNgsIndex: OnFormikSubmit<any> = async (newNgsIndex, formik) => {
    // Return if the sub-form has errors:
    const formErrors = await formik.validateForm();
    if (!_.isEmpty(formErrors)) {
      formik.setErrors({ ...formik.errors, ...formErrors });
      return;
    }
    await onSaveNgsIndex(newNgsIndex);
  };

  const title = ngsIndexToEdit ? "editNgsIndexTitle" : "addNgsIndexTitle";

  const defaultInitialValues = ngsIndexToEdit ?? {};

  return (
    <div onKeyDown={disableEnterToSubmitOuterForm}>
      <FieldSet legend={<DinaMessage id={title} />}>
        <DinaForm
          validationSchema={ngsIndexSchema}
          initialValues={defaultInitialValues}
          componentName={NGS_INDEX_COMPONENT_NAME}
          sectionName="ngs-index-add-section"
        >
          <div className="row">
            <TextField className="col-md-4" {...fieldProps("name")} />
            <NumberField className="col-md-4" {...fieldProps("lotNumber")} />
            <SelectField
              className="col-md-4"
              {...fieldProps("direction")}
              options={DIRECTION_OPTIONS}
            />
          </div>
          <div className="row">
            <TextField className="col-md-4" {...fieldProps("purification")} />
            <TextField className="col-md-4" {...fieldProps("tmCalculated")} />
            <DateField className="col-md-4" {...fieldProps("dateOrdered")} />
          </div>
          <div className="row">
            <DateField className="col-md-4" {...fieldProps("dateDestroyed")} />
            <TextField className="col-md-4" {...fieldProps("application")} />
            <TextField className="col-md-4" {...fieldProps("reference")} />
          </div>
          <div className="row">
            <TextField className="col-md-4" {...fieldProps("supplier")} />
            <TextField className="col-md-4" {...fieldProps("designedBy")} />
            <TextField
              className="col-md-4"
              {...fieldProps("stockConcentration")}
            />
          </div>
          <div className="row">
            <TextField className="col-md-4" {...fieldProps("litReference")} />
            <TextField className="col-md-4" {...fieldProps("primerSequence")} />
            <TextField
              className="col-md-4"
              {...fieldProps("miSeqHiSeqIndexSequence")}
            />
          </div>
          <div className="row">
            <TextField
              className="col-md-4"
              {...fieldProps("miniSeqNextSeqIndexSequence")}
            />
            <TextField
              multiLines={true}
              className="col-md-8"
              {...fieldProps("notes")}
            />
          </div>
          <div className="d-flex justify-content-center gap-2">
            <FormikButton
              className="btn btn-primary mb-3 add-button"
              buttonProps={() => ({ style: { width: "10rem" } })}
              onClick={submitNgsIndex}
            >
              <DinaMessage id={ngsIndexToEdit ? "submitBtnText" : "add"} />
            </FormikButton>
            {onCancelClick && (
              <FormikButton
                className="btn btn-dark mb-3"
                buttonProps={() => ({ style: { width: "10rem" } })}
                onClick={onCancelClick}
              >
                <DinaMessage id="cancelButtonText" />
              </FormikButton>
            )}
          </div>
        </DinaForm>
      </FieldSet>
    </div>
  );
}
