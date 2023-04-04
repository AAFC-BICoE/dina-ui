import { Dispatch } from "react";
import { FieldWrapper } from "../..";
import { DataEntry } from "./DataEntry";

export interface DataEntryFieldProps {
  /** Name that will be passed down to DataBlock and FieldArray component. */
  name: string;
  readOnly?: boolean;
  legend: JSX.Element;
  width?: string;
  isTemplate?: boolean;
  id?: string;
  blockAddable?: boolean;
  unitsAddable?: boolean;
  typesAddable?: boolean;
  isVocabularyBasedEnabledForBlock?: boolean;
  isVocabularyBasedEnabledForType?: boolean;
  blockOptionsEndpoint: string;
  blockOptionsFilter?: { [field: string]: string };
  typeOptionsEndpoint?: string;
  unitOptionsEndpoint?: string;
}

export function DataEntryField({
  name,
  readOnly,
  legend,
  width,
  isTemplate,
  id,
  blockAddable = false,
  unitsAddable = false,
  typesAddable = false,
  isVocabularyBasedEnabledForBlock = false,
  isVocabularyBasedEnabledForType = false,
  blockOptionsEndpoint,
  blockOptionsFilter,
  typeOptionsEndpoint,
  unitOptionsEndpoint
}: DataEntryFieldProps) {
  const defaultWidth = isTemplate ? "100%" : "70%";
  const dataEntry = (
    <DataEntry
      legend={legend}
      name={name}
      readOnly={readOnly}
      id={id}
      blockAddable={blockAddable}
      unitsAddable={unitsAddable}
      typesAddable={typesAddable}
      isVocabularyBasedEnabledForBlock={isVocabularyBasedEnabledForBlock}
      isVocabularyBasedEnabledForType={isVocabularyBasedEnabledForType}
      blockOptionsEndpoint={blockOptionsEndpoint}
      blockOptionsFilter={blockOptionsFilter}
      unitOptionsEndpoint={unitOptionsEndpoint}
      typeOptionsEndpoint={typeOptionsEndpoint}
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
