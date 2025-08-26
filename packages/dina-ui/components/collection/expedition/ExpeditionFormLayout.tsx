import {
  DateField,
  MultilingualDescription,
  SelectOption,
  TextField,
  useDinaFormContext
} from "common-ui";
import { Field } from "formik";
import { GroupSelectField, PersonSelectField, IdentifierFields } from "../..";
import { useDinaIntl } from "../../../intl/dina-ui-intl";
import { ExpeditionIdentifierType } from "../../../types/collection-api/resources/ExpeditionIdentifier";

export function ExpeditionFormLayout() {
  const { readOnly } = useDinaFormContext();
  const { formatMessage } = useDinaIntl();

  const typeOptions: SelectOption<string | undefined>[] = [
    {
      label: ExpeditionIdentifierType.WIKIDATA,
      value: ExpeditionIdentifierType.WIKIDATA
    }
  ];

  return (
    <div>
      <div className="row">
        <TextField
          className="col-md-6 name"
          name="name"
          label={formatMessage("field_expeditionName")}
        />
        {!readOnly && (
          <GroupSelectField
            name="group"
            enableStoredDefaultGroup={true}
            className="col-md-6"
          />
        )}
      </div>
      <div className="row">
        <DateField
          className="col-md-6 startDate"
          name="startDate"
          label={formatMessage("field_startDate")}
        />
        <DateField
          className="col-md-6 endDate"
          name="endDate"
          label={formatMessage("field_endDate")}
        />
      </div>
      <MultilingualDescription />
      <div className="row">
        <TextField
          className="col-md-6 status"
          name="geographicContext"
          label={formatMessage("field_geographicContext")}
        />
      </div>
      <PersonSelectField name="participants" isMulti={true} />
      <Field name="identifiers">
        {({ form: { values: formState } }) =>
          !readOnly ? (
            <IdentifierFields typeOptions={typeOptions} />
          ) : !!formState.identifiers?.length ? (
            <IdentifierFields typeOptions={typeOptions} />
          ) : null
        }
      </Field>
    </div>
  );
}
