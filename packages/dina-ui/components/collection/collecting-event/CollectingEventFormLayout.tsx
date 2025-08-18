import {
  AutoSuggestTextField,
  CheckBoxWithoutWrapper,
  DataEntryField,
  DinaFormSection,
  FieldSet,
  FieldSpy,
  FormattedTextField,
  FormikButton,
  NominatumApiSearchResult,
  NumberRangeFields,
  PlaceSectionsSelectionField,
  ResourceSelectField,
  StringArrayField,
  TextField,
  TextFieldWithCoordButtons,
  Tooltip,
  filterBy,
  useDinaFormContext,
  useInstanceContext
} from "common-ui";
import { Field, FormikContextType } from "formik";
import _ from "lodash";
import Link from "next/link";
import { ChangeEvent, useRef, useState } from "react";
import {
  AttachmentsField,
  CollectionMethodSelectField,
  GeographySearchBox,
  GroupSelectField,
  NotPubliclyReleasableWarning,
  ParseVerbatimToRangeButton,
  PersonSelectField,
  TagsAndRestrictionsSection,
  TagSelectReadOnly,
  NotPubliclyReleasableSection
} from "../..";
import { ManagedAttributesEditor } from "../../";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import {
  COLLECTING_EVENT_COMPONENT_NAME,
  GeographicThesaurusSource,
  Protocol,
  Vocabulary
} from "../../../types/collection-api";
import {
  CollectingEvent,
  GeographicPlaceNameSource
} from "../../../types/collection-api/resources/CollectingEvent";
import {
  CoordinateSystemEnum,
  CoordinateSystemEnumPlaceHolder
} from "../../../types/collection-api/resources/CoordinateSystem";
import {
  SourceAdministrativeLevel,
  geographicPlaceSourceUrl
} from "../../../types/collection-api/resources/GeographicPlaceNameSourceDetail";
import { AllowAttachmentsConfig } from "../../object-store";
import { GeoReferenceAssertionField } from "../GeoReferenceAssertionField";
import { SetCoordinatesFromVerbatimButton } from "./SetCoordinatesFromVerbatimButton";
import { TgnSourceSelection } from "./TgnIntegration";
import CollectingEventEditAlert from "./CollectingEventEditAlert";

interface CollectingEventFormLayoutProps {
  setDefaultVerbatimCoordSys?: (newValue: string | undefined | null) => void;
  setDefaultVerbatimSRS?: (newValue: string | undefined | null) => void;
  initialValuesForTemplate?: any;
  attachmentsConfig?: AllowAttachmentsConfig;
  /** Forwarded to ManagedAttributesEditor */
  visibleManagedAttributeKeys?: string[];

  /** Pass the number of material sample usages to display a warning. */
  materialSampleUsageCount?: number;
}

