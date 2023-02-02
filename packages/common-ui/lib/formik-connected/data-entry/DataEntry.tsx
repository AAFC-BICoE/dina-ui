import { FieldSet } from "../..";
import { DataBlock } from "./DataBlock";
import { DinaMessage } from "../../../../dina-ui/intl/dina-ui-intl";
import { FieldArray } from "formik";
import { Button } from "react-bootstrap";
import { useRef } from "react";
import { DataEntryFieldProps } from "./DataEntryField";

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
}: DataEntryProps) {
  const arrayHelpersRef = useRef<any>(null);

  function removeBlock(index) {
    arrayHelpersRef.current.remove(index);
  }
  function addBlock() {
    arrayHelpersRef.current.push({ rows: [{}] });
  }
  function legendWrapper(): ((legend: JSX.Element) => JSX.Element) | undefined {
    return (legend) => {
      return (
        <div className="d-flex align-items-center justify-content-between">
          {legend}
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
    <FieldSet legend={legend} wrapLegend={legendWrapper()}>
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
                        initialValues={initialValues?.at(index)}
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
