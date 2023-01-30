import {
  DataEntry,
  DataEntryProps,
  DinaForm,
  LoadingSpinner,
  useQuery,
} from "common-ui";
import { processExtensionValues } from "../../../../dina-ui/components/collection/collecting-event/useCollectingEvent";
import { useState } from "react";
import { FieldExtension } from "../../../../dina-ui/types/collection-api/resources/FieldExtension";

export interface DataEntryViewerProps extends DataEntryProps {
  extensionValues?: any;
}

export function DataEntryViewer({
  extensionValues,
  legend,
  name,
}: DataEntryViewerProps) {
  const { response, loading } = useQuery<FieldExtension[]>({
    path: `collection-api/extension`,
  });
  const [extensionFieldsOptions, setExtensionFieldsOptions] = useState<any>([]);
  const extensionOptions = response?.data
    .filter(
      (data) => data.extension.fields?.[0].dinaComponent === "COLLECTING_EVENT"
    )
    .map((data) => {
      return {
        label: data.extension.name,
        value: data.extension.key,
      };
    });

  function onBlockSelectChange(selected, _formik) {
    const selectedFieldExtension = response?.data.find(
      (data) => data.extension.key === selected
    );

    setExtensionFieldsOptions(
      selectedFieldExtension?.extension.fields.map((data) => ({
        label: data.name,
        value: data.key,
      }))
    );
  }
  const processedExtensionValues = processExtensionValues(extensionValues);
  if (loading) {
    return <LoadingSpinner loading={true} />;
  }
  return (
    <DinaForm
      initialValues={{ extensionValues: processedExtensionValues }}
      readOnly={true}
    >
      <DataEntry
        legend={legend}
        name={name}
        initialValues={processedExtensionValues}
        blockOptions={extensionOptions}
        typeOptions={extensionFieldsOptions}
        readOnly={true}
        onBlockSelectChange={onBlockSelectChange}
        width={"100%"}
      />
    </DinaForm>
  );
}
