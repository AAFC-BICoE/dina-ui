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
  id?: string;
  blockAddable?: boolean;
  unitsAddable?: boolean;
  typesAddable?: boolean;
  isVocabularyBasedEnabledForBlock?: boolean;
  isVocabularyBasedEnabledForType?: boolean;
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
  legend,
  width,
  isTemplate,
  selectedBlockOptions,
  setSelectedBlockOptions,
  id,
  blockAddable = false,
  unitsAddable = false,
  typesAddable = false,
  isVocabularyBasedEnabledForBlock = false,
  isVocabularyBasedEnabledForType = false
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
      selectedBlockOptions={selectedBlockOptions}
      setSelectedBlockOptions={setSelectedBlockOptions}
      id={id}
      blockAddable={blockAddable}
      unitsAddable={unitsAddable}
      typesAddable={typesAddable}
      isVocabularyBasedEnabledForBlock={isVocabularyBasedEnabledForBlock}
      isVocabularyBasedEnabledForType={isVocabularyBasedEnabledForType}
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
