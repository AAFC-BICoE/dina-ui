import { ColumnDef, Row } from "@tanstack/react-table";
import {
  DinaForm,
  FieldHeader,
  FieldSet,
  FieldSpy,
  FormikButton,
  OnFormikSubmit,
  ReactTable,
  TextField,
  useDinaFormContext
} from "common-ui";
import { FormikContextType } from "formik";
import _ from "lodash";
import { Fragment, ReactNode, useState } from "react";
import * as yup from "yup";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import {
  BIBLIOGRAPHIC_REFERENCES_COMPONENT_NAME,
  BibliographicReference
} from "../../../types/collection-api";
import React from "react";
import { MdEdit } from "react-icons/md";
import Switch from "react-switch";

/** Type-safe object with all BibliographicReference fields. */
export const BIBLIOGRAPHIC_REFERENCE_FIELDS_OBJECT: Required<
  Record<keyof BibliographicReference, true>
> = {
  title: true
};

/** All fields of the BibliographicReference type. */
export const BIBLIOGRAPHIC_REFERENCE_FIELDS = Object.keys(
  BIBLIOGRAPHIC_REFERENCE_FIELDS_OBJECT
);

export const bibliographicReferenceSchema = yup.object({
  title: yup.string().required()
});

export interface BibliographicReferencesFieldProps {
  className?: string;
  wrapContent?: (content: ReactNode) => ReactNode;
  id?: string;
}

