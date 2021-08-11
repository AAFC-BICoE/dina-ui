import { FieldWrapper, FieldWrapperProps } from "common-ui";
import { FormikProps } from "formik";
import { DinaMessage } from "../../../intl/dina-ui-intl";
import { CatalogueOfLifeSearchBox } from "./CatalogueOfLifeSearchBox";

export interface CatalogueOfLifeNameFieldProps extends FieldWrapperProps {
  scientificNameSourceField?: string;
  onChange?: (selection: string | null, formik: FormikProps<any>) => void;
  /** Overridable for mocking in tests. */
  fetchJson?: (url: string) => Promise<any>;
}

export function CatalogueOfLifeNameField({
  onChange,
  scientificNameSourceField,
  fetchJson,
  ...fieldWrapperProps
}: CatalogueOfLifeNameFieldProps) {
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
        value ? (
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
                onClick={e => {
                  onChange?.(null, formik);
                  setValue(null);
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
            }}
          />
        )
      }
    </FieldWrapper>
  );
}

function CatalogueOfLifeNameReadOnly({ value, scientificNameSource }) {
  return (
    <div>
      <p>{value}</p>{" "}
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
