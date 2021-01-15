import {
  ButtonBar,
  CancelButton,
  DeleteButton,
  DinaForm,
  DinaFormOnSubmit,
  LoadingSpinner,
  Query,
  SelectField,
  SubmitButton,
  TextField,
  useGroupSelectOptions
} from "common-ui";
import { NextRouter, useRouter } from "next/router";
import { useState } from "react";
import Switch from "react-switch";
import { Head, Nav } from "../../components";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import { CollectingEvent } from "../../types/objectstore-api/resources/CollectingEvent";

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
  const { id } = router.query;
  const initialValues = collectingEvent || { type: "collecting-event" };
  const { formatMessage } = useDinaIntl();
  const [checked, setChecked] = useState(false);

  const groupSelectOptions = [
    { label: "<any>", value: undefined },
    ...useGroupSelectOptions()
  ];

  const onSubmit: DinaFormOnSubmit = async ({
    submittedValues,
    formik: { setStatus, setSubmitting },
    api: { save }
  }) => {
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
      const endDateTime = submittedValues.endEventDateTime.replace(matcher, "");
      if (!datePrecision.includes(endDateTime.length)) {
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
  };

  return (
    <DinaForm initialValues={initialValues} onSubmit={onSubmit}>
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
      </div>
    </DinaForm>
  );
}
