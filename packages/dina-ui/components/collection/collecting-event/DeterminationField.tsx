import {
  AutoSuggestTextField,
  DateField,
  FieldSet,
  FormikButton,
  TextField,
  TextFieldWithMultiplicationButton,
  Tooltip,
  useDinaFormContext
} from "common-ui";
import { FormikContextType } from "formik";
import { get, isArray } from "lodash";
import { PersonSelectField } from "../..";
import { TypeStatusEnum } from "../../../../dina-ui/types/collection-api/resources/TypeStatus";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import {
  Determination,
  MaterialSample,
  Vocabulary
} from "../../../types/collection-api";
import { useFormikContext } from "formik";
import { TabbedArrayField } from "../TabbedArrayField";
import { useState } from "react";
import {
  GlobalNamesField,
  SelectedScientificNameView
} from "../global-names/GlobalNamesField";
import { useAutocompleteSearchButFallbackToRsqlApiSearch } from "../../search/useAutocompleteSearchButFallbackToRsqlApiSearch";

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
    isFileAs: true,
    determinationRemarks: true
  };

/** All fields of the Determination type. */
export const DETERMINATION_FIELDS = Object.keys(DETERMINATION_FIELDS_OBJECT);

export function DeterminationField() {
  const { formatMessage, locale } = useDinaIntl();
  const { readOnly, isTemplate, initialValues } = useDinaFormContext();
  const form = useFormikContext<MaterialSample>();

  const [hideScientificNameInput, setHideScientificNameInput] = useState(false);

  const initialIndex = Math.max(
    0,
    (initialValues as Partial<MaterialSample>).determination?.findIndex(
      dtmntn => dtmntn?.isPrimary
    ) ?? 0
  );

  const determinationsPath = "determination";

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
      formik.setFieldValue(`${determinationsPath}[${idx}].isFileAs`, false);
    });
    formik.setFieldValue(`${determinationsPath}[${index}].isFileAs`, true);
  }

  return (
    <TabbedArrayField<Determination>
      legend={<DinaMessage id="determinations" />}
      name={determinationsPath}
      typeName={formatMessage("determination")}
      sectionId="determination-section"
      initialIndex={initialIndex}
      makeNewElement={({ length }) => ({
        isPrimary: length === 0,
        isFileAs: length === 0
      })}
      renderTab={(det, index) => (
        <span className="m-3">
          {index + 1}
          {det.isPrimary && det.isFileAs
            ? ` (${formatMessage("primary")} | ${formatMessage("isFileAs")})`
            : (det.isFileAs && `(${formatMessage("isFileAs")})`) ||
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
              <div className="mb-3">
                <FormikButton
                  className="btn btn-primary primary-determinationtion-button"
                  buttonProps={ctx => {
                    const isPrimary =
                      get(
                        ctx.values,
                        `${determinationsPath}[${index}].` + "isPrimary"
                      ) ?? false;
                    return {
                      disabled: isPrimary,
                      children: isPrimary ? (
                        <DinaMessage id="primary" />
                      ) : (
                        <DinaMessage id="makePrimary" />
                      )
                    };
                  }}
                  onClick={(_, formik) => makePrimary(formik, index)}
                />
                <Tooltip id="primaryDeterminationButton_tooltip" />
                <FormikButton
                  className="btn btn-primary filed-as-button"
                  buttonProps={ctx => {
                    const isFileAs =
                      get(
                        ctx.values,
                        `${determinationsPath}[${index}].` + "isFileAs"
                      ) ?? false;
                    return {
                      disabled: isFileAs,
                      children: isFileAs ? (
                        <DinaMessage id="isFileAs" />
                      ) : (
                        <DinaMessage id="makeFiledAs" />
                      )
                    };
                  }}
                  onClick={(_, formik) => makeFiledAs(formik, index)}
                />
                <Tooltip id="isFileAsDeterminationButton_tooltip" />
              </div>
            )}
            <div className="col-md-6">
              <FieldSet
                legend={<DinaMessage id="verbatimDeterminationLegend" />}
                className="non-strip"
              >
                <TextFieldWithMultiplicationButton
                  {...fieldProps("verbatimScientificName")}
                  className="verbatimScientificName"
                />
                <AutoSuggestTextField<MaterialSample>
                  {...fieldProps("verbatimDeterminer")}
                  query={() => ({
                    path: "collection-api/material-sample"
                  })}
                  suggestion={sample =>
                    sample.determination?.map(det => det?.verbatimDeterminer) ??
                    []
                  }
                  alwaysShowSuggestions={true}
                  useCustomQuery={(searchQuery, querySpec) =>
                    useAutocompleteSearchButFallbackToRsqlApiSearch<MaterialSample>(
                      {
                        searchQuery,
                        querySpec,
                        indexName: "dina_material_sample_index",
                        searchField: "determination.verbatimDeterminer"
                      }
                    )
                  }
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
              >
                <AutoSuggestTextField<Vocabulary>
                  {...fieldProps("typeStatus")}
                  query={() => ({
                    path: "collection-api/vocabulary/typeStatus"
                  })}
                  suggestion={(vocabElement, searchValue) =>
                    vocabElement?.vocabularyElements
                      ?.filter(it => it?.name !== TypeStatusEnum.NONE)
                      .filter(it =>
                        it?.name
                          ?.toLowerCase?.()
                          ?.includes(searchValue?.toLowerCase?.())
                      )
                      .map(it => it?.labels?.[locale] ?? "")
                  }
                  alwaysShowSuggestions={true}
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
            </div>
          </div>
        );
      }}
    />
  );
}
