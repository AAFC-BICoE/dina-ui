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
import { CollectingEventSummary } from "./CollectingEventSummary";
import styles from "./CollectingEventFormLayout.module.css";

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
  compactReadOnly?: boolean;
}

/** Layout of fields which is re-useable between the edit page and the read-only view. */
export function CollectingEventFormLayout({
  setDefaultVerbatimCoordSys,
  setDefaultVerbatimSRS,
  attachmentsConfig,
  visibleManagedAttributeKeys,
  materialSampleUsageCount,
  defaultToNotReleasable,
  compactReadOnly = false
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

  if (compactReadOnly && readOnly) {
    return <CollectingEventSummary />;
  }
  const onChangeExternal = (_form, name, value) => {
    if (name === "dwcVerbatimCoordinateSystem") {
      setDefaultVerbatimCoordSys?.(value);
    } else if (name === "dwcVerbatimSRS") {
      setDefaultVerbatimSRS?.(value);
    }
  };

  function CompactFieldRow({
    label,
    children
  }: {
    label: React.ReactNode;
    children: React.ReactNode;
  }) {
    return (
      <div
        className="d-flex align-items-center mb-1"
        style={{ maxWidth: "760px" }}
      >
        <div className="fw-semibold flex-shrink-0" style={{ width: "230px" }}>
          {label}
        </div>
        <div className="flex-grow-1">{children}</div>
      </div>
    );
  }

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
        legend: "Managed Attributes",
        className: `non-strip collecting-event-clean ${styles.cleanSection}`,
        componentName: COLLECTING_EVENT_COMPONENT_NAME,
        sectionName: "collecting-event-managed-attributes-section"
      }}
      managedAttributeOrderFieldName="managedAttributesOrder"
      visibleAttributeKeys={visibleManagedAttributeKeys}
      isControlledVocabulary={true}
    />
  );

  return (
    <div ref={layoutWrapperRef} className="collecting-event-layout">
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

            <div className={styles.sectionHeading}>Access &amp; Tags</div>

            <div className={styles.accessFields}>
              <NotPubliclyReleasableSection
                defaultToNotReleasable={defaultToNotReleasable}
                horizontal={14.375}
              />
              <Tooltip
                id="collecting_event_tag_info"
                disableSpanMargin={true}
                visibleElement={
                  <TagsAndRestrictionsSection
                    resourcePath="collection-api/collecting-event"
                    indexName="dina_material_sample_index"
                    tagIncludedType="collecting-event"
                    horizontal={14.375}
                  />
                }
              />
            </div>
          </>
        )}
      </DinaFormSection>
      <div className="row mb-3">
        <div className="col-md-12">
          <FieldSet
            legend={<DinaMessage id="identifiers" />}
            id="identifiers"
            className={`non-strip collecting-event-clean ${styles.cleanSection}`}
            componentName={COLLECTING_EVENT_COMPONENT_NAME}
            sectionName="identifiers-section"
          >
            <CompactFieldRow label="Collection Number">
              <TextField
                name="dwcFieldNumber"
                tooltipLink="https://aafc-bicoe.github.io/dina-documentation/concepts-glossary/#_collection_number"
                tooltipLinkText="fromDinaUserGuide"
                removeLabel={true}
                removeBottomMargin={true}
              />
            </CompactFieldRow>

            {!isTemplate && (
              <CompactFieldRow label="Other Record Numbers">
                <StringArrayField
                  name="otherRecordNumbers"
                  minRows={2}
                  removeLabel={true}
                  removeBottomMargin={true}
                />
              </CompactFieldRow>
            )}

            {!isTemplate && !readOnly && (
              <CompactFieldRow label="Group">
                <GroupSelectField
                  name="group"
                  enableStoredDefaultGroup={true}
                  removeLabel={true}
                  removeBottomMargin={true}
                />
              </CompactFieldRow>
            )}
          </FieldSet>
        </div>
      </div>

      <div className="row mb-3">
        <div className="col-md-12">
          <FieldSet
            legend={<DinaMessage id="collecting" />}
            id="collecting"
            className={`non-strip collecting-event-clean ${styles.cleanSection}`}
            componentName={COLLECTING_EVENT_COMPONENT_NAME}
          >
            <DinaFormSection
              componentName={COLLECTING_EVENT_COMPONENT_NAME}
              sectionName="collecting-date-section"
            >
              {isTemplate && (
                <Field name="includeAllCollectingDate">
                  {() => (
                    <CheckBoxWithoutWrapper
                      name="includeAllCollectingDate"
                      parentContainerId="collecting"
                      onClickIncludeAll={onClickIncludeAll}
                      includeAllLabel={formatMessage("includeAll")}
                    />
                  )}
                </Field>
              )}

              <CompactFieldRow label="Verbatim Event DateTime">
                <TextField
                  name="verbatimEventDateTime"
                  label={formatMessage("verbatimEventDateTime")}
                  removeLabel={true}
                  removeBottomMargin={true}
                />
              </CompactFieldRow>

              <CompactFieldRow label="Start Event Date Time">
                <FormattedTextField
                  name="startEventDateTime"
                  className="startEventDateTime"
                  placeholder={"YYYY-MM-DDTHH:MM:SS.MMM"}
                  removeLabel={true}
                  removeBottomMargin={true}
                />
              </CompactFieldRow>

              <CompactFieldRow label="End Event Date Time">
                <FormattedTextField
                  name="endEventDateTime"
                  placeholder={"YYYY-MM-DDTHH:MM:SS.MMM"}
                  removeLabel={true}
                  removeBottomMargin={true}
                />
              </CompactFieldRow>
            </DinaFormSection>

            <DinaFormSection
              componentName={COLLECTING_EVENT_COMPONENT_NAME}
              sectionName="collecting-agents-section"
            >
              {isTemplate && (
                <Field name="includeAllCollectingAgent">
                  {() => (
                    <CheckBoxWithoutWrapper
                      name="includeAllCollectingAgent"
                      parentContainerId="collecting"
                      onClickIncludeAll={onClickIncludeAll}
                      includeAllLabel={formatMessage("includeAll")}
                    />
                  )}
                </Field>
              )}

              <CompactFieldRow label="Verbatim Collectors">
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
                      removeLabel={true}
                      removeBottomMargin={true}
                    />
                  )}
                </FieldSpy>
              </CompactFieldRow>

              <CompactFieldRow label="Collectors">
                <PersonSelectField
                  name="collectors"
                  isMulti={true}
                  removeLabel={true}
                  removeBottomMargin={true}
                />
              </CompactFieldRow>

              <CompactFieldRow label="Collector's Number">
                <TextField
                  name="dwcRecordNumber"
                  tooltipLink="https://aafc-bicoe.github.io/dina-documentation/concepts-glossary/#_collectors_number"
                  tooltipLinkText="fromDinaUserGuide"
                  removeLabel={true}
                  removeBottomMargin={true}
                />
              </CompactFieldRow>
            </DinaFormSection>
          </FieldSet>
        </div>
      </div>
      <div className="row mb-3">
        <div className="col-md-12">
          <FieldSet
            legend={<DinaMessage id="verbatimLabelLegend" />}
            id="verbatimLabelLegend"
            className={`non-strip h-100 ${styles.cleanSection}`}
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

            <CompactFieldRow label="Verbatim Locality">
              <TextField
                name="dwcVerbatimLocality"
                removeLabel={true}
                removeBottomMargin={true}
              />
            </CompactFieldRow>

            <CompactFieldRow label="Verbatim Coordinate System">
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
                onChangeExternal={onChangeExternal}
                removeLabel={true}
                removeBottomMargin={true}
              />
            </CompactFieldRow>

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
                    <div
                      className={
                        !hasDegree && !hasMinute && !hasSecond ? "" : "d-none"
                      }
                    >
                      <CompactFieldRow label="Verbatim Coordinates">
                        <TextField
                          name="dwcVerbatimCoordinates"
                          placeholder={
                            isUTM
                              ? CoordinateSystemEnumPlaceHolder[
                                  coordSysSelected
                                ]
                              : null
                          }
                          removeLabel={true}
                          removeBottomMargin={true}
                        />
                      </CompactFieldRow>
                    </div>

                    <div
                      className={
                        hasDegree || hasMinute || hasSecond ? "" : "d-none"
                      }
                    >
                      <CompactFieldRow label="Verbatim Latitude">
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
                          removeLabel={true}
                          removeBottomMargin={true}
                        />
                      </CompactFieldRow>

                      <CompactFieldRow label="Verbatim Longitude">
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
                          removeLabel={true}
                          removeBottomMargin={true}
                        />
                      </CompactFieldRow>

                      <div className="mb-2" style={{ marginLeft: "230px" }}>
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
                    </div>
                  </>
                );
              }}
            </Field>

            <CompactFieldRow label="Verbatim SRS">
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
                removeLabel={true}
                removeBottomMargin={true}
              />
            </CompactFieldRow>

            <CompactFieldRow label="Verbatim Elevation">
              <TextField
                name="dwcVerbatimElevation"
                removeLabel={true}
                removeBottomMargin={true}
              />
            </CompactFieldRow>

            <div className="mb-2" style={{ marginLeft: "230px" }}>
              <ParseVerbatimToRangeButton
                verbatimField="dwcVerbatimElevation"
                rangeFields={[
                  "dwcMinimumElevationInMeters",
                  "dwcMaximumElevationInMeters"
                ]}
                buttonText={formatMessage("convertToElevationMinMax")}
              />
            </div>

            <CompactFieldRow label="Verbatim Depth">
              <TextField
                name="dwcVerbatimDepth"
                removeLabel={true}
                removeBottomMargin={true}
              />
            </CompactFieldRow>

            <div style={{ marginLeft: "230px" }}>
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
      </div>

      <div className="row mb-3">
        <div className="col-md-12">
          <FieldSet
            legend={<DinaMessage id="collectingEventDetails" />}
            className={`non-strip h-100 ${styles.cleanSection}`}
            componentName={COLLECTING_EVENT_COMPONENT_NAME}
            sectionName="collecting-event-additional-details-section"
          >
            <CompactFieldRow label="Habitat">
              <TextField
                name="habitat"
                removeLabel={true}
                removeBottomMargin={true}
              />
            </CompactFieldRow>

            <CompactFieldRow label="Host">
              <TextField
                name="host"
                customName={"collectingEventHost"}
                tooltipLink="https://aafc-bicoe.github.io/dina-documentation/concepts-glossary/#ce-host"
                tooltipLinkText="fromDinaUserGuide"
                removeLabel={true}
                removeBottomMargin={true}
              />
            </CompactFieldRow>

            <CompactFieldRow label="Collection Method">
              <Field name="group">
                {({ field: { value: group } }) => (
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
                    removeLabel={true}
                    removeBottomMargin={true}
                  />
                )}
              </Field>
            </CompactFieldRow>

            <CompactFieldRow label="Protocol">
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
                removeLabel={true}
                removeBottomMargin={true}
              />
            </CompactFieldRow>

            <CompactFieldRow label="Substrate">
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
                removeLabel={true}
                removeBottomMargin={true}
              />
            </CompactFieldRow>
            <NumberRangeFields
              names={[
                "dwcMinimumElevationInMeters",
                "dwcMaximumElevationInMeters"
              ]}
              labelMsg={<DinaMessage id="elevationInMeters" />}
              compact={true}
            />

            <NumberRangeFields
              names={["dwcMinimumDepthInMeters", "dwcMaximumDepthInMeters"]}
              labelMsg={<DinaMessage id="depthInMeters" />}
              compact={true}
            />

            <CompactFieldRow label="Remarks">
              <TextField
                name="remarks"
                multiLines={true}
                removeLabel={true}
                removeBottomMargin={true}
              />
            </CompactFieldRow>
          </FieldSet>
        </div>
      </div>
      <div className="row">
        <div className="col-md-12">
          {!readOnly ? (
            <GeoReferenceAssertionField
              onChangeTabIndex={setGeoAssertionTabIdx}
              className={`collecting-event-clean ${styles.cleanSection}`}
            />
          ) : !hideGeoreferences ? (
            <GeoReferenceAssertionField
              onChangeTabIndex={setGeoAssertionTabIdx}
              className={`collecting-event-clean ${styles.cleanSection}`}
            />
          ) : null}
        </div>
        <div className="col-md-12">
          {supportedGeographicReferences.includes("OSM") ? (
            <div className="row">
              <div className="col">
                <GeographyFormLayout
                  geoAssertionTabIdx={geoAssertionTabIdx}
                  geoSearchValue={geoSearchValue}
                  setGeoSearchValue={setGeoSearchValue}
                  className={`collecting-event-clean ${styles.cleanSection}`}
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
        <div className="col-md-12">
          <FieldSet
            legend="Expedition & Site"
            className={`non-strip collecting-event-clean ${styles.cleanSection}`}
            componentName={COLLECTING_EVENT_COMPONENT_NAME}
            sectionName="collecting-event-details"
          >
            <CompactFieldRow label="Expedition">
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
                removeLabel={true}
                removeBottomMargin={true}
              />
            </CompactFieldRow>

            <CompactFieldRow label="Site">
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
                removeLabel={true}
                removeBottomMargin={true}
              />
            </CompactFieldRow>
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
            className={`non-strip collecting-event-clean ${styles.cleanSection}`}
          />
        </DinaFormSection>
      </div>
      <>
        {!readOnly ? (
          collectingEventManagedAttributesComponent
        ) : JSON.stringify(initialValues?.managedAttributes) !== "{}" ? ( // if read-only, check for managed attributes
          <FieldSet
            legend={<DinaMessage id="collectingEventManagedAttributes" />}
            className="non-strip collecting-event-clean-section"
            componentName={COLLECTING_EVENT_COMPONENT_NAME}
            sectionName="collecting-event-managed-attributes-section"
          >
            {collectingEventManagedAttributesComponent}
          </FieldSet>
        ) : null}
      </>
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
