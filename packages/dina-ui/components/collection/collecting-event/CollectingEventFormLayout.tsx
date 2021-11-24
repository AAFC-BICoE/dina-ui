import {
  AutoSuggestTextField,
  CheckBoxWithoutWrapper,
  DinaFormSection,
  FieldSet,
  filterBy,
  FormattedTextField,
  FormikButton,
  LoadingSpinner,
  NominatumApiSearchResult,
  NumberRangeFields,
  StringArrayField,
  TextField,
  TextFieldWithCoordButtons,
  TextFieldWithRemoveButton,
  useDinaFormContext
} from "common-ui";
import { FastField, Field, FieldArray, FormikContextType } from "formik";
import { ChangeEvent, useRef, useState } from "react";
import useSWR from "swr";
import { GeographySearchBox } from "..";
import {
  AttachmentsField,
  CollectionMethodSelectField,
  GroupSelectField,
  NotPubliclyReleasableWarning,
  ParseVerbatimToRangeButton,
  PersonSelectField,
  TagsAndRestrictionsSection
} from "../..";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { Vocabulary } from "../../../types/collection-api";
import {
  CollectingEvent,
  GeographicPlaceNameSource
} from "../../../types/collection-api/resources/CollectingEvent";
import {
  CoordinateSystemEnum,
  CoordinateSystemEnumPlaceHolder
} from "../../../types/collection-api/resources/CoordinateSystem";
import {
  geographicPlaceSourceUrl,
  SourceAdministrativeLevel
} from "../../../types/collection-api/resources/GeographicPlaceNameSourceDetail";
import { AllowAttachmentsConfig } from "../../object-store";
import { ManagedAttributesEditor } from "../../object-store/managed-attributes/ManagedAttributesEditor";
import { ManagedAttributesViewer } from "../../object-store/managed-attributes/ManagedAttributesViewer";
import { GeoReferenceAssertionField } from "../GeoReferenceAssertionField";
import {
  nominatimAddressDetailSearch,
  NominatimAddressDetailSearchProps,
  NominatumApiAddressDetailSearchResult
} from "./GeographySearchBox";
import { SetCoordinatesFromVerbatimButton } from "./SetCoordinatesFromVerbatimButton";

interface CollectingEventFormLayoutProps {
  setDefaultVerbatimCoordSys?: (newValue: string | undefined | null) => void;
  setDefaultVerbatimSRS?: (newValue: string | undefined | null) => void;
  initialValuesForTemplate?: any;
  attachmentsConfig?: AllowAttachmentsConfig;
}

