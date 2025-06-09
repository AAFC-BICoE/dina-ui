import { FieldWrapper, FieldWrapperProps, useDinaFormContext } from "common-ui";
import { FormikProps } from "formik";

import DOMPurify from "dompurify";
import _ from "lodash";
import { Dispatch, SetStateAction, useState } from "react";
import Switch from "react-switch";
import {
  ScientificNameSource,
  ScientificNameSourceDetails
} from "../../../../dina-ui/types/collection-api";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { ClassificationField } from "../classification/ClassificationField";
import { GlobalNamesSearchBox } from "../global-names/GlobalNamesSearchBox";

export interface GlobalNamesFieldProps extends FieldWrapperProps {
  scientificNameSourceField?: string;
  onChange?: (selection: string | null, formik: FormikProps<any>) => void;
  /** Overridable for mocking in tests. */
  fetchJson?: (url: string) => Promise<any>;
  index?: number;
  isDetermination?: boolean;
  scientificNameDetailsSrcUrlField?: string;
  scientificNameDetailsField?: string;
  /** Mock this out in tests so it gives a predictable value. */
  dateSupplier?: () => string;
}

export function GlobalNamesField({
  onChange,
  scientificNameSourceField,
  fetchJson,
  index,
  isDetermination,
  scientificNameDetailsSrcUrlField,
  scientificNameDetailsField,
  dateSupplier,
  ...fieldWrapperProps
}: GlobalNamesFieldProps) {
  const [searchInitiated, setSearchInitiated] = useState(false);

  return (
    <FieldWrapper {...fieldWrapperProps} disableLabelClick={true}>
      {({ formik, setValue, value }) => {
        const scientificNameSrcDetailUrlVal = formik.getFieldMeta(
          scientificNameDetailsSrcUrlField as any
        ).value as string;

        const scientificNameSrcDetailVal = formik.getFieldMeta(
          scientificNameDetailsField as any
        ).value as string;

        const scientificNameSourceFieldHelpers = formik.getFieldHelpers(
          scientificNameSourceField as any
        );

        const scientificNameSourceFieldVal = formik.getFieldMeta(
          scientificNameSourceField as any
        ).value as string;

        const isManualInput =
          scientificNameSourceFieldVal === ScientificNameSource.CUSTOM;

        function onToggleManualInput(checked) {
          if (checked) {
            scientificNameSourceFieldHelpers.setValue(
              ScientificNameSource.CUSTOM
            );
          } else {
            scientificNameSourceFieldHelpers.setValue(undefined);
          }
          setValue(null);
        }
        return scientificNameSrcDetailVal && scientificNameSrcDetailUrlVal ? (
          <SelectedScientificNameView
            value={value}
            formik={formik}
            scientificNameDetailsField={scientificNameDetailsField as any}
            scientificNameSrcDetailUrlVal={scientificNameSrcDetailUrlVal}
            onChange={onChange as any}
            setSearchInitiated={setSearchInitiated}
            searchInitiated={searchInitiated}
            setValue={setValue}
          />
        ) : (
          <>
            <div className="d-flex align-items-center justify-content-end mb-2">
              <label className="me-2" htmlFor="manualInput">
                <DinaMessage id="manual" />
              </label>
              <Switch
                id="manualInput"
                checked={isManualInput}
                onChange={onToggleManualInput}
              />
            </div>
            {isManualInput ? (
              <ClassificationField
                initValue={(scientificNameSrcDetailVal as any) ?? ""}
                onChange={(newValue) => onChange?.(newValue as any, formik)}
              />
            ) : (
              <GlobalNamesSearchBox
                fetchJson={fetchJson}
                onSelect={(newValue) => {
                  const val = _.isArray(newValue) ? newValue?.[1] : newValue;
                  onChange?.(newValue as any, formik);
                  setValue(val);
                  setSearchInitiated(true);
                }}
                index={index}
                setValue={setValue}
                initSearchValue={value ?? ""}
                formik={formik}
                onChange={onChange}
                isDetermination={isDetermination}
                dateSupplier={dateSupplier}
              />
            )}
          </>
        );
      }}
    </FieldWrapper>
  );
}
interface GlobalNamesReadOnlyProps {
  value: string;
  scientificNameDetails: ScientificNameSourceDetails;
  displayFull?: boolean;
}

