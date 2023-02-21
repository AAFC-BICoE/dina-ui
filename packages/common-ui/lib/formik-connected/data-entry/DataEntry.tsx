import {
  FieldSet,
  useBulkEditTabContext,
  useBulkEditTabFieldIndicators
} from "../..";
import { DataBlock } from "./DataBlock";
import { DinaMessage } from "../../../../dina-ui/intl/dina-ui-intl";
import { FieldArray } from "formik";
import { Button } from "react-bootstrap";
import { useRef } from "react";
import { DataEntryFieldProps } from "./DataEntryField";
import { useEffect } from "react";

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
  id
}: DataEntryProps) {
  // Display loaded values when in bulk edit
  const bulkCtx = useBulkEditTabContext();

  const bulkEditResourceHooks = bulkCtx?.resourceHooks;

  let bulkEditBlocksRowsMap = {};
  bulkEditResourceHooks?.forEach((resourceHook: any) => {
    resourceHook?.resource?.extensionValues?.forEach((extensionValue) => {
      // If extension value already in map, get the largest number of rows
      if (bulkEditBlocksRowsMap[extensionValue?.select]) {
        bulkEditBlocksRowsMap[extensionValue?.select] =
          bulkEditBlocksRowsMap[extensionValue?.select].length >
          extensionValue?.rows?.length
            ? bulkEditBlocksRowsMap[extensionValue?.select]
            : extensionValue?.rows;
      } else {
        bulkEditBlocksRowsMap[extensionValue?.select] = extensionValue?.rows;
      }
    });
  });

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
    if (onBlockSelectChange) {
      initialValues?.forEach((initialValue) => {
        if (initialValue?.select) {
          onBlockSelectChange(initialValue.select, undefined);
        }
      });
      Object.keys(bulkEditBlocksRowsMap).forEach((select) => {
        onBlockSelectChange(select, undefined);
      })
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
                      />
                    );
                  })}
                </div>
              ) : Object.keys(bulkEditBlocksRowsMap).length > 0 ? (
                <div style={{ padding: 15 }}>
                  {Object.keys(bulkEditBlocksRowsMap).map((select, index) => {
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
                        bulkEditRows={bulkEditBlocksRowsMap[select]}
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
