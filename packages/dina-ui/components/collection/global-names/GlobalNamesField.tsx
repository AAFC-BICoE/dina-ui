import { FieldWrapper, FieldWrapperProps, useDinaFormContext } from "common-ui";
import { FormikProps } from "formik";

import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { useState } from "react";
import { isArray } from "lodash";
import DOMPurify from "dompurify";
import { GlobalNamesSearchBox } from "../global-names/GlobalNamesSearchBox";
import { Dispatch, SetStateAction } from "react";
import { ScientificNameSourceDetails } from "../../../../dina-ui/types/collection-api";
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
          <GlobalNamesSearchBox
            fetchJson={fetchJson}
            onSelect={newValue => {
              const val = isArray(newValue) ? newValue?.[1] : newValue;
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
        );
      }}
    </FieldWrapper>
  );
}
interface GlobalNamesReadOnlyProps {
  value: string;
  scientificNameDetails: ScientificNameSourceDetails;
}

export function GlobalNamesReadOnly({
  value,
  scientificNameDetails
}: GlobalNamesReadOnlyProps) {
  const [showMore, setShowMore] = useState(false);
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

  const paths = scientificNameDetails?.classificationPath?.split("|");
  const ranks = scientificNameDetails?.classificationRanks?.split("|");

  const familyIdx = ranks?.findIndex(path => path === "family");
  const kingdomIdx = ranks?.findIndex(path => path === "kingdom");

  const kingdomRank =
    kingdomIdx && kingdomIdx >= 0 ? paths?.[kingdomIdx] : undefined;
  const familyRank =
    familyIdx && familyIdx >= 0 ? paths?.[familyIdx] + ": " : undefined;

  const initTaxonTree = (
    <span>
      {" "}
      {kingdomRank ? <b>Kingdom: </b> : undefined} {kingdomRank}
      {familyRank ? <b> &gt;Family: </b> : undefined} {familyRank}
    </span>
  );

  const fullTaxonTree = (
    <>
      {paths?.map((path, idx) => {
        let boldText = ranks?.[idx] && (
          <>
            <b>
              {" "}
              {ranks[idx].charAt(0)?.toUpperCase() + ranks[idx].substring(1)} :
            </b>{" "}
            <>{path}</>{" "}
          </>
        );

        if (idx !== path.length - 1 && boldText) {
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
      {paths?.length && ranks?.length && (
        <div className="mt-1">
          {showMore ? fullTaxonTree : initTaxonTree}
          <a
            role="button"
            className="btn-link"
            onClick={() => setShowMore(!showMore)}
          >
            {showMore ? formatMessage("showLess") : formatMessage("showMore")}{" "}
          </a>
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
      value={value}
      scientificNameDetails={scientificNameDetails}
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
