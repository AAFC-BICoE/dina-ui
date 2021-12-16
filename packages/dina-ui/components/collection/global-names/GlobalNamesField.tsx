import { FieldWrapper, FieldWrapperProps } from "common-ui";
import { FormikProps } from "formik";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { useState } from "react";
import { isArray } from "lodash";
import DOMPurify from "dompurify";
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
        const scientificNameSrceDetailUrlVal = formik.getFieldMeta(
          scientificNameDetailsSrcUrlField as any
        ).value as string;
        return value &&
          (searchInitiated || scientificNameSrceDetailUrlVal?.length > 0) ? (
          // When the field has a value of previous or current search result
          <div style={{ border: "1px solid #F5F5F5" }}>
            <div className="mt-2 ">
              <RenderAsReadonly
                value={value}
                form={formik}
                scientificNameDetailsField={scientificNameDetailsField}
              />
            </div>
            <div className="mb-2 mx-1">
              <button
                type="button"
                className="btn btn-danger remove-button"
                onClick={() => {
                  onChange?.(null, formik);
                  setValue(null);
                  setSearchInitiated(false);
                }}
              >
                <DinaMessage id="remove" />
              </button>
            </div>
          </div>
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

export function GlobalNamesReadOnly({ value, scientificNameDetails }) {
  const [showMore, setShowMore] = useState(false);
  const { formatMessage } = useDinaIntl();
  const link = document.createElement("a");
  link.setAttribute("href", scientificNameDetails?.sourceUrl);
  link.setAttribute("target", "_blank");
  link.setAttribute("rel", "noopener");

  // this will need to be replaced with currentName's label html if any to show as synonym if exists
  link.innerHTML = scientificNameDetails?.labelHtml;

  const safeHtmlLink: string = DOMPurify.sanitize(link.outerHTML, {
    ADD_ATTR: ["target", "rel"]
  });

  const paths = scientificNameDetails?.classificationPath?.split("|");
  const ranks = scientificNameDetails?.classificationRanks?.split("|");

  const familyIdx = ranks?.findIndex(path => path === "family");
  const familyRank = familyIdx >= 0 ? paths[familyIdx] + ": " : undefined;

  const kingdomIdx = ranks?.findIndex(path => path === "kingdom");
  const kingdomRank = kingdomIdx >= 0 ? paths[kingdomIdx] : undefined;

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
        let boldText = (
          <span>
            <b>{ranks?.[idx]} :</b> <span>{path}</span>{" "}
          </span>
        );
        if (idx !== path.length - 1) {
          boldText = <span> {boldText} &gt;</span>;
        }
        return boldText;
      })}
    </>
  );

  return (
    <div style={{ whiteSpace: "pre-wrap" }}>
      <span style={{ fontSize: "1.5rem" }}> {value} </span>
      <span>{scientificNameDetails?.hasSynonym ? safeHtmlLink : null} </span>
      <div className="mt-1 mx-1">
        {showMore ? fullTaxonTree : initTaxonTree}
        <a
          role="button"
          className="btn-link"
          onClick={() => setShowMore(!showMore)}
        >
          {showMore ? formatMessage("showLess") : formatMessage("showMore")}{" "}
        </a>
      </div>
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