/** Layout of fields which is re-useable between the edit page and the read-only view. */
export function CollectingEventFormLayout({
  setDefaultVerbatimCoordSys,
  setDefaultVerbatimSRS,
  attachmentsConfig,
  visibleManagedAttributeKeys,
  materialSampleUsageCount
}: CollectingEventFormLayoutProps) {
  const { formatMessage, locale } = useDinaIntl();
  const layoutWrapperRef = useRef<HTMLDivElement>(null);

  const { initialValues, readOnly, isTemplate } = useDinaFormContext();

  // Only show geo reference systems that are set. Use open street map as fallback
  const instanceContext = useInstanceContext();
  const supportedGeographicReferences: string[] =
    instanceContext?.supportedGeographicReferences?.split(",") ?? ["OSM"];

  // Check if Georeferences are empty
  const georeferencesEmpty: [] = initialValues.geoReferenceAssertions.map(
    (georeference) => {
      for (const key in georeference) {
        if (
          georeference[key] !== null &&
          key !== "createdOn" &&
          key !== "isPrimary"
        )
          return false;
      }
      return true;
    }
  );
  const hideGeoreferences: boolean = georeferencesEmpty.every(
    (element) => element === true
  );

  const [geoAssertionTabIdx, setGeoAssertionTabIdx] = useState(0);

  const [geoSearchValue, setGeoSearchValue] = useState<string>("");

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
      formik.setFieldValue(
        "templateCheckboxes['" +
          COLLECTING_EVENT_COMPONENT_NAME +
          ".current-geographic-place.geographicPlaceNameSource']",
        true
      );
      formik.setFieldValue(
        "templateCheckboxes['" +
          COLLECTING_EVENT_COMPONENT_NAME +
          ".current-geographic-place.geographicPlaceNameSourceDetail.sourceUrl']",
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
        // Determine the osm type for the admin level. Must be a single letter.
        const osmType = searchResult.osm_type.charAt(0).toUpperCase();

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

    if (isTemplate) {
      // Uncheck the templateCheckboxes in this form section:
      formik.setFieldValue(
        "templateCheckboxes['" +
          COLLECTING_EVENT_COMPONENT_NAME +
          ".current-geographic-place.geographicPlaceNameSource']",
        false
      );
      formik.setFieldValue(
        "templateCheckboxes['" +
          COLLECTING_EVENT_COMPONENT_NAME +
          ".current-geographic-place.geographicPlaceNameSourceDetail.sourceUrl']",
        false
      );
      formik.setFieldValue(
        "templateCheckboxes['" +
          COLLECTING_EVENT_COMPONENT_NAME +
          ".current-geographic-place.geographicPlaceNameSourceDetail.country']",
        false
      );
      formik.setFieldValue(
        "templateCheckboxes['" +
          COLLECTING_EVENT_COMPONENT_NAME +
          ".current-geographic-place.geographicPlaceNameSourceDetail.stateProvince']",
        false
      );
      for (let idx = 0; idx <= 10; idx++) {
        formik.setFieldValue(
          `templateCheckboxes['${COLLECTING_EVENT_COMPONENT_NAME}.current-geographic-place.srcAdminLevels[${idx}]']`,
          false
        );
      }
    }

    setCustomPlaceValue("");
    setHideCustomPlace(true);
    setHideSelectionCheckBox(true);
  }

  /** Does a Places search using the given search string. */
  function doGeoSearch(query: string) {
    setGeoSearchValue(query);
    // Do the geo-search automatically:
    setImmediate(() =>
      document?.querySelector<HTMLElement>(".geo-search-button")?.click()
    );
  }

  function onSuggestionSelected(_, formik) {
    /* To bring the effect as if the field's value is changed to reflect the placeholder change */
    if (formik.values.dwcVerbatimLatitude === null) {
      formik.setFieldValue("dwcVerbatimLatitude", "");
    } else {
      formik.setFieldValue("dwcVerbatimLatitude", null);
    }
    if (formik.values.dwcVerbatimLongitude === null) {
      formik.setFieldValue("dwcVerbatimLongitude", "");
    } else {
      formik.setFieldValue("dwcVerbatimLongitude", null);
    }
    if (formik.values.dwcVerbatimCoordinates === null) {
      formik.setFieldValue("dwcVerbatimCoordinates", "");
    } else {
      formik.setFieldValue("dwcVerbatimCoordinates", null);
    }
  }

  const onChangeExternal = (form, name, value) => {
    if (name === "dwcVerbatimCoordinateSystem") {
      setDefaultVerbatimCoordSys?.(value);
      /*When user enter other values instead of selecting from existing config,
      correctly setting the placeHolder for verbatim coordinates */
      if (
        value !== CoordinateSystemEnum.DECIMAL_DEGREE &&
        value !== CoordinateSystemEnum.DEGREE_DECIMAL_MINUTES &&
        value !== CoordinateSystemEnum.DEGREE_MINUTES_SECONDS &&
        value !== CoordinateSystemEnum.UTM
      ) {
        if (form.values.dwcVerbatimCoordinates === null) {
          form.setFieldValue("dwcVerbatimCoordinates", "");
        } else {
          form.setFieldValue("dwcVerbatimCoordinates", null);
        }
      }
    } else if (name === "dwcVerbatimSRS") {
      setDefaultVerbatimSRS?.(value);
    }
  };

  const addCustomPlaceName = (form) => {
    if (!customPlaceValue || customPlaceValue.length === 0) return;
    // Add user entered custom place in front
    const customPlaceAsInSrcAdmnLevel: SourceAdministrativeLevel = {};
    customPlaceAsInSrcAdmnLevel.name = customPlaceValue;
    customPlaceAsInSrcAdmnLevel.type = "place-section";
    customPlaceAsInSrcAdmnLevel.shortId = 0;
    customPlaceAsInSrcAdmnLevel.element = undefined;
    customPlaceAsInSrcAdmnLevel.id = undefined;

    const srcAdminLevels = form.values.srcAdminLevels;

    srcAdminLevels.map((lev) => {
      lev.shortId = lev.shortId + 1;
    });
    srcAdminLevels.unshift(customPlaceAsInSrcAdmnLevel);
    form.setFieldValue("srcAdminLevels", srcAdminLevels);

    // Make the custom place selected by default
    const selectedSections = form.values.selectedSections;
    selectedSections?.unshift(true);

    setHideCustomPlace(true);
  };

  function onClickIncludeAll(
    e: ChangeEvent<HTMLInputElement>,
    form,
    id: string
  ) {
    layoutWrapperRef.current
      ?.querySelectorAll(`#${id} .templateCheckBox`)
      ?.forEach((field) => {
        form.setFieldValue(field.attributes["name"]?.value, e.target.checked);
      });
  }
  const collectingEventAttachmentsComponent = (
    <DinaFormSection
      componentName={COLLECTING_EVENT_COMPONENT_NAME}
      sectionName="collecting-event-attachments-section"
    >
      <AttachmentsField
        name="attachment"
        title={<DinaMessage id="collectingEventAttachments" />}
        allowNewFieldName="attachmentsConfig.allowNew"
        allowExistingFieldName="attachmentsConfig.allowExisting"
        allowAttachmentsConfig={attachmentsConfig}
        attachmentPath={`collection-api/collecting-event/${initialValues.id}/attachment`}
      />
    </DinaFormSection>
  );
  const collectingEventManagedAttributesComponent = (
    <ManagedAttributesEditor
      valuesPath="managedAttributes"
      managedAttributeApiPath="collection-api/managed-attribute"
      managedAttributeComponent="COLLECTING_EVENT"
      fieldSetProps={{
        legend: <DinaMessage id="collectingEventManagedAttributes" />,
        componentName: COLLECTING_EVENT_COMPONENT_NAME,
        sectionName: "collecting-event-managed-attributes-section"
      }}
      managedAttributeOrderFieldName="managedAttributesOrder"
      visibleAttributeKeys={visibleManagedAttributeKeys}
    />
  );
  const geographicPlaceNameSourceComponent = (
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
                        onChange={(e) => setCustomPlaceValue(e.target.value)}
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
                <DinaFormSection horizontal={[3, 9]} readOnly={true}>
                  <TextField
                    name={`${commonSrcDetailRoot}.stateProvince.name`}
                    templateCheckboxFieldName={`${commonSrcDetailRoot}.stateProvince`}
                    label={formatMessage("stateProvinceLabel")}
                    readOnly={true}
                  />
                  <TextField
                    name={`${commonSrcDetailRoot}.country.name`}
                    templateCheckboxFieldName={`${commonSrcDetailRoot}.country`}
                    label={formatMessage("countryLabel")}
                    readOnly={true}
                  />
                </DinaFormSection>
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
                      <Link
                        href={`${detail.sourceUrl}`}
                        passHref={true}
                        className="btn btn-info w-100 mb-2"
                        target="_blank"
                      >
                        <DinaMessage id="viewDetailButtonLabel" />
                      </Link>
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
                        colEvent.geoReferenceAssertions?.[geoAssertionTabIdx];

                      const decimalLat = activeAssertion?.dwcDecimalLatitude;
                      const decimalLon = activeAssertion?.dwcDecimalLongitude;

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
                              hasVerbatimLocality ? "btn btn-link" : "d-none"
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
            ) : null
          }
        </Field>
      </div>
    </FieldSet>
  );

  return (
    <div ref={layoutWrapperRef}>
      <DinaFormSection
        componentName={COLLECTING_EVENT_COMPONENT_NAME}
        sectionName="general-section"
      >
        {readOnly ? (
          <>
            <NotPubliclyReleasableWarning />
            <TagSelectReadOnly />
          </>
        ) : (
          <>
            {/* Alert for multiple material sample usages when editing */}
            <CollectingEventEditAlert
              materialSampleUsageCount={materialSampleUsageCount}
              collectingEventUUID={initialValues.id}
            />

            <NotPubliclyReleasableSection />
            <Tooltip
              id="collecting_event_tag_info"
              disableSpanMargin={true}
              visibleElement={
                <TagsAndRestrictionsSection
                  resourcePath="collection-api/collecting-event"
                  indexName="dina_material_sample_index"
                  tagIncludedType="collecting-event"
                />
              }
            />
          </>
        )}
      </DinaFormSection>
      <div className="row mb-3">
        <div className="col-md-12">
          <FieldSet
            legend={<DinaMessage id="identifiers" />}
            id="identifiers"
            className="non-strip"
            componentName={COLLECTING_EVENT_COMPONENT_NAME}
            sectionName="identifiers-section"
          >
            <div className="row">
              <div className="col-md-6">
                <TextField
                  name="dwcFieldNumber"
                  tooltipLink="https://aafc-bicoe.github.io/dina-documentation/#_collection_number"
                  tooltipLinkText="fromDinaUserGuide"
                />
                {!isTemplate && <StringArrayField name="otherRecordNumbers" />}
              </div>
              <div className="col-md-6">
                {!isTemplate && !readOnly && (
                  <div className="row">
                    <GroupSelectField
                      name="group"
                      enableStoredDefaultGroup={true}
                    />
                  </div>
                )}
              </div>
            </div>
          </FieldSet>
        </div>
        <div className="col-md-6">
          <FieldSet
            legend={<DinaMessage id="collectingDateLegend" />}
            id="collectingDateLegend"
            className="non-strip h-100"
            componentName={COLLECTING_EVENT_COMPONENT_NAME}
            sectionName="collecting-date-section"
          >
            {isTemplate && (
              <Field name="includeAllCollectingDate">
                {() => (
                  <CheckBoxWithoutWrapper
                    name="includeAllCollectingDate"
                    parentContainerId="collectingDateLegend"
                    onClickIncludeAll={onClickIncludeAll}
                    includeAllLabel={formatMessage("includeAll")}
                  />
                )}
              </Field>
            )}
            <TextField
              name="verbatimEventDateTime"
              label={formatMessage("verbatimEventDateTime")}
            />
            <FormattedTextField
              name="startEventDateTime"
              className="startEventDateTime"
              placeholder={"YYYY-MM-DDTHH:MM:SS.MMM"}
            />
            <FormattedTextField
              name="endEventDateTime"
              placeholder={"YYYY-MM-DDTHH:MM:SS.MMM"}
            />
          </FieldSet>
        </div>
        <div className="col-md-6">
          <FieldSet
            legend={<DinaMessage id="collectingAgentsLegend" />}
            id="collectingAgentsLegend"
            className="non-strip h-100"
            componentName={COLLECTING_EVENT_COMPONENT_NAME}
            sectionName="collecting-agents-section"
          >
            {isTemplate && (
              <Field name="includeAllCollectingAgent">
                {() => (
                  <CheckBoxWithoutWrapper
                    name="includeAllCollectingAgent"
                    parentContainerId="collectingAgentsLegend"
                    onClickIncludeAll={onClickIncludeAll}
                    includeAllLabel={formatMessage("includeAll")}
                  />
                )}
              </Field>
            )}
            <FieldSpy<string> fieldName="group">
              {(group) => (
                <AutoSuggestTextField<CollectingEvent>
                  name="dwcRecordedBy"
                  jsonApiBackend={{
                    query: (searchValue, ctx) => ({
                      path: "collection-api/collecting-event",
                      filter: {
                        ...(ctx.values.group && {
                          group: { EQ: ctx.values.group }
                        }),
                        rsql: `dwcRecordedBy==*${searchValue}*`
                      }
                    }),
                    option: (collEvent) => collEvent?.dwcRecordedBy ?? ""
                  }}
                  elasticSearchBackend={{
                    indexName: "dina_material_sample_index",
                    searchField: "included.attributes.dwcRecordedBy",
                    group: group ?? undefined,
                    option: (collEvent) => collEvent?.dwcRecordedBy
                  }}
                  preferredBackend={"elastic-search"}
                />
              )}
            </FieldSpy>
            <PersonSelectField name="collectors" isMulti={true} />
            <TextField
              name="dwcRecordNumber"
              tooltipLink="https://aafc-bicoe.github.io/dina-documentation/#_collectors_number"
              tooltipLinkText="fromDinaUserGuide"
            />
          </FieldSet>
        </div>
      </div>
      <div className="row mb-3">
        <div className="col-md-6">
          <FieldSet
            legend={<DinaMessage id="verbatimLabelLegend" />}
            id="verbatimLabelLegend"
            className="non-strip h-100"
            componentName={COLLECTING_EVENT_COMPONENT_NAME}
            sectionName="verbatim-label-section"
          >
            {isTemplate && (
              <Field name="includeAllVerbatimCoordinates">
                {() => (
                  <CheckBoxWithoutWrapper
                    name="includeAllVerbatimCoordinates"
                    parentContainerId="verbatimLabelLegend"
                    onClickIncludeAll={onClickIncludeAll}
                    includeAllLabel={formatMessage("includeAll")}
                    customLayout={["col-sm-1", "col-sm-4"]}
                  />
                )}
              </Field>
            )}

            <TextField name="dwcVerbatimLocality" />
            <AutoSuggestTextField<Vocabulary>
              name="dwcVerbatimCoordinateSystem"
              jsonApiBackend={{
                query: () => ({
                  path: "collection-api/vocabulary2/coordinateSystem"
                }),
                option: (vocabElement) =>
                  _.compact(
                    vocabElement?.vocabularyElements?.map(
                      (it) =>
                        _.find(
                          it?.multilingualTitle?.titles || [],
                          (item) => item.lang === locale
                        )?.title
                    ) ?? []
                  )
              }}
              blankSearchBackend={"json-api"}
              onSuggestionSelected={onSuggestionSelected}
              onChangeExternal={onChangeExternal}
            />
            <Field name="dwcVerbatimCoordinateSystem">
              {({ field: { value: coordSysSelected } }) => {
                /* note need to consider there is also possible user enter their own verbatime coordsys
                  and not select any one from the dropdown*/
                const hasDegree =
                  coordSysSelected === CoordinateSystemEnum.DECIMAL_DEGREE;

                const hasMinute =
                  coordSysSelected ===
                  CoordinateSystemEnum.DEGREE_DECIMAL_MINUTES;

                const hasSecond =
                  coordSysSelected ===
                  CoordinateSystemEnum.DEGREE_MINUTES_SECONDS;

                const isUTM = coordSysSelected === CoordinateSystemEnum.UTM;

                return (
                  <>
                    <TextField
                      name="dwcVerbatimCoordinates"
                      placeholder={
                        isUTM
                          ? CoordinateSystemEnumPlaceHolder[coordSysSelected]
                          : null
                      }
                      className={
                        !hasDegree && !hasMinute && !hasSecond ? "" : "d-none"
                      }
                    />
                    <TextFieldWithCoordButtons
                      name="dwcVerbatimLatitude"
                      placeholder={
                        hasDegree || hasMinute || hasSecond
                          ? `${CoordinateSystemEnumPlaceHolder[coordSysSelected]}N`
                          : undefined
                      }
                      isExternallyControlled={true}
                      shouldShowDegree={hasDegree || hasMinute || hasSecond}
                      shouldShowMinute={hasMinute || hasSecond}
                      shouldShowSecond={hasSecond}
                      className={
                        hasDegree || hasMinute || hasSecond ? "" : "d-none"
                      }
                    />
                    <TextFieldWithCoordButtons
                      name="dwcVerbatimLongitude"
                      placeholder={
                        hasDegree || hasMinute || hasSecond
                          ? `${CoordinateSystemEnumPlaceHolder[coordSysSelected]}E`
                          : undefined
                      }
                      isExternallyControlled={true}
                      shouldShowDegree={hasDegree || hasMinute || hasSecond}
                      shouldShowMinute={hasMinute || hasSecond}
                      shouldShowSecond={hasSecond}
                      className={
                        hasDegree || hasMinute || hasSecond ? "" : "d-none"
                      }
                    />
                    <div
                      className={
                        hasDegree || hasMinute || hasSecond ? "mb-3" : "d-none"
                      }
                    >
                      <SetCoordinatesFromVerbatimButton
                        sourceLatField="dwcVerbatimLatitude"
                        sourceLonField="dwcVerbatimLongitude"
                        targetLatField={`geoReferenceAssertions[${geoAssertionTabIdx}].dwcDecimalLatitude`}
                        targetLonField={`geoReferenceAssertions[${geoAssertionTabIdx}].dwcDecimalLongitude`}
                        onClick={({ lat, lon }) =>
                          setGeoSearchValue(`${lat}, ${lon}`)
                        }
                        buttonText={formatMessage("latLongAutoSetterButton")}
                      />
                    </div>
                  </>
                );
              }}
            </Field>
            <AutoSuggestTextField<Vocabulary>
              name="dwcVerbatimSRS"
              jsonApiBackend={{
                query: () => ({
                  path: "collection-api/vocabulary2/srs"
                }),
                option: (vocabElement) =>
                  _.compact(
                    vocabElement?.vocabularyElements?.map(
                      (it) =>
                        _.find(
                          it?.multilingualTitle?.titles || [],
                          (item) => item.lang === locale
                        )?.title ||
                        it.name ||
                        ""
                    ) ?? []
                  )
              }}
              blankSearchBackend={"json-api"}
              onChangeExternal={onChangeExternal}
            />
            <TextField name="dwcVerbatimElevation" />
            <div>
              <ParseVerbatimToRangeButton
                verbatimField="dwcVerbatimElevation"
                rangeFields={[
                  "dwcMinimumElevationInMeters",
                  "dwcMaximumElevationInMeters"
                ]}
                buttonText={formatMessage("convertToElevationMinMax")}
              />
            </div>
            <TextField name="dwcVerbatimDepth" />
            <div>
              {" "}
              <ParseVerbatimToRangeButton
                verbatimField="dwcVerbatimDepth"
                rangeFields={[
                  "dwcMinimumDepthInMeters",
                  "dwcMaximumDepthInMeters"
                ]}
                buttonText={formatMessage("convertToDepthMinMax")}
              />
            </div>
          </FieldSet>
        </div>
        <div className="col-md-6">
          <FieldSet
            legend={<DinaMessage id="collectingEventDetails" />}
            className="non-strip h-100"
            componentName={COLLECTING_EVENT_COMPONENT_NAME}
            sectionName="collecting-event-details"
          >
            <TextField name="habitat" />
            <TextField
              name="host"
              customName={"collectingEventHost"}
              tooltipLink="https://aafc-bicoe.github.io/dina-documentation/#_host"
              tooltipLinkText="fromDinaUserGuide"
            />
            <Field name="group">
              {({ field: { value: group } }) => (
                // Collection methods should be filtered by the Collecting Event's group:
                <CollectionMethodSelectField
                  name="collectionMethod"
                  customName={"collectingEventCollectionMethod"}
                  tooltipLink="https://aafc-bicoe.github.io/dina-documentation/#collection-method"
                  tooltipLinkText="fromDinaUserGuide"
                  filter={filterBy(["name"], {
                    extraFilters: group
                      ? [
                          {
                            selector: "group",
                            comparison: "==",
                            arguments: group
                          }
                        ]
                      : undefined
                  })}
                />
              )}
            </Field>
            <ResourceSelectField<Protocol>
              name="protocol"
              filter={filterBy(["name"], {
                extraFilters: [
                  {
                    selector: "protocolType",
                    comparison: "==",
                    arguments: "collection_method"
                  }
                ]
              })}
              model="collection-api/protocol"
              optionLabel={(protocol) => protocol.name}
              omitNullOption={false}
              readOnlyLink="/collection/protocol/view?id="
            />
            <AutoSuggestTextField<CollectingEvent>
              name="substrate"
              customName={"collectingEventSubstrate"}
              tooltipLink="https://aafc-bicoe.github.io/dina-documentation/#_substrate"
              tooltipLinkText="fromDinaUserGuide"
              jsonApiBackend={{
                query: (searchValue, ctx) => ({
                  path: "collection-api/collecting-event",
                  filter: {
                    ...(ctx.values.group && {
                      group: { EQ: ctx.values.group }
                    }),
                    rsql: `substrate==${searchValue}*`
                  }
                }),
                option: (collEvent) => collEvent?.substrate ?? ""
              }}
            />
            <NumberRangeFields
              names={[
                "dwcMinimumElevationInMeters",
                "dwcMaximumElevationInMeters"
              ]}
              labelMsg={<DinaMessage id="elevationInMeters" />}
            />
            <NumberRangeFields
              names={["dwcMinimumDepthInMeters", "dwcMaximumDepthInMeters"]}
              labelMsg={<DinaMessage id="depthInMeters" />}
            />
            <TextField name="remarks" multiLines={true} />
            <div className="row">
              {readOnly &&
              JSON.stringify(initialValues?.managedAttributes) !== "{}" // if read-only, check for managed attributes
                ? collectingEventManagedAttributesComponent
                : null}
            </div>
          </FieldSet>
        </div>
      </div>
      <div className="row">
        <div className="col-md-6">
          {!readOnly ? (
            <GeoReferenceAssertionField
              onChangeTabIndex={setGeoAssertionTabIdx}
            />
          ) : !hideGeoreferences ? ( // if read-only, check for hideGeoreferences
            <GeoReferenceAssertionField
              onChangeTabIndex={setGeoAssertionTabIdx}
            />
          ) : null}
        </div>
        <div className="col-md-6">
          {supportedGeographicReferences.includes("OSM") ? (
            <div className="row">
              <div className="col">
                {!readOnly
                  ? geographicPlaceNameSourceComponent
                  : initialValues?.geographicPlaceNameSource // if read-only, check for managed attributes
                  ? geographicPlaceNameSourceComponent
                  : null}
              </div>
            </div>
          ) : null}
          {supportedGeographicReferences.includes("TGN") ? (
            <div className="row">
              <div className="col">
                {!readOnly ? (
                  <TgnSourceSelection />
                ) : initialValues?.geographicThesaurus?.source ===
                  GeographicThesaurusSource.TGN ? (
                  <TgnSourceSelection />
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>
      <div>
        <DinaFormSection
          componentName={COLLECTING_EVENT_COMPONENT_NAME}
          sectionName="collecting-event-field-extension-section"
        >
          <DataEntryField
            legend={<DinaMessage id="collectingEventFieldExtensions" />}
            name="extensionValues"
            readOnly={readOnly}
            isTemplate={isTemplate}
            blockOptionsEndpoint={`collection-api/extension`}
            blockOptionsFilter={{
              "extension.fields.dinaComponent": "COLLECTING_EVENT"
            }}
            width={"100%"}
          />
        </DinaFormSection>
      </div>
      <>{!readOnly ? collectingEventManagedAttributesComponent : null}</>
      <div className="mb-3">
        {!readOnly
          ? collectingEventAttachmentsComponent
          : initialValues?.attachment // if read-only, check for attachment
          ? collectingEventAttachmentsComponent
          : null}
      </div>
    </div>
  );
}
