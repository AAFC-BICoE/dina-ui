import {
  BackButton,
  ButtonBar,
  DinaForm,
  DinaFormContext,
  DinaFormSection,
  FieldSet,
  FormikButton,
  LoadingSpinner,
  StringArrayField,
  SubmitButton,
  TextField,
  withResponse,
  ResourceSelectField,
  filterBy,
  AutoSuggestTextField
} from "common-ui";
import { InputResource, PersistedResource } from "kitsu";
import Link from "next/link";
import { useRouter } from "next/router";
import { OrganismStateField } from "../../../../dina-ui/components/collection/OrganismStateField";
import { ReactNode, useContext } from "react";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import {
  CollectionSelectField,
  Footer,
  GroupSelectField,
  Head,
  MaterialSampleBreadCrumb,
  MaterialSampleFormNav,
  Nav,
  ScheduledActionsField,
  StorageLinkerField,
  TagsAndRestrictionsSection
} from "../../../components";
import {
  CollectingEventLinker,
  SetDefaultSampleName
} from "../../../components/collection";
import { DeterminationField } from "../../../components/collection/DeterminationField";
import { PreparationField } from "../../../components/collection/PreparationField";
import {
  useMaterialSampleQuery,
  useMaterialSampleSave
} from "../../../components/collection/useMaterialSample";
import { AllowAttachmentsConfig } from "../../../components/object-store";
import { ManagedAttributesEditor } from "../../../components/object-store/managed-attributes/ManagedAttributesEditor";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import {
  CollectingEvent,
  MaterialSample,
  MaterialSampleType,
  Vocabulary
} from "../../../types/collection-api";

export default function MaterialSampleEditPage() {
  const router = useRouter();
  const {
    query: { id }
  } = router;
  const { formatMessage } = useDinaIntl();
  const materialSampleQuery = useMaterialSampleQuery(id as any);

  async function moveToViewPage(savedId: string) {
    await router.push(`/collection/material-sample/view?id=${savedId}`);
  }

  const title = id ? "editMaterialSampleTitle" : "addMaterialSampleTitle";

  return (
    <div>
      <Head title={formatMessage(title)} />
      <Nav />
      <main className="container-fluid">
        <h1 id="wb-cont">
          <DinaMessage id={title} />
        </h1>
        {id ? (
          withResponse(materialSampleQuery, ({ data }) => (
            <MaterialSampleForm
              materialSample={data as any}
              onSaved={moveToViewPage}
            />
          ))
        ) : (
          <MaterialSampleForm onSaved={moveToViewPage} />
        )}
      </main>
      <Footer />
    </div>
  );
}

export interface MaterialSampleFormProps {
  materialSample?: InputResource<MaterialSample>;
  collectingEventInitialValues?: InputResource<CollectingEvent>;

  onSaved?: (id: string) => Promise<void>;

  /** Optionally call the hook from the parent component. */
  materialSampleSaveHook?: ReturnType<typeof useMaterialSampleSave>;

  /** Template form values for template mode. */
  templateInitialValues?: Partial<MaterialSample> & {
    templateCheckboxes?: Record<string, boolean | undefined>;
  };

  /** The enabled fields if creating from a template. */
  enabledFields?: {
    materialSample: string[];
    collectingEvent: string[];
  };

  attachmentsConfig?: {
    materialSample: AllowAttachmentsConfig;
    collectingEvent: AllowAttachmentsConfig;
  };

  buttonBar?: ReactNode;
}

