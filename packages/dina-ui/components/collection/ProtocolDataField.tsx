import {
  DataEntryField,
  DinaFormContext,
  SelectOption,
  useApiClient
} from "packages/common-ui/lib";
import { DinaMessage, useDinaIntl } from "packages/dina-ui/intl/dina-ui-intl";
import { ProtocolElement } from "packages/dina-ui/types/collection-api/resources/ProtocolElement";
import { useContext, useEffect, useState } from "react";
import useVocabularyOptions from "./useVocabularyOptions";

export function ProtocolsField() {
  const { locale } = useDinaIntl();
  const { initialValues, readOnly } = useContext(DinaFormContext) ?? {};
  const { apiClient } = useApiClient();

  const [typeOptions, setTypeOptions] = useState<SelectOption<string>[]>([]);
  const { vocabOptions: unitOptions } = useVocabularyOptions({
    path: "collection-api/vocabulary/unitsOfMeasurement"
  });

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
      setTypeOptions(options);
    }
    fetchAllProtocolElements();
  }, []);

  return (
    <DataEntryField
      legend={<DinaMessage id="protocolData" />}
      name="protocolData"
      vocabularyOptionsPath="collection-api/vocabulary/protocolData"
      typeOptions={typeOptions}
      unitsOptions={unitOptions}
      readOnly={readOnly}
      initialValues={initialValues.extensionValues}
      isTemplate={true}
    />
  );
}
