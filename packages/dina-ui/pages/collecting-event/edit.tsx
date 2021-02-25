import {
  ApiClientContext,
  AutoSuggestTextField,
  ButtonBar,
  CancelButton,
  DeleteButton,
  DinaForm,
  DinaFormOnSubmit,
  filterBy,
  FormattedTextField,
  KeyboardEventHandlerWrappedTextField,
  LoadingSpinner,
  Query,
  ResourceSelectField,
  SubmitButton,
  useApiClient,
  TextField,
  FormikButton
} from "common-ui";
import { KitsuResponse } from "kitsu";
import { NextRouter, useRouter } from "next/router";
import { Person } from "packages/dina-ui/types/agent-api/resources/Person";
import { useContext, useState, Dispatch } from "react";
import Switch from "react-switch";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import {
  GroupSelectField,
  Head,
  Nav,
  useAddPersonModal
} from "../../components";
import { useAttachmentsModal } from "../../components/object-store";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import { CollectingEvent } from "../../types/collection-api/resources/CollectingEvent";
import { FieldArray } from "formik";
import { useFormikContext } from "formik";
import { GeoReferenceAssertionRow } from "../../components/collection/GeoReferenceAssertionRow";
import { CommonMessage } from "../../../common-ui/lib/intl/common-ui-intl";
import { GeoReferenceAssertion } from "packages/dina-ui/types/collection-api/resources/GeoReferenceAssertion";
import { connect } from "formik";

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
      if (response && response.data) {
        response.data.collectors = await agents;
        setCollectingEvent(response.data as CollectingEvent);
      }
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
                path: `collection-api/collecting-event/${id}?include=collectors,geoReferenceAssertions`
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

interface CollectingEventFormInternalProps {
  saveGeoReferenceAssertion: ({}) => void;
  id: string;
  setAssertionId: Dispatch<any>;
}

