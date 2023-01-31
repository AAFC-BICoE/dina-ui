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
}: DataEntryFieldProps) {
  const defaultWidth = isTemplate ? "100%" : "70%";
  return (
    <div style={{ width: width ?? defaultWidth }}>
      <FieldWrapper
        name={name}
        hideLabel={true}
        readOnlyRender={(_value, _form) => (
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
          />
        )}
      >
        {
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
          />
        }
      </FieldWrapper>
    </div>
  );
}
