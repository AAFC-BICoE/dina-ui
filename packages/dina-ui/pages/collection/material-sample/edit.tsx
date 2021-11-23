import {
  AutoSuggestTextField,
  BackButton,
  ButtonBar,
  DateField,
  DinaForm,
  DinaFormContext,
  DinaFormSection,
  FieldSet,
  filterBy,
  LoadingSpinner,
  ResourceSelectField,
  StringArrayField,
  SubmitButton,
  TextField,
  useDinaFormContext,
  useFieldLabels,
  withResponse
} from "common-ui";
import { InputResource, PersistedResource } from "kitsu";
import { padStart } from "lodash";
import { useRouter } from "next/router";
import { ReactNode, useContext, useRef, useState } from "react";
import * as yup from "yup";
import {
  AttachmentsField,
  CollectionSelectField,
  Footer,
  GroupSelectField,
  Head,
  MaterialSampleBreadCrumb,
  MaterialSampleFormNav,
  MaterialSampleStateReadOnlyRender,
  Nav,
  StorageLinkerField,
  TagsAndRestrictionsSection
} from "../../../components";
import {
  CollectingEventLinker,
  DeterminationField,
  ScheduledActionsField,
  SetDefaultSampleName,
  TabbedResourceLinker,
  useMaterialSampleQuery,
  useMaterialSampleSave
} from "../../../components/collection";
import { AcquisitionEventLinker } from "../../../components/collection/AcquisitionEventLinker";
import { AssociationsField } from "../../../components/collection/AssociationsField";
import { OrganismStateField } from "../../../components/collection/material-sample/OrganismStateField";
import { PreparationField } from "../../../components/collection/material-sample/PreparationField";
import { SaveAndCopyToNextSuccessAlert } from "../../../components/collection/SaveAndCopyToNextSuccessAlert";
import { AllowAttachmentsConfig } from "../../../components/object-store";
import { ManagedAttributesEditor } from "../../../components/object-store/managed-attributes/ManagedAttributesEditor";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import {
  AcquisitionEvent,
  CollectingEvent,
  MaterialSample,
  MaterialSampleType,
  Vocabulary
} from "../../../types/collection-api";
import { AcquisitionEventFormLayout } from "../acquisition-event/edit";

export type PostSaveRedirect = "VIEW" | "CREATE_NEXT";

export default function MaterialSampleEditPage() {
  const router = useRouter();

  const id = router.query.id?.toString();
  const copyFromId = router.query.copyFromId?.toString();

  const { formatMessage } = useDinaIntl();

  const materialSampleQuery = useMaterialSampleQuery(id);
  const copyFromQuery = useMaterialSampleQuery(copyFromId);

  /** The page to redirect to after saving. */
  const [saveRedirect, setSaveRedirect] = useState<PostSaveRedirect>("VIEW");

  async function moveToViewPage(savedId: string) {
    await router.push(`/collection/material-sample/view?id=${savedId}`);
  }

  async function moveToNextSamplePage(savedId: string) {
    await router.push(`/collection/material-sample/edit?copyFromId=${savedId}`);
  }

  const title = id ? "editMaterialSampleTitle" : "addMaterialSampleTitle";

  const sampleFormProps = {
    buttonBar: (
      <ButtonBar>
        <BackButton
          className="me-auto"
          entityId={id}
          entityLink="/collection/material-sample"
        />
        {!id && (
          <SubmitButton
            buttonProps={() => ({
              style: { width: "12rem" },
              onClick: () => setSaveRedirect("CREATE_NEXT")
            })}
          >
            <DinaMessage id="saveAndCopyToNext" />
          </SubmitButton>
        )}
        <SubmitButton
          buttonProps={() => ({ onClick: () => setSaveRedirect("VIEW") })}
        />
      </ButtonBar>
    ),
    // On save either redirect to the view page or create the next sample with the same values:
    onSaved:
      saveRedirect === "CREATE_NEXT" ? moveToNextSamplePage : moveToViewPage
  };

  return (
    <div>
      <Head title={formatMessage(title)} />
      <Nav />
      <main className="container-fluid">
        {!id &&
          !!copyFromId &&
          withResponse(copyFromQuery, ({ data: originalSample }) => (
            <SaveAndCopyToNextSuccessAlert
              id={copyFromId}
              displayName={
                !!originalSample.materialSampleName?.length
                  ? originalSample.materialSampleName
                  : copyFromId
              }
              entityPath={"collection/material-sample"}
            />
          ))}
        <h1 id="wb-cont">
          <DinaMessage id={title} />
        </h1>
        {id ? (
          withResponse(materialSampleQuery, ({ data: sample }) => (
            <MaterialSampleForm {...sampleFormProps} materialSample={sample} />
          ))
        ) : copyFromId ? (
          withResponse(copyFromQuery, ({ data: originalSample }) => {
            const initialValues = nextSampleInitialValues(originalSample);
            return (
              <MaterialSampleForm
                {...sampleFormProps}
                materialSample={initialValues}
              />
            );
          })
        ) : (
          <MaterialSampleForm {...sampleFormProps} />
        )}
      </main>
      <Footer />
    </div>
  );
}

