import { FieldWrapper, FieldWrapperProps } from "common-ui";
import { FormikProps } from "formik";
import { DinaMessage } from "../../../intl/dina-ui-intl";
import { CatalogueOfLifeSearchBox } from "./CatalogueOfLifeSearchBox";
import DOMPurify from "dompurify";
import { useState } from "react";

export interface CatalogueOfLifeNameFieldProps extends FieldWrapperProps {
  scientificNameSourceField?: string;
  onChange?: (selection: string | null, formik: FormikProps<any>) => void;
  /** Overridable for mocking in tests. */
  fetchJson?: (url: string) => Promise<any>;
  index?: number;
}

export function CatalogueOfLifeNameField({
  onChange,
  scientificNameSourceField,
  fetchJson,
  index,
  ...fieldWrapperProps
}: CatalogueOfLifeNameFieldProps) {
  const [searchInitiated, setSearchInitiated] = useState(false);
  return (
    <FieldWrapper
      {...fieldWrapperProps}
      disableLabelClick={true}
      readOnlyRender={(value, form) => (
        <div className="card card-body">
          <CatalogueOfLifeNameReadOnly
            value={value}
            scientificNameSource={
              scientificNameSourceField &&
              form.getFieldMeta(scientificNameSourceField).value
            }
          />
        </div>
      )}
    >
      {({ formik, setValue, value }) =>
        value && searchInitiated ? (
          <div className="card card-body">
            <CatalogueOfLifeNameReadOnly
              value={value}
              scientificNameSource={
                scientificNameSourceField &&
                formik.getFieldMeta(scientificNameSourceField).value
              }
            />
            <div>
              <button
                type="button"
                className="btn btn-dark remove-button"
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
            onSelect={newValue => {
              onChange?.(newValue, formik);
              setValue(newValue);
              setSearchInitiated(true);
            }}
            index={index}
            setValue={setValue}
            initSearchValue={value ?? ""}
          />
        )
      }
    </FieldWrapper>
  );
}

function CatalogueOfLifeNameReadOnly({ value, scientificNameSource }) {
  const sanitizedHtml = DOMPurify.sanitize(value, {
    ADD_ATTR: ["target", "rel"]
  });
  return (
    <div style={{ whiteSpace: "pre-wrap" }}>
      <p dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />{" "}
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
