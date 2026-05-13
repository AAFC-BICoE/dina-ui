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
  NumberField,
  DOIField,
  useDinaFormContext
} from "common-ui";
import { FormikContextType, FieldArray } from "formik";
import _ from "lodash";
import { Fragment, ReactNode, useState } from "react";
import * as yup from "yup";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import {
  CITATIONS_COMPONENT_NAME,
  Citation
} from "../../../types/collection-api";
import React from "react";
import { MdEdit } from "react-icons/md";
import Switch from "react-switch";
import { FaMinus, FaPlus } from "react-icons/fa";

/** Type-safe object with all Citation fields. */
export const BIBLIOGRAPHIC_REFERENCE_FIELDS_OBJECT: Required<
  Record<keyof Citation, true>
> = {
  title: true,
  doi: true,
  year: true,
  authors: true,
  journal: true,
  volume: true,
  pages: true,
  citationRemarks: true
};

/** All fields of the Citation type. */
export const BIBLIOGRAPHIC_REFERENCE_FIELDS = Object.keys(
  BIBLIOGRAPHIC_REFERENCE_FIELDS_OBJECT
);

export const citationSchema = yup.object({
  title: yup.string().required()
});

export interface CitationsFieldProps {
  className?: string;
  wrapContent?: (content: ReactNode) => ReactNode;
  id?: string;
}