export function BibliographicReferencesField({
  className,
  wrapContent = (content) => content,
  id = BIBLIOGRAPHIC_REFERENCES_COMPONENT_NAME
}: BibliographicReferencesFieldProps) {
  const fieldName = "bibliographicReferences";

  const { readOnly } = useDinaFormContext();
  const { formatMessage } = useDinaIntl();

  const [referenceToEdit, setReferenceToEdit] = useState<
    "NEW" | { index: number } | null
  >(null);

  const isEditing = !!referenceToEdit;
  function openRowEditor(row: Row<BibliographicReference>) {
    row.getToggleExpandedHandler()();
    setReferenceToEdit({ index: row.index });
  }

  function removeAction(
    formik: FormikContextType<BibliographicReference>,
    index: number
  ) {
    setReferenceToEdit(null);
    const bibliographicReferences =
      formik.getFieldMeta<BibliographicReference[]>(fieldName).value ?? [];
    // Remove the item at the index:
    formik.setFieldValue(fieldName, [
      ...bibliographicReferences.slice(0, index),
      ...bibliographicReferences.slice(index + 1)
    ]);
  }

  const buttonProps = () => ({ disabled: isEditing, style: { width: "7rem" } });

  const columns: ColumnDef<BibliographicReference>[] = [
    {
      id: "doi",
      accessorKey: "doi",
      header: () => <FieldHeader name={formatMessage("doi")} />
    },
    {
      id: "title",
      accessorKey: "title",
      header: () => <FieldHeader name={formatMessage("title")} />
    },
    {
      id: "year",
      accessorKey: "year",
      header: () => <FieldHeader name={formatMessage("year")} />
    },
    {
      id: "author",
      accessorKey: "author",
      header: () => <FieldHeader name={formatMessage("author")} />
    },
    {
      id: "authorID",
      accessorKey: "authorID",
      header: () => <FieldHeader name={formatMessage("authorID")} />
    },
    {
      id: "journal",
      accessorKey: "journal",
      header: () => <FieldHeader name={formatMessage("journal")} />
    },
    {
      id: "volume",
      accessorKey: "volume",
      header: () => <FieldHeader name={formatMessage("volume")} />
    },
    {
      id: "pages",
      accessorKey: "pages",
      header: () => <FieldHeader name={formatMessage("pages")} />
    },
    {
      id: "referenceRemarks",
      accessorKey: "referenceRemarks",
      header: () => <FieldHeader name={formatMessage("referenceRemarks")} />
    },
    ...(readOnly
      ? []
      : [
          {
            id: "reference",
            size: 270,
            cell: ({ row }) => (
              <div className={`d-flex gap-3`}>
                <FormikButton
                  className="btn btn-primary edit-button"
                  buttonProps={buttonProps}
                  onClick={() => openRowEditor(row)}
                >
                  <MdEdit className="me-2" />
                  <DinaMessage id="editButtonText" />
                </FormikButton>
                <FormikButton
                  className="btn btn-danger remove-button"
                  buttonProps={buttonProps}
                  onClick={(_, form) => removeAction(form, row.index)}
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
      className={className}
      id={id}
      legend={<DinaMessage id="bibliographicReferences" />}
      fieldName={fieldName}
      componentName={BIBLIOGRAPHIC_REFERENCES_COMPONENT_NAME}
      sectionName="bibliographic-references-add-section"
    >
      {wrapContent(
        <FieldSpy fieldName={fieldName}>
          {(value, { form }) => {
            const bibliographicReferences = (value ??
              []) as BibliographicReference[];

            const hasReferences = !!bibliographicReferences.length;

            async function saveReference(
              savedReference: BibliographicReference
            ) {
              if (referenceToEdit === "NEW" || !referenceToEdit) {
                form.setFieldValue(fieldName, [
                  ...bibliographicReferences,
                  savedReference
                ]);
              } else {
                form.setFieldValue(
                  fieldName,
                  bibliographicReferences.map((reference, index) =>
                    index === referenceToEdit?.index
                      ? savedReference
                      : reference
                  )
                );
              }
              setReferenceToEdit(null);
            }

            return (
              <>
                {hasReferences && (
                  <ReactTable<BibliographicReference>
                    columns={columns}
                    sort={[{ id: "date", desc: true }]}
                    data={bibliographicReferences}
                    showPagination={false}
                    className="-striped mb-2"
                    getRowCanExpand={() => true}
                    renderSubComponent={({ row }) => (
                      <div className="m-2">
                        <BibliographicReferenceSubForm
                          referenceToEdit={row.original}
                          onSaveReference={(newReference) => {
                            row.getToggleExpandedHandler()();
                            return saveReference(newReference);
                          }}
                          onCancelClick={
                            hasReferences
                              ? () => {
                                  setReferenceToEdit(null);
                                  row.getToggleExpandedHandler()();
                                }
                              : undefined
                          }
                        />
                      </div>
                    )}
                  />
                )}
                {readOnly ? null : !hasReferences ||
                  referenceToEdit === "NEW" ? (
                  <BibliographicReferenceSubForm
                    onSaveReference={(newReference) => {
                      return saveReference(newReference);
                    }}
                    onCancelClick={
                      hasReferences ? () => setReferenceToEdit(null) : undefined
                    }
                  />
                ) : (
                  <FormikButton
                    className="btn btn-primary mb-3 add-new-button"
                    buttonProps={buttonProps}
                    onClick={() => setReferenceToEdit("NEW")}
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

export interface BibliographicReferenceSubFormProps {
  onSaveReference: (reference: BibliographicReference) => Promise<void>;
  onCancelClick?: () => void;
  referenceToEdit?: BibliographicReference;
}

export function BibliographicReferenceSubForm({
  onSaveReference,
  onCancelClick,
  referenceToEdit
}: BibliographicReferenceSubFormProps) {
  const { initialValues, isTemplate } = useDinaFormContext();
  const [isManualInput, setIsManualInput] = useState(false);
  const { formatMessage } = useDinaIntl();

  // TODO: This needs to be fixed.
  const enabledFields: string[] = [];

  const referenceTemplateInitialValues = enabledFields
    ? initialValues.bibliographicReference
    : undefined;

  function disableEnterToSubmitOuterForm(e) {
    // Pressing enter should not submit the outer form:
    if (e.keyCode === 13 && e.target.tagName !== "TEXTAREA") {
      e.preventDefault();
      // TODO Submit inner form.
    }
  }

  // Use a subform for Material Sample form, or use the parent template form for templates.
  const FormWrapper = isTemplate ? Fragment : DinaForm;

  /** Applies name prefix to field props */
  function fieldProps(fieldName: keyof BibliographicReference) {
    const templateFieldName = `bibliographicReference.${fieldName}`;
    return {
      name: isTemplate ? templateFieldName : fieldName,
      // If the first determination is enabled, then enable multiple determinations:
      templateCheckboxFieldName: templateFieldName,
      // Don't use the prefix for the labels and tooltips:
      customName: fieldName
    };
  }

  const submitAction: OnFormikSubmit<any> = async (newAction, formik) => {
    // Return if the sub-form has errors:
    const formErrors = await formik.validateForm();
    if (!_.isEmpty(formErrors)) {
      formik.setErrors({ ...formik.errors, ...formErrors });
      return;
    }
    await onSaveReference(newAction);
  };

  return (
    <div onKeyDown={disableEnterToSubmitOuterForm}>
      <FieldSet legend={<DinaMessage id="addBibliographicReference" />}>
        <div className="d-flex align-items-center justify-content-end mb-2">
          <label className="me-2" htmlFor="manualInput">
            <DinaMessage id="manual" />
          </label>
          <Switch
            id="manualInput"
            checked={isManualInput}
            onChange={() => setIsManualInput((prev) => !prev)}
          />
        </div>
        <FormWrapper
          validationSchema={bibliographicReferenceSchema}
          initialValues={
            referenceToEdit ??
            referenceTemplateInitialValues ??
            ({} as BibliographicReference)
          }
          componentName={BIBLIOGRAPHIC_REFERENCES_COMPONENT_NAME}
          sectionName="bibliographic-references-add-section"
        >
          <div className="row">
            <TextField
              {...fieldProps("doi")}
              className="col-sm-6"
              placeholder={formatMessage("doiPlaceholder")}
            />
            {!isManualInput && (
              <FormikButton
                className="btn btn-primary mb-3 add-new-button"
                buttonProps={() => ({ style: { width: "10rem" } })}
                onClick={(values, formik) => {
                  const doiValue = values.doi;
                  if (doiValue) {
                    const fetchUrl = `https://api.openalex.org/works/https://doi.org/${doiValue}`;
                    window
                      .fetch(fetchUrl)
                      .then((res) => res.json())
                      .then((json) => {
                        formik.setFieldValue("title", json.title);
                        formik.setFieldValue("year", json.publication_year);
                        formik.setFieldValue(
                          "author",
                          json.authorships?.map(
                            (authorship) => authorship.author.display_name
                          )
                        );
                        formik.setFieldValue(
                          "authorID",
                          json.authorships?.map(
                            (authorship) => authorship.author.orcid
                          )
                        );
                        formik.setFieldValue(
                          "journal",
                          json.primary_location?.source?.display_name
                        );
                        formik.setFieldValue("volume", json.biblio?.volume);
                        formik.setFieldValue("pages", `${json.biblio?.first_page}-${json.biblio?.last_page}`);
                      });
                  }
                }}
              >
                <DinaMessage id="doisearch" />
              </FormikButton>
            )}
          </div>
          <div className="row">
            <TextField
              {...fieldProps("title")}
              className="col-sm-6"
              disabled={!isManualInput}
            />
            <TextField
              {...fieldProps("year")}
              className="col-sm-6"
              disabled={!isManualInput}
            />
          </div>
          <div className="row">
            <TextField
              {...fieldProps("author")}
              className="col-sm-6"
              disabled={!isManualInput}
            />
            <TextField
              {...fieldProps("authorID")}
              className="col-sm-6"
              disabled={!isManualInput}
            />
          </div>
          <div className="row">
            <TextField
              {...fieldProps("journal")}
              className="col-sm-6"
              disabled={!isManualInput}
            />
            <TextField
              {...fieldProps("volume")}
              className="col-sm-6"
              disabled={!isManualInput}
            />
          </div>
          <div className="row">
            <TextField
              {...fieldProps("pages")}
              className="col-sm-6"
              disabled={!isManualInput}
            />
          </div>
          <div className="row">
            <TextField
              {...fieldProps("referenceRemarks")}
              className="col-sm-6"
            />
          </div>
          {!isTemplate && (
            <div className="d-flex justify-content-center gap-2">
              <FormikButton
                className="btn btn-primary mb-3 add-button"
                buttonProps={() => ({ style: { width: "10rem" } })}
                onClick={submitAction}
              >
                <DinaMessage id={referenceToEdit ? "submitBtnText" : "add"} />
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
          )}
        </FormWrapper>
      </FieldSet>
    </div>
  );
}