export interface MaterialSampleFormProps {
  materialSample?: InputResource<MaterialSample>;
  collectingEventInitialValues?: InputResource<CollectingEvent>;
  acquisitionEventInitialValues?: InputResource<AcquisitionEvent>;

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
    acquisitionEvent: string[];
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
  acquisitionEventInitialValues,
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
    nestedAcqEventForm,
    dataComponentState,
    colEventId,
    setColEventId,
    colEventQuery,
    acqEventQuery,
    acqEventId,
    setAcqEventId,
    onSubmit,
    loading
  } =
    materialSampleSaveHook ??
    useMaterialSampleSave({
      collectingEventAttachmentsConfig: attachmentsConfig?.collectingEvent,
      materialSample,
      collectingEventInitialValues,
      acquisitionEventInitialValues,
      onSaved,
      isTemplate,
      enabledFields
    });

  // CollectingEvent "id" being enabled in the template enabledFields means that the
  // Template links an existing Collecting Event:
  const templateAttachesCollectingEvent = Boolean(
    enabledFields?.collectingEvent.includes("id")
  );
  const templateAttachesAcquisitionEvent = Boolean(
    enabledFields?.acquisitionEvent.includes("id")
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
              <TabbedResourceLinker<CollectingEvent>
                briefDetails={colEvent => (
                  <CollectingEventBriefDetails collectingEvent={colEvent} />
                )}
                linkerTabContent={
                  <CollectingEventLinker
                    onCollectingEventSelect={colEventToLink => {
                      setColEventId(colEventToLink.id);
                    }}
                  />
                }
                nestedForm={nestedCollectingEventForm}
                resourceQuery={colEventQuery}
                setResourceId={setColEventId}
                disableLinkerTab={templateAttachesCollectingEvent}
                readOnlyLink="/collection/collecting-event/view?id="
                resourceId={colEventId}
              />
            </FieldSet>
          )}
          {dataComponentState.enableAcquisitionEvent && (
            <FieldSet
              id="acquisition-event-section"
              legend={<DinaMessage id="acquisitionEvent" />}
            >
              <TabbedResourceLinker<AcquisitionEvent>
                briefDetails={acqEvent => (
                  <DinaForm initialValues={acqEvent} readOnly={true}>
                    <AcquisitionEventFormLayout />
                  </DinaForm>
                )}
                linkerTabContent={
                  <AcquisitionEventLinker
                    onAcquisitionEventSelect={acqEventToLink => {
                      setAcqEventId(acqEventToLink.id);
                    }}
                  />
                }
                nestedForm={nestedAcqEventForm}
                resourceQuery={acqEventQuery}
                setResourceId={setAcqEventId}
                disableLinkerTab={templateAttachesAcquisitionEvent}
                readOnlyLink="/collection/acquisition-event/view?id="
                resourceId={acqEventId}
              />
            </FieldSet>
          )}
          {dataComponentState.enablePreparations && (
            <PreparationField
              // Use the same attachments config for preparations as the Material Sample:
              attachmentsConfig={attachmentsConfig?.materialSample}
            />
          )}
          {dataComponentState.enableOrganism && <OrganismStateField />}
          {dataComponentState.enableDetermination && <DeterminationField />}
          {dataComponentState.enableAssociations && <AssociationsField />}
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
          <AttachmentsField
            name="attachment"
            title={<DinaMessage id="materialSampleAttachments" />}
            id="material-sample-attachments-section"
            allowNewFieldName="attachmentsConfig.allowNew"
            allowExistingFieldName="attachmentsConfig.allowExisting"
            allowAttachmentsConfig={attachmentsConfig?.materialSample}
            attachmentPath={`collection-api/material-sample/${materialSample?.id}/attachment`}
          />
        </div>
      </div>
    </div>
  );

  const { materialSampleSchema } = useMaterialSampleSchema();

  return isTemplate ? (
    mateirialSampleInternal
  ) : loading ? (
    <LoadingSpinner loading={true} />
  ) : (
    <DinaForm<InputResource<MaterialSample>>
      initialValues={initialValues}
      onSubmit={onSubmit}
      enabledFields={enabledFields?.materialSample}
      validationSchema={materialSampleSchema}
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
  const { locale, formatMessage } = useDinaIntl();
  const divRef = useRef<HTMLDivElement>(null);

  const { readOnly, initialValues } = useDinaFormContext();

  const onMaterialSampleStateChanged = (form, _name, value) => {
    if (divRef.current) {
      if (value) {
        divRef.current.className = "";
      } else {
        divRef.current.className = divRef.current.className + " d-none";
        form.setFieldValue("stateChangeRemarks", null);
        form.setFieldValue("stateChangedOn", null);
      }
    }
  };

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
          {!readOnly ? (
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
              onChangeExternal={onMaterialSampleStateChanged}
            />
          ) : (
            <MaterialSampleStateReadOnlyRender removeLabel={false} />
          )}
        </div>
        <div className="col-md-6">
          <TextField name="materialSampleRemarks" multiLines={true} />
        </div>
      </div>
      {!readOnly && (
        <div
          ref={divRef}
          className={!initialValues.materialSampleState ? "d-none" : ""}
        >
          <FieldSet legend={<DinaMessage id="stateChangeMetaLegend" />}>
            <div className="row">
              <DateField
                className="col-md-6"
                name="stateChangedOn"
                label={formatMessage("date")}
              />
              <TextField
                className="col-md-6"
                name="stateChangeRemarks"
                multiLines={true}
                label={formatMessage("additionalRemarks")}
              />
            </div>
          </FieldSet>
        </div>
      )}
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

/** Calculates the next sample name based on the previous name's suffix. */
export function nextSampleName(previousName?: string | null): string {
  if (!previousName) {
    return "";
  }

  const originalNumberSuffix = /\d+$/.exec(previousName)?.[0];

  if (!originalNumberSuffix) {
    return "";
  }

  const suffixLength = originalNumberSuffix.length;
  const nextNumberSuffix = padStart(
    (Number(originalNumberSuffix) + 1).toString(),
    suffixLength,
    "0"
  );
  const newMaterialSampleName = nextNumberSuffix
    ? previousName.replace(/\d+$/, nextNumberSuffix)
    : previousName;

  return newMaterialSampleName;
}

export function nextSampleInitialValues(
  originalSample: PersistedResource<MaterialSample>
) {
  // Use the copied sample as a base, omitting some fields that shouldn't be copied:
  const {
    id,
    createdOn,
    createdBy,
    materialSampleName,
    allowDuplicateName,
    ...copiedValues
  } = originalSample;

  // Calculate the next suffix:
  const newMaterialSampleName = nextSampleName(materialSampleName);

  const initialValues = {
    ...copiedValues,
    materialSampleName: newMaterialSampleName
  };

  return initialValues;
}

function useMaterialSampleSchema() {
  const { getFieldLabel } = useFieldLabels();

  /** Front-end validation. */
  const materialSampleSchema = yup.object({
    associations: yup.array(
      yup.object({
        associatedSample: yup
          .string()
          .required()
          .label(getFieldLabel({ name: "associatedSample" }).fieldLabel),
        associationType: yup
          .string()
          .required()
          .label(getFieldLabel({ name: "associationType" }).fieldLabel)
      })
    )
  });

  return { materialSampleSchema };
}
