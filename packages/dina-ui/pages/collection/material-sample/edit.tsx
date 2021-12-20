import {
  AutoSuggestTextField,
  BackButton,
  ButtonBar,
  DateField,
  DinaForm,
  DinaFormContext,
  DinaFormSection,
  FieldSet,
  FieldSpy,
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
import { FormikProps } from "formik";
import { InputResource, PersistedResource } from "kitsu";
import { mapValues, padStart } from "lodash";
import { useRouter } from "next/router";
import { ReactNode, Ref, useContext, useRef, useState } from "react";
import * as yup from "yup";
import {
  AttachmentsField,
  BulkEditTabWarning,
  CollectionSelectField,
  Footer,
  GroupSelectField,
  Head,
  MaterialSampleBreadCrumb,
  MaterialSampleFormNav,
  MaterialSampleStateReadOnlyRender,
  Nav,
  ProjectSelectSection,
  StorageLinkerField,
  TagsAndRestrictionsSection
} from "../../../components";
import {
  CollectingEventLinker,
  DeterminationField,
  ScheduledActionsField,
  SetDefaultSampleName,
  TabbedResourceLinker,
  useCollectingEventQuery,
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
import {
  AcquisitionEventFormLayout,
  useAcquisitionEvent
} from "../acquisition-event/edit";

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

  /** Disables prefixing the sample name with the Collection code. */
  disableAutoNamePrefix?: boolean;

  /** Makes the sample name field (Primary ID) read-only. */
  disableSampleNameField?: boolean;

  omitGroupField?: boolean;

  materialSampleFormRef?: Ref<FormikProps<InputResource<MaterialSample>>>;

  /** Disables the "Are You Sure" prompt in the nav when removing a data component. */
  disableNavRemovePrompt?: boolean;

  /**
   * Removes the html tag IDs from hidden tabs.
   * This needs to be done for off-screen forms in the bulk editor.
   */
  isOffScreen?: boolean;
}

export function MaterialSampleForm({
  materialSample,
  collectingEventInitialValues,
  acquisitionEventInitialValues,
  onSaved,
  materialSampleSaveHook,
  enabledFields,
  attachmentsConfig,
  disableAutoNamePrefix,
  materialSampleFormRef,
  disableSampleNameField,
  omitGroupField,
  disableNavRemovePrompt,
  isOffScreen,
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

  const attachmentsField = "attachment";

  /** Set IDs to blank when this component is off-screen. */
  const navIds = mapValues(
    {
      identifiers: "identifiers-section",
      colEvent: "collecting-event-section",
      acqEvent: "acquisition-event-section",
      preparation: "preparations-section",
      organism: "organism-state-section",
      determination: "determination-section",
      associations: "associations-section",
      storage: "storage-section",
      ScheduledActions: "scheduled-actions-section",
      managedAttributes: "managedAttributes-section",
      attachments: "material-sample-attachments-section"
    },
    id => (isOffScreen ? "" : id)
  );

  const mateirialSampleInternal = (
    <div className="d-md-flex">
      <div style={{ minWidth: "20rem" }}>
        {!isOffScreen && (
          <MaterialSampleFormNav
            dataComponentState={dataComponentState}
            disableRemovePrompt={disableNavRemovePrompt}
          />
        )}
      </div>
      <div className="flex-grow-1 container-fluid">
        {!isTemplate && materialSample && (
          <MaterialSampleBreadCrumb
            disableLastLink={true}
            materialSample={materialSample as any}
          />
        )}
        {!isTemplate && !omitGroupField && (
          <div className="row">
            <div className="col-md-6">
              <GroupSelectField name="group" enableStoredDefaultGroup={true} />
            </div>
          </div>
        )}
        <TagsAndRestrictionsSection resourcePath="collection-api/material-sample" />
        <ProjectSelectSection resourcePath="collection-api/project" />
        <MaterialSampleIdentifiersFormLayout
          id={navIds.identifiers}
          disableSampleNameField={disableSampleNameField}
        />
        <MaterialSampleFormLayout />
        <div className="data-components">
          {dataComponentState.enableCollectingEvent && (
            <TabbedResourceLinker<CollectingEvent>
              id={navIds.colEvent}
              legend={<DinaMessage id="collectingEvent" />}
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
              useResourceQuery={useCollectingEventQuery}
              setResourceId={setColEventId}
              disableLinkerTab={templateAttachesCollectingEvent}
              readOnlyLink="/collection/collecting-event/view?id="
              resourceId={colEventId}
              fieldName="collectingEvent"
              targetType="materialSample"
            />
          )}
          {dataComponentState.enableAcquisitionEvent && (
            <TabbedResourceLinker<AcquisitionEvent>
              id={navIds.acqEvent}
              legend={<DinaMessage id="acquisitionEvent" />}
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
              useResourceQuery={useAcquisitionEvent}
              setResourceId={setAcqEventId}
              disableLinkerTab={templateAttachesAcquisitionEvent}
              readOnlyLink="/collection/acquisition-event/view?id="
              resourceId={acqEventId}
              fieldName="acquisitionEvent"
              targetType="materialSample"
            />
          )}
          {dataComponentState.enablePreparations && (
            <PreparationField
              id={navIds.preparation}
              // Use the same attachments config for preparations as the Material Sample:
              attachmentsConfig={attachmentsConfig?.materialSample}
            />
          )}
          {dataComponentState.enableOrganism && (
            <OrganismStateField id={navIds.organism} />
          )}
          {dataComponentState.enableDetermination && (
            <DeterminationField id={navIds.determination} />
          )}
          {dataComponentState.enableAssociations && (
            <AssociationsField id={navIds.associations} />
          )}
          {dataComponentState.enableStorage && (
            <FieldSet id={navIds.storage} legend={<DinaMessage id="storage" />}>
              <div className="card card-body mb-3">
                <StorageLinkerField name="storageUnit" />
              </div>
            </FieldSet>
          )}
          {dataComponentState.enableScheduledActions && (
            <ScheduledActionsField
              id={navIds.ScheduledActions}
              wrapContent={content => (
                <BulkEditTabWarning fieldName="scheduledActions">
                  {content}
                </BulkEditTabWarning>
              )}
            />
          )}
          {!isTemplate && (
            <FieldSet
              legend={<DinaMessage id="managedAttributeListTitle" />}
              id={navIds.managedAttributes}
            >
              <DinaFormSection
                // Disabled the template's restrictions for this section:
                enabledFields={null}
              >
                <ManagedAttributesEditor
                  valuesPath="managedAttributes"
                  managedAttributeApiPath="collection-api/managed-attribute"
                  apiBaseUrl="/collection-api"
                  managedAttributeComponent="MATERIAL_SAMPLE"
                  managedAttributeKeyField="key"
                />
              </DinaFormSection>
            </FieldSet>
          )}
          <AttachmentsField
            name={attachmentsField}
            title={<DinaMessage id="materialSampleAttachments" />}
            id={navIds.attachments}
            allowNewFieldName="attachmentsConfig.allowNew"
            allowExistingFieldName="attachmentsConfig.allowExisting"
            allowAttachmentsConfig={attachmentsConfig?.materialSample}
            attachmentPath={`collection-api/material-sample/${materialSample?.id}/attachment`}
            wrapContent={content => (
              <BulkEditTabWarning fieldName={attachmentsField}>
                {content}
              </BulkEditTabWarning>
            )}
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
      innerRef={materialSampleFormRef}
      initialValues={initialValues}
      onSubmit={onSubmit}
      enabledFields={enabledFields?.materialSample}
      validationSchema={
        dataComponentState.enableAssociations ? materialSampleSchema : null
      }
    >
      {!initialValues.id && !disableAutoNamePrefix && <SetDefaultSampleName />}
      {buttonBar}
      {mateirialSampleInternal}
      {buttonBar}
    </DinaForm>
  );
}

export function MaterialSampleFormLayout({ id = "material-sample-section" }) {
  const { locale, formatMessage } = useDinaIntl();

  const { readOnly } = useDinaFormContext();

  const onMaterialSampleStateChanged = (form, _name, value) => {
    if (value === "") {
      form.setFieldValue("stateChangeRemarks", null);
      form.setFieldValue("stateChangedOn", null);
    }
  };

  return (
    <FieldSet id={id} legend={<DinaMessage id="materialSample" />}>
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
        <FieldSpy fieldName="materialSampleState">
          {materialSampleState =>
            materialSampleState ? (
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
            ) : null
          }
        </FieldSpy>
      )}
    </FieldSet>
  );
}
export interface MaterialSampleIdentifiersFormLayoutProps {
  disableSampleNameField?: boolean;
  hideOtherCatalogNumbers?: boolean;
  className?: string;
  namePrefix?: string;
  sampleNamePlaceHolder?: string;
  id?: string;
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
  disableSampleNameField,
  className,
  namePrefix = "",
  sampleNamePlaceHolder,
  id = "identifiers-section"
}: MaterialSampleIdentifiersFormLayoutProps) {
  return (
    <FieldSet
      id={id}
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
            readOnly={disableSampleNameField}
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
              <TextField name="endEventDateTime" />
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
          .nullable()
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