/** Layout of fields which is re-useable between the edit page and the read-only view. */
export function CollectingEventFormLayout({
  setDefaultVerbatimCoordSys,
  setDefaultVerbatimSRS,
  attachmentsConfig
}: CollectingEventFormLayoutProps) {
  const { formatMessage, locale } = useDinaIntl();
  const layoutWrapperRef = useRef<HTMLDivElement>(null);

  const { initialValues, readOnly, isTemplate } = useDinaFormContext();

  const [geoAssertionTabIdx, setGeoAssertionTabIdx] = useState(0);

  const [geoSearchValue, setGeoSearchValue] = useState<string>("");

  const [customPlaceValue, setCustomPlaceValue] = useState<string>("");
  const [hideCustomPlace, setHideCustomPlace] = useState(true);
  const [hideRemoveBtn, setHideRemoveBtn] = useState(true);
  const [selectedSearchResult, setSelectedSearchResult] = useState<{}>();

  const { isValidating: detailResultsIsLoading } = useSWR(
    [selectedSearchResult, "nominatimAddressDetailSearch"],
    nominatimAddressDetailSearch,
    {
      shouldRetryOnError: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false
    }
  );

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
    formik.setFieldValue(
      `${commonSrcDetailRoot}.stateProvince.name`,
      result?.address?.state || null
    );
    formik.setFieldValue(
      `${commonSrcDetailRoot}.stateProvince.id`,
      result?.osm_id || null
    );
    formik.setFieldValue(
      `${commonSrcDetailRoot}.stateProvince.element`,
      result?.osm_type || null
    );

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
        "templateCheckboxes['geographicPlaceNameSource']",
        true
      );
      formik.setFieldValue(
        "templateCheckboxes['geographicPlaceNameSourceDetail.sourceUrl']",
        true
      );
    }

    // get the address detail with another nomiature call

    const detailSearchProps: NominatimAddressDetailSearchProps = {
      urlValue: {
        osmid: result.osm_id,
        osmtype: osmTypeForSearch,
        class: result.category
      },
      updateAdminLevels,
      formik
    };

    setSelectedSearchResult(detailSearchProps);
  }

  function updateAdminLevels(detailResults, formik) {
    const geoNameParsed = parseGeoAdminLevels(detailResults as any, formik);
    formik.setFieldValue("srcAdminLevels", geoNameParsed);
    setHideCustomPlace(false);
    setHideRemoveBtn(false);
  }

  function parseGeoAdminLevels(
    detailResults: NominatumApiAddressDetailSearchResult | null,
    formik
  ) {
    const editableSrcAdmnLevels: SourceAdministrativeLevel[] = [];
    let detail: SourceAdministrativeLevel = {};
    detailResults?.address?.map(addr => {
      // omitting country and state
      if (
        addr.type !== "country" &&
        addr.type !== "state" &&
        addr.type !== "country_code" &&
        addr.place_type !== "province" &&
        addr.place_type !== "state" &&
        addr.place_type !== "country" &&
        addr.isaddress &&
        (addr.osm_id || addr.place_id)
      ) {
        detail.id = addr.osm_id;
        detail.element = addr.osm_type;
        detail.placeType = addr.place_type ?? addr.class;
        detail.name = detail.placeType
          ? addr.localname + " [ " + detail.placeType + " ] "
          : addr.localname;
        editableSrcAdmnLevels.push(detail);
      }
      // fill in the country code
      if (addr.type === "country_code")
        formik.setFieldValue(
          `${commonSrcDetailRoot}.country.code`,
          addr.localname
        );

      // fill in the state/province name if it is not yet filled up
      if (
        (addr.place_type === "province" || addr.place_type === "state") &&
        !formik.values[`${commonSrcDetailRoot}.stateProvince.name`]
      ) {
        formik.setFieldValue(
          `${commonSrcDetailRoot}.stateProvince.name`,
          addr.localname
        );
        formik.setFieldValue(
          `${commonSrcDetailRoot}.stateProvince.placeType`,
          addr.place_type
        );
      }

      detail = {};
    });
    return editableSrcAdmnLevels;
  }

  function removeThisPlace(formik: FormikContextType<{}>) {
    // reset the source fields when user remove the place
    formik.setFieldValue(commonSrcDetailRoot, null);
    formik.setFieldValue("geographicPlaceNameSource", null);

    formik.setFieldValue("srcAdminLevels", null);

    if (isTemplate) {
      // Uncheck the templateCheckboxes in this form section:
      formik.setFieldValue(
        "templateCheckboxes['geographicPlaceNameSource']",
        false
      );
      formik.setFieldValue(
        "templateCheckboxes['geographicPlaceNameSourceDetail.sourceUrl']",
        false
      );
      formik.setFieldValue(
        "templateCheckboxes['geographicPlaceNameSourceDetail.country']",
        false
      );
      formik.setFieldValue(
        "templateCheckboxes['geographicPlaceNameSourceDetail.stateProvince']",
        false
      );
      for (let idx = 0; idx <= 10; idx++) {
        formik.setFieldValue(
          `templateCheckboxes['srcAdminLevels[${idx}]']`,
          false
        );
      }
    }

    setCustomPlaceValue("");
    setHideCustomPlace(true);
    setHideRemoveBtn(true);
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
    formik.values.dwcVerbatimLatitude === null
      ? formik.setFieldValue("dwcVerbatimLatitude", "")
      : formik.setFieldValue("dwcVerbatimLatitude", null);
    formik.values.dwcVerbatimLongitude === null
      ? formik.setFieldValue("dwcVerbatimLongitude", "")
      : formik.setFieldValue("dwcVerbatimLongitude", null);
    formik.values.dwcVerbatimCoordinates === null
      ? formik.setFieldValue("dwcVerbatimCoordinates", "")
      : formik.setFieldValue("dwcVerbatimCoordinates", null);
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
        form.values.dwcVerbatimCoordinates === null
          ? form.setFieldValue("dwcVerbatimCoordinates", "")
          : form.setFieldValue("dwcVerbatimCoordinates", null);
      }
    } else if (name === "dwcVerbatimSRS") {
      setDefaultVerbatimSRS?.(value);
    }
  };

  const addCustomPlaceName = form => {
    if (!customPlaceValue || customPlaceValue.length === 0) return;
    // Add user entered custom place in front
    const customPlaceAsInSrcAdmnLevel: SourceAdministrativeLevel = {};
    customPlaceAsInSrcAdmnLevel.name = customPlaceValue;
    const srcAdminLevels = form.values.srcAdminLevels;
    srcAdminLevels.unshift(customPlaceAsInSrcAdmnLevel);
    form.setFieldValue("srcAdminLevels", srcAdminLevels);
    setHideCustomPlace(true);
  };

  function onClickIncludeAll(
    e: ChangeEvent<HTMLInputElement>,
    form,
    id: string
  ) {
    layoutWrapperRef.current
      ?.querySelectorAll(`#${id} .templateCheckBox`)
      ?.forEach(field => {
        // tslint:disable-next-line
        form.setFieldValue(field.attributes["name"]?.value, e.target.checked);
      });
  }
  return (
    <div ref={layoutWrapperRef}>
      <NotPubliclyReleasableWarning />
      {!isTemplate && (
        <DinaFormSection horizontal={[3, 9]}>
          <div className="row">
            <GroupSelectField
              className="col-md-6"
              name="group"
              enableStoredDefaultGroup={true}
            />
            <StringArrayField
              className="col-md-6"
              name="dwcOtherRecordNumbers"
            />
          </div>
        </DinaFormSection>
      )}
      <TagsAndRestrictionsSection resourcePath="collection-api/collecting-event" />
      <div className="row">
        <div className="col-md-6">
          <FieldSet
            legend={<DinaMessage id="collectingDateLegend" />}
            id="collectingDateLegend"
            className="non-strip"
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
              label={formatMessage("startEventDateTime")}
              placeholder={"YYYY-MM-DDTHH:MM:SS.MMM"}
            />
            <FormattedTextField
              name="endEventDateTime"
              label={formatMessage("endEventDateTime")}
              placeholder={"YYYY-MM-DDTHH:MM:SS.MMM"}
            />
          </FieldSet>
        </div>
        <div className="col-md-6">
          <FieldSet
            legend={<DinaMessage id="collectingAgentsLegend" />}
            id="collectingAgentsLegend"
            className="non-strip"
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
            <PersonSelectField name="collectors" isMulti={true} />
            <TextField name="dwcRecordNumber" />
          </FieldSet>
        </div>
      </div>
      <div className="row">
        <div className="col-md-6">
          <FieldSet
            legend={<DinaMessage id="verbatimLabelLegend" />}
            id="verbatimLabelLegend"
            className="non-strip"
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
              query={() => ({
                path: "collection-api/vocabulary/coordinateSystem"
              })}
              suggestion={vocabElement =>
                vocabElement?.vocabularyElements?.map(
                  it => it?.labels?.[locale] ?? ""
                ) ?? ""
              }
              onSuggestionSelected={onSuggestionSelected}
              alwaysShowSuggestions={true}
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
                      >
                        <DinaMessage id="latLongAutoSetterButton" />
                      </SetCoordinatesFromVerbatimButton>
                    </div>
                  </>
                );
              }}
            </Field>
            <AutoSuggestTextField<Vocabulary>
              name="dwcVerbatimSRS"
              query={() => ({
                path: "collection-api/vocabulary/srs"
              })}
              suggestion={vocabElement =>
                vocabElement?.vocabularyElements?.map(
                  it => it?.labels?.[locale] ?? ""
                ) ?? ""
              }
              alwaysShowSuggestions={true}
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
            className="non-strip"
          >
            <TextField name="habitat" />
            <TextField name="host" />
            <Field name="group">
              {({ field: { value: group } }) => (
                // Collection methods should be filtered by the Collecting Event's group:
                <CollectionMethodSelectField
                  name="collectionMethod"
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
                  shouldUpdate={() => true}
                />
              )}
            </Field>
            <AutoSuggestTextField<CollectingEvent>
              name="substrate"
              query={(searchValue, ctx) => ({
                path: "collection-api/collecting-event",
                filter: {
                  ...(ctx.values.group && { group: { EQ: ctx.values.group } }),
                  rsql: `substrate==${searchValue}*`
                }
              })}
              suggestion={collEvent => collEvent.substrate ?? ""}
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
          </FieldSet>
        </div>
      </div>

      <div className="row">
        <div className="col-md-6">
          <GeoReferenceAssertionField
            onChangeTabIndex={setGeoAssertionTabIdx}
          />
        </div>
        <div className="col-md-6">
          <FieldSet
            legend={<DinaMessage id="toponymyLegend" />}
            className="non-strip"
          >
            <div
              style={{
                overflowY: "auto",
                overflowX: "hidden",
                maxHeight: 520
              }}
            >
              <Field name="geographicPlaceNameSourceDetail">
                {({ field: { value: detail }, form }) =>
                  detail ? (
                    <div>
                      {!hideCustomPlace && !readOnly && (
                        <div className="m-3">
                          <div className="d-flex flex-row">
                            <label className="p-2" style={{ marginLeft: -20 }}>
                              <strong>
                                <DinaMessage id="customPlaceName" />
                              </strong>
                            </label>
                            <input
                              aria-label="customPlace"
                              className="p-2 form-control"
                              style={{ width: "60%" }}
                              onChange={e =>
                                setCustomPlaceValue(e.target.value)
                              }
                              onKeyDown={e => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  if (customPlaceValue?.length > 0) {
                                    addCustomPlaceName(form);
                                  }
                                }
                              }}
                            />
                            <button
                              className="mb-2 btn btn-primary"
                              type="button"
                              onClick={() => addCustomPlaceName(form)}
                            >
                              <DinaMessage id="addCustomPlaceName" />
                            </button>
                          </div>
                        </div>
                      )}
                      {detailResultsIsLoading ? (
                        <LoadingSpinner loading={true} />
                      ) : (
                        form.values.srcAdminLevels?.length > 0 && (
                          <FieldArray name="srcAdminLevels">
                            {({ remove }) => {
                              const geoNames = form.values.srcAdminLevels;
                              function removeItem(index: number) {
                                remove(index);
                              }
                              return (
                                <div className="pb-4">
                                  {geoNames.map((_, idx) => (
                                    <TextFieldWithRemoveButton
                                      name={`srcAdminLevels[${idx}].name`}
                                      templateCheckboxFieldName={`srcAdminLevels[${idx}]`}
                                      readOnly={true}
                                      removeLabel={true}
                                      removeBottomMargin={true}
                                      removeItem={removeItem}
                                      key={Math.random()}
                                      index={idx}
                                      hideCloseBtn={hideRemoveBtn}
                                      inputProps={{
                                        style: {
                                          backgroundColor: `${
                                            idx % 2 === 0 ? "#e9ecef" : "white"
                                          }`
                                        }
                                      }}
                                    />
                                  ))}
                                </div>
                              );
                            }}
                          </FieldArray>
                        )
                      )}
                      <DinaFormSection horizontal={[3, 9]}>
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
                          {detail.sourceUrl && (
                            <a
                              href={`${detail.sourceUrl}`}
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
                            const colEvent: Partial<CollectingEvent> =
                              formState;
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
                            const hasDecimalCoords = !!(
                              decimalLat && decimalLon
                            );

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
                                  onClick={state =>
                                    doGeoSearch(state.dwcVerbatimLocality)
                                  }
                                >
                                  <DinaMessage id="field_dwcVerbatimLocality" />
                                </FormikButton>
                                <FormikButton
                                  className={
                                    hasDecimalCoords ? "btn btn-link" : "d-none"
                                  }
                                  onClick={state => {
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
        </div>
      </div>

      {!isTemplate && (
        <FieldSet
          legend={<DinaMessage id="collectingEventManagedAttributes" />}
        >
          {readOnly ? (
            <FastField name="managedAttributeValues">
              {({ field: { value } }) => (
                <ManagedAttributesViewer
                  values={value}
                  managedAttributeApiPath={key =>
                    `collection-api/managed-attribute/collecting_event.${key}`
                  }
                />
              )}
            </FastField>
          ) : (
            <DinaFormSection
              // Disabled the template's restrictions for this section:
              enabledFields={null}
            >
              <ManagedAttributesEditor
                valuesPath="managedAttributeValues"
                valueFieldName="assignedValue"
                managedAttributeApiPath="collection-api/managed-attribute"
                apiBaseUrl="/collection-api"
                managedAttributeComponent="COLLECTING_EVENT"
                managedAttributeKeyField="key"
              />
            </DinaFormSection>
          )}
        </FieldSet>
      )}
      <div className="mb-3">
        <AttachmentsField
          name="attachment"
          title={<DinaMessage id="collectingEventAttachments" />}
          allowNewFieldName="attachmentsConfig.allowNew"
          allowExistingFieldName="attachmentsConfig.allowExisting"
          allowAttachmentsConfig={attachmentsConfig}
          attachmentPath={`collection-api/collecting-event/${initialValues.id}/attachment`}
        />
      </div>
    </div>
  );
}
