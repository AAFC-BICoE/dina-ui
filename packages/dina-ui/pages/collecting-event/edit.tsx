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
  TextField,
  SelectField
} from "common-ui";
import { Form, Formik, FormikContextType } from "formik";
import { useRouter, NextRouter } from "next/router";
import { useContext } from "react";
import { useEffect } from "react";
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
              query={{ path: `collection-api/collecting-event/${id}` }}
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
  const [checked, setChecked] = useState(false);

  const onSubmit = safeSubmit(
    async (
      submittedValues,
      { setStatus, setSubmitting }: FormikContextType<any>
    ) => {
      if (!checked) delete submittedValues.endEventDateTime;
      if (submittedValues.startEventDateTime === undefined) {
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
      if (
        datePrecision.filter(precision => precision === startDateTime.length)
          .length !== 1
      ) {
        setStatus(formatMessage("field_collectingEvent_startDateTimeError"));
        setSubmitting(false);
        return;
      }
      if (checked) {
        const endDateTime = submittedValues.endEventDateTime.replace(
          matcher,
          ""
        );
        if (
          datePrecision.filter(precision => precision === endDateTime.length)
            .length !== 1
        ) {
          setStatus(formatMessage("field_collectingEvent_endDateTimeError"));
          setSubmitting(false);
          return;
        }
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
          <div className="row">
            <TextField
              className="col-md-3"
              name="startEventDateTime"
              label={formatMessage("startEventDateTimeLabel")}
              placeholder={"YYYY_MM_DD_HH_MM_SS_MMM"}
            />
            {checked && (
              <TextField
                className="col-md-3"
                name="endEventDateTime"
                label={formatMessage("endEventDateTimeLabel")}
                placeholder={"YYYY_MM_DD_HH_MM_SS_MMM"}
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
        </div>
      </Form>
    </Formik>
  );
}
