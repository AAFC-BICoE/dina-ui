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
import { SequencingFacilityContacts } from "packages/dina-ui/components/seqdb";
import { GroupSelectField, Head, Nav } from "../../../components";
import { SeqdbMessage, useSeqdbIntl } from "../../../intl/seqdb-intl";
import {
  SequencingFacility,
  SequencingFacilityContact
} from "../../../types/seqdb-api/";

interface SequencingFacilityFormProps {
  sequencingFacility?: SequencingFacility;
  router: NextRouter;
}

export function SequencingFacilityEditPage({ router }: WithRouterProps) {
  const { id } = router.query;
  const { formatMessage } = useSeqdbIntl();
  const title = id
    ? "editSequencingFacilityTitle"
    : "addSequencingFacilityTitle";

  const query = useQuery<SequencingFacility>(
    {
      path: `seqdb-api/sequencing-facility/${id}`
    },
    {
      disabled: !id
    }
  );

  return (
    <div>
      <Head title={formatMessage(title)} />
      <Nav />
      <main className="container-fluid">
        {id ? (
          <div>
            <h1 id="wb-cont">
              <SeqdbMessage id="editSequencingFacilityTitle" />
            </h1>
            {withResponse(query, ({ data }) => (
              <SequencingFacilityForm
                sequencingFacility={data}
                router={router}
              />
            ))}
          </div>
        ) : (
          <div>
            <h1 id="wb-cont">
              <SeqdbMessage id="addSequencingFacilityTitle" />
            </h1>
            <SequencingFacilityForm router={router} />
          </div>
        )}
      </main>
    </div>
  );
}

function SequencingFacilityForm({
  sequencingFacility,
  router
}: SequencingFacilityFormProps) {
  const { id } = router.query;
  const initialValues = sequencingFacility || {};

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
      <SequencingFacilityFormFields />
    </DinaForm>
  );
}

const mockData: SequencingFacilityContact[] = [
  { name: "abc", roles: ["admin", "tester"], info: "abc info" },
  { name: "def", roles: ["admin", "tester"], info: "def info" }
];

export function SequencingFacilityFormFields() {
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
      </div>
      <SequencingFacilityContacts contacts={mockData} />
    </div>
  );
}

export default withRouter(SequencingFacilityEditPage);
