import {
  AutoSuggestTextField,
  DateField,
  FieldSet,
  filterBy,
  FormikButton,
  ResourceSelectField,
  TextField,
  TextFieldWithMultiplicationButton,
  Tooltip,
  useDinaFormContext
} from "common-ui";
import { FieldArray, FormikContextType } from "formik";
import { clamp, get } from "lodash";
import { useState } from "react";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import { CatalogueOfLifeNameField } from ".";
import { Person } from "../../../dina-ui/types/agent-api/resources/Person";
import { TypeStatusEnum } from "../../../dina-ui/types/collection-api/resources/TypeStatus";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import {
  Determination,
  MaterialSample,
  Vocabulary
} from "../../types/collection-api";
import { useAddPersonModal } from "../add-person/PersonForm";
import { isArray } from "lodash";

export interface DeterminationFieldProps {
  className?: string;
  namePrefix?: string;
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
    qualifier: true,
    scientificNameSource: true,
    scientificName: true,
    transcriberRemarks: true,
    isPrimary: true,
    scientificNameDetails: true,
    isFileAs: true,
    remarks: true
  };

/** All fields of the Determination type. */
export const DETERMINATION_FIELDS = Object.keys(DETERMINATION_FIELDS_OBJECT);

export function DeterminationField({ className }: DeterminationFieldProps) {
  const { readOnly, isTemplate, initialValues } = useDinaFormContext();
  const { openAddPersonModal } = useAddPersonModal();
  const { formatMessage, locale } = useDinaIntl();
  const determinationsPath = "determination";

  // Open the tab with the Primary determination even if it's not the first one.
  // Defaults to 0 if there's no primary determination.
  const intialPrimaryDeterminationIndex = Math.max(
    0,
    (initialValues as Partial<MaterialSample>).determination?.findIndex(
      dtmntn => dtmntn?.isPrimary
    ) ?? 0
  );

  const [activeTabIdx, setActiveTabIdx] = useState(
    intialPrimaryDeterminationIndex
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
      formik.setFieldValue(`${determinationsPath}[${idx}].isFileAs`, false);
    });
    formik.setFieldValue(`${determinationsPath}[${index}].isFileAs`, true);
  }

  return (
    <div>
      <FieldArray name="determination">
        {({ form, push, remove }) => {
          const determinations =
            (form.values.determination as Determination[]) ?? [];
          function addDetermination() {
            push({
              isPrimary: determinations?.length === 0,
              isFileAs: determinations?.length === 0
            });
            setActiveTabIdx(determinations.length);
          }

          function removeDetermination(index: number) {
            remove(index); // Stay on the current tab number, or reduce if removeing the last element:
            setActiveTabIdx(current =>
              clamp(current, 0, determinations.length - 2)
            );
          }

          function determinationInternal(index: number) {
            /** Applies name prefix to field props */
            function fieldProps(fieldName: string) {
              return {
                name: `${determinationsPath}[${index}].${fieldName}`,
                // If the first determination is enabled, then enable multiple determinations:
                templateCheckboxFieldName: `${determinationsPath}[0].${fieldName}`,
                // Don't use the prefix for the labels and tooltips:
                customName: fieldName
              };
            }

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
                        (sample.determination?.map(
                          det => det?.verbatimDeterminer
                        ) as any) ?? []
                      }
                    />
                    <TextField {...fieldProps("verbatimDate")} />
                    <TextField
                      {...fieldProps("transcriberRemarks")}
                      multiLines={true}
                    />
                    <TextField {...fieldProps("qualifier")} multiLines={true} />
                  </FieldSet>
                </div>
                <div className="col-md-6">
                  <FieldSet
                    legend={<DinaMessage id="determination" />}
                    className="non-strip"
                  >
                    <CatalogueOfLifeNameField
                      {...fieldProps("scientificName")}
                      scientificNameSourceField={
                        fieldProps("scientificNameSource").name
                      }
                      scientificNameDetailsSrcUrlField={
                        fieldProps("scientificNameDetails.sourceUrl").name
                      }
                      scientificNameDetailsLabelHtmlField={
                        fieldProps("scientificNameDetails.labelHtml").name
                      }
                      onChange={(newValue, formik) => {
                        formik.setFieldValue(
                          fieldProps("scientificNameSource").name,
                          newValue ? "COLPLUS" : null
                        );
                        formik.setFieldValue(
                          fieldProps("scientificNameDetails.labelHtml").name,
                          newValue && isArray(newValue)
                            ? newValue[0].labelHtml
                            : null
                        );
                        formik.setFieldValue(
                          fieldProps("scientificNameDetails.sourceUrl").name,
                          newValue && isArray(newValue)
                            ? newValue[0].sourceUrl
                            : null
                        );
                        formik.setFieldValue(
                          fieldProps("scientificNameDetails.recordedOn").name,
                          newValue && isArray(newValue)
                            ? newValue[0].recordedOn
                            : null
                        );
                      }}
                      index={index}
                      isDetermination={true}
                    />
                    <ResourceSelectField<Person>
                      {...fieldProps("determiner")}
                      label={formatMessage("determiningAgents")}
                      readOnlyLink="/person/view?id="
                      filter={filterBy(["displayName"])}
                      model="agent-api/person"
                      optionLabel={person => person.displayName}
                      isMulti={true}
                      asyncOptions={[
                        {
                          label: <DinaMessage id="addNewPerson" />,
                          getResource: openAddPersonModal
                        }
                      ]}
                    />
                    <DateField
                      {...fieldProps("determinedOn")}
                      label={formatMessage("determiningDate")}
                    />
                    <TextField {...fieldProps("remarks")} />
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
              </div>
            );
          }

          // Always shows the panel without tabs when it is a template
          return (
            <FieldSet
              className={className}
              id="determination-section"
              legend={<DinaMessage id="determinations" />}
            >
              <div className="determination-section">
                <Tabs selectedIndex={activeTabIdx} onSelect={setActiveTabIdx}>
                  {
                    // Only show the tabs when there is more than 1 assertion:
                    <TabList
                      className={`react-tabs__tab-list mb-0 ${
                        determinations.length === 1 ? "d-none" : ""
                      }`}
                    >
                      {determinations.map((determination, index) => (
                        <Tab key={index}>
                          <span className="m-3">
                            {index + 1}
                            {determination.isPrimary && determination.isFileAs
                              ? ` (${formatMessage(
                                  "primary"
                                )} | ${formatMessage("isFileAs")})`
                              : (determination.isFileAs &&
                                  `(${formatMessage("isFileAs")})`) ||
                                (determination.isPrimary &&
                                  `(${formatMessage("primary")})`)}
                          </span>
                        </Tab>
                      ))}
                    </TabList>
                  }
                  {determinations.length
                    ? determinations.map((_, index) => (
                        <TabPanel key={index}>
                          <div
                            className="card-body border-top-0 mb-3"
                            style={
                              determinations.length > 1
                                ? { border: "1px solid rgb(170, 170, 170)" }
                                : undefined
                            }
                          >
                            {determinationInternal(index)}
                            {!readOnly && !isTemplate && (
                              <div className="list-inline">
                                <FormikButton
                                  className="list-inline-item btn btn-primary add-determination-button"
                                  onClick={addDetermination}
                                >
                                  <DinaMessage id="addAnotherDetermination" />
                                </FormikButton>
                                <FormikButton
                                  className="list-inline-item btn btn-dark"
                                  onClick={() => removeDetermination(index)}
                                >
                                  <DinaMessage id="removeDeterminationLabel" />
                                </FormikButton>
                              </div>
                            )}
                          </div>
                        </TabPanel>
                      ))
                    : null}
                </Tabs>
                {!determinations.length && !readOnly && !isTemplate && (
                  <FormikButton
                    className="btn btn-primary add-determination-button"
                    onClick={addDetermination}
                  >
                    <DinaMessage id="addDetermination" />
                  </FormikButton>
                )}
              </div>
            </FieldSet>
          );
        }}
      </FieldArray>
    </div>
  );
}
