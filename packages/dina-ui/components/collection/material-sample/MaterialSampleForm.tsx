import { FormikProps } from "formik";
import { InputResource } from "kitsu";
import { compact, toPairs, uniq } from "lodash";
import {
  BackButton,
  ButtonBar,
  DinaForm,
  DinaFormContext,
  DinaFormSection,
  FieldSet,
  LoadingSpinner,
  SubmitButton
} from "common-ui";
import { Fragment, ReactNode, Ref, useContext, useState } from "react";
import {
  AttachmentsField,
  BulkEditTabWarning,
  CollectingEventLinker,
  GroupSelectField,
  ManagedAttributesEditor,
  MaterialSampleFormNav,
  ProjectSelectSection,
  StorageLinkerField,
  TagsAndRestrictionsSection,
  useCollectingEventQuery,
  AssemblageSelectSection
} from "../..";
import { DinaMessage } from "../../../intl/dina-ui-intl";
import {
  AcquisitionEventFormLayout,
  useAcquisitionEvent
} from "../../../pages/collection/acquisition-event/edit";
import {
  AcquisitionEvent,
  CollectingEvent,
  MaterialSample,
  MaterialSampleFormSectionId
} from "../../../types/collection-api";
import { AllowAttachmentsConfig } from "../../object-store";
import { AcquisitionEventLinker } from "../AcquisitionEventLinker";
import { AssociationsField } from "../AssociationsField";
import { CollectingEventBriefDetails } from "../collecting-event/CollectingEventBriefDetails";
import { TabbedResourceLinker } from "../TabbedResourceLinker";
import { MaterialSampleBreadCrumb } from "./MaterialSampleBreadCrumb";
import { MaterialSampleIdentifiersSection } from "./MaterialSampleIdentifiersSection";
import { MaterialSampleInfoSection } from "./MaterialSampleInfoSection";
import { OrganismsField } from "./OrganismsField";
import { PreparationField } from "./PreparationField";
import { ScheduledActionsField } from "./ScheduledActionsField";
import { SetDefaultSampleName } from "./SetDefaultSampleName";
import { useMaterialSampleSave } from "./useMaterialSample";
import { RestrictionField } from "./RestrictionField";

/**
 * The enabled fields if creating from a template.
 * Nested DinaForms (Collecting Event and Acquisition Event) have separate string arrays.
 */
export interface MatrialSampleFormEnabledFields {
  materialSample: string[];
  collectingEvent: string[];
  acquisitionEvent: string[];
}

export interface VisibleManagedAttributesConfig {
  materialSample?: string[];
  collectingEvent?: string[];
  determination?: string[];
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
  enabledFields?: MatrialSampleFormEnabledFields;

  attachmentsConfig?: {
    materialSample: AllowAttachmentsConfig;
    collectingEvent: AllowAttachmentsConfig;
  };

  buttonBar?: ReactNode;

  /** Disables prefixing the sample name with the Collection code. */
  disableAutoNamePrefix?: boolean;

  /** Makes the sample name field (Primary ID) read-only. */
  disableSampleNameField?: boolean;

  materialSampleFormRef?: Ref<FormikProps<InputResource<MaterialSample>>>;

  /** Disables the "Are You Sure" prompt in the nav when removing a data component. */
  disableNavRemovePrompt?: boolean;

  /**
   * Removes the html tag IDs from hidden tabs.
   * This needs to be done for off-screen forms in the bulk editor.
   */
  isOffScreen?: boolean;

  /** Reduces the rendering to improve performance when bulk editing many material samples. */
  reduceRendering?: boolean;

  /** Hide the use next identifer checkbox, e.g when create multiple new samples */
  hideUseSequence?: boolean;

  /** Sets a default group from local storage when the group is not already set. */
  enableStoredDefaultGroup?: boolean;

  /**
   * Toggle to disable the collecting even switch due to a parent containing the collecting event
   * information.
   */
  disableCollectingEventSwitch?: boolean;

