import { FormikProps } from "formik";
import { InputResource } from "kitsu";
import _ from "lodash";
import {
  BackButton,
  ButtonBar,
  DataEntryField,
  DinaForm,
  DinaFormContext,
  DinaFormSection,
  FieldSet,
  LoadingSpinner,
  SubmitButton
} from "common-ui";
import { Fragment, ReactNode, Ref, useContext } from "react";
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
  AssemblageSelectSection,
  OrganismsField,
  useCopyToNextSample,
  NotPubliclyReleasableSection
} from "../..";
import { DinaMessage } from "../../../intl/dina-ui-intl";
import {
  ASSOCIATIONS_COMPONENT_NAME,
  CollectingEvent,
  COLLECTING_EVENT_COMPONENT_NAME,
  FIELD_EXTENSIONS_COMPONENT_NAME,
  FormTemplate,
  IDENTIFIER_COMPONENT_NAME,
  MANAGED_ATTRIBUTES_COMPONENT_NAME,
  MaterialSample,
  MATERIAL_SAMPLE_ATTACHMENTS_COMPONENT_NAME,
  MATERIAL_SAMPLE_INFO_COMPONENT_NAME,
  ORGANISMS_COMPONENT_NAME,
  PREPARATIONS_COMPONENT_NAME,
  RESTRICTION_COMPONENT_NAME,
  SCHEDULED_ACTIONS_COMPONENT_NAME,
  STORAGE_COMPONENT_NAME,
  SHOW_PARENT_ATTRIBUTES_COMPONENT_NAME
} from "../../../types/collection-api";
import { AllowAttachmentsConfig } from "../../object-store";
import { AssociationsField } from "../AssociationsField";
import { CollectingEventBriefDetails } from "../collecting-event/CollectingEventBriefDetails";
import { TabbedResourceLinker } from "../TabbedResourceLinker";
import { MaterialSampleBreadCrumb } from "./MaterialSampleBreadCrumb";
import { MaterialSampleIdentifiersSection } from "./MaterialSampleIdentifiersSection";
import { MaterialSampleInfoSection } from "./MaterialSampleInfoSection";
import { PreparationField } from "./PreparationField";
import { ScheduledActionsField } from "./ScheduledActionsField";
import { SetDefaultSampleName } from "./SetDefaultSampleName";
import { useMaterialSampleSave } from "./useMaterialSample";
import { RestrictionField } from "./RestrictionField";
import { CollectionSelectSection } from "../CollectionSelectSection";
import { ShowParentAttributesField } from "./ShowParentAttributesField";
import { SaveAndCopyToNextSuccessAlert } from "../SaveAndCopyToNextSuccessAlert";

export interface VisibleManagedAttributesConfig {
  materialSample?: string[];
  collectingEvent?: string[];
  determination?: string[];
  preparations?: string[];
}

export interface MaterialSampleFormProps {
  materialSample?: InputResource<MaterialSample>;
  collectingEventInitialValues?: InputResource<CollectingEvent>;

  onSaved?: (id: string) => Promise<void>;

  /**
   * Data component navigation order to be used by the form.
   */
  navOrder?: string[] | null;

  /**
   * This should only be used when editing a form template. Returns the new order of the
   * navigation.
   */
  onChangeNavOrder?: (newOrder: string[] | null) => void;

  /** Optionally call the hook from the parent component. */
  materialSampleSaveHook?: ReturnType<typeof useMaterialSampleSave>;

  /** Template form values for template mode. */
  templateInitialValues?: Partial<MaterialSample> & {
    templateCheckboxes?: Record<string, boolean | undefined>;
  };

  formTemplate?: FormTemplate;

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

  /**
   * When this prop is enabled, formik initialValues can be reinitialized
   */
  enableReinitialize?: boolean;

  isBulkEditAllTab?: boolean;
}

