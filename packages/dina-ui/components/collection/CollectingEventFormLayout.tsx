import {
  AutoSuggestTextField,
  CheckBoxField,
  DinaFormSection,
  filterBy,
  FormattedTextField,
  FormikButton,
  KeyboardEventHandlerWrappedTextField,
  NominatumApiSearchResult,
  ResourceSelectField,
  TextField,
  useDinaFormContext
} from "common-ui";
import { Field, FieldArray, FormikContextType } from "formik";
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

  const [activeTabIdx, setActiveTabIdx] = useState(0);

  const [geoSearchValue, setGeoSearchValue] = useState<string>("");

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

  function onGeoReferencingImpossibleCheckBoxClick(
    event,
    formik: FormikContextType<{}>
  ) {
    if (event.target.checked === true) {
      formik.setFieldValue(
        "dwcGeoreferenceVerificationStatus",
        GeoreferenceVerificationStatus.GEOREFERENCING_NOT_POSSIBLE
      );
      formik.setFieldValue("geoReferenceAssertions", []);
    } else {
      formik.setFieldValue("dwcGeoreferenceVerificationStatus", null);
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
              <KeyboardEventHandlerWrappedTextField name="dwcVerbatimLocality" />
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
        </fieldset>
        <div className="row">
          <div className="col-lg-6">
            <fieldset className="form-group border px-4 py-2">
              <legend className="w-auto">
                <DinaMessage id="geoReferencingLegend" />
              </legend>
              <Field name="dwcGeoreferenceVerificationStatus">
                {({
                  field: { value: verificationStatus },
                  form: {
                    values: { geoReferenceAssertions }
                  }
                }) =>
                  (verificationStatus ===
                    GeoreferenceVerificationStatus.GEOREFERENCING_NOT_POSSIBLE ||
                    !geoReferenceAssertions?.length) && (
                    <div className="col-md-5">
                      <CheckBoxField
                        name="dwcGeoreferenceVerificationStatus"
                        onCheckBoxClick={
                          onGeoReferencingImpossibleCheckBoxClick
                        }
                      />
                    </div>
                  )
                }
              </Field>
              <FieldArray name="geoReferenceAssertions">
                {({ form, push, remove }) => {
                  const assertions =
                    (form.values as CollectingEvent).geoReferenceAssertions ??
                    [];

                  const georeferenceDisabled =
                    (form.values as CollectingEvent)
                      .dwcGeoreferenceVerificationStatus ===
                    GeoreferenceVerificationStatus.GEOREFERENCING_NOT_POSSIBLE;

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

                  return georeferenceDisabled ? null : (
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
                              const hasVerbatimCoords = !!(
                                colEvent.dwcVerbatimLatitude &&
                                colEvent.dwcVerbatimLongitude
                              );
                              const hasDecimalCoords = !!(
                                decimalLat && decimalLon
                              );

                              const hasAnyLocation =
                                hasVerbatimLocality ||
                                hasVerbatimCoords ||
                                hasDecimalCoords;

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
                                      hasVerbatimCoords
                                        ? "btn btn-link"
                                        : "d-none"
                                    }
                                    onClick={state =>
                                      doGeoSearch(
                                        `${state.dwcVerbatimLatitude}, ${state.dwcVerbatimLongitude}`
                                      )
                                    }
                                  >
                                    <DinaMessage id="verbatimLatLong" />
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
