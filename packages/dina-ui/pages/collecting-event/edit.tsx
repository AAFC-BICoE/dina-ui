import {
  ApiClientContext,
  ButtonBar,
  CancelButton,
  DeleteButton,
  ErrorViewer,
  LoadingSpinner,
  Query,
  safeSubmit,
  SubmitButton,
  TextField,
  ResourceSelectField,
  filterBy,
  SelectField,
  useGroupSelectOptions
} from "common-ui";
import { Form, Formik, FormikContextType } from "formik";
import { useRouter, NextRouter } from "next/router";
import { useContext } from "react";
import { CollectingEvent } from "../../types/objectstore-api/resources/CollectingEvent";
import { CollectorGroup } from "../../types/objectstore-api/resources/CollectorGroup";
import { Head, Nav } from "../../components";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import { useState } from "react";
import Switch from "react-switch";
import { Person } from "packages/dina-ui/types/objectstore-api/resources/Person";
import { KitsuResponse } from "kitsu";

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
  const { bulkGet } = useContext(ApiClientContext);
  const [collectingEvent, setCollectingEvent] = useState<CollectingEvent>();
  const getAgents = (response: KitsuResponse<CollectingEvent, undefined>) => {
    const fetchAgents = async () => {
      if (response?.data?.collectors) {
        return await bulkGet<Person>(
          response?.data?.collectors.map(
            collector => `/person/${collector.id}`
          ) as any,
          { apiBaseUrl: "/agent-api" }
        );
      }
    };
    const agents = fetchAgents();
    agents.then(async () => {
      response.data.collectors = await agents;
      setCollectingEvent(response.data);
    });
  };
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
              query={{
                path: `collection-api/collecting-event/${id}?include=collectors`
              }}
              onSuccess={getAgents}
            >
              {({ loading }) => (
                <div>
                  <LoadingSpinner loading={loading} />
                  {collectingEvent && (
                    <CollectingEventForm
                      collectingEvent={collectingEvent}
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
  const { save } = useContext(ApiClientContext);
  const { id } = router.query;
  const initialValues = collectingEvent || { type: "collecting-event" };
  const { formatMessage } = useDinaIntl();
  const [checked, setChecked] = useState(false);

  const populateAgentList = event => {
    const collectorGroupId = event;
  };

  const groupSelectOptions = [
    { label: "<any>", value: undefined },
    ...useGroupSelectOptions()
  ];

  const onSubmit = safeSubmit(
    async (
      submittedValues,
      { setStatus, setSubmitting }: FormikContextType<any>
    ) => {
      if (!checked) delete submittedValues.endEventDateTime;
      if (!submittedValues.startEventDateTime) {
        setStatus(formatMessage("field_collectingEvent_startDateTimeError"));
        setSubmitting(false);
        return;
      }
      const matcher = /([^\d]+)/g;
      const startDateTime = submittedValues.startEventDateTime.replace(
        matcher,
        ""
      );
      const datePrecision = [4, 6, 8, 12, 14, 17];
      if (!datePrecision.includes(startDateTime.length)) {
        setStatus(formatMessage("field_collectingEvent_startDateTimeError"));
        setSubmitting(false);
        return;
      }
      if (checked && submittedValues.endEventDateTime) {
        const endDateTime = submittedValues.endEventDateTime.replace(
          matcher,
          ""
        );
        if (!datePrecision.includes(endDateTime.length)) {
          setStatus(formatMessage("field_collectingEvent_endDateTimeError"));
          setSubmitting(false);
          return;
        }
      }

      if (submittedValues.collectorGroupUuid?.id) {
        submittedValues.collectorGroupUuid =
          submittedValues.collectorGroupUuid?.id;
      }
      // handle converting to relationship manually due to crnk bug
      const submitCopy = { ...submittedValues };
      if (submitCopy.collectors) {
        submittedValues.relationships = {};
        submittedValues.relationships.collectors = {};
        submittedValues.relationships.collectors.data = [];
        submitCopy.collectors.map(collector =>
          submittedValues.relationships.collectors.data.push({
            id: collector.id,
            type: "agent"
          })
        );
        delete submittedValues.collectors;
      }
      await save(
        [
          {
            resource: submittedValues,
            type: "collecting-event"
          }
        ],
        {
          apiBaseUrl: "/collection-api"
        }
      );
      await router.push(`/collecting-event/list`);
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
            entityLink="/collecting-event"
            byPassView={true}
          />
          <DeleteButton
            className="ml-5"
            id={id as string}
            options={{ apiBaseUrl: "/collection-api" }}
            postDeleteRedirect="/collecting-event/list"
            type="collecting-event"
          />
        </ButtonBar>
        <div>
          <div className="form-group">
            <div style={{ width: "300px" }}>
              <SelectField name="group" options={groupSelectOptions} />
            </div>
          </div>
          <div className="row">
            <TextField
              className="col-md-3 startEventDateTime"
              name="startEventDateTime"
              label={formatMessage("startEventDateTimeLabel")}
              placeholder={"YYYY-MM-DDTHH:MM:SS.MMM"}
            />
            {checked && (
              <TextField
                className="col-md-3"
                name="endEventDateTime"
                label={formatMessage("endEventDateTimeLabel")}
                placeholder={"YYYY-MM-DDTHH:MM:SS.MMM"}
              />
            )}
            <TextField
              className="col-md-3"
              name="verbatimEventDateTime"
              label={formatMessage("verbatimEventDateTimeLabel")}
            />
          </div>
          <div className="row">
            <label style={{ marginLeft: 15 }}>
              <span>{formatMessage("enableDateRangeLabel")}</span>
              <Switch
                onChange={e => setChecked(e)}
                checked={checked}
                className="react-switch"
              />
            </label>
          </div>
          <div className="row">
            <ResourceSelectField<CollectorGroup>
              name="collectorGroup"
              filter={filterBy(["name"])}
              model="collection-api/collector-group"
              optionLabel={group => group.name}
              onChange={event => populateAgentList(event)}
              className="col-md-3"
            />
            <ResourceSelectField<Person>
              name="collectors"
              filter={filterBy(["displayName"])}
              model="agent-api/person"
              className="col-md-3"
              optionLabel={person => person.displayName}
              isMulti={true}
            />
          </div>
        </div>
      </Form>
    </Formik>
  );
}