export function MaterialSampleForm({
  materialSample,
  collectingEventInitialValues,
  navOrder,
  onChangeNavOrder,
  onSaved,
  materialSampleSaveHook,
  formTemplate,
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
  enableReinitialize,
  buttonBar = (
    <ButtonBar className="mb-3">
      <div className="col-md-6 col-sm-12 mt-2">
        <BackButton
          entityId={materialSample?.id}
          entityLink="/collection/material-sample"
        />
      </div>
      <div className="col-md-6 col-sm-12 d-flex">
        <SubmitButton className="ms-auto" />
      </div>
    </ButtonBar>
  ),
  isBulkEditAllTab
}: MaterialSampleFormProps) {
  const { isTemplate, readOnly } = useContext(DinaFormContext) ?? {};
  const {
    initialValues,
    nestedCollectingEventForm,
    dataComponentState,
    colEventId,
    setColEventId,
    onSubmit,
    loading
  } =
    materialSampleSaveHook ??
    useMaterialSampleSave({
      formTemplate,
      collectingEventAttachmentsConfig: attachmentsConfig?.collectingEvent,
      materialSample,
      collectingEventInitialValues,
      onSaved,
      isTemplate,
      reduceRendering,
      visibleManagedAttributeKeys
    });

  const copyFromNextSample = useCopyToNextSample();

  // CollectingEvent "id" being enabled in the template enabledFields means that the
  // Template links an existing Collecting Event:
  const templateAttachesCollectingEvent = Boolean(
    // enabledFields?.collectingEvent.includes("id")
    false
  );
  const attachmentsField = "attachment";
  const hideLinkerTab = isTemplate ? true : false;

  /**
   * A map where:
   * - The key is the form section ID.
   * - The value is the section's render function given the ID as a param.
   */
  const formSections: Record<string, (id: string) => ReactNode> = {
    [SHOW_PARENT_ATTRIBUTES_COMPONENT_NAME]: (id) =>
      !reduceRendering &&
      (isTemplate || readOnly) &&
      dataComponentState.enableShowParentAttributes && (
        <ShowParentAttributesField
          id={id}
          isTemplate={isTemplate}
          attrList={
            formTemplate?.components?.find(
              (comp) => comp.name === SHOW_PARENT_ATTRIBUTES_COMPONENT_NAME
            )?.sections?.[0].items?.[0].defaultValue
          }
          materialSample={materialSample}
        />
      ),
    [IDENTIFIER_COMPONENT_NAME]: (id) =>
      !reduceRendering && (
        <MaterialSampleIdentifiersSection
          id={id}
          disableSampleNameField={disableSampleNameField}
          hideUseSequence={hideUseSequence}
        />
      ),
    [MATERIAL_SAMPLE_INFO_COMPONENT_NAME]: (id) =>
      !reduceRendering && (
        <MaterialSampleInfoSection
          id={id}
          visibleManagedAttributeKeys={visibleManagedAttributeKeys}
        />
      ),
    [COLLECTING_EVENT_COMPONENT_NAME]: (id) =>
      dataComponentState.enableCollectingEvent && (
        <TabbedResourceLinker<CollectingEvent>
          fieldSetId={id}
          hideLinkerTab={hideLinkerTab}
          legend={<DinaMessage id="collectingEvent" />}
          briefDetails={(colEvent) => (
            <CollectingEventBriefDetails collectingEvent={colEvent} />
          )}
          linkerTabContent={
            reduceRendering ? null : (
              <CollectingEventLinker
                onCollectingEventSelect={(colEventToLink) => {
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
    [PREPARATIONS_COMPONENT_NAME]: (id) =>
      !reduceRendering &&
      dataComponentState.enablePreparations && (
        <PreparationField
          id={id}
          visibleManagedAttributeKeys={
            visibleManagedAttributeKeys?.preparations
          }
        />
      ),
    [ORGANISMS_COMPONENT_NAME]: (id) =>
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
    [ASSOCIATIONS_COMPONENT_NAME]: (id) =>
      !reduceRendering &&
      dataComponentState.enableAssociations && <AssociationsField id={id} />,
    [STORAGE_COMPONENT_NAME]: (id) =>
      !reduceRendering &&
      dataComponentState.enableStorage && (
        <FieldSet
          id={id}
          legend={<DinaMessage id="storage" />}
          fieldName="storageUnit"
          componentName={STORAGE_COMPONENT_NAME}
          sectionName="storage-selection-section"
        >
          <StorageLinkerField
            name="storageUnit"
            hideLabel={true}
            targetType="material-sample"
            createStorageMode={true}
          />
        </FieldSet>
      ),
    [RESTRICTION_COMPONENT_NAME]: (id) =>
      !reduceRendering &&
      dataComponentState.enableRestrictions && <RestrictionField id={id} />,
    [SCHEDULED_ACTIONS_COMPONENT_NAME]: (id) =>
      !reduceRendering &&
      dataComponentState.enableScheduledActions && (
        <ScheduledActionsField
          id={id}
          wrapContent={(content) => (
            <BulkEditTabWarning
              messageIdSingle="bulkEditResourceSetWarning_ScheduledActions_MaterialSample_Single"
              messageIdMultiple="bulkEditResourceSetWarning_ScheduledActions_MaterialSample_Multi"
              fieldName="scheduledActions"
            >
              {content}
            </BulkEditTabWarning>
          )}
        />
      ),
    [FIELD_EXTENSIONS_COMPONENT_NAME]: (id) =>
      !reduceRendering && (
        <DinaFormSection
          componentName={FIELD_EXTENSIONS_COMPONENT_NAME}
          sectionName="field-extension-section"
        >
          <DataEntryField
            legend={<DinaMessage id="materialSampleFieldExtensions" />}
            name="extensionValues"
            readOnly={readOnly}
            isTemplate={isTemplate}
            id={id}
            blockOptionsEndpoint={`collection-api/extension`}
            blockOptionsFilter={{
              "extension.fields.dinaComponent": "MATERIAL_SAMPLE"
            }}
            width={"100%"}
          />
        </DinaFormSection>
      ),
    [MANAGED_ATTRIBUTES_COMPONENT_NAME]: (id) =>
      !reduceRendering && (
        <DinaFormSection
          componentName={MANAGED_ATTRIBUTES_COMPONENT_NAME}
          sectionName="managed-attributes-section"
        >
          <div className="row">
            <div className="col-md-12">
              <ManagedAttributesEditor
                valuesPath="managedAttributes"
                managedAttributeApiPath="collection-api/managed-attribute"
                managedAttributeComponent="MATERIAL_SAMPLE"
                fieldSetProps={{
                  id,
                  legend: <DinaMessage id="materialSampleManagedAttributes" />
                }}
                managedAttributeOrderFieldName="managedAttributesOrder"
                visibleAttributeKeys={
                  visibleManagedAttributeKeys?.materialSample
                }
              />
            </div>
          </div>
        </DinaFormSection>
      ),
    [MATERIAL_SAMPLE_ATTACHMENTS_COMPONENT_NAME]: (id) =>
      !reduceRendering && (
        <DinaFormSection
          componentName={MATERIAL_SAMPLE_ATTACHMENTS_COMPONENT_NAME}
          sectionName="material-sample-attachments-sections"
        >
          <AttachmentsField
            name={attachmentsField}
            title={<DinaMessage id="materialSampleAttachments" />}
            id={id}
            allowNewFieldName="attachmentsConfig.allowNew"
            allowExistingFieldName="attachmentsConfig.allowExisting"
            allowAttachmentsConfig={attachmentsConfig?.materialSample}
            attachmentPath={`collection-api/material-sample/${materialSample?.id}/attachment`}
            wrapContent={(content) => (
              <BulkEditTabWarning
                messageIdSingle="bulkEditResourceLinkerWarning_Attachments_MaterialSample_Single"
                messageIdMultiple="bulkEditResourceLinkerWarning_Attachments_MaterialSample_Multi"
                fieldName={attachmentsField}
              >
                {content}
              </BulkEditTabWarning>
            )}
          />
        </DinaFormSection>
      )
  };

  const formSectionPairs = _.toPairs(formSections);

  const sortedFormSectionPairs = _.uniq([
    ..._.compact(
      (navOrder ?? []).map((id) => formSectionPairs.find(([it]) => it === id))
    ),
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
            navOrder={navOrder}
            onChangeNavOrder={onChangeNavOrder}
            isTemplate={isTemplate ?? false}
          />
        )}
      </div>
      <DinaFormSection
        componentName={IDENTIFIER_COMPONENT_NAME}
        sectionName="general-section"
      >
        <div className="flex-grow-1 container-fluid">
          {!reduceRendering && (
            <>
              {!isTemplate && materialSample?.materialSampleName && (
                <MaterialSampleBreadCrumb
                  disableLastLink={true}
                  materialSample={materialSample as any}
                  enableStoredDefaultGroup={enableStoredDefaultGroup}
                  enableGroupSelectField={true}
                />
              )}
              {!isTemplate && !materialSample?.materialSampleName && (
                <div className="row">
                  <div className="col-md-6">
                    <GroupSelectField
                      disableTemplateCheckbox={true}
                      name="group"
                      enableStoredDefaultGroup={enableStoredDefaultGroup}
                    />
                  </div>
                </div>
              )}
              <div className="row">
                <div className="col-md-8">
                  <CollectionSelectSection resourcePath="collection-api/collection" />
                  <ProjectSelectSection resourcePath="collection-api/project" />
                  <AssemblageSelectSection resourcePath="collection-api/assemblage" />
                  <NotPubliclyReleasableSection />
                  <TagsAndRestrictionsSection
                    resourcePath="collection-api/material-sample"
                    indexName="dina_material_sample_index"
                  />
                </div>
              </div>
            </>
          )}
          {/* The toggleable / re-arrangeable form sections: */}
          <div className="data-components">
            {sortedFormSectionPairs.map(([id, renderFn]) => (
              <Fragment key={id}>{renderFn(isOffScreen ? "" : id)}</Fragment>
            ))}
          </div>
        </div>
      </DinaFormSection>
    </div>
  );

  return isTemplate ? (
    formLayout
  ) : loading ? (
    <LoadingSpinner loading={true} />
  ) : (
    <DinaForm<InputResource<MaterialSample>>
      formTemplate={formTemplate}
      enableReinitialize={enableReinitialize}
      innerRef={materialSampleFormRef}
      initialValues={initialValues}
      onSubmit={onSubmit}
      isBulkEditAllTab={isBulkEditAllTab}
    >
      {!initialValues.id && !disableAutoNamePrefix && <SetDefaultSampleName />}
      {copyFromNextSample && (
        <>
          <SaveAndCopyToNextSuccessAlert
            id={copyFromNextSample.lastCreatedId ?? ""}
            displayName={
              !!copyFromNextSample.originalSample.materialSampleName?.length
                ? copyFromNextSample.originalSample.materialSampleName
                : copyFromNextSample.lastCreatedId ?? ""
            }
            entityPath={"collection/material-sample"}
            dataComponentState={dataComponentState}
          />
          <h1 id="wb-cont">
            <DinaMessage id={"addMaterialSampleTitle"} />
          </h1>
        </>
      )}
      {buttonBar}
      {formLayout}
    </DinaForm>
  );
}
