import {
  AutoSuggestTextField,
  CheckBoxWithoutWrapper,
  DataEntryField,
  DinaFormSection,
  FieldSet,
  FieldSpy,
  FormattedTextField,
  NumberRangeFields,
  ResourceSelectField,
  SimpleSearchFilterBuilder,
  StringArrayField,
  TextField,
  TextFieldWithCoordButtons,
  Tooltip,
  useDinaFormContext,
  useInstanceContext
} from "common-ui";
import { Field } from "formik";
import _ from "lodash";
import { ChangeEvent, useRef, useState } from "react";
import {
  AttachmentsField,
  CollectionMethodSelectField,
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
  CollectionMethod,
  GeographicThesaurusSource,
  Protocol,
  Vocabulary,
  Expedition,
  Site
} from "../../../types/collection-api";
import { CollectingEvent } from "../../../types/collection-api/resources/CollectingEvent";
import {
  CoordinateSystemEnum,
  CoordinateSystemEnumPlaceHolder
} from "../../../types/collection-api/resources/CoordinateSystem";
import { ControlledVocabularyItem } from "../../../types/collection-api/resources/ControlledVocabularyItem";
import { AllowAttachmentsConfig } from "../../object-store";
import { GeoReferenceAssertionField } from "../GeoReferenceAssertionField";
import { SetCoordinatesFromVerbatimButton } from "./SetCoordinatesFromVerbatimButton";
import { TgnSourceSelection } from "./TgnIntegration";
import CollectingEventEditAlert from "./CollectingEventEditAlert";
import { simpleSearchFilterToFiql } from "../../../../common-ui/lib/filter-builder/fiql";
import { GeographyFormLayout } from "./GeographyFormLayout";
import { COLLECTION_MANAGED_ATTRIBUTE_ID } from "@dina-ui/components/controlled-vocabulary/controlledVocabularyItemUtils";

interface CollectingEventFormLayoutProps {
  setDefaultVerbatimCoordSys?: (newValue: string | undefined | null) => void;
  setDefaultVerbatimSRS?: (newValue: string | undefined | null) => void;
  initialValuesForTemplate?: any;
  attachmentsConfig?: AllowAttachmentsConfig;
  /** Forwarded to ManagedAttributesEditor */
  visibleManagedAttributeKeys?: string[];

  /** Pass the number of material sample usages to display a warning. */
  materialSampleUsageCount?: number;

  defaultToNotReleasable?: boolean;
}

