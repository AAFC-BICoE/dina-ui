import { InputResource } from "kitsu";
import { fromPairs, toPairs } from "lodash";
import { Protocol } from "packages/dina-ui/types/collection-api";
import { ProtocolFormValue } from "./ProtocolForm";

export function useProtocolFormConverter() {
  function convertProtocolToFormData(protocol?: Protocol): ProtocolFormValue {
    let protocolFormData;
    if (protocol?.protocolData && protocol.protocolData.length > 0) {
      protocolFormData = protocol.protocolData.map((data) => ({
        select: data.key,
        vocabularyBased: data.vocabularyBased,
        rows:
          !data.protocolDataElement || data.protocolDataElement.length === 0
            ? null
            : data.protocolDataElement.map((item) => ({
                type: item.elementType,
                unit: item.unit,
                value: item.value,
                vocabularyBased: item.vocabularyBased
              }))
      }));
    }
    const protocolFormValue: ProtocolFormValue = protocol
      ? {
          ...protocol,
          // Convert multilingualDescription to editable Dictionary format:
          multilingualDescription: fromPairs<string | undefined>(
            protocol.multilingualDescription?.descriptions?.map(
              ({ desc, lang }) => [lang ?? "", desc ?? ""]
            )
          ),
          protocolFormData
        }
      : { name: "", type: "protocol", protocolData: [] };

    delete protocolFormValue.protocolData;
    return protocolFormValue;
  }

  function convertFormDataToProtocol(
    protocolFormValue: ProtocolFormValue
  ): InputResource<Protocol> {
    if (
      protocolFormValue.protocolFormData &&
      protocolFormValue.protocolFormData.length > 0
    ) {
      protocolFormValue.protocolData = protocolFormValue.protocolFormData.map(
        (formData) => ({
          key: formData.select,
          vocabularyBased: formData.vocabularyBased,
          protocolDataElement:
            !formData.rows || formData.rows.length === 0
              ? null
              : formData.rows.map((rowData) => ({
                  elementType: rowData.type,
                  vocabularyBased: rowData.vocabularyBased,
                  unit: rowData.unit,
                  value: rowData.value
                }))
        })
      );
    }
    delete protocolFormValue.protocolFormData;
    const protocolResource: InputResource<Protocol> = {
      ...protocolFormValue,
      // Convert the editable format to the stored format:
      multilingualDescription: {
        descriptions: toPairs(protocolFormValue.multilingualDescription).map(
          ([lang, desc]) => ({ lang, desc })
        )
      }
    };

    // Add attachments if they were selected:
    (protocolResource as any).relationships = {
      attachments: {
        data:
          protocolResource.attachments?.map((it) => ({
            id: it.id,
            type: it.type
          })) ?? []
      }
    };

    // Delete the 'attachments' attribute because it should stay in the relationships field:
    delete protocolResource.attachments;
    return protocolResource;
  }

  return { convertFormDataToProtocol, convertProtocolToFormData };
}
