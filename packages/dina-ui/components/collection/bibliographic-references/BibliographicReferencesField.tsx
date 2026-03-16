import { ColumnDef, Row } from "@tanstack/react-table";
import {
  CheckBoxWithoutWrapper,
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
import { FormikContextType, FieldArray } from "formik";
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
import { FaMinus, FaPlus } from "react-icons/fa";

/** Type-safe object with all BibliographicReference fields. */
export const BIBLIOGRAPHIC_REFERENCE_FIELDS_OBJECT: Required<
  Record<keyof BibliographicReference, true>
> = {
  title: true,
  doi: true,
  year: true,
  author: true,
  authorID: true,
  journal: true,
  volume: true,
  pages: true,
  referenceRemarks: true
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
      header: () => <FieldHeader name={formatMessage("doi")} />,
      cell: ({ getValue }) => {
        const doi = getValue() as string;
        return doi ? (
          <a
            href={`https://doi.org/${doi}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {doi}
          </a>
        ) : null;
      },
      meta: {
        style: { verticalAlign: "top" }
      }
    },
    {
      id: "title",
      accessorKey: "title",
      header: () => <FieldHeader name={formatMessage("title")} />,
      meta: {
        style: { verticalAlign: "top" }
      }
    },
    {
      id: "year",
      accessorKey: "year",
      header: () => <FieldHeader name={formatMessage("year")} />,
      meta: {
        style: { verticalAlign: "top" }
      }
    },
    {
      id: "author",
      accessorKey: "author",
      header: () => <FieldHeader name={formatMessage("author")} />,
      cell: ({ getValue }) => {
        const authors = getValue() as string[];
        if (!authors) return null;

        return (
          <div className="d-flex flex-column gap-1">
            <span>{authors.join(", ")}</span>
          </div>
        );
      },
      meta: {
        style: { verticalAlign: "top" }
      }
    },
    {
      id: "authorID",
      accessorKey: "authorID",
      header: () => <FieldHeader name={formatMessage("authorID")} />,
      cell: ({ getValue }) => {
        const authorIDs = getValue() as string[];
        if (!authorIDs) return null;

        return (
          <div className="d-flex flex-column gap-1">
            {authorIDs.map((id, index) => (
              <a
                key={index}
                href={`${id}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {id}
              </a>
            ))}
          </div>
        );
      },
      meta: {
        style: { verticalAlign: "top" }
      }
    },
    {
      id: "journal",
      accessorKey: "journal",
      header: () => <FieldHeader name={formatMessage("journal")} />,
      meta: {
        style: { verticalAlign: "top" }
      }
    },
    {
      id: "volume",
      accessorKey: "volume",
      header: () => <FieldHeader name={formatMessage("volume")} />,
      meta: {
        style: { verticalAlign: "top" }
      }
    },
    {
      id: "pages",
      accessorKey: "pages",
      header: () => <FieldHeader name={formatMessage("pages")} />,
      meta: {
        style: { verticalAlign: "top" }
      }
    },
    {
      id: "referenceRemarks",
      accessorKey: "referenceRemarks",
      header: () => <FieldHeader name={formatMessage("referenceRemarks")} />,
      meta: {
        style: { verticalAlign: "top" }
      }
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
  const [doiFetchError, setDoiFetchError] = useState<boolean>(false);
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
            ({
              doi: "",
              title: "",
              year: undefined,
              author: [""],
              authorID: [""],
              journal: "",
              volume: "",
              pages: "",
              referenceRemarks: ""
            } as BibliographicReference)
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
              <div className="col-sm-6 d-flex align-items-center gap-2">
                <FieldSpy fieldName="doi">
                  {(doiValue) => (
                    <FormikButton
                      className="btn btn-info add-new-button"
                      buttonProps={() => ({
                        style: { width: "10rem" },
                        disabled:
                          typeof doiValue === "string" ? !doiValue.trim() : true
                      })}
                      onClick={async (values, formik) => {
                        const doiValue = values.doi;
                        if (!doiValue) return;

                        const fetchUrl = `https://api.openalex.org/works/https://doi.org/${doiValue}`;
                        const clearFields = () => {
                          formik.setFieldValue("title", "");
                          formik.setFieldValue("year", "");
                          formik.setFieldValue("author", [""]);
                          formik.setFieldValue("authorID", [""]);
                          formik.setFieldValue("journal", "");
                          formik.setFieldValue("volume", "");
                          formik.setFieldValue("pages", "");
                        };

                        const res = await fetch(fetchUrl);

                        if (!res.ok) {
                          setDoiFetchError(true);
                          clearFields();
                          return;
                        }
                        setDoiFetchError(false);

                        const json = await res.json();

                        formik.setValues({
                          ...formik.values,
                          title: json.title,
                          year: json.publication_year,
                          author: json.authorships
                            ?.map((a) => a.author.display_name)
                            .filter(Boolean),
                          authorID: json.authorships
                            ?.map((a) => a.author.orcid)
                            .filter(Boolean),
                          journal: json.primary_location?.source?.display_name,
                          volume: json.biblio?.volume,
                          pages: `${json.biblio?.first_page}-${json.biblio?.last_page}`
                        });
                      }}
                    >
                      <DinaMessage id="doiSearch" />
                    </FormikButton>
                  )}
                </FieldSpy>
                {doiFetchError && (
                  <div className="alert alert-danger" role="alert">
                    <DinaMessage id="doiSearchError" />
                  </div>
                )}
              </div>
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
            <FieldArray name="author">
              {({ form, push, remove }) => {
                const author = form?.values?.author ?? [];

                // If empty, just display one.
                if (author.length === 0) {
                  push("");
                }

                function addAuthor() {
                  push("");
                }

                function removeAuthor(index: number) {
                  remove(index);
                }

                function containsEmptyObject() {
                  return (
                    author.some((obj) => Object.keys(obj).length === 0) ||
                    author.find((obj) => obj.value === "")
                  );
                }

                const disableAddButton =
                  !isManualInput || containsEmptyObject();

                return (
                  <div className="author-section col-md-6">
                    {/* Top header, where the plus icon is displayed */}
                    <div
                      className="row"
                      style={{
                        borderTop: "0px solid white",
                        paddingTop: "15px"
                      }}
                    >
                      <div className="col-md-11 d-flex">
                        {isTemplate && (
                          <div
                            style={{ marginTop: "3px", marginRight: "20px" }}
                          >
                            <CheckBoxWithoutWrapper
                              name={`templateCheckboxes['bibreferences-component.author']`}
                              className={`col-sm-1 templateCheckBox`}
                            />
                          </div>
                        )}
                        <strong>
                          <DinaMessage id={"field_author"} />
                        </strong>
                      </div>
                      <div className="col-md-1 d-flex align-items-center justify-content-between">
                        <FaPlus
                          className="ms-auto"
                          style={{
                            cursor: disableAddButton
                              ? "not-allowed"
                              : "pointer",
                            color: disableAddButton ? "gray" : "black"
                          }}
                          onClick={() => {
                            if (!disableAddButton) {
                              addAuthor();
                            }
                          }}
                          size="2em"
                          onMouseOver={(event) => {
                            if (!disableAddButton) {
                              event.currentTarget.style.color = "blue";
                            }
                          }}
                          onMouseOut={(event) => {
                            if (disableAddButton) {
                              event.currentTarget.style.color = "gray";
                            } else {
                              event.currentTarget.style.color = "black";
                            }
                          }}
                          data-testid="add row button"
                        />
                      </div>
                    </div>

                    {author?.map((_, index) => (
                      <div className="row" key={index}>
                        <div
                          className="col-md-11"
                          data-testid={"author[" + index + "]"}
                        >
                          <TextField
                            name={"author[" + index + "]"}
                            hideLabel={true}
                            disableTemplateCheckbox={true}
                            disabled={isTemplate || !isManualInput}
                          />
                        </div>
                        <div className="col-md-1 d-flex align-items-center justify-content-between">
                          <FaMinus
                            className="ms-auto"
                            style={{
                              marginTop: "-10px",
                              cursor: isManualInput ? "pointer" : "not-allowed",
                              color: isManualInput ? "" : "grey"
                            }}
                            onClick={() => isManualInput && removeAuthor(index)}
                            size="2em"
                            onMouseOver={(event) => {
                              if (isManualInput)
                                event.currentTarget.style.color = "blue";
                            }}
                            onMouseOut={(event) => {
                              if (isManualInput)
                                event.currentTarget.style.color = "";
                            }}
                            data-testid="add row button"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                );
              }}
            </FieldArray>
            <FieldArray name="authorID">
              {({ form, push, remove }) => {
                const authorID = form?.values?.authorID ?? [];

                // If empty, just display one.
                if (authorID.length === 0) {
                  push("");
                }

                function addAuthorID() {
                  push("");
                }

                function removeAuthorID(index: number) {
                  remove(index);
                }

                function containsEmptyObject() {
                  return (
                    authorID.some((obj) => Object.keys(obj).length === 0) ||
                    authorID.find((obj) => obj.value === "")
                  );
                }

                const disableAddButton =
                  !isManualInput || containsEmptyObject();

                return (
                  <div className="authorID-section col-md-6">
                    {/* Top header, where the plus icon is displayed */}
                    <div
                      className="row"
                      style={{
                        borderTop: "0px solid white",
                        paddingTop: "15px"
                      }}
                    >
                      <div className="col-md-11 d-flex">
                        {isTemplate && (
                          <div
                            style={{ marginTop: "3px", marginRight: "20px" }}
                          >
                            <CheckBoxWithoutWrapper
                              name={`templateCheckboxes['bibreferences-component.authorID']`}
                              className={`col-sm-1 templateCheckBox`}
                            />
                          </div>
                        )}
                        <strong>
                          <DinaMessage id={"field_authorID"} />
                        </strong>
                      </div>
                      <div className="col-md-1 d-flex align-items-center justify-content-between">
                        <FaPlus
                          className="ms-auto"
                          style={{
                            cursor: disableAddButton
                              ? "not-allowed"
                              : "pointer",
                            color: disableAddButton ? "gray" : "black"
                          }}
                          onClick={() => {
                            if (!disableAddButton) {
                              addAuthorID();
                            }
                          }}
                          size="2em"
                          onMouseOver={(event) => {
                            if (!disableAddButton) {
                              event.currentTarget.style.color = "blue";
                            }
                          }}
                          onMouseOut={(event) => {
                            if (disableAddButton) {
                              event.currentTarget.style.color = "gray";
                            } else {
                              event.currentTarget.style.color = "black";
                            }
                          }}
                          data-testid="add row button"
                        />
                      </div>
                    </div>

                    {authorID?.map((_, index) => (
                      <div className="row" key={index}>
                        <div
                          className="col-md-11"
                          data-testid={"authorID[" + index + "]"}
                        >
                          <TextField
                            name={"authorID[" + index + "]"}
                            hideLabel={true}
                            disableTemplateCheckbox={true}
                            disabled={isTemplate || !isManualInput}
                          />
                        </div>
                        <div className="col-md-1 d-flex align-items-center justify-content-between">
                          <FaMinus
                            className="ms-auto"
                            style={{ marginTop: "-10px", cursor: "pointer" }}
                            onClick={() =>
                              isManualInput && removeAuthorID(index)
                            }
                            size="2em"
                            onMouseOver={(event) =>
                              (event.currentTarget.style.color = "blue")
                            }
                            onMouseOut={(event) =>
                              (event.currentTarget.style.color = "")
                            }
                            data-testid="add row button"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                );
              }}
            </FieldArray>
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
