import { useFormikContext } from "formik";
import _ from "lodash";
import { useState } from "react";
import Button from "react-bootstrap/Button";
import {
  CheckBoxField,
  CreatableSelectField,
  FieldWrapperProps,
  SelectField
} from "../../../../common-ui/lib";
import { DataRow } from "../../../../common-ui/lib";
import { DinaMessage } from "../../../../dina-ui/intl/dina-ui-intl";

export interface DataBlockProps extends FieldWrapperProps {
  removeBlock?: (blockPath) => void;
  readOnly?: boolean;
  blockAddable?: boolean;
  unitsAddable?: boolean;
  typesAddable?: boolean;
  isVocabularyBasedEnabledForBlock?: boolean;
  isVocabularyBasedEnabledForType?: boolean;
  blockKey: string;
  extensionValues: any;
  blockOptions: any[];
  unitsOptions?: any[];
  typeOptions?: any[];
  disableClearButton?: boolean;
}

export function DataBlock({
  removeBlock,
  readOnly,
  blockAddable = false,
  unitsAddable = false,
  typesAddable = false,
  isVocabularyBasedEnabledForBlock = false,
  isVocabularyBasedEnabledForType = false,
  blockKey,
  extensionValues,
  blockOptions,
  unitsOptions,
  typeOptions,
  disableClearButton = false,
  ...props
}: DataBlockProps) {
  const extensionKeys = extensionValues[blockKey].rows;
  const formik = useFormikContext<any>();
  const rootName = props.name.split(".")[0];
  const selectedBlockOptions = formik?.values?.[rootName]
    ? Object.keys(formik?.values?.[rootName]).map(
        (blockKeySelect) => formik?.values?.[rootName][blockKeySelect].select
      )
    : [];

  // Dynamic DataBlock type options that changes based on what DataBlock selection is
  // Make SelectField component load initial values if they exist
  const [dynamicSelectedTypeOptions, setDynamicSelectedTypeOptions] =
    useState<any>(
      getDynamicSelectedTypeOption(extensionValues?.[blockKey].select)
    );

  function onBlockSelectChange(selected, formikCtx, oldValue?) {
    const selectedExtensionFieldsOptions =
      getDynamicSelectedTypeOption(selected);
    setDynamicSelectedTypeOptions(selectedExtensionFieldsOptions);

    // Clear block rows if new block option selected
    if (selected !== oldValue) {
      if (formikCtx?.values?.[rootName]) {
        Object.keys(formikCtx?.values?.[rootName]).forEach((extensionKey) => {
          if (formikCtx?.values?.[rootName][extensionKey].select === oldValue) {
            // Use setFieldValue to cause a rerender
            formikCtx.setFieldValue(`${rootName}.${extensionKey}.rows`, {
              "extensionField-0": ""
            });
          }
        });
      }
    }
  }

  function getDynamicSelectedTypeOption(selected: any) {
    const selectedFieldExtension = blockOptions?.find(
      (data) => data.value === selected
    );

    const selectedExtensionFieldsOptions = selectedFieldExtension?.fields?.map(
      (data) => ({
        label: data.name,
        value: data.key,
        descriptions: data.multilingualDescription?.descriptions,
        unit: data.unit,
        vocabularyElementType: data.vocabularyElementType
      })
    );
    return selectedExtensionFieldsOptions;
  }

  function onCreatableSelectFieldChange(value, oldValue) {
    if (isVocabularyBasedEnabledForBlock) {
      formik.setFieldValue(
        `${props.name}.vocabularyBased`,
        !!_.find(blockOptions, (item) => item.value === value)
      );
    }
    if (onBlockSelectChange) {
      onBlockSelectChange(value, formik, oldValue);
    }
  }

  return (
    <div>
      {
        <div className="border" style={{ padding: 15, marginBottom: "2rem" }}>
          <div className="d-inline-flex align-items-center">
            {blockOptions && (
              <div style={{ width: "15rem" }}>
                {blockAddable ? (
                  <CreatableSelectField
                    options={blockOptions}
                    name={`${props.name}.select`}
                    removeBottomMargin={true}
                    removeLabel={true}
                    onChange={onCreatableSelectFieldChange}
                    disableTemplateCheckbox={true}
                    filterValues={selectedBlockOptions}
                    readOnlyBold={true}
                  />
                ) : (
                  <SelectField
                    options={blockOptions}
                    name={`${props.name}.select`}
                    removeBottomMargin={true}
                    removeLabel={true}
                    onChange={onBlockSelectChange}
                    disableTemplateCheckbox={true}
                    filterValues={selectedBlockOptions}
                    readOnlyBold={true}
                  />
                )}
              </div>
            )}
            {isVocabularyBasedEnabledForBlock && (
              <CheckBoxField
                className="hidden"
                name={`${props.name}.vocabularyBased`}
                removeLabel={true}
              />
            )}
          </div>
          {Object.keys(extensionKeys).map((extensionKey, rowIndex) => {
            return (
              <DataRow
                key={rowIndex}
                showPlusIcon={true}
                name={`${props.name}.rows.${extensionKey}`}
                rowIndex={rowIndex}
                unitsOptions={unitsOptions}
                typeOptions={typeOptions ?? dynamicSelectedTypeOptions}
                readOnly={readOnly}
                typesAddable={typesAddable}
                unitsAddable={unitsAddable}
                isVocabularyBasedEnabledForType={
                  isVocabularyBasedEnabledForType
                }
                disableClearButton={disableClearButton}
              />
            );
          })}
          {!readOnly && (
            <div className="d-flex align-items-center justify-content-between">
              <Button onClick={() => removeBlock?.(props.name)}>
                <DinaMessage id="deleteButtonText" />
              </Button>
            </div>
          )}
        </div>
      }
    </div>
  );
}