export function MaterialSampleForm({
  materialSample,
  collectingEventInitialValues,
  onSaved,
  materialSampleSaveHook,
  enabledFields,
  attachmentsConfig,
  buttonBar = (
    <ButtonBar>
      <BackButton
        entityId={materialSample?.id}
        entityLink="/collection/material-sample"
      />
      <SubmitButton className="ms-auto" />
    </ButtonBar>
  )
}: MaterialSampleFormProps) {
  const { isTemplate } = useContext(DinaFormContext) ?? {};

  const {
    initialValues,
    nestedCollectingEventForm,
    dataComponentState,
    colEventId,
    setColEventId,
    colEventQuery,
    onSubmit,
    materialSampleAttachmentsUI,
    preparationsAttachmentsUI,
    loading
  } =
    materialSampleSaveHook ??
    useMaterialSampleSave({
      collectingEventAttachmentsConfig: attachmentsConfig?.collectingEvent,
      materialSampleAttachmentsConfig: attachmentsConfig?.materialSample,
      materialSample,
      collectingEventInitialValues,
      onSaved,
      isTemplate,
      enabledFields
    });

  // CollectingEvent "id" being enabled in the template enabledFields means that the
  // Template links an existing Collecting Event:
  const templateAttachesCollectingEvent = Boolean(
    enabledFields?.collectingEvent.includes("id")
  );

  const mateirialSampleInternal = (
    <div className="d-md-flex">
      <div style={{ minWidth: "20rem" }}>
        <MaterialSampleFormNav dataComponentState={dataComponentState} />
      </div>
      <div className="flex-grow-1 container-fluid">
        {!isTemplate && materialSample && (
          <MaterialSampleBreadCrumb
            disableLastLink={true}
            materialSample={materialSample as any}
          />
        )}
        {!isTemplate && <MaterialSampleInfoFormLayout />}
        <TagsAndRestrictionsSection resourcePath="collection-api/material-sample" />
        <MaterialSampleIdentifiersFormLayout />
        <MaterialSampleFormLayout />
        <div className="data-components">
          {dataComponentState.enableCollectingEvent && (
            <FieldSet
              id="collecting-event-section"
              legend={<DinaMessage id="collectingEvent" />}
            >
              <Tabs
                // Re-initialize the form when the linked CollectingEvent changes:
                key={colEventId}
                // Prevent unmounting the form on tab switch to avoid losing the form state:
                forceRenderTabPanel={true}
              >
                <TabList>
                  <Tab>
                    {colEventId ? (
                      <DinaMessage id="attachedCollectingEvent" />
                    ) : (
                      <DinaMessage id="createNew" />
                    )}
                  </Tab>
                  <Tab disabled={templateAttachesCollectingEvent}>
                    <DinaMessage id="attachExisting" />
                  </Tab>
                </TabList>
                <TabPanel>
                  {
                    // If there is already a linked CollectingEvent then wait for it to load first:
                    colEventId
                      ? withResponse(
                          colEventQuery,
                          ({ data: linkedColEvent }) => (
                            <>
                              <div className="mb-3 d-flex justify-content-end align-items-center">
                                <Link
                                  href={`/collection/collecting-event/view?id=${colEventId}`}
                                >
                                  <a target="_blank">
                                    <DinaMessage id="collectingEventDetailsPageLink" />
                                  </a>
                                </Link>
                                {
                                  // Do not allow changing an attached Collecting Event from a template:
                                  !templateAttachesCollectingEvent && (
                                    <FormikButton
                                      className="btn btn-danger detach-collecting-event-button ms-5"
                                      onClick={() => setColEventId(null)}
                                    >
                                      <DinaMessage id="detachCollectingEvent" />
                                    </FormikButton>
                                  )
                                }
                              </div>
                              {
                                // In template mode or Workflow Run mode, only show a link to the linked Collecting Event:
                                isTemplate ||
                                templateAttachesCollectingEvent ? (
                                  <div>
                                    <div className="attached-collecting-event-link mb-3">
                                      <DinaMessage id="attachedCollectingEvent" />
                                      :{" "}
                                      <Link
                                        href={`/collection/collecting-event/view?id=${colEventId}`}
                                      >
                                        <a target="_blank">
                                          {linkedColEvent.id}
                                        </a>
                                      </Link>
                                    </div>
                                    <CollectingEventBriefDetails
                                      collectingEvent={linkedColEvent}
                                    />
                                  </div>
                                ) : (
                                  // In form mode, show the actual editable Collecting Event form:
                                  nestedCollectingEventForm
                                )
                              }
                            </>
                          )
                        )
                      : nestedCollectingEventForm
                  }
                </TabPanel>
                <TabPanel>
                  <CollectingEventLinker
                    onCollectingEventSelect={colEventToLink => {
                      setColEventId(colEventToLink.id);
                    }}
                  />
                </TabPanel>
              </Tabs>
            </FieldSet>
          )}
          {dataComponentState.enablePreparations && (
            <PreparationField attachmentsUI={preparationsAttachmentsUI} />
          )}
          {dataComponentState.enableOrganism && <OrganismStateField />}
          {dataComponentState.enableDetermination && <DeterminationField />}
          {dataComponentState.enableStorage && (
            <FieldSet
              id="storage-section"
              legend={<DinaMessage id="storage" />}
            >
              <div className="card card-body mb-3">
                <StorageLinkerField name="storageUnit" removeLabelTag={true} />
              </div>
            </FieldSet>
          )}
          {dataComponentState.enableScheduledActions && (
            <ScheduledActionsField />
          )}
          {!isTemplate && (
            <FieldSet
              legend={<DinaMessage id="managedAttributeListTitle" />}
              id="managedAttributes-section"
            >
              <DinaFormSection
                // Disabled the template's restrictions for this section:
                enabledFields={null}
              >
                <ManagedAttributesEditor
                  valuesPath="managedAttributeValues"
                  valueFieldName="assignedValue"
                  managedAttributeApiPath="collection-api/managed-attribute"
                  apiBaseUrl="/collection-api"
                  managedAttributeComponent="MATERIAL_SAMPLE"
                  managedAttributeKeyField="key"
                />
              </DinaFormSection>
            </FieldSet>
          )}
          {materialSampleAttachmentsUI}
        </div>
      </div>
    </div>
  );

  return isTemplate ? (
    mateirialSampleInternal
  ) : loading ? (
    <LoadingSpinner loading={true} />
  ) : (
    <DinaForm<InputResource<MaterialSample>>
      initialValues={initialValues}
      onSubmit={onSubmit}
      enabledFields={enabledFields?.materialSample}
    >
      {!initialValues.id && <SetDefaultSampleName />}
      {buttonBar}
      {mateirialSampleInternal}
      {buttonBar}
    </DinaForm>
  );
}
export function MaterialSampleInfoFormLayout() {
  return (
    <div className="row">
      <div className="col-md-6">
        <GroupSelectField name="group" enableStoredDefaultGroup={true} />
      </div>
    </div>
  );
}

