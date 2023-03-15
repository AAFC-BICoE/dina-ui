import {
  DinaForm,
  LoadingSpinner,
  processExtensionValuesLoading,
  useQuery
} from "common-ui";
import { useState } from "react";
import { FieldExtension } from "../../../../dina-ui/types/collection-api/resources/FieldExtension";
import { DataEntry, DataEntryProps } from "./DataEntry";

export interface DataEntryViewerProps extends DataEntryProps {
  extensionValues?: any;
  disableDinaForm?: boolean;
  dinaComponent: string;
}

export function DataEntryViewer({
  extensionValues,
  legend,
  name,
  disableDinaForm,
  blockOptionsEndpoint,
  dinaComponent
}: DataEntryViewerProps) {
  const processedExtensionValues = disableDinaForm
    ? extensionValues
    : processExtensionValuesLoading(extensionValues);

  return disableDinaForm ? (
    <DataEntry
      legend={legend}
      name={name}
      initialValues={processedExtensionValues}
      blockOptionsEndpoint={blockOptionsEndpoint}
      blockOptionsFilter={dinaComponent}
      readOnly={true}
      width={"100%"}
    />
  ) : (
    <DinaForm
      initialValues={{ extensionValues: processedExtensionValues }}
      readOnly={true}
    >
      <DataEntry
        legend={legend}
        name={name}
        initialValues={processedExtensionValues}
        blockOptionsEndpoint={blockOptionsEndpoint}
        blockOptionsFilter={dinaComponent}
        readOnly={true}
        width={"100%"}
      />
    </DinaForm>
  );
}
