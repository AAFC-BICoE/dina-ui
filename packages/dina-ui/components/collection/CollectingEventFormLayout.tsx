import {
  AutoSuggestTextField,
  CheckBoxField,
  DinaFormSection,
  FieldArray,
  FieldSet,
  filterBy,
  FormattedTextField,
  FormikButton,
  KeyboardEventHandlerWrappedTextField,
  NominatumApiSearchResult,
  ResourceSelectField,
  TextField,
  useDinaFormContext
} from "common-ui";
import { Field, useFormikContext } from "formik";
import { clamp } from "lodash";
import { useState } from "react";
import Switch from "react-switch";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import {
  GeographySearchBox,
  GeoReferenceAssertionRow,
  GroupSelectField,
  useAddPersonModal
} from "..";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import { Person } from "../../types/agent-api/resources/Person";
import { geographicPlaceSourceUrl } from "../../types/collection-api/GeographicPlaceNameSourceDetail";
import {
  CollectingEvent,
  GeographicPlaceNameSource,
  GeoreferenceVerificationStatus
} from "../../types/collection-api/resources/CollectingEvent";
import { SetCoordinatesFromVerbatimButton } from "./SetCoordinatesFromVerbatimButton";

/** Layout of fields which is re-useable between the edit page and the read-only view. */
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

  /** Does a Places search using the given search string. */
  function doGeoSearch(query: string) {
    setGeoSearchValue(query);
    // Do the geo-search automatically:
    setImmediate(() =>
      document?.querySelector<HTMLElement>(".geo-search-button")?.click()
    );
  }

  return (
    <div>
      <DinaFormSection horizontal={[3, 9]}>
        <div className="row">
          <div className="col-md-6">
            <GroupSelectField name="group" enableStoredDefaultGroup={true} />
          </div>
          <div className="col-md-6">
            <TextField name="dwcOtherRecordNumbers" multiLines={true} />
          </div>
        </div>
      </DinaFormSection>
      <div className="row">
        <div className="col-md-6">
          <FieldSet legend={<DinaMessage id="collectingDateLegend" />}>
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
                        checked={rangeEnabled || endEventDateTime || false}
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
          </FieldSet>
        </div>
        <div className="col-md-6">
          <FieldSet legend={<DinaMessage id="collectingAgentsLegend" />}>
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
          </FieldSet>
        </div>
      </div>
      <FieldSet legend={<DinaMessage id="collectingLocationLegend" />}>
        <FieldSet legend={<DinaMessage id="verbatimCoordinatesLegend" />}>
          <KeyboardEventHandlerWrappedTextField name="dwcVerbatimLocality" />
          <div className="row">
            <div className="col-md-6">
              <KeyboardEventHandlerWrappedTextField name="dwcVerbatimLatitude" />
              <KeyboardEventHandlerWrappedTextField name="dwcVerbatimLongitude" />
              <div className="form-group">
                <SetCoordinatesFromVerbatimButton
                  sourceLatField="dwcVerbatimLatitude"
                  sourceLonField="dwcVerbatimLongitude"
                  targetLatField={`geoReferenceAssertions[${activeTabIdx}].dwcDecimalLatitude`}
                  targetLonField={`geoReferenceAssertions[${activeTabIdx}].dwcDecimalLongitude`}
                  onClick={({ lat, lon }) =>
                    setGeoSearchValue(`${lat}, ${lon}`)
                  }
                >
                  <DinaMessage id="latLongAutoSetterButton" />
                </SetCoordinatesFromVerbatimButton>
              </div>
            </div>
            <div className="col-md-6">
              <TextField name="dwcVerbatimCoordinates" />
              <TextField name="dwcVerbatimCoordinateSystem" />
              <TextField name="dwcVerbatimSRS" />
              <TextField name="dwcVerbatimElevation" />
              <TextField name="dwcVerbatimDepth" />
            </div>
          </div>
        </FieldSet>
        <div className="row">
          <div className="col-lg-6">
            <FieldSet legend={<DinaMessage id="geoReferencingLegend" />}>
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
                          {assertions.map((assertion, index) => (
                            <Tab key={assertion.id}>
                              <span className="m-3">{index + 1}</span>
                            </Tab>
                          ))}
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
                                      onClick={({ lat, lon }) =>
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
                                  <div className="list-inline mb-3">
                                    <FormikButton
                                      className="list-inline-item btn btn-primary add-assertion-button"
                                      onClick={addGeoReference}
                                    >
                                      <DinaMessage id="addAnotherAssertion" />
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
                      {!assertions.length && !readOnly && (
                        <FormikButton
                          className="btn btn-primary add-assertion-button"
                          onClick={addGeoReference}
                        >
                          <DinaMessage id="addAssertion" />
                        </FormikButton>
                      )}
                    </div>
                  );
                }}
              </FieldArray>
            </FieldSet>
          </div>
          <div className="col-lg-6">
            <FieldSet legend={<DinaMessage id="toponymyLegend" />}>
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
                          <div className="form-group d-flex flex-row align-items-center">
                            <div className="pr-3">
                              <DinaMessage id="search" />:
                            </div>
                            <FormikButton
                              className="btn btn-link"
                              onClick={state =>
                                doGeoSearch(state.dwcVerbatimLocality)
                              }
                              buttonProps={({ values: state }) => ({
                                disabled: !state.dwcVerbatimLocality
                              })}
                            >
                              <DinaMessage id="field_dwcVerbatimLocality" />
                            </FormikButton>
                            <FormikButton
                              className="btn btn-link"
                              onClick={state =>
                                doGeoSearch(
                                  `${state.dwcVerbatimLatitude}, ${state.dwcVerbatimLongitude}`
                                )
                              }
                              buttonProps={({ values: state }) => ({
                                disabled:
                                  !state.dwcVerbatimLatitude ||
                                  !state.dwcVerbatimLongitude
                              })}
                            >
                              <DinaMessage id="verbatimLatLong" />
                            </FormikButton>
                            <FormikButton
                              className="btn btn-link"
                              onClick={state => {
                                const assertion =
                                  state.geoReferenceAssertions?.[activeTabIdx];
                                const lat = assertion?.dwcDecimalLatitude;
                                const lon = assertion?.dwcDecimalLongitude;
                                doGeoSearch(`${lat}, ${lon}`);
                              }}
                              buttonProps={({ values: state }) => {
                                const assertion =
                                  state.geoReferenceAssertions?.[activeTabIdx];
                                const lat = assertion?.dwcDecimalLatitude;
                                const lon = assertion?.dwcDecimalLongitude;
                                return { disabled: !lat || !lon };
                              }}
                            >
                              <DinaMessage id="decimalLatLong" />
                            </FormikButton>
                          </div>
                        }
                      />
                    )
                  }
                </Field>
              </div>
            </FieldSet>
          </div>
        </div>
      </FieldSet>
    </div>
  );
}
