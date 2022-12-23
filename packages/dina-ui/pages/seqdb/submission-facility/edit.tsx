import {
  BackButton,
  ButtonBar,
  DinaForm,
  DinaFormOnSubmit,
  SubmitButton,
  TextField,
  useQuery,
  withResponse
} from "common-ui";
import { WithRouterProps } from "next/dist/client/with-router";
import { NextRouter, withRouter } from "next/router";
import { GroupSelectField, Head, Nav } from "../../../components";
import { SeqdbMessage, useSeqdbIntl } from "../../../intl/seqdb-intl";
import { SubmissionFacility } from "../../../types/seqdb-api/resources/SubmissionFacility";

interface SubmissionFacilityFormProps {
  submissionFacility?: SubmissionFacility;
  router: NextRouter;
}

export function SubmissionFacilityEditPage({ router }: WithRouterProps) {
  const { id } = router.query;
  const { formatMessage } = useSeqdbIntl();
  const title = id
    ? "editSubmissionFacilityTitle"
    : "addSubmissionFacilityTitle";

  const query = useQuery<SubmissionFacility>({
    path: `seqdb-api/sequencing-facility/${id}`
  });

  return (
    <div>
      <Head title={formatMessage(title)} />
      <Nav />
      <main className="container-fluid">
        {id ? (
          <div>
            <h1 id="wb-cont">
              <SeqdbMessage id="editSubmissionFacilityTitle" />
            </h1>
            {withResponse(query, ({ data }) => (
              <SubmissionFacilityForm
                submissionFacility={data}
                router={router}
              />
            ))}
          </div>
        ) : (
          <div>
            <h1 id="wb-cont">
              <SeqdbMessage id="addSubmissionFacilityTitle" />
            </h1>
            <SubmissionFacilityForm router={router} />
          </div>
        )}
      </main>
    </div>
  );
}

function SubmissionFacilityForm({
  submissionFacility,
  router
}: SubmissionFacilityFormProps) {
  const { id } = router.query;
  const initialValues = submissionFacility || {};

  const onSubmit: DinaFormOnSubmit = async ({
    api: { save },
    submittedValues
  }) => {
    const response = await save(
      [
        {
          resource: submittedValues,
          type: "sequencing-facility"
        }
      ],
      { apiBaseUrl: "/seqdb-api" }
    );

    const newId = response[0].id;
    await router.push(`/seqdb/sequencing-facility/view?id=${newId}`);
  };

  const buttonBar = (
    <ButtonBar>
      <BackButton
        entityId={id as string}
        entityLink="/seqdb/sequencing-facility"
      />
      <SubmitButton className="ms-auto" />
    </ButtonBar>
  );

  return (
    <DinaForm initialValues={initialValues} onSubmit={onSubmit}>
      {buttonBar}
      <SubmissionFacilityFormFields />
    </DinaForm>
  );
}

export function SubmissionFacilityFormFields() {
  return (
    <div>
      <div className="row">
        <GroupSelectField
          className="col-md-6"
          name="group"
          enableStoredDefaultGroup={true}
        />
      </div>
      <div className="row">
        <TextField className="col-md-6" name="name" />
        <TextField className="col-md-6" name="symbol" />
      </div>
      <div className="row">
        <TextField className="col-md-6" name="description" />
      </div>
    </div>
  );
}

export default withRouter(SubmissionFacilityEditPage);
