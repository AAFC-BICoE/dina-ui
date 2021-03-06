import {
  ApiClientContext,
  AutoSuggestTextField,
  BackButton,
  ButtonBar,
  DeleteButton,
  DinaForm,
  DinaFormOnSubmit,
  filterBy,
  FormattedTextField,
  FormikButton,
  KeyboardEventHandlerWrappedTextField,
  LoadingSpinner,
  Query,
  ResourceSelectField,
  SubmitButton,
  TextField,
  useApiClient
} from "common-ui";
import { useFormikContext } from "formik";
import { KitsuResponse, PersistedResource } from "kitsu";
import { orderBy } from "lodash";
import { NextRouter, useRouter } from "next/router";
import { Person } from "packages/dina-ui/types/agent-api/resources/Person";
import { Dispatch, useContext, useState } from "react";
import Switch from "react-switch";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import {
  GroupSelectField,
  Head,
  Nav,
  useAddPersonModal
} from "../../components";
import { GeoReferenceAssertionRow } from "../../components/collection/GeoReferenceAssertionRow";
import { useAttachmentsModal } from "../../components/object-store";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import { CollectingEvent } from "../../types/collection-api/resources/CollectingEvent";
import { Metadata } from "../../types/objectstore-api";

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

  /** Do client-side multi-API joins on one-to-many fields. */
  async function initOneToManyRelations(
    response: KitsuResponse<CollectingEvent>
  ) {
    if (response?.data?.collectors) {
      const agents = await bulkGet<Person>(
        response.data.collectors.map(collector => `/person/${collector.id}`),
        { apiBaseUrl: "/agent-api", returnNullForMissingResource: true }
      );
      // Omit null (deleted) records:
      response.data.collectors = agents.filter(it => it);
    }

    if (response?.data?.attachment) {
      const metadatas = await bulkGet<Metadata>(
        response.data.attachment.map(collector => `/metadata/${collector.id}`),
        { apiBaseUrl: "/objectstore-api", returnNullForMissingResource: true }
      );
      // Omit null (deleted) records:
      response.data.attachment = metadatas.filter(it => it);
    }

    // Order GeoReferenceAssertions by "createdOn" ascending:
    if (response?.data) {
      response.data.geoReferenceAssertions = orderBy(
        response.data.geoReferenceAssertions,
        "createdOn"
      );
    }

    setCollectingEvent(response.data);
  }

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
                path: `collection-api/collecting-event/${id}?include=collectors,geoReferenceAssertions,attachment`
              }}
              onSuccess={initOneToManyRelations}
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
  deletedId: string;
  setDeletedId: Dispatch<any>;
}