/** Layout of fields which is re-useable between the edit page and the read-only view. */
export function CollectingEventFormLayout({
  setDefaultVerbatimCoordSys,
  setDefaultVerbatimSRS,
  attachmentsConfig,
  visibleManagedAttributeKeys,
  materialSampleUsageCount,
  defaultToNotReleasable
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
      />
    </DinaFormSection>
  );
  const collectingEventManagedAttributesComponent = (
    <ManagedAttributesEditor
      valuesPath="managedAttributes"
      managedAttributeApiPath="collection-api/controlled-vocabulary-item"
      managedAttributeComponent="COLLECTING_EVENT"
      controlledVocabularyId={COLLECTION_MANAGED_ATTRIBUTE_ID}
      fieldSetProps={{
        legend: <DinaMessage id="collectingEventManagedAttributes" />,
        componentName: COLLECTING_EVENT_COMPONENT_NAME,
        sectionName: "collecting-event-managed-attributes-section"
      }}
      managedAttributeOrderFieldName="managedAttributesOrder"
      visibleAttributeKeys={visibleManagedAttributeKeys}
      isControlledVocabulary={true}
    />
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

            <NotPubliclyReleasableSection
              defaultToNotReleasable={defaultToNotReleasable}
            />
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
                  tooltipLink="https://aafc-bicoe.github.io/dina-documentation/concepts-glossary/#_collection_number"
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
                      fiql: simpleSearchFilterToFiql(
                        SimpleSearchFilterBuilder.create<CollectingEvent>()
                          .searchFilter("dwcRecordedBy", searchValue)
                          .whereProvided("group", "EQ", ctx.values.group)
                          .build()
                      )
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
              tooltipLink="https://aafc-bicoe.github.io/dina-documentation/concepts-glossary/#_collectors_number"
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
            <AutoSuggestTextField<ControlledVocabularyItem>
              name="dwcVerbatimCoordinateSystem"
              jsonApiBackend={{
                query: () => ({
                  path: "collection-api/controlled-vocabulary-item?filter[controlledVocabulary.key][EQ]=coordinate_format"
                }),
                option: (vocabElement) =>
                  _.find(
                    vocabElement?.multilingualTitle?.titles || [],
                    (item) => item.lang === locale
                  )?.title
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
              tooltipLink="https://aafc-bicoe.github.io/dina-documentation/concepts-glossary/#ce-host"
              tooltipLinkText="fromDinaUserGuide"
            />
            <Field name="group">
              {({ field: { value: group } }) => (
                // Collection methods should be filtered by the Collecting Event's group:
                <CollectionMethodSelectField
                  name="collectionMethod"
                  customName={"collectingEventCollectionMethod"}
                  tooltipLink="https://aafc-bicoe.github.io/dina-documentation/concepts-glossary/#collection-method"
                  tooltipLinkText="fromDinaUserGuide"
                  filter={(searchValue: string) =>
                    SimpleSearchFilterBuilder.create<CollectionMethod>()
                      .searchFilter("name", searchValue)
                      .whereProvided("group", "EQ", group)
                      .build()
                  }
                />
              )}
            </Field>
            <ResourceSelectField<Protocol>
              name="protocol"
              filter={(searchValue: string) =>
                SimpleSearchFilterBuilder.create<Protocol>()
                  .searchFilter("name", searchValue)
                  .where("protocolType", "EQ", "collection_method")
                  .build()
              }
              model="collection-api/protocol"
              optionLabel={(protocol) => protocol.name}
              omitNullOption={false}
              readOnlyLink="/collection/protocol/view?id="
            />
            <AutoSuggestTextField<CollectingEvent>
              name="substrate"
              customName={"collectingEventSubstrate"}
              tooltipLink="https://aafc-bicoe.github.io/dina-documentation/concepts-glossary/#_substrate"
              tooltipLinkText="fromDinaUserGuide"
              jsonApiBackend={{
                query: (searchValue, ctx) => ({
                  path: "collection-api/collecting-event",
                  fiql: simpleSearchFilterToFiql(
                    SimpleSearchFilterBuilder.create<CollectingEvent>()
                      .searchFilter("substrate", searchValue)
                      .whereProvided("group", "EQ", ctx.values.group)
                      .build()
                  )
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
                <GeographyFormLayout
                  geoAssertionTabIdx={geoAssertionTabIdx}
                  geoSearchValue={geoSearchValue}
                  setGeoSearchValue={setGeoSearchValue}
                />
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
      <div className="row mb-3">
        <div className="col-md-6">
          <FieldSet
            legend={<DinaMessage id="collectingEventPartOfExpedition" />}
            className="non-strip h-100"
            componentName={COLLECTING_EVENT_COMPONENT_NAME}
            sectionName="collecting-event-details"
          >
            <ResourceSelectField<Expedition>
              name="expedition"
              filter={(searchValue: string) =>
                SimpleSearchFilterBuilder.create<CollectionMethod>()
                  .searchFilter("name", searchValue)
                  .build()
              }
              model="collection-api/expedition"
              optionLabel={(expedition) => expedition.name}
              omitNullOption={false}
              readOnlyLink="/collection/expedition/view?id="
            />
          </FieldSet>
        </div>
        <div className="col-md-6">
          <FieldSet
            legend={<DinaMessage id="collectingEventSite" />}
            className="non-strip h-100"
            componentName={COLLECTING_EVENT_COMPONENT_NAME}
            sectionName="collecting-event-details"
          >
            <ResourceSelectField<Site>
              name="site"
              filter={(searchValue: string) =>
                SimpleSearchFilterBuilder.create<CollectionMethod>()
                  .searchFilter("name", searchValue)
                  .build()
              }
              model="collection-api/site"
              optionLabel={(site) =>
                site.name + (site.code ? ` (${site.code})` : "")
              }
              omitNullOption={false}
              readOnlyLink="/collection/site/view?id="
            />
          </FieldSet>
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
            disableClearButton={true}
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
