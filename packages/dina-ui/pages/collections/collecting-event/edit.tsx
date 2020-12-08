import {
  BulkDataEditor,
  ButtonBar,
  CancelButton,
  DateField,
  filterBy,
  LoadingSpinner,
  Query,
  ResourceSelectField,
  safeSubmit,
  SubmitButton,
  TextField,
  useResourceSelectCells
} from "common-ui";
import { Form, Formik } from "formik";
import { NextRouter, useRouter } from "next/router";
import { Head, Nav } from "../../../components";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { CollectingEvent } from "../../../types/collections-api";
import { Person } from "../../../types/objectstore-api";

interface CollectingEventFormProps {
  collectingEvent?: CollectingEvent;
  router: NextRouter;
}

export default function CollectingEventEditPage() {
  const router = useRouter();
  const {
    query: { id }
  } = router;

  const { formatMessage } = useDinaIntl();

  return (
    <div>
      <Head title={formatMessage("editCollectingEventTitle")} />
      <Nav />
      <main className="container-fluid">
        {id ? (
          <div>
            <h1>
              <DinaMessage id="editCollectingEventTitle" />
            </h1>
            <Query<CollectingEvent>
              query={{ path: `collections-api/collecting-event/${id}` }}
            >
              {({ loading, response }) => (
                <div>
                  <LoadingSpinner loading={loading} />
                  {response && (
                    <CollectingEventForm
                      collectingEvent={response.data}
                      router={router}
                    />
                  )}
                </div>
              )}
            </Query>
          </div>
        ) : (
          <div>
            <h1>
              <DinaMessage id="addCollectingEventTitle" />
            </h1>
            <CollectingEventForm router={router} />
          </div>
        )}
      </main>
    </div>
  );
}

function CollectingEventForm({
  collectingEvent,
  router
}: CollectingEventFormProps) {
  const { id } = router.query;

  const initialValues = collectingEvent || {};

  const onSubmit = safeSubmit(async () => {
    // TODO mock submit
  });

  return (
    <Formik initialValues={initialValues} onSubmit={onSubmit}>
      <Form translate={undefined}>
        <ButtonBar>
          <SubmitButton />
          <CancelButton
            entityId={id as string}
            entityLink="/collections/collecting-event"
          />
        </ButtonBar>
        <div>
          <div className="row">
            <DateField className="col-md-2" name="eventDateTime" />
            <TextField className="col-md-2" name="verbatimLocality" />
            <ResourceSelectField<Person>
              className="col-md-2"
              name="collectors"
              filter={filterBy(["displayName"])}
              model="agent-api/person"
              isMulti={true}
              optionLabel={person => person.displayName}
            />
          </div>
          <div className="row">
            <div className="col-md-6">
              <h2>Agents</h2>
              <CollectingEventsAgentEditor />
            </div>
            <div className="col-md-6">
              <h2>Attached Files</h2>
            </div>
          </div>
        </div>
      </Form>
    </Formik>
  );
}

interface AgentTableRow {
  person: string;
  role: string;
}

function CollectingEventsAgentEditor() {
  const { formatMessage } = useDinaIntl();
  const resourceSelectCell = useResourceSelectCells();

  async function mockLoadAgents(): Promise<AgentTableRow[]> {
    return [
      {
        person: "Test Person (person/031e8576-9739-427f-b800-24e0be91ba7f)",
        role: "test-role"
      }
    ];
  }

  async function mockSubmit() {
    // TODO Submit method
  }

  return (
    <div className="card card-body">
      <div>
        <BulkDataEditor<AgentTableRow>
          columns={[
            resourceSelectCell<Person>(
              {
                filter: input => ({ rsql: `displayName==*${input}*` }),
                label: person => person.displayName,
                model: "agent-api/person",
                type: "person"
              },
              {
                data: "person",
                title: formatMessage("field_person"),
                width: 300
              }
            ),
            {
              data: "role",
              title: formatMessage("field_role"),
              width: 300
            }
          ]}
          loadData={mockLoadAgents}
          onSubmit={mockSubmit}
          showRowHeaders={true}
          allowDragging={true}
          showContextMenu={true}
          allowInsertRow={true}
        />
      </div>
    </div>
  );
}
