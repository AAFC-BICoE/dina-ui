import {
  BackButton,
  ButtonBar,
  DateField,
  DinaForm,
  DinaFormOnSubmit,
  filterBy,
  ResourceSelectField,
  SubmitButton,
  TextField,
  useAccount,
  useDinaFormContext,
  useQuery,
  withResponse
} from "common-ui";
import { WithRouterProps } from "next/dist/client/with-router";
import { NextRouter, withRouter } from "next/router";
import { SeqdbMessage, useSeqdbIntl } from "packages/dina-ui/intl/seqdb-intl";
import { useState } from "react";
import { useDinaIntl } from "../../../../dina-ui/intl/dina-ui-intl";
import { PcrBatch } from "../../../../dina-ui/types/seqdb-api";
import { SeqSubmission } from "../../../../dina-ui/types/seqdb-api/resources/SeqSubmission";
import {
  GroupSelectField,
  Head,
  Nav,
  PersonSelectField
} from "../../../components";

interface SeqSubmissionFormProps {
  seqSubmission?: SeqSubmission;
  router: NextRouter;
}

export function SeqSubmissionEditPage({ router }: WithRouterProps) {
  const { id } = router.query;
  const { formatMessage } = useSeqdbIntl();
  const title = id ? "editSeqSubmissionTitle" : "addSeqSubmissionTitle";

  const query = useQuery<SeqSubmission>({
    path: `seqdb-api/seq-submission/${id}`
  });

  return (
    <div>
      <Head title={formatMessage(title)} />
      <Nav />
      <main className="container-fluid">
        {id ? (
          <div>
            <h1 id="wb-cont">
              <SeqdbMessage id="editSeqSubmissionTitle" />
            </h1>
            {withResponse(query, ({ data }) => (
              <SeqSubmissionForm seqSubmission={data} router={router} />
            ))}
          </div>
        ) : (
          <div>
            <h1 id="wb-cont">
              <SeqdbMessage id="addSeqSubmissionTitle" />
            </h1>
            <SeqSubmissionForm router={router} />
          </div>
        )}
      </main>
    </div>
  );
}

function SeqSubmissionForm({ seqSubmission, router }: SeqSubmissionFormProps) {
  const { id } = router.query;
  const initialValues = seqSubmission || {};

  const onSubmit: DinaFormOnSubmit<SeqSubmission> = async ({
    api: { save },
    submittedValues
  }) => {
    const response = await save(
      [
        {
          resource: submittedValues,
          type: "seq-submission"
        }
      ],
      { apiBaseUrl: "/seqdb-api" }
    );

    const newId = response[0].id;
    await router.push(`/seqdb/seq-submission/view?id=${newId}`);
  };

  return (
    <DinaForm initialValues={initialValues} onSubmit={onSubmit}>
      <ButtonBar>
        <BackButton
          entityId={id as string}
          entityLink="/seqdb/seq-submission"
        />
        <SubmitButton className="ms-auto" />
      </ButtonBar>
      <SeqSubmissionFields />
    </DinaForm>
  );
}

export function SeqSubmissionFields() {
  const { formatMessage } = useDinaIntl();
  const { readOnly } = useDinaFormContext();
  const { isAdmin, groupNames } = useAccount();
  const [group, setGroup] = useState(
    groupNames && groupNames.length > 0 ? groupNames[0] : ""
  );
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
        <ResourceSelectField<PcrBatch>
          name="pcrBatch"
          label={formatMessage("pcrBatch")}
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
          readOnlyLink="/seqdb/pcr-batch/view?id="
          model="seqdb-api/pcr-batch"
          optionLabel={(pcrBatch) => `${pcrBatch.name || pcrBatch.id}`}
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

export default withRouter(SeqSubmissionEditPage);
