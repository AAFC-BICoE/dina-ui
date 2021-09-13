import { TextField, SelectField, SelectOption } from "common-ui";
import { IdentifierType } from "../../../dina-ui/types/agent-api/resources/Identifier";

export interface IdentifierRowProps {
  index: number;
}

export function IdentifierRow({ index }: IdentifierRowProps) {
  const typeOptions: SelectOption<string>[] | undefined = [
    {
      label: IdentifierType.ORCID,
      value: IdentifierType.ORCID
    },
    {
      label: IdentifierType.WIKIDATA,
      value: IdentifierType.WIKIDATA
    }
  ];

  const identifiersPath = "identifiers";
  const identifierPath = `${identifiersPath}[${index}]`;
  const commonRoot = identifierPath + ".";

  return (
    <>
      <SelectField name={commonRoot + "type"} options={typeOptions as any} />
      <TextField name={commonRoot + "URI"} />
    </>
  );
}
