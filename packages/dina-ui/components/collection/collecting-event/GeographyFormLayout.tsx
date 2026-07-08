import { DinaMessage, useDinaIntl } from "@dina-ui/intl/dina-ui-intl";
import {
  COLLECTING_EVENT_COMPONENT_NAME,
  CollectingEvent,
  GeographicPlaceNameSource,
  geographicPlaceSourceUrl,
  SourceAdministrativeLevel
} from "@dina-ui/types/collection-api";
import {
  DinaFormSection,
  ExternalLink,
  FieldSet,
  FormikButton,
  NominatumApiSearchResult,
  PlaceSectionsSelectionField,
  TextField,
  useDinaFormContext
} from "common-ui";
import { Field, FormikContextType } from "formik";
import { useState } from "react";
import Switch from "react-switch";
import { GeographySearchBox } from "./GeographySearchBox";

export interface GeographyFormLayoutProps {
  geoAssertionTabIdx: number;
  geoSearchValue: string;
  setGeoSearchValue: (value: string) => void;
}

const MAX_SRC_ADMIN_LEVELS = 10;

function templateCheckboxPath(fieldSuffix: string) {
  return `templateCheckboxes['${COLLECTING_EVENT_COMPONENT_NAME}.current-geographic-place.${fieldSuffix}']`;
}

function setTemplateCheckboxes(
  formik: FormikContextType<{}>,
  fieldSuffixes: string[],
  value: boolean
) {
  fieldSuffixes.forEach((suffix) =>
    formik.setFieldValue(templateCheckboxPath(suffix), value)
  );
}

function StateProvinceCountryFields({
  stateProvinceName,
  stateProvinceTemplateCheckboxName,
  countryName,
  countryTemplateCheckboxName,
  readOnly
}: {
  stateProvinceName: string;
  stateProvinceTemplateCheckboxName: string;
  countryName: string;
  countryTemplateCheckboxName: string;
  readOnly: boolean;
}) {
  const { formatMessage } = useDinaIntl();
  return (
    <DinaFormSection horizontal={[3, 9]} readOnly={readOnly}>
      <TextField
        name={stateProvinceName}
        templateCheckboxFieldName={stateProvinceTemplateCheckboxName}
        label={formatMessage("stateProvinceLabel")}
        readOnly={readOnly}
      />
      <TextField
        name={countryName}
        templateCheckboxFieldName={countryTemplateCheckboxName}
        label={formatMessage("countryLabel")}
        readOnly={readOnly}
      />
    </DinaFormSection>
  );
}

function ManualStateProvinceCountryFields({ readOnly }: { readOnly: boolean }) {
  return (
    <StateProvinceCountryFields
      stateProvinceName="dwcStateProvince"
      stateProvinceTemplateCheckboxName="dwcStateProvince"
      countryName="dwcCountry"
      countryTemplateCheckboxName="dwcCountry"
      readOnly={readOnly}
    />
  );
}

