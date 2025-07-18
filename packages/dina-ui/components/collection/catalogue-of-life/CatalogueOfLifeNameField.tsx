import { FieldWrapper, FieldWrapperProps } from "common-ui";
import { FormikProps } from "formik";
import { DinaMessage } from "../../../intl/dina-ui-intl";
import { CatalogueOfLifeSearchBox } from "./CatalogueOfLifeSearchBox";
import { useState } from "react";
import _ from "lodash";
import DOMPurify from "dompurify";
export interface CatalogueOfLifeNameFieldProps extends FieldWrapperProps {
  scientificNameSourceField?: string;
  onChange?: (selection: string | null, formik: FormikProps<any>) => void;
  /** Overridable for mocking in tests. */
  fetchJson?: (url: string) => Promise<any>;
  index?: number;
  isDetermination?: boolean;
  scientificNameDetailsSrcUrlField?: string;
  scientificNameDetailsLabelHtmlField?: string;

  /** Mock this out in tests so it gives a predictable value. */
  dateSupplier?: () => string;
}

export function CatalogueOfLifeNameField({
  onChange,
  scientificNameSourceField,
  fetchJson,
  index,
  isDetermination,
  scientificNameDetailsSrcUrlField,
  scientificNameDetailsLabelHtmlField,
  dateSupplier,
  ...fieldWrapperProps
}: CatalogueOfLifeNameFieldProps) {
  const [searchInitiated, setSearchInitiated] = useState(false);

  const getFieldValue = (form, fieldName) => {
    return form?.getFieldValue
      ? form?.getFieldValue(fieldName as any)
      : form?.getFieldMeta
      ? form?.getFieldMeta(fieldName as any).value
      : null;
  };

  const RenderAsReadonly = ({ value, form }) => {
    const scientificNameDetailSrcUrl = getFieldValue(
      form,
      scientificNameDetailsSrcUrlField
    );
    const scientificNameDetailLabelHtml = getFieldValue(
      form,
      scientificNameDetailsLabelHtmlField
    );
    const scientificNameVal = getFieldValue(form, scientificNameSourceField);

    const link = document.createElement("a");
    link.setAttribute("href", scientificNameDetailSrcUrl);

    link.innerHTML = scientificNameDetailLabelHtml;

    const safeHtmlLink: string = DOMPurify.sanitize(link.outerHTML, {
      ADD_ATTR: ["target", "rel"]
    });

    const isFromSrcDetailsUrl = scientificNameDetailSrcUrl?.length > 0;

    return (
      <CatalogueOfLifeNameReadOnly
        value={isFromSrcDetailsUrl ? safeHtmlLink : value}
        scientificNameSource={scientificNameSourceField && scientificNameVal}
        isFromSrcDetailsUrl={isFromSrcDetailsUrl}
      />
    );
  };
  return (
    <FieldWrapper
      {...fieldWrapperProps}
      disableLabelClick={true}
      readOnlyRender={(value, form) => (
        <div className="card card-body">
          <RenderAsReadonly value={value} form={form} />
        </div>
      )}
    >
      {({ formik, setValue, value }) => {
        const scientificNameSrceDetailUrlVal = formik.getFieldMeta(
          scientificNameDetailsSrcUrlField as any
        ).value as string;
        return value &&
          (searchInitiated || scientificNameSrceDetailUrlVal?.length > 0) ? (
          // When the field has a value of previous or current search result
          <div
            className="d-flex flex-row"
            style={{ border: "1px solid #F5F5F5" }}
          >
            <div className="col-md-6 mt-2 ">
              <RenderAsReadonly value={value} form={formik} />
            </div>
            <div className="col-md-4 d-flex align-items-center">
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
          <CatalogueOfLifeSearchBox
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
        );
      }}
    </FieldWrapper>
  );
}

function CatalogueOfLifeNameReadOnly({
  value,
  scientificNameSource,
  isFromSrcDetailsUrl
}) {
  const sanitizedHtml = DOMPurify.sanitize(value, {
    ADD_ATTR: ["target", "rel"]
  });

  return (
    <div style={{ whiteSpace: "pre-wrap" }}>
      {isFromSrcDetailsUrl ? (
        <p dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />
      ) : (
        <p> {value} </p>
      )}
      {scientificNameSource && (
        <p>
          <strong>
            <DinaMessage id="source" />:{" "}
          </strong>
          {scientificNameSource}
        </p>
      )}
    </div>
  );
}
