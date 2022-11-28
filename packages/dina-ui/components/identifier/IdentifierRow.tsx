import { SelectOption, TextField, SelectField } from "common-ui";
import { useDinaIntl } from "../../../dina-ui/intl/dina-ui-intl";
import { Fragment } from "react";
import Link from "next/link";
import { VocabularySelectField } from "../collection/VocabularySelectField";

export interface IdentifierRowProps {
  index: number;
  typeOptions?: SelectOption<string | undefined>[];
  vocabularyOptionsEndpoint?: string;
}

export function IdentifierRow({
  index,
  typeOptions,
  vocabularyOptionsEndpoint
}: IdentifierRowProps) {
  const identifiersPath = "identifiers";
  const identifierPath = `${identifiersPath}[${index}]`;
  const commonRoot = identifierPath + ".";

  const { formatMessage } = useDinaIntl();

  return (
    <>
      {typeOptions && (
        <SelectField
          name={commonRoot + "type"}
          options={typeOptions as any}
          label={formatMessage("identifierType")}
        />
      )}
      {vocabularyOptionsEndpoint && (
        <VocabularySelectField
          name={commonRoot + "namespace"}
          path={vocabularyOptionsEndpoint}
          label={formatMessage("identifierType")}
        />
      )}
      <TextField
        name={commonRoot + (vocabularyOptionsEndpoint ? "value" : "uri")}
        label={formatMessage("identifierURI")}
        readOnlyRender={(value) => {
          try {
            const url = new URL(value);
            if (url.protocol === "http:" || url.protocol === "https:") {
              return (
                <Fragment key={value}>
                  <Link href={value} passHref={true}>
                    <a>{value}</a>
                  </Link>
                </Fragment>
              );
            }
          } catch (_) {
            return value;
          }
        }}
      />
    </>
  );
}
