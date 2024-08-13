import { IdentifierFields } from "../../identifier/IdentifierFields";
import useVocabularyOptions from "../useVocabularyOptions";

export function OtherIdentifiersSection() {
  const { vocabOptions } = useVocabularyOptions({
    path: "collection-api/vocabulary2/materialSampleIdentifierType"
  });

  return (
    <IdentifierFields
      typeOptions={vocabOptions.map((vocab) => ({
        label: vocab.label,
        value: vocab.value
      }))}
      legendId={"otherIdentifiers"}
      otherIdentifiersMode={true}
    />
  );
}
