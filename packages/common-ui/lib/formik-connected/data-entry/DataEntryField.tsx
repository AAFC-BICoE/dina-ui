import { Dispatch } from "react";
import { FieldWrapper } from "../..";
import { DataEntry } from "./DataEntry";

export interface DataEntryFieldProps {
  blockOptions?: any[];
  onBlockSelectChange?: (value, formik, oldValue?) => void;
  typeOptions?: any[];
  vocabularyOptionsPath?: string;
  /** The model type to select resources from. */
  model?: string;
  unitsOptions?: any[];
  /** Name that will be passed down to DataBlock and FieldArray component. */
  name: string;
  readOnly?: boolean;
  initialValues?: any;
  legend: JSX.Element;
  width?: string;
  isTemplate?: boolean;
  selectedBlockOptions?: any;
  setSelectedBlockOptions?: Dispatch<any>;
}

export function DataEntryField({
  blockOptions,
  onBlockSelectChange,
  vocabularyOptionsPath,
  model,
  unitsOptions,
  typeOptions,
  name,
  readOnly,
  initialValues,
  legend,
  width,
  isTemplate,
  selectedBlockOptions,
  setSelectedBlockOptions,
}: DataEntryFieldProps) {
  const defaultWidth = isTemplate ? "100%" : "70%";
  const dataEntry = (
    <DataEntry
      legend={legend}
      name={name}
      blockOptions={blockOptions}
      onBlockSelectChange={onBlockSelectChange}
      model={model}
      unitsOptions={unitsOptions}
      vocabularyOptionsPath={vocabularyOptionsPath}
      typeOptions={typeOptions}
      readOnly={readOnly}
      initialValues={initialValues}
      selectedBlockOptions={selectedBlockOptions}
      setSelectedBlockOptions={setSelectedBlockOptions}
    />
  );
  return (
    <div style={{ width: width ?? defaultWidth }}>
      <FieldWrapper
        disableLabelClick={true}
        name={name}
        hideLabel={true}
        readOnlyRender={(_value, _form) => dataEntry}
      >
        {dataEntry}
      </FieldWrapper>
    </div>
  );
}
