import { FieldSet } from "common-ui/lib";
import { DinaMessage } from "packages/dina-ui/intl/dina-ui-intl";
import { useFormikContext } from "formik";
import { OtherIdentifiersRow } from "./OtherIdentifiersRow";

export interface OtherIdentifiersSectionProps {
  name: string;
}

export function OtherIdentifiersSection({
  name
}: OtherIdentifiersSectionProps) {
  const formik = useFormikContext<any>();
  const otherIdentifierValues = formik?.values?.[name] ?? { [""]: "" };

  return (
    <FieldSet legend={<DinaMessage id="otherIdentifiers" />}>
      {Object.keys(otherIdentifierValues).map((identifierType, rowIndex) => {
        return (
          <OtherIdentifiersRow
            key={rowIndex}
            rootName={name}
            typeOptions={[]}
          />
        );
      })}
    </FieldSet>
  );
}