export function MaterialSampleFormLayout() {
  const { locale } = useDinaIntl();
  return (
    <FieldSet
      id="material-sample-section"
      legend={<DinaMessage id="materialSample" />}
    >
      <div className="row">
        <div className="col-md-6">
          <ResourceSelectField<MaterialSampleType>
            name="materialSampleType"
            filter={filterBy(["name"])}
            model="collection-api/material-sample-type"
            optionLabel={it => it.name}
            readOnlyLink="/collection/material-sample-type/view?id="
          />
          <AutoSuggestTextField<Vocabulary>
            name="materialSampleState"
            query={() => ({
              path: "collection-api/vocabulary/materialSampleState"
            })}
            suggestion={vocabElement =>
              vocabElement?.vocabularyElements?.map(
                it => it?.labels?.[locale] ?? ""
              ) ?? ""
            }
            alwaysShowSuggestions={true}
          />
        </div>
        <div className="col-md-6">
          <TextField name="materialSampleRemarks" multiLines={true} />
        </div>
      </div>
    </FieldSet>
  );
}
export interface MaterialSampleIdentifiersFormLayoutProps {
  disableSampleName?: boolean;
  hideOtherCatalogNumbers?: boolean;
  className?: string;
  namePrefix?: string;
  sampleNamePlaceHolder?: string;
}

export const IDENTIFIERS_FIELDS: (keyof MaterialSample)[] = [
  "collection",
  "materialSampleName",
  "dwcOtherCatalogNumbers",
  "barcode"
];

export const MATERIALSAMPLE_FIELDSET_FIELDS: (keyof MaterialSample)[] = [
  "materialSampleRemarks",
  "materialSampleState",
  "materialSampleType"
];

/** Fields layout re-useable between view and edit pages. */
export function MaterialSampleIdentifiersFormLayout({
  disableSampleName,
  className,
  namePrefix = "",
  sampleNamePlaceHolder
}: MaterialSampleIdentifiersFormLayoutProps) {
  return (
    <FieldSet
      id="identifiers-section"
      legend={<DinaMessage id="identifiers" />}
      className={className}
    >
      <div className="row">
        <div className="col-md-6">
          <CollectionSelectField
            name={`${namePrefix}collection`}
            customName="collection"
          />
          <TextField
            name={`${namePrefix}materialSampleName`}
            customName="materialSampleName"
            className="materialSampleName"
            readOnly={disableSampleName}
            placeholder={sampleNamePlaceHolder}
          />
          <TextField name={`${namePrefix}barcode`} customName="barcode" />
        </div>
        <div className="col-md-6">
          <StringArrayField
            name={`${namePrefix}dwcOtherCatalogNumbers`}
            customName="dwcOtherCatalogNumbers"
          />
        </div>
      </div>
    </FieldSet>
  );
}
export interface CollectingEventBriefDetailsProps {
  collectingEvent: PersistedResource<CollectingEvent>;
}

/** Shows just the main details of a Collecting Event. */
export function CollectingEventBriefDetails({
  collectingEvent
}: CollectingEventBriefDetailsProps) {
  return (
    <DinaForm initialValues={collectingEvent} readOnly={true}>
      <div className="row">
        <div className="col-sm-6">
          <FieldSet legend={<DinaMessage id="collectingDateLegend" />}>
            <TextField name="startEventDateTime" />
            {collectingEvent.endEventDateTime && (
              <TextField name="startEventDateTime" />
            )}
            <TextField name="verbatimEventDateTime" />
          </FieldSet>
        </div>
        <div className="col-sm-6">
          <FieldSet legend={<DinaMessage id="collectingLocationLegend" />}>
            <TextField name="dwcVerbatimLocality" />
            <TextField name="dwcVerbatimCoordinateSystem" />
            <TextField name="dwcVerbatimLatitude" />
            <TextField name="dwcVerbatimLongitude" />
          </FieldSet>
        </div>
      </div>
    </DinaForm>
  );
}
