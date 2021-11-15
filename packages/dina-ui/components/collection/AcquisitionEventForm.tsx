import {
  DateField,
  FieldSet,
  filterBy,
  ResourceSelectField,
  TextField,
  useQuery
} from "common-ui";
import { AcquisitionEvent } from "../../types/collection-api";
import { GroupSelectField, useAddPersonModal } from "..";
import { DinaMessage } from "../../intl/dina-ui-intl";
import { Person } from "../../types/objectstore-api";

export function useAcquisitionEvent(id?: string | null) {
  return useQuery<AcquisitionEvent>(
    {
      path: `collection-api/acquisition-event/${id}`,
      include: "receivedFrom,externallyIsolatedBy"
    },
    { disabled: !id }
  );
}

export function AcquisitionEventFormLayout() {
  const { openAddPersonModal } = useAddPersonModal();

  return (
    <div>
      <FieldSet legend={<DinaMessage id="reception" />}>
        <div className="row">
          <GroupSelectField
            className="col-sm-6"
            name="group"
            enableStoredDefaultGroup={true}
          />
        </div>
        <div className="row">
          <div className="col-sm-6">
            <ResourceSelectField<Person>
              name="receivedFrom"
              readOnlyLink="/person/view?id="
              filter={filterBy(["displayName"])}
              model="agent-api/person"
              optionLabel={person => person.displayName}
              asyncOptions={[
                {
                  label: <DinaMessage id="addNewPerson" />,
                  getResource: openAddPersonModal
                }
              ]}
            />
            <DateField name="receivedDate" />
          </div>
          <TextField
            name="receptionRemarks"
            className="col-sm-6"
            multiLines={true}
          />
        </div>
      </FieldSet>
      <FieldSet legend={<DinaMessage id="externalIsolation" />}>
        <div className="row">
          <div className="col-sm-6">
            <ResourceSelectField<Person>
              name="externallyIsolatedBy"
              readOnlyLink="/person/view?id="
              filter={filterBy(["displayName"])}
              model="agent-api/person"
              optionLabel={person => person.displayName}
              asyncOptions={[
                {
                  label: <DinaMessage id="addNewPerson" />,
                  getResource: openAddPersonModal
                }
              ]}
            />
            <DateField name="externallyIsolatedOn" />
          </div>
          <TextField
            name="externallyIsolationRemarks"
            className="col-sm-6"
            multiLines={true}
          />
        </div>
      </FieldSet>
    </div>
  );
}
