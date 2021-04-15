import {
  AutoSuggestTextField,
  DinaFormSection,
  filterBy,
  FormattedTextField,
  FormikButton,
  TextFieldWithCoordButtons,
  NominatumApiSearchResult,
  ResourceSelectField,
  TextField,
  useDinaFormContext
} from "common-ui";
import { Field, FieldArray, FormikContextType } from "formik";
import { clamp } from "lodash";
import { SRS } from "../../types/collection-api/resources/SRS";
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
  GeographicPlaceNameSource
} from "../../types/collection-api/resources/CollectingEvent";
import { SetCoordinatesFromVerbatimButton } from "./SetCoordinatesFromVerbatimButton";
import {
  CoordinateSystem,
  CoordinateSystemEnum,
  CoordinateSystemEnumPlaceHolder
} from "../../types/collection-api/resources/CoordinateSystem";
import { ShouldRenderReasons } from "react-autosuggest";

interface CollectingEventFormLayoutProps {
  dwcVerbatimCoord?: string | undefined;
}

/** Layout of fields which is re-useable between the edit page and the read-only view. */
export function CollectingEventFormLayout(
  props: CollectingEventFormLayoutProps
) {
  const { formatMessage } = useDinaIntl();
  const { openAddPersonModal } = useAddPersonModal();
  const [rangeEnabled, setRangeEnabled] = useState(false);

  const { readOnly } = useDinaFormContext();
  const [activeTabIdx, setActiveTabIdx] = useState(0);

  const [geoSearchValue, setGeoSearchValue] = useState<string>("");

  const [coordSysSelected, setCoordSysSelected] = useState(
    props?.dwcVerbatimCoord ?? ""
  );

  function toggleRangeEnabled(
    newValue: boolean,
    formik: FormikContextType<{}>
  ) {
    if (!newValue) {
      formik.setFieldValue("endEventDateTime", null);
    }
    setRangeEnabled(newValue);
  }

  function selectSearchResult(
    result: NominatumApiSearchResult,
    formik: FormikContextType<{}>
  ) {
    // Set locality fields:
    formik.setFieldValue("dwcCountry", result?.address?.country || null);
    formik.setFieldValue("dwcStateProvince", result?.address?.state || null);
    formik.setFieldValue("geographicPlaceName", result?.display_name || null);

    // Set geo source fields:
    formik.setFieldValue(
      "geographicPlaceNameSourceDetail.sourceID",
      result.osm_id || null
    );
    formik.setFieldValue(
      "geographicPlaceNameSourceDetail.sourceIdType",
      result.osm_type || null
    );
    formik.setFieldValue(
      "geographicPlaceNameSourceDetail.sourceUrl",
      geographicPlaceSourceUrl
    );
    formik.setFieldValue(
      "geographicPlaceNameSourceDetail.geographicPlaceNameSource",
      GeographicPlaceNameSource.OSM
    );
  }

  function removeThisPlace(formik: FormikContextType<{}>) {
    // reset the fields when user remove the place
    formik.setFieldValue("dwcCountry", null);
    formik.setFieldValue("dwcStateProvince", null);
    formik.setFieldValue("geographicPlaceName", null);

    // reset the source fields when user remove the place
    formik.setFieldValue("geographicPlaceNameSourceDetail", null);
    formik.setFieldValue("geographicPlaceNameSource", null);
  }

  /** Does a Places search using the given search string. */
  function doGeoSearch(query: string) {
    setGeoSearchValue(query);
    // Do the geo-search automatically:
    setImmediate(() =>
      document?.querySelector<HTMLElement>(".geo-search-button")?.click()
    );
  }

  /* Ensure config is rendered when input get focuse without needing to enter any value */
  function shouldRenderSuggestions(value: string, reason: ShouldRenderReasons) {
    return (
      value?.length >= 0 ||
      reason === "input-changed" ||
      reason === "input-focused"
    );
  }

  function onSuggestionSelected(selectedSuggestion, formik) {
    /* To bring the effect as if the field's value is changed to reflect the placeholder change */
    formik.values.dwcVerbatimLatitude === null
      ? formik.setFieldValue("dwcVerbatimLatitude", "")
      : formik.setFieldValue("dwcVerbatimLatitude", null);
    formik.values.dwcVerbatimLongitude === null
      ? formik.setFieldValue("dwcVerbatimLongitude", "")
      : formik.setFieldValue("dwcVerbatimLongitude", null);
    formik.values.dwcVerbatimCoordinates === null
      ? formik.setFieldValue("dwcVerbatimCoordinates", "")
      : formik.setFieldValue("dwcVerbatimCoordinates", null);
    setCoordSysSelected(selectedSuggestion);
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
              {({ field: { value: endEventDateTime }, form }) => (
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
                        onChange={newValue =>
                          toggleRangeEnabled(newValue, form)
                        }
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
          <div className="row">
            <div className="col-md-6">
              <TextFieldWithCoordButtons name="dwcVerbatimLocality" />
              <AutoSuggestTextField<CoordinateSystem>
                name="dwcVerbatimCoordinateSystem"
                configQuery={() => ({
                  path: "collection-api/coordinate-system"
                })}
                configSuggestion={src => src?.coordinateSystem ?? []}
                shouldRenderSuggestions={shouldRenderSuggestions}
                onSuggestionSelected={onSuggestionSelected}
              />
              <TextField
                name="dwcVerbatimCoordinates"
                placeholder={
                  coordSysSelected === CoordinateSystemEnum.UTM
                    ? CoordinateSystemEnumPlaceHolder[coordSysSelected]
                    : ""
                }
              />
              <TextFieldWithCoordButtons
                name="dwcVerbatimLatitude"
                placeholder={
                  coordSysSelected !== CoordinateSystemEnum.UTM
                    ? CoordinateSystemEnumPlaceHolder[coordSysSelected]
                    : null
                }
                isExternallyControlled={true}
                shouldShowDegree={
                  coordSysSelected === CoordinateSystemEnum.DECIMAL_DEGREE ||
                  coordSysSelected ===
                    CoordinateSystemEnum.DEGREE_DECIMAL_MINUTES ||
                  coordSysSelected ===
                    CoordinateSystemEnum.DEGREE_MINUTES_SECONDS
                }
                shouldShowMinute={
                  coordSysSelected ===
                    CoordinateSystemEnum.DEGREE_DECIMAL_MINUTES ||
                  coordSysSelected ===
                    CoordinateSystemEnum.DEGREE_MINUTES_SECONDS
                }
                shouldShowSecond={
                  coordSysSelected ===
                  CoordinateSystemEnum.DEGREE_MINUTES_SECONDS
                }
              />
              <TextFieldWithCoordButtons
                name="dwcVerbatimLongitude"
                placeholder={
                  coordSysSelected !== CoordinateSystemEnum.UTM
                    ? CoordinateSystemEnumPlaceHolder[coordSysSelected]
                    : null
                }
                isExternallyControlled={true}
                shouldShowDegree={
                  coordSysSelected === CoordinateSystemEnum.DECIMAL_DEGREE ||
                  coordSysSelected ===
                    CoordinateSystemEnum.DEGREE_DECIMAL_MINUTES ||
                  coordSysSelected ===
                    CoordinateSystemEnum.DEGREE_MINUTES_SECONDS
                }
                shouldShowMinute={
                  coordSysSelected ===
                    CoordinateSystemEnum.DEGREE_DECIMAL_MINUTES ||
                  coordSysSelected ===
                    CoordinateSystemEnum.DEGREE_MINUTES_SECONDS
                }
                shouldShowSecond={
                  coordSysSelected ===
                  CoordinateSystemEnum.DEGREE_MINUTES_SECONDS
                }
              />
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
              <AutoSuggestTextField<SRS>
                name="dwcVerbatimSRS"
                configQuery={() => ({
                  path: "collection-api/srs"
                })}
                configSuggestion={src => src?.srs ?? []}
                shouldRenderSuggestions={shouldRenderSuggestions}
              />
              <TextField name="dwcVerbatimElevation" />
              <TextField name="dwcVerbatimDepth" />
            </div>
          </div>
        </fieldset>
        <div className="row">
          <div className="col-lg-6">
            <fieldset className="form-group border px-4 py-2">
              <legend className="w-auto">
                <DinaMessage id="geoReferencingLegend" />
              </legend>
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
                    <div>
                      <Tabs
                        selectedIndex={activeTabIdx}
                        onSelect={setActiveTabIdx}
                      >
                        {
                          // Only show the tabs when there is more than 1 assertion:
                          assertions.length !== 1 && (
                            <TabList>
                              {assertions.map((assertion, index) => (
                                <Tab key={assertion.id}>
                                  <span className="m-3">{index + 1}</span>
                                </Tab>
                              ))}
                            </TabList>
                          )
                        }
                        {assertions.length
                          ? assertions.map((assertion, index) => (
                              <TabPanel key={assertion.id}>
                                <GeoReferenceAssertionRow
                                  index={index}
                                  openAddPersonModal={openAddPersonModal}
                                  assertion={assertion}
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
            </fieldset>
          </div>
          <div className="col-lg-6">
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
                                onClick={(_, formik) => removeThisPlace(formik)}
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
                    ) : !readOnly ? (
                      <GeographySearchBox
                        inputValue={geoSearchValue}
                        onInputChange={setGeoSearchValue}
                        onSelectSearchResult={selectSearchResult}
                        renderUnderSearchBar={
                          <Field>
                            {({ form: { values: formState } }) => {
                              const colEvent: Partial<CollectingEvent> = formState;
                              const activeAssertion =
                                colEvent.geoReferenceAssertions?.[activeTabIdx];

                              const decimalLat =
                                activeAssertion?.dwcDecimalLatitude;
                              const decimalLon =
                                activeAssertion?.dwcDecimalLongitude;

                              const hasVerbatimLocality = !!colEvent.dwcVerbatimLocality;
                              const hasDecimalCoords = !!(
                                decimalLat && decimalLon
                              );

                              const hasAnyLocation =
                                hasVerbatimLocality || hasDecimalCoords;

                              return hasAnyLocation ? (
                                <div className="form-group d-flex flex-row align-items-center">
                                  <div className="pr-3">
                                    <DinaMessage id="search" />:
                                  </div>
                                  <FormikButton
                                    className={
                                      hasVerbatimLocality
                                        ? "btn btn-link"
                                        : "d-none"
                                    }
                                    onClick={state =>
                                      doGeoSearch(state.dwcVerbatimLocality)
                                    }
                                  >
                                    <DinaMessage id="field_dwcVerbatimLocality" />
                                  </FormikButton>
                                  <FormikButton
                                    className={
                                      hasDecimalCoords
                                        ? "btn btn-link"
                                        : "d-none"
                                    }
                                    onClick={state => {
                                      const assertion =
                                        state.geoReferenceAssertions?.[
                                          activeTabIdx
                                        ];
                                      const lat = assertion?.dwcDecimalLatitude;
                                      const lon =
                                        assertion?.dwcDecimalLongitude;
                                      doGeoSearch(`${lat}, ${lon}`);
                                    }}
                                  >
                                    <DinaMessage id="decimalLatLong" />
                                  </FormikButton>
                                </div>
                              ) : null;
                            }}
                          </Field>
                        }
                      />
                    ) : null
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
