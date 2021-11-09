import { FieldWrapper, FieldWrapperProps } from "common-ui";
import { FormikProps } from "formik";
import { DinaMessage } from "../../../intl/dina-ui-intl";
import { CatalogueOfLifeSearchBox } from "./CatalogueOfLifeSearchBox";
import { useState } from "react";
import { isArray } from "lodash";
export interface CatalogueOfLifeNameFieldProps extends FieldWrapperProps {
  scientificNameSourceField?: string;
  onChange?: (selection: string | null, formik: FormikProps<any>) => void;
  /** Overridable for mocking in tests. */
  fetchJson?: (url: string) => Promise<any>;
  index?: number;
  isDetermination?: boolean;
}

export function CatalogueOfLifeNameField({
  onChange,
  scientificNameSourceField,
  fetchJson,
  index,
  isDetermination,
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
          />
        )
      }
    </FieldWrapper>
  );
}

function CatalogueOfLifeNameReadOnly({ value, scientificNameSource }) {
  return (
    <div style={{ whiteSpace: "pre-wrap" }}>
      <p> {value} </p>
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