function CollectingEventFormInternal({
  setDeletedId
}: CollectingEventFormInternalProps) {
  const { formatMessage } = useDinaIntl();
  const { openAddPersonModal } = useAddPersonModal();
  const [checked, setChecked] = useState(false);
  const { doOperations } = useContext(ApiClientContext);
  const { setFieldValue, setFieldTouched, values } = useFormikContext<
    CollectingEvent
  >();

  const [activeTabIdx, setActiveTabIdx] = useState(0);

  const deleteById = async id => {
    await doOperations(
      [
        {
          op: "DELETE",
          path: `georeference-assertion/${id}`
        }
      ],
      { apiBaseUrl: "/collection-api" }
    );

    const index = values.geoReferenceAssertions?.findIndex(
      assertion => assertion.id === id
    );

    if (index !== undefined && index !== -1) {
      values.geoReferenceAssertions?.splice(index, 1);
      setFieldValue("geoReferenceAssertions", values.geoReferenceAssertions);
      setFieldTouched("geoReferenceAssertions", true);
      setFieldValue("managedAssertions", values.geoReferenceAssertions);
      setFieldTouched("managedAssertions", true);
      setDeletedId(id);
    }
  };

  return (
    <div>
      <div className="form-group">
        <div style={{ width: "300px" }}>
          <GroupSelectField name="group" enableStoredDefaultGroup={true} />
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
        <TextField className="col-md-3" name="dwcRecordNumber" />
        <TextField
          className="col-md-3"
          name="dwcOtherRecordNumbers"
          multiLines={true}
        />
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
              className="col-md-6"
              name="dwcVerbatimCoordinateSystem"
            />
            <TextField className="col-md-6" name="dwcVerbatimSRS" />
          </div>
          <div className="row">
            <TextField className="col-md-6" name="dwcVerbatimElevation" />
            <TextField className="col-md-6" name="dwcVerbatimDepth" />
          </div>
        </div>

        <div className="col-md-6">
          <fieldset className="border p-2">
            <legend className="w-auto">
              <DinaMessage id="geoReferencingLegend" />
            </legend>
            {values &&
            values.geoReferenceAssertions &&
            values.geoReferenceAssertions.length <= 1 ? (
              <>
                <GeoReferenceAssertionRow index={0} />
                <div>
                  <button
                    style={{ width: "20rem" }}
                    className="btn btn-primary add-assertion-button"
                    type="button"
                    onClick={() => {
                      setFieldTouched("geoReferenceAssertions", true);
                      setFieldValue(
                        "geoReferenceAssertions",
                        values.geoReferenceAssertions?.length === 0
                          ? values.geoReferenceAssertions.concat([
                              {} as any,
                              {} as any
                            ])
                          : values.geoReferenceAssertions?.concat([{} as any])
                      );
                      setActiveTabIdx(
                        values.geoReferenceAssertions?.length as number
                      );
                    }}
                  >
                    <DinaMessage id="addAssertion" />
                  </button>

                  {values.geoReferenceAssertions?.[0]?.id && (
                    <FormikButton
                      className="btn btn-danger delete-button"
                      onClick={() =>
                        deleteById(values.geoReferenceAssertions?.[0]?.id)
                      }
                      buttonProps={() => ({ style: { marginLeft: 10 } })}
                    >
                      <DinaMessage id="deleteAssertionLabel" />
                    </FormikButton>
                  )}
                </div>
              </>
            ) : (
              <Tabs
                selectedIndex={activeTabIdx}
                onSelect={index => setActiveTabIdx(index)}
              >
                <TabList>
                  {values &&
                    values.geoReferenceAssertions &&
                    values.geoReferenceAssertions?.map((assert, idx) => (
                      <Tab key={assert.id}> {idx + 1} </Tab>
                    ))}
                </TabList>
                {values &&
                  values.geoReferenceAssertions &&
                  values.geoReferenceAssertions.map((assertion, idx) => (
                    <TabPanel key={idx}>
                      <GeoReferenceAssertionRow index={idx} />
                      {idx === 0 && (
                        <div>
                          <button
                            style={{ width: "20rem" }}
                            className="btn btn-primary add-assertion-button"
                            type="button"
                            onClick={() => {
                              setFieldTouched("geoReferenceAssertions", true);
                              setFieldValue(
                                "geoReferenceAssertions",
                                values.geoReferenceAssertions?.concat([
                                  {} as any
                                ])
                              );
                              setActiveTabIdx(
                                values.geoReferenceAssertions?.length as number
                              );
                            }}
                          >
                            <DinaMessage id="addAssertion" />
                          </button>
                          {assertion.id && (
                            <FormikButton
                              className="btn btn-danger delete-button"
                              onClick={() => deleteById(assertion.id)}
                              buttonProps={() => ({
                                style: { marginLeft: 10 }
                              })}
                            >
                              <DinaMessage id="deleteAssertionLabel" />
                            </FormikButton>
                          )}
                        </div>
                      )}
                    </TabPanel>
                  ))}
              </Tabs>
            )}
          </fieldset>
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

  // The selected Metadatas to be attached to this Collecting Event:
  const { selectedMetadatas, attachedMetadatasUI } = useAttachmentsModal({
    initialMetadatas: collectingEvent?.attachment as PersistedResource<
      Metadata
    >[]
  });
  const initialValues = collectingEvent
    ? {
        ...collectingEvent,
        dwcOtherRecordNumbers:
          collectingEvent.dwcOtherRecordNumbers?.concat("").join("\n") ?? "",
        geoReferenceAssertions: collectingEvent.geoReferenceAssertions ?? [],
        managedAssertions: collectingEvent.geoReferenceAssertions ?? []
      }
    : {
        type: "collecting-event",
        collectors: [],
        collectorGroups: [],
        startEventDateTime: "YYYY-MM-DDTHH:MM:SS.MMM",
        geoReferenceAssertions: [],
        managedAssertions: []
      };

  const { save } = useApiClient();
  const [deletedId, setDeletedId] = useState();

  const saveGeoReferenceAssertion = async assertions => {
    if (!assertions) return;
    const savedAssertions = await save(
      assertions
        .filter(assertion => Object.keys(assertion).length > 0)
        .map(assertion => {
          return {
            resource: { ...assertion, type: "georeference-assertion" },
            type: "georeference-assertion"
          };
        }),
      {
        apiBaseUrl: "/collection-api"
      }
    );

    return savedAssertions;
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
    if (submittedValues.collectors?.length > 0) {
      submittedValues.relationships.collectors = {
        data: submittedValues.collectors.map(collector => ({
          id: collector.id,
          type: "agent"
        }))
      };
    }
    delete submittedValues.collectors;

    if (submittedValues.collectorGroups?.id)
      submittedValues.collectorGroupUuid = submittedValues.collectorGroups.id;
    delete submittedValues.collectorGroups;

    // When there is deleted assertion, replace the link to assertion with
    // the updated assertions
    if (deletedId)
      submittedValues.geoReferenceAssertions =
        submittedValues.managedAssertions;

    // save georefernce assertions if any
    if (
      submittedValues.geoReferenceAssertions &&
      submittedValues.geoReferenceAssertions.length > 0
    ) {
      const savedAssertions = await saveGeoReferenceAssertion(
        submittedValues.geoReferenceAssertions
      );

      if (savedAssertions && savedAssertions.length > 0)
        submittedValues.relationships.geoReferenceAssertions = {
          data: savedAssertions.map(assertion => ({
            id: assertion.id,
            type: assertion.type
          }))
        };
    }

    delete submittedValues.geoReferenceAssertions;
    delete submittedValues.managedAssertions;

    // Convert user-suplied string to string array:
    submittedValues.dwcOtherRecordNumbers = (
      submittedValues.dwcOtherRecordNumbers?.toString() || ""
    )
      // Split by line breaks:
      .match(/[^\r\n]+/g)
      // Remove empty lines:
      ?.filter(line => line.trim());

    // Treat empty array or undefined as null:
    if (!submittedValues.dwcOtherRecordNumbers?.length) {
      submittedValues.dwcOtherRecordNumbers = null;
    }

    // Add attachments if they were selected:
    if (selectedMetadatas.length) {
      submittedValues.relationships.attachment = {
        data: selectedMetadatas.map(it => ({ id: it.id, type: it.type }))
      };
    }
    // Delete the 'attachment' attribute because it should stay in the relationships field:
    delete submittedValues.attachment;
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
        <BackButton
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
        deletedId={deletedId as any}
        setDeletedId={setDeletedId}
        key={Math.random()}
      />
      <div className="form-group">{attachedMetadatasUI}</div>
    </DinaForm>
  );
}
