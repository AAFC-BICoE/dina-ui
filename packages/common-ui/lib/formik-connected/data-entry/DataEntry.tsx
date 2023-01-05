import { FieldSet } from "../../../../common-ui/lib";
import { DataBlock } from "./DataBlock";
import { DinaMessage } from "../../../../dina-ui/intl/dina-ui-intl";
import { FieldArray } from "formik";
import { Button } from "react-bootstrap";
import { useRef } from "react";

export interface DataEntryProps {
  blockOptions?: any[];
  typeOptions: any[];
  vocabularyOptionsPath?: string;
  /** The model type to select resources from. */
  model?: string;
  unitsOptions?: any[];
}

export function DataEntry({
  blockOptions,
  vocabularyOptionsPath,
  model,
  unitsOptions,
  typeOptions
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
          <Button onClick={() => addBlock()} className="add-datablock">
            Add
          </Button>
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
        <FieldArray name="blocks">
          {(fieldArrayProps) => {
            const blocks: [] = fieldArrayProps.form.values.blocks;
            arrayHelpersRef.current = fieldArrayProps;

            return (
              <div>
                {blocks?.length > 0 ? (
                  <div style={{ padding: 15 }}>
                    {blocks.map((_, index) => {
                      return (
                        <DataBlock
                          blockOptions={blockOptions}
                          // mocked based on <ResourceSelectField<Person>
                          model={model}
                          unitsOptions={unitsOptions}
                          blockIndex={index}
                          removeBlock={removeBlock}
                          name={`${fieldArrayProps.name}[${index}]`}
                          key={index}
                          vocabularyOptionsPath={vocabularyOptionsPath}
                          typeOptions={typeOptions}
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
