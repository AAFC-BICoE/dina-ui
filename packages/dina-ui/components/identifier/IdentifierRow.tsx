import { TextField } from "common-ui";
import { useDinaIntl } from "../../../dina-ui/intl/dina-ui-intl";
import { Fragment } from "react";
import Link from "next/link";
import { VocabularySelectField } from "../collection/VocabularySelectField";

export interface IdentifierRowProps {
  index: number;
}

export function IdentifierRow({ index }: IdentifierRowProps) {
  const identifiersPath = "identifiers";
  const identifierPath = `${identifiersPath}[${index}]`;
  const commonRoot = identifierPath + ".";

  const { formatMessage } = useDinaIntl();

  return (
    <>
      <VocabularySelectField
        name={commonRoot + "type"}
        path="agent-api/vocabulary/identifiers"
        label={formatMessage("identifierType")}
      />
      <TextField
        name={commonRoot + "uri"}
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
