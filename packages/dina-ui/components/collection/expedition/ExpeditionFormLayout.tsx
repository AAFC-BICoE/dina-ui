import {
  DateField,
  MultilingualDescription,
  TextField,
  useDinaFormContext
} from "common-ui";
import { GroupSelectField, PersonSelectField } from "../..";
import { useDinaIntl } from "../../../intl/dina-ui-intl";

export function ExpeditionFormLayout() {
  const { readOnly } = useDinaFormContext();
  const { formatMessage } = useDinaIntl();

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
    </div>
  );
}
