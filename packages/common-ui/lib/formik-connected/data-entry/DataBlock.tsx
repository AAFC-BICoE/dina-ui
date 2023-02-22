import { FieldArray } from "formik";
import { find, get } from "lodash";
import Button from "react-bootstrap/Button";
import {
  CheckBoxField,
  CreatableSelectField,
  FieldWrapperProps,
  SelectField,
  TextField
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
  blockIndex: number;
  removeBlock?: (index) => void;
  typeOptions?: any[];
  readOnly?: boolean;
  selectedBlockOptions?: any;
  blockAddable?: boolean;
  unitsAddable?: boolean;
  typesAddable?: boolean;
  isVocabularyBasedEnabledForBlock?: boolean;
  isVocabularyBasedEnabledForType?: boolean;
}

export function DataBlock({
  blockOptions,
  onBlockSelectChange,
  vocabularyOptionsPath,
  model,
  unitsOptions,
  blockIndex,
  removeBlock,
  typeOptions,
  readOnly,
  selectedBlockOptions,
  blockAddable = false,
  unitsAddable = false,
  typesAddable = false,
  isVocabularyBasedEnabledForBlock = false,
  isVocabularyBasedEnabledForType = false,
  ...props
}: DataBlockProps) {
  return (
    <div>
      <FieldArray name={`${props.name}.rows`}>
        {(fieldArrayProps) => {
          const rows: [] = get(
            fieldArrayProps,
            `form.values.${fieldArrayProps.name}`
          );
          function addRow() {
            fieldArrayProps.push({});
          }

          function removeRow(rowIndex) {
            fieldArrayProps.remove(rowIndex);
          }

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

          return (
            <div>
              {rows?.length > 0 ? (
                <div
                  className="border"
                  style={{ padding: 15, marginBottom: "2rem" }}
                >
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
                  {rows.map((_, rowIndex) => {
                    return (
                      <DataRow
                        showPlusIcon={true}
                        name={`${fieldArrayProps.name}`}
                        key={rowIndex}
                        rowIndex={rowIndex}
                        addRow={addRow}
                        removeRow={removeRow}
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
                  })}
                  {!readOnly && (
                    <div className="d-flex align-items-center justify-content-between">
                      <Button onClick={() => removeBlock?.(blockIndex)}>
                        <DinaMessage id="deleteButtonText" />
                      </Button>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          );
        }}
      </FieldArray>
    </div>
  );
}
