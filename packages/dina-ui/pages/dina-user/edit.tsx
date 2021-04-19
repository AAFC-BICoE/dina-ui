import {
  BackButton,
  ButtonBar,
  DinaForm,
  DinaFormOnSubmit,
  FieldView,
  filterBy,
  ResourceSelectField,
  SubmitButton,
  useQuery,
  withResponse
} from "common-ui";
import { NextRouter, useRouter } from "next/router";
import { Head, Nav } from "../../components";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import { Person } from "../../types/objectstore-api";
import { DinaUser } from "../../types/user-api/resources/DinaUser";

interface DinaUserWithAgent extends DinaUser {
  agent?: Person;
}

export default function DinaUserEditPage() {
  const router = useRouter();
  const {
    query: { id }
  } = router;

  const { formatMessage } = useDinaIntl();

  const userQuery = useQuery<DinaUser & { agent?: Person }>(
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
      <main className="container">
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
        <BackButton entityId={dinaUser.id as string} entityLink="/dina-user" />
        <SubmitButton className="ml-auto" />
      </ButtonBar>
      <div>
        <div className="row">
          <FieldView className="col-md-6" name="username" />
          <ResourceSelectField<Person>
            className="col-md-6"
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
