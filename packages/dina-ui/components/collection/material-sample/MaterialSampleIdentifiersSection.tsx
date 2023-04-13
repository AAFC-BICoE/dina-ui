import {
  CheckBoxField,
  DinaFormSection,
  FieldSet,
  StringArrayField,
  TextField,
  useDinaFormContext
} from "common-ui";
import { useField } from "formik";
import { useState } from "react";
import { CollectionSelectField } from "../..";
import { DinaMessage } from "../../../intl/dina-ui-intl";
import {
  IDENTIFIER_COMPONENT_NAME,
  MaterialSample
} from "../../../types/collection-api";

export interface MaterialSampleIdentifiersSectionProps {
  disableSampleNameField?: boolean;
  hideOtherCatalogNumbers?: boolean;
  className?: string;
  namePrefix?: string;
  sampleNamePlaceHolder?: string;
  id?: string;
  hideUseSequence?: boolean;
}

/** The fields in the Identifiers section. */
export const IDENTIFIERS_FIELDS: (keyof MaterialSample)[] = [
  "collection",
  "materialSampleName",
  "dwcOtherCatalogNumbers",
  "barcode"
];

/** Fields layout re-useable between view and edit pages. */
export function MaterialSampleIdentifiersSection({
  disableSampleNameField,
  className,
  namePrefix = "",
  sampleNamePlaceHolder,
  hideUseSequence,
  id = IDENTIFIER_COMPONENT_NAME
}: MaterialSampleIdentifiersSectionProps) {
  const [{ value }] = useField("collection");
  const { readOnly, initialValues } = useDinaFormContext();
  const [primaryIdDisabled, setPrimaryIdDisabled] = useState(false);

  return (
    <FieldSet
      id={id}
      legend={<DinaMessage id="identifiers" />}
      className={className}
      componentName={IDENTIFIER_COMPONENT_NAME}
      sectionName="identifiers-section"
    >
      <div className="row">
        <div className="col-md-6">
          <CollectionSelectField
            name={`${namePrefix}collection`}
            customName="collection"
            disableTemplateCheckbox={true}
          />
          <div className="d-flex">
            <TextField
              disableTemplateCheckbox={true}
              name={`${namePrefix}materialSampleName`}
              inputProps={{ disabled: primaryIdDisabled }}
              customName="materialSampleName"
              className="materialSampleName flex-grow-1"
              readOnly={disableSampleNameField}
              placeholder={sampleNamePlaceHolder}
            />
            {!readOnly && !hideUseSequence && (
              <CheckBoxField
                onCheckBoxClick={(event) =>
                  setPrimaryIdDisabled(event.target.checked)
                }
                name="useNextSequence"
                className="ms-2 mt-1"
                // only enabled when add new sample and collection is selected
                disabled={initialValues.id || !value?.id}
                overridecheckboxProps={{
                  style: {
                    height: "30px",
                    width: "30px"
                  }
                }}
              />
            )}
          </div>
          <TextField name={`${namePrefix}barcode`} customName="barcode" />
        </div>
        <div className="col-md-6">
          <StringArrayField
            name={`${namePrefix}dwcOtherCatalogNumbers`}
            customName="dwcOtherCatalogNumbers"
          />
        </div>
      </div>
    </FieldSet>
  );
}
