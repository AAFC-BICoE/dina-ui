import {
  ButtonBar,
  CancelButton,
  DinaForm,
  DinaFormOnSubmit,
  FieldView,
  filterBy,
  ResourceSelectField,
  SubmitButton,
  TextField,
  useQuery,
  withResponse
} from "common-ui";
import { NextRouter, useRouter } from "next/router";
import { Head, Nav } from "../../components";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import { Person } from "../../types/objectstore-api";
import { DinaUser } from "../../types/objectstore-api/resources/DinaUser";

/** DinaUser with client-side-joined Agent. */
interface DinaUserWithAgent extends DinaUser {
  agent?: Person;
}

export default function DinaUserEditPage() {
  const router = useRouter();
  const {
    query: { id }
  } = router;

  const { formatMessage } = useDinaIntl();

  const userQuery = useQuery<DinaUser>(
    { path: `user-api/user/${id}` },
    {
      joinSpecs: [
        {
          apiBaseUrl: "/agent-api",
          idField: "agentId",
          joinField: "agent",
          path: user => `person/${user.agentId}`
        }
      ]
    }
  );

  return (
    <div>
      <Head title={formatMessage("editDinaUserTitle")} />
      <Nav />
      <ButtonBar>
        <CancelButton entityId={id as string} entityLink="/dina-user" />
      </ButtonBar>
      <main className="container-fluid">
        <h1>
          <DinaMessage id="editDinaUserTitle" />
        </h1>
        {withResponse(userQuery, response => (
          <DinaUserForm dinaUser={response.data} router={router} />
        ))}
      </main>
    </div>
  );
}

interface DinaUserFormProps {
  dinaUser: DinaUserWithAgent;
  router: NextRouter;
}

export function DinaUserForm({ dinaUser, router }: DinaUserFormProps) {
  const onSubmit: DinaFormOnSubmit<DinaUserWithAgent> = async ({
    api: { save },
    submittedValues
  }) => {
    // Only the agentId is editable:
    const updatedUser = {
      id: submittedValues.id,
      type: submittedValues.type
    } as DinaUser;

    if (submittedValues.agent?.id !== undefined) {
      updatedUser.agentId = submittedValues.agent.id;
    }

    await save(
      [
        {
          resource: updatedUser,
          type: updatedUser.type
        }
      ],
      { apiBaseUrl: "/user-api" }
    );

    await router.push(`/dina-user/view?id=${submittedValues.id}`);
  };

  return (
    <DinaForm<DinaUserWithAgent> initialValues={dinaUser} onSubmit={onSubmit}>
      <ButtonBar>
        <SubmitButton />
        <CancelButton
          entityId={dinaUser.id as string}
          entityLink="/dina-user"
        />
      </ButtonBar>
      <div>
        <div className="row">
          <FieldView className="col-md-2" name="username" />
          <ResourceSelectField<Person>
            className="col-md-2"
            name="agent"
            filter={filterBy(["displayName"])}
            model="agent-api/person"
            optionLabel={person => person.displayName}
          />
        </div>
      </div>
    </DinaForm>
  );
}
