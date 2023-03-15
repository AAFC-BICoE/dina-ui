import { DataEntryField, DinaFormContext } from "../../../../common-ui/lib";
import { DinaMessage } from "../../../../dina-ui/intl/dina-ui-intl";
import { useContext } from "react";

export function ProtocolsField() {
  const { readOnly } = useContext(DinaFormContext) ?? {};

  return (
    <DataEntryField
      legend={<DinaMessage id="protocolData" />}
      name="protocolFormData"
      readOnly={readOnly}
      isTemplate={true}
      blockAddable={true}
      unitsAddable={true}
      typesAddable={true}
      isVocabularyBasedEnabledForBlock={true}
      isVocabularyBasedEnabledForType={true}
      blockOptionsEndpoint={"collection-api/vocabulary/protocolData"}
      typeOptionsEndpoint={"collection-api/protocol-element"}
      unitOptionsEndpoint={"collection-api/vocabulary/unitsOfMeasurement"}
    />
  );
}
