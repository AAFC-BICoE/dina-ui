import {
  useDinaFormContext,
  useAccount,
  TextField,
  ResourceSelectField,
  filterBy,
  DateField
} from "packages/common-ui/lib";
import {
  GroupSelectField,
  PersonSelectField
} from "packages/dina-ui/components";
import { useDinaIntl } from "packages/dina-ui/intl/dina-ui-intl";
import { SeqBatch, SequencingFacility } from "packages/dina-ui/types/seqdb-api";

export function SeqSubmissionFields() {
  const { formatMessage } = useDinaIntl();
  const { readOnly } = useDinaFormContext();
  const { isAdmin, groupNames } = useAccount();
  const group = groupNames && groupNames.length > 0 ? groupNames[0] : "";
  return (
    <div>
      <div className="row">
        <TextField className="col-md-6" name="name" />
        {!readOnly && (
          <GroupSelectField
            className="col-md-6"
            name="group"
            enableStoredDefaultGroup={true}
          />
        )}
      </div>
      <div className="row">
        <PersonSelectField className="col-md-6" name="submittedBy" />
        <ResourceSelectField<SeqBatch>
          name="seqBatch"
          label={formatMessage("seqBatch")}
          className="col-md-6"
          filter={filterBy(
            ["name"],
            !isAdmin
              ? {
                  extraFilters: [
                    {
                      selector: "group",
                      comparison: "==",
                      arguments: group
                    }
                  ]
                }
              : undefined
          )}
          isDisabled={!group}
          readOnlyLink="/seqdb/seq-batch/view?id="
          model="seqdb-api/seq-batch"
          optionLabel={(seqBatch) => `${seqBatch.name || seqBatch.id}`}
        />
      </div>
      <div className="row">
        <ResourceSelectField<SequencingFacility>
          name="sequencingFacility"
          label={formatMessage("sequencingFacility")}
          className="col-md-6"
          filter={filterBy(
            ["name"],
            !isAdmin
              ? {
                  extraFilters: [
                    {
                      selector: "group",
                      comparison: "==",
                      arguments: group
                    }
                  ]
                }
              : undefined
          )}
          isDisabled={!group}
          readOnlyLink="/seqdb/sequencing-facility/view?id="
          model="seqdb-api/sequencing-facility"
          optionLabel={(sequencingFacility) =>
            `${sequencingFacility.name || sequencingFacility.id}`
          }
        />
      </div>
      {readOnly && (
        <div className="row">
          <DateField className="col-md-6" name="createdOn" />
          <TextField className="col-md-6" name="createdBy" />
        </div>
      )}
    </div>
  );
}
