import {
  BackButton,
  ButtonBar,
  DateField,
  DinaForm,
  DinaFormContext,
  DinaFormSection,
  FieldSet,
  filterBy,
  FormikButton,
  ResourceSelectField,
  StringArrayField,
  SubmitButton,
  TextField,
  withResponse
} from "common-ui";
import { FormikProps, Field } from "formik";
import { InputResource } from "kitsu";
import Link from "next/link";
import { useRouter } from "next/router";
import { useContext, ReactNode } from "react";
import Switch from "react-switch";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import { GroupSelectField, Head, Nav } from "../../../components";
import { CollectingEventLinker } from "../../../components/collection";
import {
  useMaterialSampleQuery,
  useMaterialSampleSave
} from "../../../components/collection/useMaterialSample";
import { AllowAttachmentsConfig } from "../../../components/object-store";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { Person } from "../../../types/agent-api";
import {
  CollectingEvent,
  MaterialSample,
  MaterialSampleType
} from "../../../types/collection-api";
import { PreparationType } from "../../../types/collection-api/resources/PreparationType";

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
      <div className="container-fluid">
        <h1>
          <DinaMessage id={title} />
        </h1>
        {id ? (
          withResponse(materialSampleQuery, ({ data }) => (
            <MaterialSampleForm
              materialSample={data}
              onSaved={moveToViewPage}
            />
          ))
        ) : (
          <MaterialSampleForm onSaved={moveToViewPage} />
        )}
      </div>
    </div>
  );
}

export interface MaterialSampleFormProps {
  materialSample?: InputResource<MaterialSample>;
  collectingEventInitialValues?: InputResource<CollectingEvent>;

  onSaved?: (id: string) => Promise<void>;
  preparationsSectionRef?: React.RefObject<FormikProps<any>>;
  identifiersSectionRef?: React.RefObject<FormikProps<any>>;

  /** Optionally call the hook from the parent component. */
  materialSampleSaveHook?: ReturnType<typeof useMaterialSampleSave>;

