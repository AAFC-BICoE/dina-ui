import {
  AutoSuggestTextField,
  DateField,
  FieldSet,
  TextField,
  TextFieldWithMultiplicationButton,
  ToggleField,
  useDinaFormContext
} from "common-ui";
import { FormikContextType, useFormikContext } from "formik";
import { get, isArray } from "lodash";
import { useState } from "react";
import { PersonSelectField } from "../..";
import { TypeStatusEnum } from "../../../../dina-ui/types/collection-api/resources/TypeStatus";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import {
  Determination,
  MaterialSample,
  Organism,
  Vocabulary
} from "../../../types/collection-api";
import { ManagedAttributesEditor } from "../../managed-attributes/ManagedAttributesEditor";
import {
  GlobalNamesField,
  SelectedScientificNameView
} from "../global-names/GlobalNamesField";
import { TabbedArrayField } from "../TabbedArrayField";
import { find, compact } from "lodash";

export interface DeterminationFieldProps {
  className?: string;
}

/** Type-safe object with all determination fields. */
const DETERMINATION_FIELDS_OBJECT: Required<Record<keyof Determination, true>> =
  {
    verbatimScientificName: true,
    verbatimDeterminer: true,
    verbatimDate: true,
    typeStatus: true,
    typeStatusEvidence: true,
    determiner: true,
    determinedOn: true,
    verbatimRemarks: true,
    scientificNameSource: true,
    scientificName: true,
    transcriberRemarks: true,
    isPrimary: true,
    scientificNameDetails: true,
    isFiledAs: true,
    determinationRemarks: true,
    managedAttributes: true
  };

/** All fields of the Determination type. */
export const DETERMINATION_FIELDS = Object.keys(DETERMINATION_FIELDS_OBJECT);

export interface DeterminationFieldProps {
  id?: string;
  name?: string;
  visibleManagedAttributeKeys?: string[];
}

