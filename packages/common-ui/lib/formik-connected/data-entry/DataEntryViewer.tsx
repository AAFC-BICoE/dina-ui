import {
  DinaForm,
  DinaFormSection,
  FieldWrapper,
  processExtensionValuesLoading
} from "common-ui";
import { DataEntry, DataEntryProps } from "./DataEntry";
import { FIELD_EXTENSIONS_COMPONENT_NAME } from "../../../../dina-ui/types/collection-api";

export interface DataEntryViewerProps extends DataEntryProps {
  extensionValues?: any;
  disableDinaForm?: boolean;
}

export function DataEntryViewer({
  extensionValues,
  legend,
  name,
  disableDinaForm,
  blockOptionsEndpoint,
  blockOptionsFilter
}: DataEntryViewerProps) {
  const processedExtensionValues = disableDinaForm
    ? extensionValues
    : processExtensionValuesLoading(extensionValues);

  return disableDinaForm ? (
    <DinaFormSection
      componentName={FIELD_EXTENSIONS_COMPONENT_NAME}
      sectionName="field-extension-section"
    >
      <FieldWrapper
        disableLabelClick={true}
        name={name}
        hideLabel={true}
        readOnlyRender={(_value, _form) => (
          <DataEntry
            legend={legend}
            name={name}
            blockOptionsEndpoint={blockOptionsEndpoint}
            readOnly={true}
            width={"100%"}
            blockOptionsFilter={blockOptionsFilter}
          />
        )}
      >
        <DataEntry
          legend={legend}
          name={name}
          blockOptionsEndpoint={blockOptionsEndpoint}
          readOnly={true}
          width={"100%"}
          blockOptionsFilter={blockOptionsFilter}
        />
      </FieldWrapper>
    </DinaFormSection>
  ) : (
    <DinaForm
      initialValues={{ extensionValues: processedExtensionValues }}
      readOnly={true}
    >
      <DataEntry
        legend={legend}
        name={name}
        blockOptionsEndpoint={blockOptionsEndpoint}
        readOnly={true}
        width={"100%"}
        blockOptionsFilter={blockOptionsFilter}
      />
    </DinaForm>
  );
}
