import { TextField, SelectField, SelectOption } from "common-ui";
import { useDinaIntl } from "../../../dina-ui/intl/dina-ui-intl";
import { Fragment } from "react";

export interface IdentifierRowProps {
  index: number;
  typeOptions: SelectOption<string | undefined>[];
}

export function IdentifierRow({ index, typeOptions }: IdentifierRowProps) {
  const identifiersPath = "identifiers";
  const identifierPath = `${identifiersPath}[${index}]`;
  const commonRoot = identifierPath + ".";

  const { formatMessage } = useDinaIntl();

  return (
    <>
      <SelectField
        name={commonRoot + "type"}
        options={typeOptions as any}
        label={formatMessage("identifierType")}
      />
      <TextField
        name={commonRoot + "uri"}
        label={formatMessage("identifierURI")}
        readOnlyRender={value => {
          try {
            const url = new URL(value);
            if (url.protocol === "http:" || url.protocol === "https:") {
              return (
                <Fragment key={value}>
                  <a href={value}>{value}</a>
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
