import { FieldArray } from "formik";
import { useEffect, useRef } from "react";
import { Button } from "react-bootstrap";
import { FieldSet } from "../..";
import { DinaMessage } from "../../../../dina-ui/intl/dina-ui-intl";
import { DataBlock } from "./DataBlock";
import { DataEntryFieldProps } from "./DataEntryField";

/* tslint:disable-next-line */
export interface DataEntryProps extends DataEntryFieldProps {}

export function DataEntry({
  legend,
  name,
  blockOptions,
  onBlockSelectChange,
  model,
  unitsOptions,
  vocabularyOptionsPath,
  typeOptions,
  readOnly,
  initialValues,
  selectedBlockOptions,
  setSelectedBlockOptions,
  id,
  blockAddable = false,
  unitsAddable = false,
  typesAddable = false,
  isVocabularyBasedEnabledForBlock = false,
  isVocabularyBasedEnabledForType = false
}: DataEntryProps) {
  const arrayHelpersRef = useRef<any>(null);

  function removeBlock(index) {
    const oldValue =
      arrayHelpersRef?.current?.form?.values?.extensionValues?.[index]
        ?.select ??
      arrayHelpersRef?.current?.form?.initialValues?.extensionValues?.[index]
        ?.select;

    if (setSelectedBlockOptions) {
      setSelectedBlockOptions(
        selectedBlockOptions.filter((item) => item !== oldValue)
      );
    }
    arrayHelpersRef.current.remove(index);
  }

  function addBlock() {
    arrayHelpersRef.current.push({ rows: [{}] });
  }
  // Make SelectField component load initial values if they exist
  useEffect(() => {
    if (onBlockSelectChange && initialValues) {
      initialValues.forEach((initialValue) => {
        if (onBlockSelectChange && initialValue?.select) {
          onBlockSelectChange(initialValue.select, undefined);
        }
      });
    }
  }, []);
  function legendWrapper():
    | ((legendElement: JSX.Element) => JSX.Element)
    | undefined {
    return (legendElement) => {
      return (
        <div className="d-flex align-items-center justify-content-between">
          {legendElement}
          {!readOnly && (
            <Button onClick={() => addBlock()} className="add-datablock">
              <DinaMessage id="addCustomPlaceName" />
            </Button>
          )}
        </div>
      );
    };
  }
  return (
    <FieldSet legend={legend} wrapLegend={legendWrapper()} id={id}>
      <FieldArray name={name}>
        {(fieldArrayProps) => {
          const blocks: [] = fieldArrayProps.form.values[name];
          arrayHelpersRef.current = fieldArrayProps;

          return (
            <div>
              {blocks?.length > 0 ? (
                <div style={{ padding: 15 }}>
                  {blocks.map((_, index) => {
                    return (
                      <DataBlock
                        blockOptions={blockOptions}
                        onBlockSelectChange={onBlockSelectChange}
                        model={model}
                        unitsOptions={unitsOptions}
                        blockIndex={index}
                        removeBlock={removeBlock}
                        name={`${fieldArrayProps.name}[${index}]`}
                        key={index}
                        vocabularyOptionsPath={vocabularyOptionsPath}
                        typeOptions={typeOptions}
                        readOnly={readOnly}
                        selectedBlockOptions={selectedBlockOptions}
                        blockAddable={blockAddable}
                        unitsAddable={unitsAddable}
                        typesAddable={typesAddable}
                        isVocabularyBasedEnabledForBlock={
                          isVocabularyBasedEnabledForBlock
                        }
                        isVocabularyBasedEnabledForType={
                          isVocabularyBasedEnabledForType
                        }
                      />
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        }}
      </FieldArray>
    </FieldSet>
  );
}