  /**
   * When this prop is changed, the visible managed attributes state is updated in useEffect.
   * e.g. when the form's custom view is updated.
   */
  visibleManagedAttributeKeys?: VisibleManagedAttributesConfig;
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
  disableNavRemovePrompt,
  isOffScreen,
  reduceRendering,
  hideUseSequence,
  enableStoredDefaultGroup,
  visibleManagedAttributeKeys,
  disableCollectingEventSwitch,
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
      enabledFields,
      reduceRendering,
      visibleManagedAttributeKeys
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

  const navState = useState<MaterialSampleFormSectionId[] | null>(null);

  /**
   * A map where:
   * - The key is the form section ID.
   * - The value is the section's render function given the ID as a param.
   */
  const formSections: Record<
    MaterialSampleFormSectionId,
    (id: string) => ReactNode
  > = {
    "identifiers-section": id =>
      !reduceRendering && (
        <MaterialSampleIdentifiersSection
          id={id}
          disableSampleNameField={disableSampleNameField}
          hideUseSequence={hideUseSequence}
        />
      ),
    "material-sample-info-section": id =>
      !reduceRendering && <MaterialSampleInfoSection id={id} />,
    "collecting-event-section": id =>
      dataComponentState.enableCollectingEvent && (
        <TabbedResourceLinker<CollectingEvent>
          fieldSetId={id}
          legend={<DinaMessage id="collectingEvent" />}
          briefDetails={colEvent => (
            <CollectingEventBriefDetails collectingEvent={colEvent} />
          )}
          linkerTabContent={
            reduceRendering ? null : (
              <CollectingEventLinker
                onCollectingEventSelect={colEventToLink => {
                  setColEventId(colEventToLink.id);
                }}
              />
            )
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
      ),
    "acquisition-event-section": id =>
      dataComponentState.enableAcquisitionEvent && (
        <TabbedResourceLinker<AcquisitionEvent>
          fieldSetId={id}
          legend={<DinaMessage id="acquisitionEvent" />}
          briefDetails={acqEvent => (
            <DinaForm initialValues={acqEvent} readOnly={true}>
              <AcquisitionEventFormLayout />
            </DinaForm>
          )}
          linkerTabContent={
            reduceRendering ? null : (
              <AcquisitionEventLinker
                onAcquisitionEventSelect={acqEventToLink => {
                  setAcqEventId(acqEventToLink.id);
                }}
              />
            )
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
      ),
    "preparations-section": id =>
      !reduceRendering &&
      dataComponentState.enablePreparations && <PreparationField id={id} />,
    "organisms-section": id =>
      !reduceRendering &&
      dataComponentState.enableOrganisms && (
        <OrganismsField
          id={id}
          name="organism"
          visibleManagedAttributeKeys={
            visibleManagedAttributeKeys?.determination
          }
        />
      ),
    "associations-section": id =>
      !reduceRendering &&
      dataComponentState.enableAssociations && <AssociationsField id={id} />,
    "storage-section": id =>
      !reduceRendering &&
      dataComponentState.enableStorage && (
        <FieldSet
          id={id}
          legend={<DinaMessage id="storage" />}
          fieldName="storageUnit"
        >
          <StorageLinkerField
            name="storageUnit"
            hideLabel={true}
            targetType="material-sample"
          />
        </FieldSet>
      ),
    "restriction-section": id =>
      !reduceRendering &&
      dataComponentState.enableRestrictions && <RestrictionField id={id} />,
    "scheduled-actions-section": id =>
      !reduceRendering &&
      dataComponentState.enableScheduledActions && (
        <ScheduledActionsField
          id={id}
          wrapContent={content => (
            <BulkEditTabWarning
              targetType="material-sample"
              fieldName="scheduledActions"
            >
              {content}
            </BulkEditTabWarning>
          )}
        />
      ),
    "managedAttributes-section": id =>
      !reduceRendering && (
        <DinaFormSection
          // Disabled the template's restrictions for this section:
          enabledFields={null}
        >
          <div className="row">
            <div className="col-md-6">
              <ManagedAttributesEditor
                valuesPath="managedAttributes"
                managedAttributeApiPath="collection-api/managed-attribute"
                managedAttributeComponent="MATERIAL_SAMPLE"
                fieldSetProps={{
                  id,
                  legend: <DinaMessage id="materialSampleManagedAttributes" />
                }}
                // Custom view selection is supported for material samples,
                // but not in template editor mode:
                showFormTemplateDropdown={!isTemplate}
                managedAttributeOrderFieldName="managedAttributesOrder"
                visibleAttributeKeys={
                  visibleManagedAttributeKeys?.materialSample
                }
              />
            </div>
          </div>
        </DinaFormSection>
      ),
    "material-sample-attachments-section": id =>
      !reduceRendering && (
        <AttachmentsField
          name={attachmentsField}
          title={<DinaMessage id="materialSampleAttachments" />}
          id={id}
          allowNewFieldName="attachmentsConfig.allowNew"
          allowExistingFieldName="attachmentsConfig.allowExisting"
          allowAttachmentsConfig={attachmentsConfig?.materialSample}
          attachmentPath={`collection-api/material-sample/${materialSample?.id}/attachment`}
          wrapContent={content => (
            <BulkEditTabWarning
              targetType="material-sample"
              fieldName={attachmentsField}
            >
              {content}
            </BulkEditTabWarning>
          )}
        />
      )
  };

  const formSectionPairs = toPairs(formSections);

  const sortedFormSectionPairs = uniq([
    ...compact([].map(id => formSectionPairs.find(([it]) => it === id))),
    ...formSectionPairs
  ]);

  const formLayout = (
    <div className="d-md-flex">
      <div style={{ minWidth: "20rem", maxWidth: "20rem" }}>
        {(!isOffScreen || !reduceRendering) && (
          <MaterialSampleFormNav
            dataComponentState={dataComponentState}
            disableRemovePrompt={disableNavRemovePrompt}
            disableCollectingEventSwitch={
              disableCollectingEventSwitch ||
              initialValues.parentMaterialSample !== undefined
            }
          />
        )}
      </div>
      <div className="flex-grow-1 container-fluid">
        {!reduceRendering && (
          <>
            {!isTemplate && materialSample && (
              <MaterialSampleBreadCrumb
                disableLastLink={true}
                materialSample={materialSample as any}
              />
            )}
            {!isTemplate && (
              <div className="row">
                <div className="col-md-6">
                  <GroupSelectField
                    name="group"
                    enableStoredDefaultGroup={enableStoredDefaultGroup}
                  />
                </div>
              </div>
            )}
            <TagsAndRestrictionsSection resourcePath="collection-api/material-sample" />
            <ProjectSelectSection
              classNames="mt-3"
              resourcePath="collection-api/project"
            />
            <AssemblageSelectSection
              classNames="mt-2"
              resourcePath="collection-api/assemblage"
            />
          </>
        )}
        {/* The toggleable / re-arrangeable form sections: */}
        <div className="data-components">
          {sortedFormSectionPairs.map(([id, renderFn]) => (
            <Fragment key={id}>{renderFn(isOffScreen ? "" : id)}</Fragment>
          ))}
        </div>
      </div>
    </div>
  );

  return isTemplate ? (
    formLayout
  ) : loading ? (
    <LoadingSpinner loading={true} />
  ) : (
    <DinaForm<InputResource<MaterialSample>>
      innerRef={materialSampleFormRef}
      initialValues={initialValues}
      onSubmit={onSubmit}
      enabledFields={enabledFields?.materialSample}
    >
      {!initialValues.id && !disableAutoNamePrefix && <SetDefaultSampleName />}
      {buttonBar}
      {formLayout}
      {buttonBar}
    </DinaForm>
  );
}