export function GlobalNamesReadOnly({
  value,
  scientificNameDetails,
  displayFull
}: GlobalNamesReadOnlyProps) {
  const [showMore, setShowMore] = useState(displayFull ?? false);
  const { formatMessage } = useDinaIntl();

  let safeHtmlLink: string = "";

  if (scientificNameDetails?.isSynonym) {
    const link = document.createElement("a");
    link.setAttribute("href", scientificNameDetails.sourceUrl as string);

    link.innerHTML = scientificNameDetails.currentName as string;

    safeHtmlLink = DOMPurify.sanitize(link.outerHTML, {
      ADD_ATTR: ["target", "rel"]
    });
  }

  const paths = scientificNameDetails?.classificationPath
    ?.split("|")
    ?.reverse();
  const ranks = scientificNameDetails?.classificationRanks
    ?.split("|")
    ?.reverse();
  const pathsInit = paths?.slice(0, 2);
  const ranksInit = ranks?.slice(0, 2);

  const initTaxonTree = (
    <>
      {pathsInit?.map((path, idx) => {
        let boldText = (
          <>
            <b>
              {" "}
              {_.startCase(
                ranksInit?.[idx] === ""
                  ? "unranked"
                  : ranksInit?.[idx] ?? "unranked"
              )}{" "}
              :
            </b>{" "}
            <>{path}</>{" "}
          </>
        );

        if (idx !== pathsInit.length - 1 && boldText) {
          boldText = <> {boldText} &gt;</>;
        }
        return boldText;
      })}
    </>
  );

  const fullTaxonTree = (
    <>
      {paths?.map((path, idx) => {
        let boldText = (
          <>
            <b>
              {" "}
              {_.startCase(
                ranks?.[idx] === "" ? "unranked" : ranks?.[idx] ?? "unranked"
              )}{" "}
              :
            </b>{" "}
            <>{path}</>{" "}
          </>
        );

        if (idx !== paths.length - 1 && boldText) {
          boldText = <> {boldText} &gt;</>;
        }
        return boldText;
      })}
    </>
  );

  return (
    <div>
      <span style={{ fontSize: "1.5rem" }}> {value} </span>
      {scientificNameDetails?.isSynonym && (
        <div className="flex-grow-1 d-flex align-items-center">
          <span className="me-2">Synonym of: </span>{" "}
          <span dangerouslySetInnerHTML={{ __html: safeHtmlLink }} />
        </div>
      )}
      {paths?.length &&
      ranks?.length &&
      paths.length < 3 &&
      ranks.length < 3 ? (
        <div className="mt-1">{initTaxonTree}</div>
      ) : (
        <div className="mt-1">
          {showMore ? fullTaxonTree : initTaxonTree}
          {!displayFull && (
            <a
              role="button"
              className="btn-link"
              onClick={() => setShowMore(!showMore)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  setShowMore(!showMore);
                }
              }}
              tabIndex={0}
            >
              {showMore ? formatMessage("showLess") : formatMessage("showMore")}{" "}
            </a>
          )}
        </div>
      )}
    </div>
  );
}

export function getFieldValue(form, fieldName) {
  return form?.getFieldValue
    ? form?.getFieldValue(fieldName as any)
    : form?.getFieldMeta
    ? form?.getFieldMeta(fieldName as any).value
    : null;
}

export function RenderAsReadonly({ value, form, scientificNameDetailsField }) {
  const scientificNameDetails = getFieldValue(form, scientificNameDetailsField);
  return (
    <GlobalNamesReadOnly
      scientificNameDetails={scientificNameDetails}
      value={value}
    />
  );
}

export interface SelectedScientificNameViewProps {
  value: string;
  formik: FormikProps<any>;
  scientificNameDetailsField: string;
  scientificNameSrcDetailUrlVal: string;
  searchInitiated?: boolean;
  onChange?: (selection: string | null, formik: FormikProps<any>) => void;
  setValue?: (newValue: any) => void;
  setSearchInitiated?: Dispatch<SetStateAction<boolean>>;
}

export function SelectedScientificNameView(
  props: SelectedScientificNameViewProps
) {
  const {
    value,
    formik,
    scientificNameDetailsField,
    scientificNameSrcDetailUrlVal,
    searchInitiated,
    onChange,
    setValue,
    setSearchInitiated
  } = props;

  const scientificNameDetails = getFieldValue(
    formik,
    scientificNameDetailsField
  );
  const { readOnly } = useDinaFormContext();

  return (
    <div style={{ border: "1px solid #F5F5F5" }}>
      <div className="mt-2">
        <RenderAsReadonly
          value={value}
          form={formik}
          scientificNameDetailsField={scientificNameDetailsField}
        />
      </div>
      <div className="my-2">
        {scientificNameSrcDetailUrlVal && (
          <a
            type="button"
            href={`${scientificNameSrcDetailUrlVal}`}
            className="btn btn-info me-2 view-button "
            target="_blank"
          >
            <DinaMessage id="viewDetailButtonLabel" />
          </a>
        )}
        {(searchInitiated || scientificNameDetails) && !readOnly && (
          <button
            type="button"
            className="btn btn-danger remove-button"
            onClick={() => {
              onChange?.(null, formik);
              setValue?.(null);
              setSearchInitiated?.(false);
            }}
          >
            <DinaMessage id="remove" />
          </button>
        )}
      </div>
    </div>
  );
}
