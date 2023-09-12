import { ColumnDef, Row } from "@tanstack/react-table";
import {
  DinaForm,
  FieldHeader,
  FieldSet,
  FieldSpy,
  FormikButton,
  NumberField,
  OnFormikSubmit,
  ReactTable,
  TextField,
  useDinaFormContext
} from "common-ui";
import { FormikContextType } from "formik";
import { isEmpty } from "lodash";
import { NgsIndex } from "packages/dina-ui/types/seqdb-api";
import { ReactNode, useState } from "react";
import * as yup from "yup";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";

export interface NgsIndexFieldProps {
  wrapContent?: (content: ReactNode) => ReactNode;
  id?: string;
}

const fieldName = "ngsIndexes";
const NGS_INDEX_COMPONENT_NAME = "ngs-index-component";

export function NgsIndexField({
  wrapContent = (content) => content,
  id = NGS_INDEX_COMPONENT_NAME
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

  function removeNgxIndex(formik: FormikContextType<NgsIndex>, index: number) {
    setNgsIndexToEdit(null);
    const ngsIndexes = formik.getFieldMeta<NgsIndex[]>(fieldName).value ?? [];
    // Remove the item at the index:
    formik.setFieldValue(fieldName, [
      ...ngsIndexes.slice(0, index),
      ...ngsIndexes.slice(index + 1)
    ]);
  }

  const buttonProps = () => ({ disabled: isEditing, style: { width: "7rem" } });

  const ngxIndexColumns: ColumnDef<NgsIndex>[] = [
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
                  onClick={(_, form) => removeNgxIndex(form, row.index)}
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
      id={id}
      fieldName={fieldName}
      componentName={NGS_INDEX_COMPONENT_NAME}
      sectionName="ngx-index-add-section"
    >
      {wrapContent(
        <FieldSpy fieldName={fieldName}>
          {(value, { form }) => {
            const ngsIndexes = (value ?? []) as NgsIndex[];

            const hasNgxIndexs = !!ngsIndexes.length;

            async function saveNgxIndex(savedNgxIndex: NgsIndex) {
              if (ngsIndexToEdit === "NEW" || !ngsIndexToEdit) {
                form.setFieldValue(fieldName, [...ngsIndexes, savedNgxIndex]);
              } else {
                form.setFieldValue(
                  fieldName,
                  ngsIndexes.map((ngxIndex, index) =>
                    index === ngsIndexToEdit?.index ? savedNgxIndex : ngxIndex
                  )
                );
              }
              setNgsIndexToEdit(null);
            }

            return (
              <>
                {hasNgxIndexs && (
                  <ReactTable<NgsIndex>
                    columns={ngxIndexColumns}
                    defaultSorted={[{ id: "date", desc: true }]}
                    data={ngsIndexes}
                    showPagination={false}
                    className="-striped mb-2"
                    getRowCanExpand={() => true}
                    renderSubComponent={({ row }) => (
                      <div className="m-2">
                        <NgsIndexSubForm
                          ngxIndexToEdit={row.original}
                          onSaveNgxIndex={saveNgxIndex}
                          onCancelClick={
                            hasNgxIndexs
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
                {readOnly ? null : !hasNgxIndexs || ngsIndexToEdit === "NEW" ? (
                  <NgsIndexSubForm
                    onSaveNgxIndex={saveNgxIndex}
                    onCancelClick={
                      hasNgxIndexs ? () => setNgsIndexToEdit(null) : undefined
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
  onSaveNgxIndex: (ngxIndex: NgsIndex) => Promise<void>;
  onCancelClick?: () => void;
  ngxIndexToEdit?: NgsIndex;
}

export const ngsIndexSchema = yup.object({
  name: yup.string().required()
});

export function NgsIndexSubForm({
  onSaveNgxIndex,
  onCancelClick,
  ngxIndexToEdit
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

  const submitNgxIndex: OnFormikSubmit<any> = async (newNgxIndex, formik) => {
    // Return if the sub-form has errors:
    const formErrors = await formik.validateForm();
    if (!isEmpty(formErrors)) {
      formik.setErrors({ ...formik.errors, ...formErrors });
      return;
    }
    await onSaveNgxIndex(newNgxIndex);
  };

  const defaultInitialValues = {};

  return (
    <div onKeyDown={disableEnterToSubmitOuterForm}>
      <FieldSet legend={<DinaMessage id="addNew" />}>
        <DinaForm
          validationSchema={ngsIndexSchema}
          initialValues={ngxIndexToEdit ?? defaultInitialValues}
          componentName={NGS_INDEX_COMPONENT_NAME}
          sectionName="ngx-index-add-section"
        >
          <div className="row">
            <TextField {...fieldProps("name")} className="col-sm-6" />
            <NumberField {...fieldProps("lotNumber")} className="col-sm-6" />
          </div>
          <div className="row">
            <TextField
              {...fieldProps("notes")}
              multiLines={true}
              className="col-sm-12"
            />
          </div>
          <div className="d-flex justify-content-center gap-2">
            <FormikButton
              className="btn btn-primary mb-3 add-button"
              buttonProps={() => ({ style: { width: "10rem" } })}
              onClick={submitNgxIndex}
            >
              <DinaMessage id={ngxIndexToEdit ? "submitBtnText" : "add"} />
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
