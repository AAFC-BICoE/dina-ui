import {
  ApiClientContext,
  ButtonBar,
  BackButton,
  DeleteButton,
  DinaForm,
  DinaFormOnSubmit,
  filterBy,
  SubmitButton,
  TextField
} from "common-ui";
import { ResourceSelectField } from "common-ui/lib";
import { NextRouter, useRouter } from "next/router";
import { CollectorGroup } from "../../../types/collection-api/resources/CollectorGroup";
import { Person } from "packages/dina-ui/types/agent-api/resources/Person";
import { useContext } from "react";
import { Head, Nav } from "../../../components";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";

interface CollectorGroupFormProps {
  collectorGroup?: CollectorGroup;
  router: NextRouter;
}

export default function CollectorGroupEditPage() {
  const router = useRouter();
  const {
    query: { id }
  } = router;
  const { formatMessage } = useDinaIntl();
  return (
    <div>
      <Head title={formatMessage("addCollectorGroupTitle")} />
      <Nav />
      <main className="container-fluid">
        <div>
          <h1 id="wb-cont">
            <DinaMessage id="addCollectorGroupTitle" />
          </h1>
          <CollectorGroupForm router={router} />
        </div>
      </main>
    </div>
  );
}

function CollectorGroupForm({
  collectorGroup,
  router
}: CollectorGroupFormProps) {
  const { save } = useContext(ApiClientContext);
  const { id } = router.query;
  const initialValues = collectorGroup || { type: "collector-group" };
  const { formatMessage } = useDinaIntl();

  const onSubmit: DinaFormOnSubmit = async ({ submittedValues }) => {
    if (!submittedValues.agentIdentifiers) {
      throw new Error(formatMessage("field_collectorGroup_agentsError"));
    } else {
      // handle converting to relationship manually due to crnk bug
      submittedValues.relationships = {};
      submittedValues.relationships.agentIdentifiers = {};
      submittedValues.relationships.agentIdentifiers.data = [];
      submittedValues.agentIdentifiers.map(agent =>
        submittedValues.relationships.agentIdentifiers.data.push({
          id: agent.id,
          type: "person"
        })
      );
      delete submittedValues.agentIdentifiers;
    }

    await save(
      [
        {
          resource: submittedValues,
          type: "collector-group"
        }
      ],
      {
        apiBaseUrl: "/collection-api"
      }
    );
    await router.push(`/collection/collector-group/list`);
  };

  return (
    <DinaForm initialValues={initialValues} onSubmit={onSubmit}>
      <ButtonBar>
        <SubmitButton />
        <BackButton
          entityId={id as string}
          entityLink="/collection/collector-group"
          byPassView={true}
        />
        <DeleteButton
          className="ms-5"
          id={id as string}
          options={{ apiBaseUrl: "/collection-api" }}
          postDeleteRedirect="/collection/collector-group/list"
          type="collector-group"
        />
      </ButtonBar>
      <CollectorGroupFields />
    </DinaForm>
  );
}

export function CollectorGroupFields() {
  const { formatMessage } = useDinaIntl();

  return (
    <div>
      <div className="row">
        <TextField
          className="col-md-3 collectorGroupName"
          name="name"
          label={formatMessage("collectorGroupNameLabel")}
        />
        <ResourceSelectField<Person>
          name="agentIdentifiers"
          filter={filterBy(["displayName"])}
          model="agent-api/person"
          isMulti={true}
          className="col-md-3"
          optionLabel={agent => agent.displayName}
          label={formatMessage("collectorGroupAgentsLabel")}
        />
      </div>
    </div>
  );
}
