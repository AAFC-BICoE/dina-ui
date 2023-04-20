import {
  DateField,
  DinaForm,
  filterBy,
  ResourceSelectField,
  TextField,
  useAccount,
  useDinaFormContext
} from "common-ui";
import { useDinaIntl } from "../../../../dina-ui/intl/dina-ui-intl";
import { SeqBatch } from "../../../../dina-ui/types/seqdb-api";
import { SeqSubmission } from "../../../../dina-ui/types/seqdb-api/resources/SeqSubmission";
import {
  GroupSelectField,
  PersonSelectField,
  ViewPageLayout
} from "../../../components";

export default function PreparationTypeDetailsPage() {
  return (
    <ViewPageLayout<SeqSubmission>
      form={(props) => (
        <DinaForm {...props}>
          <SeqSubmissionFields />
        </DinaForm>
      )}
      query={(id) => ({
        path: `seqdb-api/seq-submission/${id}`,
        include: "seqBatch,submittedBy"
      })}
      entityLink="/seqdb/seq-submission"
      type="seq-submission"
      apiBaseUrl="/seqdb-api"
      showDeleteButton={false}
      showEditButton={false}
    />
  );
}

export function SeqSubmissionFields() {
  const { formatMessage } = useDinaIntl();
  const { readOnly } = useDinaFormContext();
  const { isAdmin, groupNames } = useAccount();
  const group = groupNames && groupNames.length > 0 ? groupNames[0] : "";
  return (
    <div>
      <div className="row">
        <GroupSelectField
          className="col-md-4"
          name="group"
          enableStoredDefaultGroup={true}
        />
      </div>
      <div className="row">
        <TextField className="col-md-6" name="name" />
        <PersonSelectField className="col-md-6" name="submittedBy" />
      </div>
      <div className="row">
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
      {readOnly && (
        <div className="row">
          <DateField className="col-md-6" name="createdOn" />
          <TextField className="col-md-6" name="createdBy" />
        </div>
      )}
    </div>
  );
}
