import {  useFormikContext } from "formik";
import { find } from "lodash";
import { useEffect, useState } from "react";
import Button from "react-bootstrap/Button";
import {
  CheckBoxField,
  CreatableSelectField,
  FieldWrapperProps,
  LoadingSpinner,
  QueryState,
  SelectField,
} from "../../../../common-ui/lib";
import { DataRow } from "../../../../dina-ui/components";
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
  blockOptionsQuery?: QueryState<any, any>;
  blockOptions?: any[];
  unitsOptions?: any[];
  typeOptions?: any[];
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
  blockOptionsQuery,
  blockOptions,
  unitsOptions,
  typeOptions,
  ...props
}: DataBlockProps) {
  const extensionKeys = extensionValues[blockKey].rows;
  const formik = useFormikContext<any>();
  const rootName = props.name.split(".")[0];
  const selectedBlockOptions = formik?.values?.[rootName]
    ? Object.keys(formik?.values?.[rootName]).map(
        (blockKey) => formik?.values?.[rootName][blockKey].select
      )
    : [];
    
  // Dynamic DataBlock type options that changes based on what DataBlock selection is
  const [dynamicSelectedTypeOptions, setDynamicSelectedTypeOptions] = useState<any>([]);

  function onBlockSelectChange(selected, oldValue?) {
    const selectedFieldExtension = blockOptionsQuery?.response?.data.find(
      (data) => data.extension.key === selected
    );
    const selectedExtensionFieldsOptions =
      selectedFieldExtension?.extension.fields.map((data) => ({
        label: data.name,
        value: data.key
      }));
    setDynamicSelectedTypeOptions(selectedExtensionFieldsOptions);

    // Clear block rows if new block option selected
    if (selected !== oldValue) {
      if (formik?.values?.[rootName]) {
        Object.keys(formik?.values?.[rootName]).forEach((extensionKey) => {
          if (formik?.values?.[rootName][extensionKey].select === oldValue) {
            formik.values[rootName][extensionKey].rows = {
              "extensionField-0": ""
            };
          }
        });
      }
    }
  }

  function onCreatableSelectFieldChange(value, oldValue) {
    if (isVocabularyBasedEnabledForBlock) {
      formik.setFieldValue(
        `${props.name}.vocabularyBased`,
        !!find(blockOptions, (item) => item.value === value)
      );
    }
    if (onBlockSelectChange) {
      onBlockSelectChange(value, oldValue);
    }
  }
  // Make SelectField component load initial values if they exist
  useEffect(() => {
    if (extensionValues && blockOptionsQuery?.response) {
      Object.keys(extensionValues)?.forEach((blockKey) => {
        if (blockKey) {
          onBlockSelectChange(extensionValues[blockKey].select);
        }
      });
    }
  }, [blockOptionsQuery?.response]);
  
  if (blockOptionsQuery?.loading) {
    return <LoadingSpinner loading={true} />;
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
