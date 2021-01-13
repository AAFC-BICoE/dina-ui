import {
  ApiClientContext,
  ButtonBar,
  CancelButton,
  DeleteButton,
  ErrorViewer,
  filterBy,
  LoadingSpinner,
  Query,
  safeSubmit,
  SubmitButton,
  TextField
} from "common-ui";
import { Form, Formik, FormikContextType } from "formik";
import { useRouter, NextRouter } from "next/router";
import { CollectorGroup } from "../../types/objectstore-api/resources/CollectorGroup";
import { useContext } from "react";
import { Head, Nav } from "../../components";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import { Person } from "packages/dina-ui/types/objectstore-api/resources/Person";
import { ResourceSelectField } from "common-ui/lib";

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
          <h1>
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

  const onSubmit = safeSubmit(
    async (
      submittedValues,
      { setStatus, setSubmitting }: FormikContextType<any>
    ) => {
      if (!submittedValues.agentIdentifiers) {
        setStatus(formatMessage("field_collectorGroup_agentsError"));
        setSubmitting(false);
        return;
      } else {
        // handle converting to relationship manually due to crnk bug
        submittedValues.relationships = {};
        submittedValues.relationships.agentIdentifiers = {};
        submittedValues.relationships.agentIdentifiers.data = [];
        submittedValues.agentIdentifiers.map(agent =>
          submittedValues.relationships.agentIdentifiers.data.push({
            id: agent.id,
            type: "agent"
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
      await router.push(`/collector-group/list`);
    }
  );

  return (
    <Formik initialValues={initialValues} onSubmit={onSubmit}>
      <Form translate={undefined}>
        <ErrorViewer />
        <ButtonBar>
          <SubmitButton />
          <CancelButton
            entityId={id as string}
            entityLink="/collector-group"
            byPassView={true}
          />
          <DeleteButton
            className="ml-5"
            id={id as string}
            options={{ apiBaseUrl: "/collection-api" }}
            postDeleteRedirect="/collector-group/list"
            type="collector-group"
          />
        </ButtonBar>
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
              optionLabel={agent => agent.displayName}
              label={formatMessage("collectorGroupAgentsLabel")}
            />
          </div>
        </div>
      </Form>
    </Formik>
  );
}
