import {
  ApiClientContext,
  ButtonBar,
  CancelButton,
  DateField,
  DeleteButton,
  ErrorViewer,
  LoadingSpinner,
  Query,
  safeSubmit,
  SubmitButton,
  TextField
} from "common-ui";
import { Form, Formik } from "formik";
import { useRouter, NextRouter } from "next/router";
import { useContext } from "react";
import { CollectingEvent } from "../../types/objectstore-api/resources/CollectingEvent";
import { Head, Nav } from "../../components";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import { useState } from "react";
import Switch from "react-switch";

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
              query={{ path: `agent-api/collecting-event/${id}` }}
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
  const { save } = useContext(ApiClientContext);
  const { id } = router.query;
  const initialValues = collectingEvent || { type: "collecting-event" };
  const { formatMessage } = useDinaIntl();
  const [visible, setVisible] = useState(false);

  function setEndDateVisible(event) {
    setVisible(event);
  }

  const onSubmit = safeSubmit(async submittedValues => {
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
  });

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
          <div className="row">
            <DateField
              className="col-md-4"
              name="startEventDateTime"
              label={formatMessage("startEventDateTimeLabel")}
            />
          </div>
          <div className="row">
            <label
              className="col-md-4"
              onChange={undefined}
              onClick={undefined}
            >
              <span>{formatMessage("enableDateRangeLabel")}</span>
              <Switch onChange={e => setEndDateVisible(e)} checked={visible} />
            </label>
          </div>
          {visible && (
            <div className="row">
              <DateField
                className="col-md-4"
                name="endEventDateTime"
                label={formatMessage("endEventDateTimeLabel")}
              />
            </div>
          )}
          <div className="row">
            <TextField
              className="col-md-6"
              name="verbatimEventDateTime"
              label={formatMessage("verbatimEventDateTimeLabel")}
            />
          </div>
        </div>
      </Form>
    </Formik>
  );
}