function CollectingEventFormInternal({
  saveGeoReferenceAssertion,
  id,
  setAssertionId
}: CollectingEventFormInternalProps) {
  const { formatMessage } = useDinaIntl();
  const { openAddPersonModal } = useAddPersonModal();
  const [checked, setChecked] = useState(false);
  const { values } = useFormikContext<CollectingEvent>();

  const CustomDeleteButton = connect<{}, GeoReferenceAssertion>(
    ({ formik: { resetForm } }) => (
      <DeleteAssertionButton
        id={id}
        resetForm={resetForm}
        setAssertionId={setAssertionId}
      />
    )
  );

  const blankAssertion = index => {
    const key1 = index + "dwcDecimalLatitude";
    const key2 = index + "dwcDecimalLongitude";
    const key3 = index + "dwcCoordinateUncertaintyInMeters";
    const assertion = {
      [key1]: "",
      [key2]: "",
      [key3]: ""
    };
    return assertion;
  };
  return (
    <div>
      <div className="form-group">
        <div style={{ width: "300px" }}>
          <GroupSelectField name="group" />
        </div>
      </div>
      <div className="row">
        <FormattedTextField
          name="startEventDateTime"
          className="col-md-3 startEventDateTime"
          label={formatMessage("startEventDateTimeLabel")}
          placeholder={"YYYY-MM-DDTHH:MM:SS.MMM"}
        />
        {checked && (
          <FormattedTextField
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
        <label style={{ marginLeft: 15, marginTop: -15 }}>
          <span>{formatMessage("enableDateRangeLabel")}</span>
          <Switch
            onChange={e => setChecked(e)}
            checked={checked}
            className="react-switch dateRange"
          />
        </label>
      </div>
      <div className="row">
        <AutoSuggestTextField<CollectingEvent>
          className="col-md-3"
          name="dwcRecordedBy"
          query={(searchValue, ctx) => ({
            path: "collection-api/collecting-event",
            filter: {
              ...(ctx.values.group && { group: { EQ: ctx.values.group } }),
              rsql: `dwcRecordedBy==*${searchValue}*`
            }
          })}
          suggestion={collEvent => collEvent.dwcRecordedBy ?? ""}
        />
        <ResourceSelectField<Person>
          name="collectors"
          filter={filterBy(["displayName"])}
          model="agent-api/person"
          className="col-md-3"
          optionLabel={person => person.displayName}
          isMulti={true}
          asyncOptions={[
            {
              label: <DinaMessage id="addNewPerson" />,
              getResource: openAddPersonModal
            }
          ]}
        />
        <TextField className="col-md-3" name="dwcRecordNumbers" />
      </div>
      <div className="row">
        <KeyboardEventHandlerWrappedTextField
          className="col-md-3"
          name="dwcVerbatimLocality"
        />
        <KeyboardEventHandlerWrappedTextField
          name="dwcVerbatimLatitude"
          className="col-md-3"
        />
        <KeyboardEventHandlerWrappedTextField
          className="col-md-3"
          name="dwcVerbatimLongitude"
        />
        <TextField className="col-md-3" name="dwcVerbatimCoordinates" />
      </div>
      <div className="row">
        <div className="col-md-6">
          <div className="row">
            <TextField
              className="col-md-4"
              name="dwcVerbatimCoordinateSystem"
            />
            <TextField className="col-md-4" name="dwcVerbatimSRS" />
          </div>
          <div className="row">
            <TextField className="col-md-4" name="dwcVerbatimElevation" />
            <TextField className="col-md-4" name="dwcVerbatimDepth" />
          </div>
        </div>

        <div className="col-md-4">
          <Tabs>
            <TabList>
              <Tab>
                <DinaMessage id="geoReferencing" />
              </Tab>
            </TabList>
            <TabPanel>
              <div>
                <ul>
                  <FieldArray name="geoReferenceAssertions">
                    {arrayHelpers =>
                      values.geoReferenceAssertions?.length ? (
                        values.geoReferenceAssertions.map(
                          (assertion, index) => (
                            <li className="list-group-item" key={index}>
                              <GeoReferenceAssertionRow
                                index={index}
                                assertion={assertion}
                                onAddClick={() =>
                                  arrayHelpers.insert(index + 1, blankAssertion)
                                }
                                onRemoveClick={() => arrayHelpers.remove(index)}
                              />
                            </li>
                          )
                        )
                      ) : (
                        <button
                          style={{ width: "10rem" }}
                          className="btn btn-primary add-assertion-button"
                          type="button"
                          onClick={() => arrayHelpers.push(blankAssertion)}
                        >
                          <DinaMessage id="addAssertion" />
                        </button>
                      )
                    }
                  </FieldArray>
                  <div style={{ height: "5rem" }} />
                  <FormikButton
                    className="btn btn-primary add-assertion-button"
                    onClick={() =>
                      saveGeoReferenceAssertion(
                        values.geoReferenceAssertions?.[0] as any
                      )
                    }
                  >
                    <DinaMessage id="saveGeoReferenceAssertion" />
                  </FormikButton>
                  <CustomDeleteButton />
                </ul>
              </div>
            </TabPanel>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function CollectingEventForm({
  collectingEvent,
  router
}: CollectingEventFormProps) {
  const { id } = router.query;
  const { formatMessage } = useDinaIntl();
  const { selectedMetadatas, attachedMetadatasUI } = useAttachmentsModal();
  const initialValues = collectingEvent
    ? {
        ...collectingEvent,
        dwcRecordNumbers: collectingEvent.dwcRecordNumbers?.join(", ") ?? ""
      }
    : {
        type: "collecting-event",
        collectors: [],
        collectorGroups: [],
        startEventDateTime: "YYYY-MM-DDTHH:MM:SS.MMM",
        geoReferenceAssertions: []
      };

  const { save } = useApiClient();
  const [assertionId, setAssertionId] = useState(
    initialValues.geoReferenceAssertions?.[0]?.id ?? (undefined as any)
  );

  const isValueNumber = value => {
    const matcher = /([\d\\.]+)/g;
    const nonDigitsAndDots = value?.toString().replace(matcher, "");
    return !nonDigitsAndDots || nonDigitsAndDots.length <= 0;
  };

  const saveGeoReferenceAssertion = async assertion => {
    if (!assertion) return;
    if (
      !isValueNumber(assertion.dwcDecimalLatitude) ||
      !isValueNumber(assertion.dwcDecimalLongitude) ||
      !isValueNumber(assertion.dwcCoordinateUncertaintyInMeters)
    ) {
      throw new Error(formatMessage("geoReferenceAssertionError"));
    }
    const [saved] = await save(
      [
        {
          resource: { ...assertion, type: "georeference-assertion" },
          type: "georeference-assertion"
        }
      ],
      {
        apiBaseUrl: "/collection-api"
      }
    );
    setAssertionId(saved.id);
  };

  const onSubmit: DinaFormOnSubmit = async ({ submittedValues }) => {
    // Init relationships object for one-to-many relations:
    submittedValues.relationships = {};

    if (!submittedValues.startEventDateTime) {
      throw new Error(
        formatMessage("field_collectingEvent_startDateTimeError")
      );
    }
    const matcher = /([^\d]+)/g;
    const startDateTime = submittedValues.startEventDateTime.replace(
      matcher,
      ""
    );
    const datePrecision = [4, 6, 8, 12, 14, 17];
    if (!datePrecision.includes(startDateTime.length)) {
      throw new Error(
        formatMessage("field_collectingEvent_startDateTimeError")
      );
    }
    if (submittedValues.endEventDateTime) {
      const endDateTime = submittedValues.endEventDateTime.replace(matcher, "");
      if (!datePrecision.includes(endDateTime.length)) {
        throw new Error(
          formatMessage("field_collectingEvent_endDateTimeError")
        );
      }
    }
    // handle converting to relationship manually due to crnk bug
    const submitCopy = { ...submittedValues };
    if (submitCopy.collectors && submitCopy.collectors.length > 0) {
      submittedValues.relationships.collectors = {};
      submittedValues.relationships.collectors.data = [];
      submitCopy.collectors.map(collector =>
        submittedValues.relationships.collectors.data.push({
          id: collector.id,
          type: "agent"
        })
      );
    }
    delete submittedValues.collectors;

    if (submittedValues.collectorGroups?.id)
      submittedValues.collectorGroupUuid = submittedValues.collectorGroups.id;
    delete submittedValues.collectorGroups;

    if (assertionId) {
      if (!submittedValues.relationships) submittedValues.relationships = {};
      submittedValues.relationships.geoReferenceAssertions = {};
      submittedValues.relationships.geoReferenceAssertions.data = [];
      submittedValues.relationships.geoReferenceAssertions.data.push({
        id: assertionId,
        type: "georeference-assertion"
      });
    }
    delete submittedValues.geoReferenceAssertions;
    const { dwcRecordNumbers } = submittedValues;
    if (dwcRecordNumbers && dwcRecordNumbers.length > 0) {
      submittedValues.dwcRecordNumbers = dwcRecordNumbers
        .split(",")
        .map(num => num.trim());
    } else submittedValues.dwcRecordNumbers = null;

    // Add attachments if they were selected:
    if (selectedMetadatas.length) {
      submittedValues.relationships.attachment = {
        data: selectedMetadatas.map(it => ({ id: it.id, type: it.type }))
      };
    }

    const [saved] = await save(
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
    await router.push(`/collecting-event/view?id=${saved.id}`);
  };

  return (
    <DinaForm
      initialValues={initialValues}
      onSubmit={onSubmit}
      enableReinitialize={true}
    >
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
      <CollectingEventFormInternal
        saveGeoReferenceAssertion={saveGeoReferenceAssertion}
        id={assertionId}
        setAssertionId={setAssertionId}
      />
      {!id && <div className="form-group">{attachedMetadatasUI}</div>}
    </DinaForm>
  );
}

const DeleteAssertionButton = ({ id, resetForm, setAssertionId }) => {
  const { doOperations } = useContext(ApiClientContext);
  async function doDelete() {
    await doOperations(
      [
        {
          op: "DELETE",
          path: `georeference-assertion/${id}`
        }
      ],
      { apiBaseUrl: "/collection-api" }
    );
    setAssertionId(null);
    resetForm();
  }

  if (!id) {
    return null;
  }

  return (
    <button
      className={`btn btn-danger delete-button`}
      onClick={doDelete}
      type="button"
      style={{ marginLeft: 10 }}
    >
      <CommonMessage id="deleteButtonText" />
    </button>
  );
};
