import {
  ApiClientContext,
  AutoSuggestTextField,
  BackButton,
  ButtonBar,
  CheckBoxField,
  DeleteButton,
  DinaForm,
  DinaFormOnSubmit,
  filterBy,
  FormattedTextField,
  FormikButton,
  KeyboardEventHandlerWrappedTextField,
  LoadingSpinner,
  NominatumApiSearchResult,
  Query,
  ResourceSelectField,
  SaveArgs,
  SubmitButton,
  TextField,
  useApiClient,
  useDinaFormContext
} from "common-ui";
import { Field, FastField, FieldArray, useFormikContext } from "formik";
import { KitsuResponse, PersistedResource } from "kitsu";
import { clamp, orderBy } from "lodash";
import { NextRouter, useRouter } from "next/router";
import { useContext, useState } from "react";
import Switch from "react-switch";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import { geographicPlaceSourceUrl } from "../../..//types/collection-api/GeographicPlaceNameSourceDetail";
import {
  GeographySearchBox,
  GeoReferenceAssertionRow,
  GroupSelectField,
  Head,
  Nav,
  useAddPersonModal
} from "../../../components";
import { SetCoordinatesFromVerbatimButton } from "../../../components/collection/SetCoordinatesFromVerbatimButton";
import { useAttachmentsModal } from "../../../components/object-store";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { Person } from "../../../types/agent-api/resources/Person";
import {
  CollectingEvent,
  GeographicPlaceNameSource,
  GeoreferenceVerificationStatus
} from "../../../types/collection-api/resources/CollectingEvent";
import { GeoReferenceAssertion } from "../../../types/collection-api/resources/GeoReferenceAssertion";
import { Metadata } from "../../../types/objectstore-api";

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

    if (response?.data?.geoReferenceAssertions) {
      // Retrieve georeferenceAssertion with georeferencedBy
      const geoReferenceAssertions = await bulkGet<GeoReferenceAssertion>(
        response?.data?.geoReferenceAssertions.map(
          it => `/georeference-assertion/${it.id}?include=georeferencedBy`
        ),
        { apiBaseUrl: "/collection-api", returnNullForMissingResource: true }
      );

      // Retrieve georeferencedBy associated agents
      let agentBulkGetArgs: string[];
      agentBulkGetArgs = [];
      geoReferenceAssertions.forEach(async assert => {
        if (assert.georeferencedBy) {
          agentBulkGetArgs = agentBulkGetArgs.concat(
            assert.georeferencedBy.map(it => `/person/${it.id}`)
          );
        }
      });

      const agents = await bulkGet<Person>(agentBulkGetArgs, {
        apiBaseUrl: "/agent-api",
        returnNullForMissingResource: true
      });

      geoReferenceAssertions.forEach(assert => {
        const refers = assert.georeferencedBy;
        refers?.map(refer => {
          const index = assert.georeferencedBy?.findIndex(
            it => it.id === refer.id
          );
          const agent = agents.filter(it => it.id === refer.id)?.[0];
          if (assert.georeferencedBy !== undefined && index !== undefined) {
            assert.georeferencedBy[index] = agent;
          }
        });
      });
      response.data.geoReferenceAssertions = geoReferenceAssertions;
    }

    // Order GeoReferenceAssertions by "createdOn" ascending:
    if (response?.data) {
      response.data.geoReferenceAssertions = orderBy(
        response.data.geoReferenceAssertions,
        "createdOn"
      );
    }
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
              {({ loading, response }) => (
                <div>
                  <LoadingSpinner loading={loading} />
                  {response?.data && (
                    <CollectingEventForm
                      collectingEvent={response?.data}
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

/** Re-usable between the edit page and the read-only view. */
export function CollectingEventFormLayout() {
  const { formatMessage } = useDinaIntl();
  const { openAddPersonModal } = useAddPersonModal();
  const [rangeEnabled, setRangeEnabled] = useState(false);

  const { readOnly } = useDinaFormContext();
  const { setFieldValue, values } = useFormikContext<CollectingEvent>();

  const [activeTabIdx, setActiveTabIdx] = useState(0);

  const [geoSearchValue, setGeoSearchValue] = useState<string>("");

  const [georeferenceDisabled, setGeoreferenceDisabled] = useState(
    values.dwcGeoreferenceVerificationStatus ===
      GeoreferenceVerificationStatus.GEOREFERENCING_NOT_POSSIBLE
  );

  function toggleRangeEnabled(newValue: boolean) {
    if (!newValue) {
      setFieldValue("endEventDateTime", null);
    }
    setRangeEnabled(newValue);
  }

  function selectSearchResult(result: NominatumApiSearchResult) {
    // Set locality fields:
    setFieldValue("dwcCountry", result?.address?.country || null);
    setFieldValue("dwcStateProvince", result?.address?.state || null);
    setFieldValue("geographicPlaceName", result?.display_name || null);

    // Set geo source fields:
    setFieldValue(
      "geographicPlaceNameSourceDetail.sourceID",
      result.osm_id || null
    );
    setFieldValue(
      "geographicPlaceNameSourceDetail.sourceIdType",
      result.osm_type || null
    );
    setFieldValue(
      "geographicPlaceNameSourceDetail.sourceUrl",
      geographicPlaceSourceUrl
    );
    setFieldValue(
      "geographicPlaceNameSourceDetail.geographicPlaceNameSource",
      GeographicPlaceNameSource.OSM
    );
  }

  function removeThisPlace() {
    // reset the fields when user remove the place
    setFieldValue("dwcCountry", null);
    setFieldValue("dwcStateProvince", null);
    setFieldValue("geographicPlaceName", null);

    // reset the source fields when user remove the place
    setFieldValue("geographicPlaceNameSourceDetail", null);
    setFieldValue("geographicPlaceNameSource", null);
  }

  function onGeoReferencingImpossibleCheckBoxClick(e) {
    if (e.target.checked === true) {
      setFieldValue(
        "dwcGeoreferenceVerificationStatus",
        GeoreferenceVerificationStatus.GEOREFERENCING_NOT_POSSIBLE
      );
      setFieldValue("geoReferenceAssertions", []);
      setGeoreferenceDisabled(true);
    } else {
      setFieldValue("dwcGeoreferenceVerificationStatus", null);
      setGeoreferenceDisabled(false);
    }
  }

  return (
    <div>
      <div className="form-group">
        <div style={{ width: "300px" }}>
          <GroupSelectField name="group" enableStoredDefaultGroup={true} />
        </div>
      </div>
      <div className="row">
        <div className="col-md-6">
          <fieldset className="form-group border px-4 py-2">
            <legend className="w-auto">
              <DinaMessage id="collectingDateLegend" />
            </legend>
            <FormattedTextField
              name="startEventDateTime"
              className="startEventDateTime"
              label={formatMessage("startEventDateTimeLabel")}
              placeholder={"YYYY-MM-DDTHH:MM:SS.MMM"}
            />
            <Field name="endEventDateTime">
              {({ field: { value: endEventDateTime } }) => (
                <div>
                  {(rangeEnabled || endEventDateTime) && (
                    <FormattedTextField
                      name="endEventDateTime"
                      label={formatMessage("endEventDateTimeLabel")}
                      placeholder={"YYYY-MM-DDTHH:MM:SS.MMM"}
                    />
                  )}
                  {!readOnly && (
                    <label style={{ marginLeft: 15, marginTop: -15 }}>
                      <span>{formatMessage("enableDateRangeLabel")}</span>
                      <Switch
                        onChange={toggleRangeEnabled}
                        checked={rangeEnabled || endEventDateTime}
                        className="react-switch dateRange"
                      />
                    </label>
                  )}
                </div>
              )}
            </Field>
            <TextField
              name="verbatimEventDateTime"
              label={formatMessage("verbatimEventDateTimeLabel")}
            />
          </fieldset>
        </div>
        <div className="col-md-6">
          <fieldset className="form-group border px-4 py-2">
            <legend className="w-auto">
              <DinaMessage id="collectingAgentsLegend" />
            </legend>
            <AutoSuggestTextField<CollectingEvent>
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
              arrayItemLink="/person/view?id="
              filter={filterBy(["displayName"])}
              model="agent-api/person"
              optionLabel={person => person.displayName}
              isMulti={true}
              asyncOptions={[
                {
                  label: <DinaMessage id="addNewPerson" />,
                  getResource: openAddPersonModal
                }
              ]}
            />
            <TextField name="dwcRecordNumber" />
            <TextField name="dwcOtherRecordNumbers" multiLines={true} />
          </fieldset>
        </div>
      </div>
      <fieldset className="form-group border px-4 py-2">
        <legend className="w-auto">
          <DinaMessage id="collectingLocationLegend" />
        </legend>
        <fieldset className="form-group border px-4 py-2">
          <legend className="w-auto">
            <DinaMessage id="verbatimCoordinatesLegend" />
          </legend>
          <KeyboardEventHandlerWrappedTextField name="dwcVerbatimLocality" />
          <div className="row">
            <div className="col-md-6">
              <KeyboardEventHandlerWrappedTextField name="dwcVerbatimLatitude" />
              <KeyboardEventHandlerWrappedTextField name="dwcVerbatimLongitude" />
            </div>
            <div className="col-md-6">
              <TextField name="dwcVerbatimCoordinates" />
              <TextField name="dwcVerbatimCoordinateSystem" />
              <TextField name="dwcVerbatimSRS" />
              <TextField name="dwcVerbatimElevation" />
              <TextField name="dwcVerbatimDepth" />
            </div>
          </div>
        </fieldset>
        <div className="row">
          <div className="col-md-6">
            <fieldset className="form-group border px-4 py-2">
              <legend className="w-auto">
                <DinaMessage id="geoReferencingLegend" />
              </legend>
              {(georeferenceDisabled ||
                (values.geoReferenceAssertions &&
                  values.geoReferenceAssertions.length === 0)) && (
                <div className="col-md-5">
                  <CheckBoxField
                    name="dwcGeoreferenceVerificationStatus"
                    onCheckBoxClick={onGeoReferencingImpossibleCheckBoxClick}
                  />
                </div>
              )}
              <FieldArray name="geoReferenceAssertions">
                {({ form, push, remove }) => {
                  const assertions =
                    (form.values as CollectingEvent).geoReferenceAssertions ??
                    [];

                  function addGeoReference() {
                    push({});
                    setActiveTabIdx(assertions.length);
                  }

                  function removeGeoReference(index: number) {
                    remove(index);
                    // Stay on the current tab number, or reduce if removeing the last element:
                    setActiveTabIdx(current =>
                      clamp(current, 0, assertions.length - 2)
                    );
                  }

                  return (
                    <div
                      style={{
                        display: georeferenceDisabled ? "none" : "inline"
                      }}
                    >
                      <Tabs
                        selectedIndex={activeTabIdx}
                        onSelect={setActiveTabIdx}
                      >
                        <TabList>
                          {assertions.length
                            ? assertions.map((assertion, index) => (
                                <Tab key={assertion.id}>
                                  <span className="m-3">{index + 1}</span>
                                </Tab>
                              ))
                            : null}
                        </TabList>
                        {assertions.length
                          ? assertions.map((assertion, index) => (
                              <TabPanel key={assertion.id}>
                                <div className="form-group">
                                  {!readOnly && (
                                    <SetCoordinatesFromVerbatimButton
                                      sourceLatField="dwcVerbatimLatitude"
                                      sourceLonField="dwcVerbatimLongitude"
                                      targetLatField={`geoReferenceAssertions[${index}].dwcDecimalLatitude`}
                                      targetLonField={`geoReferenceAssertions[${index}].dwcDecimalLongitude`}
                                      onSetCoords={({ lat, lon }) =>
                                        setGeoSearchValue(`${lat}, ${lon}`)
                                      }
                                    >
                                      <DinaMessage id="latLongAutoSetterButton" />
                                    </SetCoordinatesFromVerbatimButton>
                                  )}
                                </div>
                                <GeoReferenceAssertionRow
                                  index={index}
                                  openAddPersonModal={openAddPersonModal}
                                />
                                {!readOnly && (
                                  <div className="list-inline">
                                    <FormikButton
                                      className="list-inline-item btn btn-primary add-assertion-button"
                                      onClick={addGeoReference}
                                    >
                                      <DinaMessage id="addAssertion" />
                                    </FormikButton>
                                    <FormikButton
                                      className="list-inline-item btn btn-dark"
                                      onClick={() => removeGeoReference(index)}
                                    >
                                      <DinaMessage id="removeAssertionLabel" />
                                    </FormikButton>
                                  </div>
                                )}
                              </TabPanel>
                            ))
                          : null}
                      </Tabs>
                      {!assertions.length && !readOnly ? (
                        <FormikButton
                          className="btn btn-primary add-assertion-button"
                          onClick={addGeoReference}
                        >
                          <DinaMessage id="addAssertion" />
                        </FormikButton>
                      ) : null}
                    </div>
                  );
                }}
              </FieldArray>
            </fieldset>
          </div>
          <div className="col-md-6">
            <fieldset className="form-group border px-4 py-2">
              <legend className="w-auto">
                <DinaMessage id="toponymyLegend" />
              </legend>
              <div
                style={{
                  overflowY: "auto",
                  overflowX: "hidden",
                  maxHeight: 520
                }}
              >
                <Field name="geographicPlaceNameSourceDetail">
                  {({ field: { value: detail } }) =>
                    detail ? (
                      <div>
                        <TextField name="geographicPlaceName" readOnly={true} />
                        <TextField name="dwcStateProvince" readOnly={true} />
                        <TextField name="dwcCountry" readOnly={true} />
                        <div className="row">
                          {!readOnly && (
                            <div className="col-md-4">
                              <FormikButton
                                className="btn btn-dark"
                                onClick={removeThisPlace}
                              >
                                <DinaMessage id="removeThisPlaceLabel" />
                              </FormikButton>
                            </div>
                          )}
                          <div className="col-md-4">
                            {detail?.sourceIdType && detail?.sourceID && (
                              <a
                                href={`${geographicPlaceSourceUrl}/${detail?.sourceIdType}/${detail?.sourceID}`}
                                target="_blank"
                                className="btn btn-info"
                              >
                                <DinaMessage id="viewDetailButtonLabel" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <GeographySearchBox
                        inputValue={geoSearchValue}
                        onInputChange={setGeoSearchValue}
                        onSelectSearchResult={selectSearchResult}
                        renderUnderSearchBar={
                          <div className="form-group">
                            <DinaMessage id="search" />:{" "}
                            <FormikButton
                              className="btn btn-link"
                              onClick={state => {
                                setGeoSearchValue(
                                  `${state.dwcVerbatimLatitude}, ${state.dwcVerbatimLongitude}`
                                );
                                // Do the geo-search automatically:
                                setImmediate(() =>
                                  document
                                    ?.querySelector<HTMLElement>(
                                      ".geo-search-button"
                                    )
                                    ?.click()
                                );
                              }}
                              buttonProps={({ values: state }) => ({
                                disabled:
                                  !state.dwcVerbatimLatitude ||
                                  !state.dwcVerbatimLongitude
                              })}
                            >
                              <DinaMessage id="verbatimLatLong" />
                            </FormikButton>
                          </div>
                        }
                      />
                    )
                  }
                </Field>
              </div>
            </fieldset>
          </div>
        </div>
      </fieldset>
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
    initialMetadatas: collectingEvent?.attachment as PersistedResource<Metadata>[]
  });
  const initialValues = collectingEvent
    ? {
        ...collectingEvent,
        dwcOtherRecordNumbers:
          collectingEvent.dwcOtherRecordNumbers?.concat("").join("\n") ?? "",
        geoReferenceAssertions: collectingEvent.geoReferenceAssertions ?? []
      }
    : {
        type: "collecting-event",
        collectors: [],
        collectorGroups: [],
        startEventDateTime: "YYYY-MM-DDTHH:MM:SS.MMM",
        geoReferenceAssertions: []
      };

  const { save } = useApiClient();

  async function saveGeoReferenceAssertion(
    assertionsToSave: GeoReferenceAssertion[],
    linkedCollectingEvent: PersistedResource<CollectingEvent>
  ) {
    const existingAssertions = initialValues.geoReferenceAssertions as PersistedResource<GeoReferenceAssertion>[];

    const assertionIdsToSave = assertionsToSave.map(it => it.id);
    const assertionsToDelete = existingAssertions.filter(
      existingAssertion => !assertionIdsToSave.includes(existingAssertion.id)
    );

    const saveArgs: SaveArgs[] = assertionsToSave
      .filter(assertion => Object.keys(assertion).length > 0)
      .map(assertion => {
        return {
          resource: {
            ...assertion,
            type: "georeference-assertion",
            collectingEvent: {
              type: linkedCollectingEvent.type,
              id: linkedCollectingEvent.id
            }
          },
          type: "georeference-assertion"
        };
      });

    const deleteArgs = assertionsToDelete.map(assertion => ({
      delete: assertion
    }));

    if (saveArgs.length) {
      await save(saveArgs, { apiBaseUrl: "/collection-api" });
    }
    // Call the saves and deleted separately for now.
    // TODO find out why an operations request with 1 save + 1 delete causes the delete to be ignored.
    if (deleteArgs.length) {
      await save(deleteArgs, { apiBaseUrl: "/collection-api" });
    }
  }

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

    // Convert georeferenceByAgents to relationship
    submittedValues.geoReferenceAssertions?.map(assertion => {
      if (assertion.georeferencedBy) {
        assertion.relationships = {};
        assertion.relationships.georeferencedBy = {
          data: assertion.georeferencedBy.map(it => ({
            id: it.id,
            type: "agent"
          }))
        };
      }
      delete assertion.georeferencedBy;
    });

    const geoReferenceAssertionsToSave = submittedValues.geoReferenceAssertions;
    delete submittedValues.geoReferenceAssertions;

    const [savedCollectingEvent] = await save<CollectingEvent>(
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

    // save georeference assertions:
    await saveGeoReferenceAssertion(
      geoReferenceAssertionsToSave,
      savedCollectingEvent
    );

    await router.push(
      `/collection/collecting-event/view?id=${savedCollectingEvent.id}`
    );
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
          entityLink="/collection/collecting-event"
          byPassView={true}
        />
        <DeleteButton
          className="ml-5"
          id={id as string}
          options={{ apiBaseUrl: "/collection-api" }}
          postDeleteRedirect="/collection/collecting-event/list"
          type="collecting-event"
        />
      </ButtonBar>
      <CollectingEventFormLayout />
      <div className="form-group">{attachedMetadatasUI}</div>
    </DinaForm>
  );
}