export function CitationsField({
  className,
  wrapContent = (content) => content,
  id = CITATIONS_COMPONENT_NAME
}: CitationsFieldProps) {
  const fieldName = "citations";

  const { readOnly } = useDinaFormContext();
  const { formatMessage } = useDinaIntl();

  const [referenceToEdit, setReferenceToEdit] = useState<
    "NEW" | { index: number } | null
  >(null);
  const [viewDetailTable, setViewDetailTable] = useState<boolean>(false);

  const isEditing = !!referenceToEdit;
  function openRowEditor(row: Row<Citation>) {
    row.getToggleExpandedHandler()();
    setReferenceToEdit({ index: row.index });
  }

  function removeAction(formik: FormikContextType<Citation>, index: number) {
    setReferenceToEdit(null);
    const citations = formik.getFieldMeta<Citation[]>(fieldName).value ?? [];
    // Remove the item at the index:
    formik.setFieldValue(fieldName, [
      ...citations.slice(0, index),
      ...citations.slice(index + 1)
    ]);
  }

  const buttonProps = () => ({ disabled: isEditing, style: { width: "7rem" } });

  const columns: ColumnDef<Citation>[] = [
    {
      id: "doi",
      accessorKey: "doi",
      header: () => <FieldHeader name={formatMessage("doi")} />,
      cell: ({ getValue }) => {
        const doi = getValue() as string;
        return doi ? (
          <a href={`${doi}`} target="_blank" rel="noopener noreferrer">
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
      id: "authors",
      accessorKey: "authors",
      header: () => <FieldHeader name={formatMessage("authors")} />,
      cell: ({ getValue }) => {
        const authors = getValue() as {
          given_names: string;
          family_names: string;
          id: string;
        }[];
        if (!authors || !authors.length) return null;

        return (
          <div className="d-flex flex-column gap-1">
            <span>
              {authors
                .map((author) => `${author.given_names} ${author.family_names}`)
                .join(", ")}
            </span>
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
      id: "citationRemarks",
      accessorKey: "citationRemarks",
      header: () => <FieldHeader name={formatMessage("citationRemarks")} />,
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
      legend={<DinaMessage id="citations" />}
      fieldName={fieldName}
      componentName={CITATIONS_COMPONENT_NAME}
      sectionName="citations-add-section"
    >
      <div className="d-flex align-items-center justify-content-end mb-2">
        <label className="me-2" htmlFor="viewDetailTableSwitch">
          <DinaMessage id="viewDetailButtonLabel" />
        </label>
        <Switch
          id="viewDetailTableSwitch"
          checked={viewDetailTable}
          onChange={() => setViewDetailTable((prev) => !prev)}
        />
      </div>
      {wrapContent(
        <FieldSpy fieldName={fieldName}>
          {(value, { form }) => {
            const citations = (value ?? []) as Citation[];

            const hasReferences = !!citations.length;

            async function saveReference(savedReference: Citation) {
              if (referenceToEdit === "NEW" || !referenceToEdit) {
                form.setFieldValue(fieldName, [...citations, savedReference]);
              } else {
                form.setFieldValue(
                  fieldName,
                  citations.map((reference, index) =>
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
                {hasReferences &&
                  (viewDetailTable ? (
                    <ReactTable<Citation>
                      columns={columns}
                      data={citations}
                      showPagination={false}
                      className="-striped mb-2"
                      getRowCanExpand={() => true}
                      renderSubComponent={({ row }) => (
                        <div className="m-2">
                          <CitationSubForm
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
                  ) : (
                    <>
                      <div className="mb-3">
                        <ul>
                          {citations.map((ref, index) => {
                            const year = ref.year ? `(${ref.year})` : null;
                            const title = ref.title || null;
                            const journal = ref.journal || null;
                            const volume = ref.volume ? ref.volume : null;
                            const pages = ref.pages || null;
                            const doi = ref.doi ? `${ref.doi}` : null;

                            const firstAuthor = ref.authors?.[0];

                            // If no authors, display empty string. If family names exist, display them.
                            const authorText = firstAuthor?.family_names
                              ? firstAuthor?.given_names?.[0]
                                ? `${firstAuthor.family_names}, ${firstAuthor.given_names[0]}.`
                                : firstAuthor.family_names
                              : "";
                            const multipleAuthors =
                              ref.authors && ref.authors.length > 1;

                            const authors = authorText ? (
                              firstAuthor?.id ? (
                                <>
                                  <a
                                    href={firstAuthor.id}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    {authorText}
                                  </a>
                                  {multipleAuthors && " et al."}
                                </>
                              ) : (
                                <>
                                  {authorText}
                                  {multipleAuthors && " et al."}
                                </>
                              )
                            ) : null;

                            return (
                              <li key={index}>
                                <div>
                                  {authors && <>{authors} </>}
                                  {year && <>{year}. </>}
                                  {title && (
                                    <span className="fw-bold">{title}</span>
                                  )}
                                  {title && "."}
                                  {journal ? <>-- {journal}. </> : " "}
                                  {volume && volume.includes("(") ? (
                                    <>
                                      <span className="fw-bold">
                                        {volume.split("(")[0]}
                                      </span>
                                      {"(" + volume.split("(")[1]}
                                    </>
                                  ) : (
                                    <span className="fw-bold">{volume} </span>
                                  )}
                                  {pages && `: ${pages}.`}
                                  {doi && (
                                    <>
                                      {" "}
                                      <a
                                        href={doi}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                      >
                                        {doi}
                                      </a>
                                    </>
                                  )}
                                </div>
                                {ref.citationRemarks && (
                                  <div className="ms-3">
                                    <span>
                                      <DinaMessage id="field_remarks" />
                                      {": "}
                                    </span>
                                    <em>{ref.citationRemarks}</em>
                                  </div>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </>
                  ))}
                {readOnly ? null : !hasReferences ||
                  referenceToEdit === "NEW" ? (
                  <CitationSubForm
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

export interface CitationSubFormProps {
  onSaveReference: (reference: Citation) => Promise<void>;
  onCancelClick?: () => void;
  referenceToEdit?: Citation;
}

export function CitationSubForm({
  onSaveReference,
  onCancelClick,
  referenceToEdit
}: CitationSubFormProps) {
  const { initialValues, isTemplate } = useDinaFormContext();
  const [isManualInput, setIsManualInput] = useState(false);
  const [doiFetchError, setDoiFetchError] = useState<boolean>(false);
  const { formatMessage } = useDinaIntl();

  // TODO: This needs to be fixed.
  const enabledFields: string[] = [];

  const referenceTemplateInitialValues = enabledFields
    ? initialValues.citation
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
  function fieldProps(fieldName: keyof Citation) {
    const templateFieldName = `citation.${fieldName}`;
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
      <FieldSet legend={<DinaMessage id="addCitation" />}>
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
          validationSchema={citationSchema}
          initialValues={
            referenceToEdit ??
            referenceTemplateInitialValues ??
            ({
              doi: "",
              title: "",
              year: undefined,
              authors: [{ given_names: "", family_names: "", id: "" }],
              journal: "",
              volume: "",
              pages: "",
              citationRemarks: ""
            } as Citation)
          }
          componentName={CITATIONS_COMPONENT_NAME}
          sectionName="citations-add-section"
        >
          <div className="row">
            <DOIField
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
                          typeof doiValue === "string"
                            ? !doiValue.trim().startsWith("https://doi.org/")
                            : true
                      })}
                      onClick={async (values, formik) => {
                        const doiValue = values.doi;
                        if (!doiValue) return;

                        const fetchUrl = `https://api.crossref.org/works/${doiValue}`;
                        const clearFields = () => {
                          formik.setFieldValue("title", "");
                          formik.setFieldValue("year", "");
                          formik.setFieldValue("authors", [
                            { given_names: "", family_names: "", id: "" }
                          ]);
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
                        const item = json.message;
                        formik.setValues({
                          ...formik.values,
                          title: item.title[0],
                          year: item.issued["date-parts"][0][0],
                          authors: item.author
                            ?.map((a) => {
                              const family_names = a.family || "";
                              const given_names = a.given || "";
                              const authorId = a.ORCID || "";
                              return {
                                given_names,
                                family_names,
                                id: authorId
                              };
                            })
                            .filter(
                              (author) =>
                                author.given_names || author.family_names
                            ),
                          journal: item["container-title"]
                            ? item["container-title"][0]
                            : "",
                          volume: item.volume
                            ? item["journal-issue"]
                              ? `${item["volume"][0]} (${item["journal-issue"].issue})`
                              : ""
                            : "",
                          pages: item.page || ""
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
            <NumberField
              {...fieldProps("year")}
              className="col-sm-6"
              disabled={!isManualInput}
            />
          </div>
          <div className="row">
            <FieldArray name="authors">
              {({ form, push, remove }) => {
                const authors = form?.values?.authors ?? [];

                // If empty, just display one.
                if (authors.length === 0) {
                  push({ given_names: "", family_names: "", id: "" });
                }

                function addAuthor() {
                  push({ given_names: "", family_names: "", id: "" });
                }

                function removeAuthor(index: number) {
                  remove(index);
                }

                function containsEmptyObject() {
                  return authors.some(
                    (obj) => !obj.given_names.trim() || !obj.family_names.trim()
                  );
                }

                const disableAddButton =
                  !isManualInput || containsEmptyObject();

                return (
                  <div className="authors-section col-md-6">
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
                              name={`templateCheckboxes['citation-component.authors']`}
                              className={`col-sm-1 templateCheckBox`}
                            />
                          </div>
                        )}
                        <strong>
                          <DinaMessage id={"authors"} />
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

                    {authors?.map((_, index) => (
                      <div className="row" key={index}>
                        <div className="col-md-11">
                          <div className="row">
                            <div className="col-md-4">
                              <TextField
                                name={`authors[${index}].given_names`}
                                placeholder={formatMessage("field_givenNames")}
                                hideLabel={true}
                                disableTemplateCheckbox={true}
                                disabled={isTemplate || !isManualInput}
                              />
                            </div>
                            <div className="col-md-4">
                              <TextField
                                name={`authors[${index}].family_names`}
                                placeholder={formatMessage("field_familyNames")}
                                hideLabel={true}
                                disableTemplateCheckbox={true}
                                disabled={isTemplate || !isManualInput}
                              />
                            </div>
                            <div className="col-md-4">
                              <TextField
                                name={`authors[${index}].id`}
                                placeholder="ID"
                                hideLabel={true}
                                disableTemplateCheckbox={true}
                                disabled={isTemplate || !isManualInput}
                              />
                            </div>
                          </div>
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
              {...fieldProps("citationRemarks")}
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
                <DinaMessage id={referenceToEdit ? "submitBtnText" : "save"} />
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
