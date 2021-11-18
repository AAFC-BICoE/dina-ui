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
import { CatalogueOfLifeNameField } from "..";
import { PersonSelectField } from "../..";
import { TypeStatusEnum } from "../../../../dina-ui/types/collection-api/resources/TypeStatus";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import {
  Determination,
  MaterialSample,
  Vocabulary
} from "../../../types/collection-api";
import { TabbedArrayField } from "../TabbedArrayField";

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
      renderTabPanel={({ fieldProps, index }) => (
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
              />
              <TextField {...fieldProps("verbatimDate")} />
              <TextField {...fieldProps("verbatimRemarks")} multiLines={true} />
              <TextField
                {...fieldProps("transcriberRemarks")}
                multiLines={true}
              />
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
                    newValue && isArray(newValue) ? newValue[0].labelHtml : null
                  );
                  formik.setFieldValue(
                    fieldProps("scientificNameDetails.sourceUrl").name,
                    newValue && isArray(newValue) ? newValue[0].sourceUrl : null
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
              <PersonSelectField
                {...fieldProps("determiner")}
                label={formatMessage("determiningAgents")}
                isMulti={true}
              />
              <DateField
                {...fieldProps("determinedOn")}
                label={formatMessage("determiningDate")}
              />
              <TextField {...fieldProps("determinationRemarks")} />
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
      )}
    />
  );
}