  /** Template form values for template mode. */
  preparationsTemplateInitialValues?: Partial<MaterialSample> & {
    templateCheckboxes?: Record<string, boolean | undefined>;
  };
  identifiersTemplateInitialValues?: Partial<MaterialSample> & {
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
  preparationsSectionRef,
  identifiersSectionRef,
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
  ),
  preparationsTemplateInitialValues,
  identifiersTemplateInitialValues
}: MaterialSampleFormProps) {
  const { formatMessage } = useDinaIntl();
  const { isTemplate } = useContext(DinaFormContext) ?? {};

  const {
    initialValues,
    nestedCollectingEventForm,
    dataComponentToggler,
    enablePreparations,
    setEnablePreparations,
    enableCollectingEvent,
    setEnableCollectingEvent,
    colEventId,
    setColEventId,
    colEventQuery,
    onSubmit,
    materialSampleAttachmentsUI
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

  const mateirialSampleInternal = (
    <div className="d-flex">
      <div>
        <nav
          className="card card-body sticky-top d-none d-md-block"
          style={{ width: "20rem" }}
        >
          <h4>
            <DinaMessage id="formNavigation" />
          </h4>
          <div className="list-group">
            {!isTemplate && (
              <a href="#material-sample-section" className="list-group-item">
                <DinaMessage id="materialSample" />
              </a>
            )}
            {!isTemplate && (
              <a href="#identifiers-section" className="list-group-item">
                <DinaMessage id="identifiers" />
              </a>
            )}
            {enableCollectingEvent && (
              <a href="#collecting-event-section" className="list-group-item">
                <DinaMessage id="collectingEvent" />
              </a>
            )}
            {enablePreparations && (
              <a href="#preparations-section" className="list-group-item">
                <DinaMessage id="preparations" />
              </a>
            )}
            <a
              href="#material-sample-attachments-section"
              className="list-group-item"
            >
              <DinaMessage id="materialSampleAttachments" />
            </a>
          </div>
        </nav>
      </div>
      <div className="flex-grow-1 container-fluid">
        {!isTemplate && <MaterialSampleMainInfoFormLayout />}
        {isTemplate ? (
          <DinaForm
            initialValues={identifiersTemplateInitialValues}
            innerRef={identifiersSectionRef}
            isTemplate={true}
          >
            <MaterialSampleIdentifiersFormLayout />
          </DinaForm>
        ) : (
          <MaterialSampleIdentifiersFormLayout />
        )}
        <FieldSet legend={<DinaMessage id="components" />}>
          <div className="row">
            <label className="enable-collecting-event d-flex align-items-center fw-bold col-sm-3">
              <Switch
                className="mx-2"
                checked={enableCollectingEvent}
                onChange={dataComponentToggler(
                  setEnableCollectingEvent,
                  formatMessage("collectingEvent")
                )}
              />
              <DinaMessage id="collectingEvent" />
            </label>
            <label className="enable-catalogue-info d-flex align-items-center fw-bold col-sm-3">
              <Switch
                className="mx-2"
                checked={enablePreparations}
                onChange={dataComponentToggler(
                  setEnablePreparations,
                  formatMessage("preparations")
                )}
              />
              <DinaMessage id="preparations" />
            </label>
          </div>
        </FieldSet>
        <div className="data-components">
          <FieldSet
            id="collecting-event-section"
            className={enableCollectingEvent ? "" : "d-none"}
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
                <Tab>
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
                              <FormikButton
                                className="btn btn-danger detach-collecting-event-button ms-5"
                                onClick={() => setColEventId(null)}
                              >
                                <DinaMessage id="detachCollectingEvent" />
                              </FormikButton>
                            </div>
                            {
                              // In template mode, only show a link to the linked Collecting Event:
                              isTemplate ? (
                                <div className="attached-collecting-event-link">
                                  <DinaMessage id="attachedCollectingEvent" />:{" "}
                                  <Link
                                    href={`/collection/collecting-event/view?id=${colEventId}`}
                                  >
                                    <a target="_blank">{linkedColEvent.id}</a>
                                  </Link>
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
          {isTemplate ? (
            <DinaForm
              initialValues={preparationsTemplateInitialValues}
              innerRef={preparationsSectionRef}
              isTemplate={true}
            >
              <PreparationsFormLayout
                className={enablePreparations ? "" : "d-none"}
              />
              {materialSampleAttachmentsUI}
            </DinaForm>
          ) : (
            <>
              <PreparationsFormLayout
                className={enablePreparations ? "" : "d-none"}
              />
              {materialSampleAttachmentsUI}
            </>
          )}
        </div>
      </div>
    </div>
  );

  return !isTemplate ? (
    <DinaForm<InputResource<MaterialSample>>
      initialValues={initialValues}
      onSubmit={onSubmit}
      enabledFields={enabledFields?.materialSample}
    >
      {buttonBar}
      {mateirialSampleInternal}
      {buttonBar}
    </DinaForm>
  ) : (
    mateirialSampleInternal
  );
}
export function MaterialSampleMainInfoFormLayout() {
  return (
    <div id="material-sample-section">
      <div className="row">
        <div className="col-md-6">
          <GroupSelectField name="group" enableStoredDefaultGroup={true} />
          <ResourceSelectField<MaterialSampleType>
            name="materialSampleType"
            filter={filterBy(["name"])}
            model="collection-api/material-sample-type"
            optionLabel={it => it.name}
            readOnlyLink="/collection/material-sample-type/view?id="
          />
        </div>
      </div>
    </div>
  );
}

export interface MaterialSampleIdentifiersFormLayoutProps {
  hideSampleName?: boolean;
  hideOtherCatalogNumbers?: boolean;
  className?: string;
  namePrefix?: string;
  sampleNamePlaceHolder?: string;
}

/** Fields layout re-useable between view and edit pages. */
export function MaterialSampleIdentifiersFormLayout({
  className,
  namePrefix,
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
          <TextField
            name={`${
              namePrefix
                ? namePrefix + "materialSampleName"
                : "materialSampleName"
            }`}
            customName="materialSampleName"
            className="materialSampleName"
            placeholder={sampleNamePlaceHolder}
          />

          <TextField
            name={`${
              namePrefix ? namePrefix + "dwcCatalogNumber" : "dwcCatalogNumber"
            }`}
            customName="dwcCatalogNumber"
            className="dwcCatalogNumber"
          />
        </div>
        <div className="col-md-6">
          <StringArrayField
            name={`${
              namePrefix
                ? namePrefix + "dwcOtherCatalogNumbers"
                : "dwcOtherCatalogNumbers"
            }`}
            customName="dwcOtherCatalogNumbers"
          />
        </div>
      </div>
    </FieldSet>
  );
}

export interface CatalogueInfoFormLayoutProps {
  className?: string;
  namePrefix?: string;
}

export function PreparationsFormLayout({
  className,
  namePrefix
}: CatalogueInfoFormLayoutProps) {
  return (
    <FieldSet
      className={className}
      id="preparations-section"
      legend={<DinaMessage id="preparations" />}
    >
      <div className="row">
        <div className="col-md-6">
          <div className="preparation-type">
            <Field
              name={`${
                namePrefix ? namePrefix + "preparationType" : "preparationType"
              }`}
            >
              {({ form: { values } }) => (
                <ResourceSelectField<PreparationType>
                  model="collection-api/preparation-type"
                  optionLabel={it => it.name}
                  readOnlyLink="/collection/preparation-type/view?id="
                  filter={input => ({
                    ...filterBy(["name"])(input),
                    group: { EQ: `${values.group}` }
                  })}
                  name={`${
                    namePrefix
                      ? namePrefix + "preparationType"
                      : "preparationType"
                  }`}
                  key={values.group}
                  customName="preparationType"
                />
              )}
            </Field>
          </div>
          <DinaFormSection>
            <ResourceSelectField<Person>
              name="preparedBy"
              filter={filterBy(["displayName"])}
              model="agent-api/person"
              optionLabel={person => person.displayName}
            />
            <DateField name="preparationDate" />
          </DinaFormSection>
        </div>
      </div>
    </FieldSet>
  );
}
