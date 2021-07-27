import {
  AutoSuggestTextField,
  DateField,
  FieldSet,
  TextField,
  TextFieldWithMultiplicationButton
} from "common-ui";
import { DinaMessage } from "../../intl/dina-ui-intl";
import { Person } from "../../types/agent-api";

export interface DeterminationFieldProps {
  className?: string;
  namePrefix?: string;
}

export function DeterminationField({
  className,
  namePrefix = ""
}: DeterminationFieldProps) {
  return (
    <FieldSet
      className={className}
      id="determination-section"
      legend={<DinaMessage id="determination" />}
    >
      <div className="row">
        <TextFieldWithMultiplicationButton
          name={`${namePrefix}verbatimScientificName`}
          customName="verbatimScientificName"
          className="col-sm-6"
        />
        <AutoSuggestTextField<Person>
          name={`${namePrefix}verbatimAgent`}
          customName="verbatimAgent"
          className="col-sm-6"
        />
        <DateField
          name={`${namePrefix}verbatimDate`}
          customName="verbatimDate"
          className="col-sm-6"
        />
        <TextField
          name={`${namePrefix}verbatimRemarks`}
          customName="vebatimRemarks"
          multiLines={true}
        />
      </div>
    </FieldSet>
  );
}
