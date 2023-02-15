import {
  DataEntryField,
  DinaFormContext,
  useApiClient
} from "packages/common-ui/lib";
import { DinaMessage, useDinaIntl } from "packages/dina-ui/intl/dina-ui-intl";
import { ProtocolElement } from "packages/dina-ui/types/collection-api/resources/ProtocolElement";
import { useContext, useEffect, useState } from "react";

export function ProtocolsField() {
  const { locale } = useDinaIntl();
  const { initialValues, readOnly } = useContext(DinaFormContext) ?? {};
  const { apiClient } = useApiClient();

  const [protocolElementOptions, setProtocolElementOptions] = useState<
    { value: string; label: string }[]
  >([]);

  useEffect(() => {
    async function fetchAllProtocolElements() {
      const { data } = await apiClient.get<ProtocolElement[]>(
        "collection-api/protocol-element",
        {}
      );
      const options = data.map((rec) => {
        return {
          label:
            rec.multilingualTitle?.titles?.find((item) => item.lang === locale)
              ?.title || "",
          value: rec.id
        };
      });
      setProtocolElementOptions(options);
    }
    fetchAllProtocolElements();
  }, []);

  return (
    <DataEntryField
      legend={<DinaMessage id="protocolData" />}
      name="protocolData"
      vocabularyOptionsPath="collection-api/vocabulary/protocolData"
      typeOptions={protocolElementOptions}
      readOnly={readOnly}
      initialValues={initialValues.extensionValues}
      isTemplate={true}
    />
  );
}
