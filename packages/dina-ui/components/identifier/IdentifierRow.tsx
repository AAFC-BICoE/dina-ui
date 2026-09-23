import { SelectOption, TextField, SelectField } from "common-ui";
import { useDinaIntl } from "../../intl/dina-ui-intl";
import { Fragment } from "react";
import Link from "next/link";
import useControlledVocabularyOptions from "../controlled-vocabulary/useControlledVocabularyOptions";

export interface IdentifierTypeVocabulary {
  apiPath: string;
  uuid: string;
  dinaComponent: string;
}

export interface IdentifierRowProps {
  index: number;
  typeOptions?: SelectOption<string | undefined>[];
  /** Controlled vocabulary supplying the identifier types. */
  controlledVocabulary?: IdentifierTypeVocabulary;
}

export function IdentifierRow({
  index,
  typeOptions,
  controlledVocabulary
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
      {controlledVocabulary && (
        <IdentifierTypeSelectField
          name={commonRoot + "namespace"}
          controlledVocabulary={controlledVocabulary}
        />
      )}
      <TextField
        name={commonRoot + (controlledVocabulary ? "value" : "uri")}
        label={formatMessage("identifierURI")}
        readOnlyRender={(value) => {
          try {
            const url = new URL(value);
            if (url.protocol === "http:" || url.protocol === "https:") {
              return (
                <Fragment key={value}>
                  <Link href={value} passHref={true}>
                    {value}
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

interface IdentifierTypeSelectFieldProps {
  name: string;
  controlledVocabulary: IdentifierTypeVocabulary;
}

/** Stores the selected controlled vocabulary item's key. */
function IdentifierTypeSelectField({
  name,
  controlledVocabulary: { apiPath, uuid, dinaComponent }
}: IdentifierTypeSelectFieldProps) {
  const { formatMessage } = useDinaIntl();
  const { vocabOptions } = useControlledVocabularyOptions({
    path:
      `${apiPath}/controlled-vocabulary-item` +
      `?filter[controlledVocabulary.uuid][EQ]=${uuid}` +
      `&filter[dinaComponent][EQ]=${dinaComponent}`
  });

  return (
    <SelectField
      name={name}
      options={vocabOptions}
      label={formatMessage("identifierType")}
      readOnlyRender={(optionValue) =>
        vocabOptions.find((option) => option.value === optionValue)?.label ??
        optionValue ??
        ""
      }
    />
  );
}