export function GeographyFormLayout({
  geoAssertionTabIdx,
  geoSearchValue,
  setGeoSearchValue
}: GeographyFormLayoutProps) {
  const { formatMessage } = useDinaIntl();

  const { readOnly, isTemplate } = useDinaFormContext();

  const [manualMode, setManualMode] = useState(false);
  const [customPlaceValue, setCustomPlaceValue] = useState<string>("");
  const [hideCustomPlace, setHideCustomPlace] = useState(true);
  const [hideSelectionCheckBox, setHideSelectionCheckBox] = useState(true);
  const [
    customGeographicPlaceCheckboxState,
    setCustomGeographicPlaceCheckboxState
  ] = useState(false);

  const commonSrcDetailRoot = "geographicPlaceNameSourceDetail";

  async function selectSearchResult(
    result: NominatumApiSearchResult,
    formik: FormikContextType<{}>
  ) {
    const osmTypeForSearch =
      result?.osm_type === "relation"
        ? "R"
        : result?.osm_type === "way"
        ? "W"
        : result?.osm_type === "node"
        ? "N"
        : "N";

    formik.setFieldValue(
      `${commonSrcDetailRoot}.country.name`,
      result?.address?.country || null
    );
    const stateProvinceName = result?.address?.state || null;

    if (stateProvinceName) {
      formik.setFieldValue(
        `${commonSrcDetailRoot}.stateProvince.name`,
        stateProvinceName
      );
      formik.setFieldValue(
        `${commonSrcDetailRoot}.stateProvince.id`,
        result?.osm_id || null
      );
      formik.setFieldValue(
        `${commonSrcDetailRoot}.stateProvince.element`,
        result?.osm_type || null
      );
    }

    formik.setFieldValue(
      `${commonSrcDetailRoot}.sourceUrl`,
      `${geographicPlaceSourceUrl}osmtype=${osmTypeForSearch}&osmid=${result.osm_id}`
    );
    formik.setFieldValue(
      "geographicPlaceNameSource",
      GeographicPlaceNameSource.OSM
    );
    if (isTemplate) {
      // Include the hidden geographicPlaceNameSource and sourceUrl values in the enabled template fields:
      setTemplateCheckboxes(
        formik,
        ["geographicPlaceNameSource", `${commonSrcDetailRoot}.sourceUrl`],
        true
      );
    }

    const geoNameParsed = parseGeoAdminLevels(
      result,
      formik,
      stateProvinceName
    );
    formik.setFieldValue("srcAdminLevels", geoNameParsed);
    setHideCustomPlace(false);
    setHideSelectionCheckBox(false);
  }

  function parseGeoAdminLevels(
    searchResult: NominatumApiSearchResult,
    formik: any,
    stateProvinceName: string | null
  ) {
    const adminLevels: SourceAdministrativeLevel[] = [];

    // If no address, just return an empty object.
    if (!searchResult?.address) {
      return adminLevels;
    }

    // Determine the osm type for the admin levels. Must be a single letter.
    const osmType = searchResult.osm_type.charAt(0).toUpperCase();

    // Go through each "address" available.
    for (const [key, value] of Object.entries(searchResult.address)) {
      // Ignore state/province and country as they are already handled.
      if (
        key === "state" ||
        key === "province" ||
        key === "country" ||
        key === "country_code"
      ) {
        // fill in the country code
        if (key === "country_code")
          formik.setFieldValue(`${commonSrcDetailRoot}.country.code`, value);

        // fill in the state/province name and placeType if it is not yet filled up
        // use name match if this result has empty/null state province placeType
        if (
          key === "province" ||
          key === "state" ||
          stateProvinceName === value
        ) {
          formik.setFieldValue(
            `${commonSrcDetailRoot}.stateProvince.name`,
            value
          );
          formik.setFieldValue(
            `${commonSrcDetailRoot}.stateProvince.placeType`,
            key
          );
        }

        continue;
      }

      if (value) {
        adminLevels.push({
          // Please note this is the TOP level ID.
          id: String(searchResult.osm_id),

          // Please note this is the TOP level element type.
          element: osmType,

          placeType: key,
          name: value
        });
      }
    }

    return adminLevels;
  }

  function removeThisPlace(formik: FormikContextType<{}>) {
    // reset the source fields when user remove the place
    formik.setFieldValue(commonSrcDetailRoot, null);
    formik.setFieldValue("geographicPlaceNameSource", null);
    formik.setFieldValue("srcAdminLevels", null);
    formik.setFieldValue("selectedSections", null);
    formik.setFieldValue("dwcStateProvince", null);
    formik.setFieldValue("dwcCountry", null);

    if (isTemplate) {
      // Uncheck the templateCheckboxes in this form section:
      const srcAdminLevelSuffixes = Array.from(
        { length: MAX_SRC_ADMIN_LEVELS + 1 },
        (_, idx) => `srcAdminLevels[${idx}]`
      );
      setTemplateCheckboxes(
        formik,
        [
          "geographicPlaceNameSource",
          `${commonSrcDetailRoot}.sourceUrl`,
          `${commonSrcDetailRoot}.country`,
          `${commonSrcDetailRoot}.stateProvince`,
          ...srcAdminLevelSuffixes
        ],
        false
      );
    }

    setCustomPlaceValue("");
    setHideCustomPlace(true);
    setHideSelectionCheckBox(true);
    setManualMode(false);
  }

  /** Does a Places search using the given search string. */
  function doGeoSearch(query: string) {
    setGeoSearchValue(query);
    // Do the geo-search automatically:
    setImmediate(() =>
      document?.querySelector<HTMLElement>(".geo-search-button")?.click()
    );
  }

  const addCustomPlaceName = (form) => {
    if (!customPlaceValue || customPlaceValue.length === 0) return;
    // Add user entered custom place in front
    const customPlaceAsInSrcAdmnLevel: SourceAdministrativeLevel = {
      name: customPlaceValue,
      type: "place-section",
      shortId: 0,
      element: undefined,
      id: undefined
    };

    const srcAdminLevels = form.values.srcAdminLevels;

    srcAdminLevels.forEach((lev) => {
      lev.shortId = lev.shortId + 1;
    });
    srcAdminLevels.unshift(customPlaceAsInSrcAdmnLevel);
    form.setFieldValue("srcAdminLevels", srcAdminLevels);

    // Make the custom place selected by default
    const selectedSections = form.values.selectedSections;
    selectedSections?.unshift(true);

    setHideCustomPlace(true);
  };

  return (
    <FieldSet
      fieldName="geographicPlaceNameSourceDetail"
      legend={<DinaMessage id="toponymyLegend" />}
      className="non-strip"
      componentName={COLLECTING_EVENT_COMPONENT_NAME}
      sectionName="current-geographic-place"
    >
      <div
        style={{
          overflowY: "auto",
          overflowX: "hidden",
          maxHeight: 925
        }}
      >
        <Field name="geographicPlaceNameSourceDetail">
          {({ field: { value: detail }, form }) =>
            detail ? (
              <div>
                {!hideCustomPlace && !readOnly && (
                  <div className="mb-3">
                    <label
                      htmlFor="customPlaceNameInput"
                      className="form-label"
                    >
                      <strong>
                        <DinaMessage id="customPlaceName" />
                      </strong>
                    </label>

                    <div className="input-group">
                      <input
                        id="customPlaceNameInput"
                        disabled={customGeographicPlaceCheckboxState}
                        aria-label="Custom Place Name"
                        className="form-control"
                        placeholder={formatMessage(
                          "customPlaceNamePlaceholder"
                        )}
                        value={customPlaceValue}
                        onChange={(e) =>
                          setCustomPlaceValue(
                            (e.target as HTMLTextAreaElement | HTMLInputElement)
                              .value
                          )
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            if (customPlaceValue?.length > 0) {
                              addCustomPlaceName(form);
                            }
                          }
                        }}
                      />
                      <button
                        className="btn btn-primary"
                        type="button"
                        data-testid="addCustomPlaceNameButton"
                        onClick={() => addCustomPlaceName(form)}
                        disabled={
                          !customPlaceValue ||
                          customGeographicPlaceCheckboxState
                        }
                      >
                        <DinaMessage id="addCustomPlaceName" />
                      </button>
                    </div>
                  </div>
                )}
                <PlaceSectionsSelectionField
                  name="srcAdminLevels"
                  hideSelectionCheckBox={hideSelectionCheckBox}
                  setCustomGeographicPlaceCheckboxState={
                    setCustomGeographicPlaceCheckboxState
                  }
                  customPlaceValue={customPlaceValue}
                />
                <StateProvinceCountryFields
                  stateProvinceName={`${commonSrcDetailRoot}.stateProvince.name`}
                  stateProvinceTemplateCheckboxName={`${commonSrcDetailRoot}.stateProvince`}
                  countryName={`${commonSrcDetailRoot}.country.name`}
                  countryTemplateCheckboxName={`${commonSrcDetailRoot}.country`}
                  readOnly={true}
                />
                <div className="row">
                  {!readOnly && (
                    <div className="col-md-6">
                      <FormikButton
                        className="btn btn-dark w-100"
                        onClick={(_, formik) => removeThisPlace(formik)}
                      >
                        <DinaMessage id="removeThisPlaceLabel" />
                      </FormikButton>
                    </div>
                  )}
                  <div className="col-md-6">
                    {detail.sourceUrl && (
                      <ExternalLink
                        href={`${detail.sourceUrl}`}
                        className="btn btn-info w-100 mb-2"
                      >
                        <DinaMessage id="viewDetailButtonLabel" />
                      </ExternalLink>
                    )}
                  </div>
                </div>
              </div>
            ) : readOnly ? (
              <ManualStateProvinceCountryFields readOnly={true} />
            ) : (
              <>
                <div className="d-flex align-items-center justify-content-end mb-2">
                  <label className="me-2" htmlFor="manualGeographyInput">
                    <DinaMessage id="manual" />
                  </label>
                  <Switch
                    id="manualGeographyInput"
                    checked={manualMode}
                    onChange={(checked) => setManualMode(checked)}
                  />
                </div>
                {manualMode ? (
                  <ManualStateProvinceCountryFields readOnly={false} />
                ) : (
                  <GeographySearchBox
                    inputValue={geoSearchValue}
                    onInputChange={setGeoSearchValue}
                    onSelectSearchResult={selectSearchResult}
                    renderUnderSearchBar={
                      <Field>
                        {({ form: { values: formState } }) => {
                          const colEvent: Partial<CollectingEvent> = formState;
                          const activeAssertion =
                            colEvent.geoReferenceAssertions?.[
                              geoAssertionTabIdx
                            ];

                          const decimalLat =
                            activeAssertion?.dwcDecimalLatitude;
                          const decimalLon =
                            activeAssertion?.dwcDecimalLongitude;

                          const hasVerbatimLocality =
                            !!colEvent.dwcVerbatimLocality;
                          const hasDecimalCoords = !!(decimalLat && decimalLon);

                          const hasAnyLocation =
                            hasVerbatimLocality || hasDecimalCoords;

                          return hasAnyLocation ? (
                            <div className="mb-3 d-flex flex-row align-items-center">
                              <div className="pe-3">
                                <DinaMessage id="search" />:
                              </div>
                              <FormikButton
                                className={
                                  hasVerbatimLocality
                                    ? "btn btn-link"
                                    : "d-none"
                                }
                                onClick={(state) =>
                                  doGeoSearch(state.dwcVerbatimLocality)
                                }
                              >
                                <DinaMessage id="field_dwcVerbatimLocality" />
                              </FormikButton>
                              <FormikButton
                                className={
                                  hasDecimalCoords ? "btn btn-link" : "d-none"
                                }
                                onClick={(state) => {
                                  const assertion =
                                    state.geoReferenceAssertions?.[
                                      geoAssertionTabIdx
                                    ];
                                  const lat = assertion?.dwcDecimalLatitude;
                                  const lon = assertion?.dwcDecimalLongitude;
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
                )}
              </>
            )
          }
        </Field>
      </div>
    </FieldSet>
  );
}
