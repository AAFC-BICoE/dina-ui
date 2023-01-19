import { FieldSet } from "../../../../common-ui/lib";
import { DataBlock } from "./DataBlock";
import { DinaMessage } from "../../../../dina-ui/intl/dina-ui-intl";
import { FieldArray } from "formik";
import { Button } from "react-bootstrap";
import { useRef } from "react";

export interface DataEntryProps {
  blockOptions?: any[];
  onBlockSelectChange?: (value, formik) => void;
  typeOptions?: any[];
  vocabularyOptionsPath?: string;
  /** The model type to select resources from. */
  model?: string;
  unitsOptions?: any[];
  /** Name that will be passed down to DataBlock and FieldArray component. */
  name: string;
  readOnly?: boolean;
}

export function DataEntry({
  blockOptions,
  onBlockSelectChange,
  vocabularyOptionsPath,
  model,
  unitsOptions,
  typeOptions,
  name,
  readOnly,
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
    <div style={{ width: "70%" }}>
      <FieldSet
        legend={<DinaMessage id="dataEntryLabel" />}
        wrapLegend={legendWrapper()}
      >
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
    </div>
  );
}
