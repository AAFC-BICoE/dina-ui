import { FieldArray, useFormikContext } from "formik";
import { find, get } from "lodash";
import Button from "react-bootstrap/Button";
import {
  CheckBoxField,
  CreatableSelectField,
  FieldWrapperProps,
  SelectField,
  TextField,
  useBulkEditTabContext
} from "../../../../common-ui/lib";
import { DataRow, VocabularySelectField } from "../../../../dina-ui/components";
import { DinaMessage } from "../../../../dina-ui/intl/dina-ui-intl";

export interface DataBlockProps extends FieldWrapperProps {
  blockOptions?: any[];
  onBlockSelectChange?: (value, formik, oldValue?) => void;
  vocabularyOptionsPath?: string;
  /** The model type to select resources from. */
  model?: string;
  unitsOptions?: any[];
  removeBlock?: (blockPath) => void;
  typeOptions?: any[];
  readOnly?: boolean;
  blockAddable?: boolean;
  unitsAddable?: boolean;
  typesAddable?: boolean;
  isVocabularyBasedEnabledForBlock?: boolean;
  isVocabularyBasedEnabledForType?: boolean;
  blockKey: string;
  extensionValues: any;
}

export function DataBlock({
  blockOptions,
  onBlockSelectChange,
  vocabularyOptionsPath,
  model,
  unitsOptions,
  removeBlock,
  typeOptions,
  readOnly,
  blockAddable = false,
  unitsAddable = false,
  typesAddable = false,
  isVocabularyBasedEnabledForBlock = false,
  isVocabularyBasedEnabledForType = false,
  blockKey,
  extensionValues,
  ...props
}: DataBlockProps) {
  function onCreatableSelectFieldChange(value, formik, oldValue) {
    if (isVocabularyBasedEnabledForBlock) {
      formik.setFieldValue(
        `${props.name}.vocabularyBased`,
        !!find(blockOptions, (item) => item.value === value)
      );
    }
    if (onBlockSelectChange) {
      onBlockSelectChange(value, formik, oldValue);
    }
  }
  const extensionKeys = extensionValues[blockKey].rows;
  const formik = useFormikContext<any>();
  const selectedBlockOptions = Object.keys(formik?.values?.extensionValues);
  
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
            {vocabularyOptionsPath && (
              <VocabularySelectField
                path={vocabularyOptionsPath}
                name={`${props.name}.select`}
                removeLabel={true}
                disableTemplateCheckbox={true}
              />
            )}
            {!blockOptions && !vocabularyOptionsPath && (
              <TextField
                name={`${props.name}.select`}
                removeLabel={true}
                disableTemplateCheckbox={true}
              />
            )}
            {isVocabularyBasedEnabledForBlock && (
              <CheckBoxField
                className="hidden"
                name={`${props.name}.vocabularyBased`}
                removeLabel={true}
              />
            )}
          </div>
          {Object.keys(extensionKeys).map(
            (extensionKey, rowIndex) => {
              return (
                <DataRow
                  showPlusIcon={true}
                  name={`${props.name}.rows.${extensionKey}`}
                  rowIndex={rowIndex}
                  model={model}
                  unitsOptions={unitsOptions}
                  typeOptions={typeOptions}
                  readOnly={readOnly}
                  typesAddable={typesAddable}
                  unitsAddable={unitsAddable}
                  isVocabularyBasedEnabledForType={
                    isVocabularyBasedEnabledForType
                  }
                />
              );
            }
          )}
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