export function DeterminationField({
  id = "determination-section",
  name,
  visibleManagedAttributeKeys
}: DeterminationFieldProps) {
  const { formatMessage, locale } = useDinaIntl();
  const { readOnly, isTemplate, initialValues } = useDinaFormContext();
  const form = useFormikContext<MaterialSample>();

  const [hideScientificNameInput, setHideScientificNameInput] = useState(false);

  const determinationsPath = name || "determination";

  const initialIndex = Math.max(
    0,
    (get(initialValues, determinationsPath) as Determination[])?.findIndex(
      (dtmntn) => dtmntn?.isPrimary
    ) ?? 0
  );

  /** Make this Assertion the Primary. */
  function makePrimary(formik: FormikContextType<any>, index) {
    const assertions: Determination[] =
      get(formik.values, determinationsPath) ?? [];

    assertions.forEach((_, idx) => {
      formik.setFieldValue(`${determinationsPath}[${idx}].isPrimary`, false);
    });
    formik.setFieldValue(`${determinationsPath}[${index}].isPrimary`, true);
  }

  /** Make this Assertion Filed As. */
  function makeFiledAs(formik: FormikContextType<any>, index) {
    const assertions: Determination[] =
      get(formik.values, determinationsPath) ?? [];

    assertions.forEach((_, idx) => {
      formik.setFieldValue(`${determinationsPath}[${idx}].isFiledAs`, false);
    });
    formik.setFieldValue(`${determinationsPath}[${index}].isFiledAs`, true);
  }

  return (
    <div className="determination-section">
      <TabbedArrayField<Determination>
        legend={<DinaMessage id="determinations" />}
        name={determinationsPath}
        typeName={formatMessage("determination")}
        sectionId={id}
        initialIndex={initialIndex}
        makeNewElement={() => ({})}
        renderTab={(det, index) => (
          <span className="m-3">
            {index + 1}
            {det.isPrimary && det.isFiledAs
              ? ` (${formatMessage("primary")} | ${formatMessage("isFiledAs")})`
              : (det.isFiledAs && `(${formatMessage("isFiledAs")})`) ||
                (det.isPrimary && `(${formatMessage("primary")})`)}
          </span>
        )}
        renderTabPanel={({ fieldProps, index }) => {
          const fieldScientificNameSrcDetail = fieldProps(
            "scientificNameDetails"
          ).name;

          const scientificNameSrcDetailVal = get(
            form.values,
            fieldScientificNameSrcDetail
          );
          return (
            <div className="row">
              {!readOnly && !isTemplate && (
                <div className="d-flex gap-4">
                  <ToggleField
                    className="primary-determination-button"
                    {...fieldProps("isPrimary")}
                    onChangeExternal={(checked, formik) => {
                      if (checked) {
                        makePrimary(formik, index);
                      }
                    }}
                  />
                  <ToggleField
                    className="filed-as-button"
                    {...fieldProps("isFiledAs")}
                    onChangeExternal={(checked, formik) => {
                      if (checked) {
                        makeFiledAs(formik, index);
                      }
                    }}
                  />
                </div>
              )}
              <div className="col-md-6">
                <FieldSet
                  legend={<DinaMessage id="verbatimDeterminationLegend" />}
                  className="non-strip"
                  sectionName="organism-verbatim-determination-section"
                >
                  <TextFieldWithMultiplicationButton
                    {...fieldProps("verbatimScientificName")}
                    className="verbatimScientificName"
                  />
                  <AutoSuggestTextField<Organism>
                    {...fieldProps("verbatimDeterminer")}
                    elasticSearchBackend={{
                      indexName: "dina_material_sample_index",
                      searchField:
                        "included.attributes.determination.verbatimDeterminer",
                      option: (determination) =>
                        determination?.determination?.[0]?.verbatimDeterminer
                    }}
                    preferredBackend={"elastic-search"}
                  />
                  <TextField {...fieldProps("verbatimDate")} />
                  <TextField
                    {...fieldProps("verbatimRemarks")}
                    multiLines={true}
                  />
                  <TextField
                    {...fieldProps("transcriberRemarks")}
                    multiLines={true}
                  />
                </FieldSet>
                <FieldSet
                  legend={<DinaMessage id="typeSpecimen" />}
                  className="non-strip"
                  sectionName="organism-type-specimen-section"
                >
                  <AutoSuggestTextField<Vocabulary>
                    {...fieldProps("typeStatus")}
                    jsonApiBackend={{
                      query: () => ({
                        path: "collection-api/vocabulary/typeStatus"
                      }),
                      option: (vocabElement, searchValue) =>
                        compact(
                          vocabElement?.vocabularyElements
                            ?.filter((it) => it?.name !== TypeStatusEnum.NONE)
                            .filter((it) =>
                              it?.name
                                ?.toLowerCase?.()
                                ?.includes(searchValue?.toLowerCase?.())
                            )
                            .map(
                              (it) =>
                                find(
                                  it?.multilingualTitle?.titles || [],
                                  (item) => item.lang === locale
                                )?.title ||
                                it.name ||
                                ""
                            ) ?? []
                        )
                    }}
                    blankSearchBackend={"json-api"}
                  />
                  <TextField
                    {...fieldProps("typeStatusEvidence")}
                    multiLines={true}
                  />
                </FieldSet>
              </div>
              <div className="col-md-6">
                <FieldSet
                  legend={<DinaMessage id="determination" />}
                  className="non-strip"
                  sectionName="organism-determination-section"
                >
                  {/* determination scientific name is used for display readonly and edit plain string entry  */}

                  {((!hideScientificNameInput && !scientificNameSrcDetailVal) ||
                    readOnly) && (
                    <>
                      <TextField
                        {...fieldProps("scientificName")}
                        readOnlyRender={(value, _form) => {
                          const scientificNameSrcDetailUrlVal =
                            _form.getFieldMeta(
                              fieldProps("scientificNameDetails.sourceUrl").name
                            ).value as string;
                          return (
                            <SelectedScientificNameView
                              value={value}
                              formik={_form}
                              scientificNameDetailsField={
                                fieldProps("scientificNameDetails").name
                              }
                              scientificNameSrcDetailUrlVal={
                                scientificNameSrcDetailUrlVal
                              }
                            />
                          );
                        }}
                        onChangeExternal={(_form, _, newVal) => {
                          if (newVal && newVal?.trim().length > 0) {
                            _form.setFieldValue(
                              fieldProps("scientificNameSource").name,
                              "GNA"
                            );
                          } else {
                            _form.setFieldValue(
                              fieldProps("scientificNameSource").name,
                              null
                            );
                            _form.setFieldValue(
                              fieldProps("scientificNameDetails").name,
                              null
                            );
                          }
                        }}
                      />
                      {!readOnly && <hr />}
                    </>
                  )}

                  {/* determination scientific name search is used for search scientific name and display search result entry in edit mode */}
                  {!readOnly && (
                    <GlobalNamesField
                      {...fieldProps(
                        !scientificNameSrcDetailVal
                          ? "scientificNameInput"
                          : "scientificName"
                      )}
                      label={
                        hideScientificNameInput || !!scientificNameSrcDetailVal
                          ? formatMessage("field_scientificNameInput")
                          : formatMessage("scientificNameSearch")
                      }
                      scientificNameDetailsField={
                        fieldProps("scientificNameDetails").name
                      }
                      scientificNameSourceField={
                        fieldProps("scientificNameSource").name
                      }
                      scientificNameDetailsSrcUrlField={
                        fieldProps("scientificNameDetails.sourceUrl").name
                      }
                      onChange={(newValue, formik) => {
                        formik.setFieldValue(
                          fieldProps("scientificNameSource").name,
                          newValue ? "GNA" : null
                        );
                        formik.setFieldValue(
                          fieldProps("scientificNameDetails").name,
                          newValue && isArray(newValue) ? newValue[0] : null
                        );
                        // If selected a result from search , set text input value to null and hide it
                        // If a search value is removed, show the text input value
                        if (newValue) {
                          formik.setFieldValue(
                            fieldProps("scientificName").name,
                            newValue?.[1]
                          );
                          // here need to set the synonym field as well
                          setHideScientificNameInput(true);
                        } else {
                          setHideScientificNameInput(false);
                        }
                      }}
                      index={index}
                      isDetermination={true}
                    />
                  )}
                  <PersonSelectField
                    {...fieldProps("determiner")}
                    label={formatMessage("determiningAgents")}
                    isMulti={true}
                  />
                  <DateField
                    {...fieldProps("determinedOn")}
                    label={formatMessage("determiningDate")}
                  />
                  <TextField
                    {...fieldProps("determinationRemarks")}
                    multiLines={true}
                  />
                </FieldSet>
                <ManagedAttributesEditor
                  valuesPath={fieldProps("managedAttributes").name}
                  managedAttributeApiPath="collection-api/managed-attribute"
                  managedAttributeComponent="DETERMINATION"
                  attributeSelectorWidth={12}
                  fieldSetProps={{
                    legend: <DinaMessage id="determinationManagedAttributes" />,
                    className: "non-strip",
                    sectionName: "organism-managed-attributes-section"
                  }}
                  managedAttributeOrderFieldName="determinationManagedAttributesOrder"
                  visibleAttributeKeys={visibleManagedAttributeKeys}
                />
              </div>
            </div>
          );
        }}
      />
    </div>
  );
}
