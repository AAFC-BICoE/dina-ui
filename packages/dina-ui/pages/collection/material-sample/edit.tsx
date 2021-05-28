import {
  AreYouSureModal,
  BackButton,
  ButtonBar,
  DateField,
  DinaForm,
  DinaFormSection,
  DinaFormSubmitParams,
  FieldSet,
  filterBy,
  FormikButton,
  ResourceSelectField,
  StringArrayField,
  SubmitButton,
  TextField,
  useAccount,
  useApiClient,
  useModal,
  useQuery,
  withResponse
} from "common-ui";
import { FormikProps } from "formik";
import { InputResource, PersistedResource } from "kitsu";
import { cloneDeep, isEmpty } from "lodash";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  Dispatch,
  SetStateAction,
  useLayoutEffect,
  useRef,
  useState
} from "react";
import Switch from "react-switch";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import { GroupSelectField, Head, Nav } from "../../../components";
import {
  CollectingEventFormLayout,
  CollectingEventLinker,
  useCollectingEventQuery,
  useCollectingEventSave
} from "../../../components/collection";
import { useAttachmentsModal } from "../../../components/object-store";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { MaterialSample } from "../../../types/collection-api";
import { PreparationType } from "../../../types/collection-api/resources/PreparationType";
import { Metadata } from "../../../types/objectstore-api";

export default function MaterialSampleEditPage() {
  const router = useRouter();
  const {
    query: { id }
  } = router;
  const { formatMessage } = useDinaIntl();
  const { bulkGet } = useApiClient();

  const materialSampleQuery = useQuery<MaterialSample>(
    {
      path: `collection-api/material-sample/${id}`,
      include: "collectingEvent,attachment,preparationType"
    },
    {
      disabled: !id,
      onSuccess: async ({ data }) => {
        if (data.attachment) {
          try {
            const metadatas = await bulkGet<Metadata>(
              data.attachment.map(collector => `/metadata/${collector.id}`),
              {
                apiBaseUrl: "/objectstore-api",
                returnNullForMissingResource: true
              }
            );
            // Omit null (deleted) records:
            data.attachment = metadatas.filter(it => it);
          } catch (error) {
            console.warn("Attachment join failed: ", error);
          }
        }
      }
    }
  );

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
  materialSample?: PersistedResource<MaterialSample>;
  onSaved?: (id: string) => Promise<void>;
  isTemplate?: boolean;
  materialSampleRef?: React.Ref<FormikProps<any>>;
}

export function MaterialSampleForm({
  materialSample,
  onSaved,
  isTemplate,
  materialSampleRef
}: MaterialSampleFormProps) {
  const { username } = useAccount();
  const { openModal } = useModal();
  const { formatMessage } = useDinaIntl();

  const [enableCollectingEvent, setEnableCollectingEvent] = useState(
    !!materialSample?.collectingEvent
  );

  const hasPreparations = !!materialSample?.preparationType;
  const [enablePreparations, setEnablePreparations] = useState(hasPreparations);

  /** YYYY-MM-DD format. */
  const todayDate = new Date().toISOString().slice(0, 10);

  const initialValues: InputResource<MaterialSample> = materialSample
    ? { ...materialSample }
    : {
        type: "material-sample",
        materialSampleName: `${username}-${todayDate}`
        // managedAttributeValues: {}
      };

  /** Used to get the values of the nested CollectingEvent form. */
  const colEventFormRef = useRef<FormikProps<any>>(null);

  const [colEventId, setColEventId] = useState<string | null | undefined>(
    materialSample?.collectingEvent?.id
  );
  const colEventQuery = useCollectingEventQuery(colEventId);

  const {
    collectingEventInitialValues,
    saveCollectingEvent,
    attachedMetadatasUI: colEventAttachmentsUI,
    collectingEventFormSchema
  } = useCollectingEventSave(colEventQuery.response?.data, isTemplate);

  const {
    attachedMetadatasUI: materialSampleAttachmentsUI,
    selectedMetadatas
  } = useAttachmentsModal({
    initialMetadatas:
      materialSample?.attachment as PersistedResource<Metadata>[],
    deps: [materialSample?.id],
    title: <DinaMessage id="materialSampleAttachments" />,
    isTemplate,
    allowNewFieldName: "materialSampleAllowNew",
    allowExistingFieldName: "materialSampleAllowExisting",
    id: "material-sample-attachments-section"
  });

  // Add zebra-striping effect to the form sections. Every second top-level fieldset should have a grey background.
  useLayoutEffect(() => {
    const dataComponents = document?.querySelectorAll<HTMLDivElement>(
      ".data-components > fieldset:not(.d-none)"
    );
    dataComponents?.forEach((element, index) => {
      element.style.backgroundColor = index % 2 === 0 ? "#f3f3f3" : "";
    });
  });

  /** Wraps the useState setter with an AreYouSure modal when setting to false. */
  function dataComponentToggler(
    setBoolean: Dispatch<SetStateAction<boolean>>,
    componentName: string
  ) {
    return function toggleDataComponent(enabled: boolean) {
      if (!enabled) {
        // When removing data, ask the user for confirmation first:
        openModal(
          <AreYouSureModal
            actionMessage={
              <DinaMessage
                id="removeComponentData"
                values={{ component: componentName }}
              />
            }
            onYesButtonClicked={() => setBoolean(enabled)}
          />
        );
      } else {
        setBoolean(enabled);
      }
    };
  }

  async function onSubmit({
    api: { save },
    formik,
    submittedValues
  }: DinaFormSubmitParams<InputResource<MaterialSample>>) {
    // Init relationships object for one-to-many relations:
    (submittedValues as any).relationships = {};

    /** Input to submit to the back-end API. */
    const { ...materialSampleInput } = submittedValues;

    if (
      !materialSampleInput.materialSampleName?.trim() &&
      !materialSampleInput.dwcCatalogNumber?.trim()
    ) {
      throw new Error(formatMessage("materialSampleIdOrCatalogNumberRequired"));
    }

    // Only persist the preparation type if the preparations toggle is enabled:
    if (!enablePreparations) {
      materialSampleInput.preparationType = {
        id: null,
        type: "preparation-type"
      };
    }

    if (!enableCollectingEvent) {
      // Unlink the CollectingEvent if its switch is unchecked:
      materialSampleInput.collectingEvent = {
        id: null,
        type: "collecting-event"
      };
    } else if (colEventFormRef.current) {
      // Return if the Collecting Event sub-form has errors:
      const colEventErrors = await colEventFormRef.current.validateForm();
      if (!isEmpty(colEventErrors)) {
        formik.setErrors({ ...formik.errors, ...colEventErrors });
        return;
      }

      // Save the linked CollectingEvent if included:
      const submittedCollectingEvent = cloneDeep(
        colEventFormRef.current.values
      );
      // Use the same save method as the Collecting Event page:
      const savedCollectingEvent = await saveCollectingEvent(
        submittedCollectingEvent,
        colEventFormRef.current
      );

      // Set the ColEventId here in case the next operation fails:
      setColEventId(savedCollectingEvent.id);

      // Link the MaterialSample to the CollectingEvent:
      materialSampleInput.collectingEvent = {
        id: savedCollectingEvent.id,
        type: savedCollectingEvent.type
      };
    }

    // Add attachments if they were selected:
    if (selectedMetadatas.length) {
      (materialSampleInput as any).relationships.attachment = {
        data: selectedMetadatas.map(it => ({ id: it.id, type: it.type }))
      };
    }
    // Delete the 'attachment' attribute because it should stay in the relationships field:
    delete materialSampleInput.attachment;

    // Save the MaterialSample:
    const [savedMaterialSample] = await save(
      [
        {
          resource: materialSampleInput,
          type: "material-sample"
        }
      ],
      { apiBaseUrl: "/collection-api" }
    );

    await onSaved?.(savedMaterialSample.id);
  }

  const buttonBar = (
    <ButtonBar>
      <BackButton
        entityId={materialSample?.id}
        entityLink="/collection/material-sample"
      />
      <SubmitButton className="ms-auto" />
    </ButtonBar>
  );

  /** Re-use the CollectingEvent form layout from the Collecting Event edit page. */
  // Unwrap the DinaForm for template saving purpose
  const nestedCollectingEventForm = !isTemplate ? (
    <DinaForm
      innerRef={colEventFormRef}
      initialValues={collectingEventInitialValues}
      validationSchema={collectingEventFormSchema}
    >
      <CollectingEventFormLayout />
      <div className="mb-3">{colEventAttachmentsUI}</div>
    </DinaForm>
  ) : (
    <>
      <CollectingEventFormLayout />
      <div className="mb-3">{colEventAttachmentsUI}</div>
    </>
  );
  return (
    <DinaForm<InputResource<MaterialSample>>
      initialValues={initialValues}
      onSubmit={onSubmit}
      isTemplate={isTemplate}
      innerRef={materialSampleRef}
    >
      {!isTemplate && buttonBar}
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
          {!isTemplate && <MaterialSampleIdentifiersFormLayout />}
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
                  {!isTemplate && (
                    <Tab>
                      <DinaMessage id="attachExisting" />
                    </Tab>
                  )}
                </TabList>
                <TabPanel>
                  {
                    // If there is already a linked CollectingEvent then wait for it to load first:
                    colEventId
                      ? withResponse(colEventQuery, () => (
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
                            {nestedCollectingEventForm}
                          </>
                        ))
                      : nestedCollectingEventForm
                  }
                </TabPanel>
                {!isTemplate && (
                  <TabPanel>
                    <CollectingEventLinker
                      onCollectingEventSelect={colEventToLink => {
                        setColEventId(colEventToLink.id);
                      }}
                    />
                  </TabPanel>
                )}
              </Tabs>
            </FieldSet>
            <PreparationsFormLayout
              className={enablePreparations ? "" : "d-none"}
              isTemplate={isTemplate}
            />
            {materialSampleAttachmentsUI}
          </div>
        </div>
      </div>
      {!isTemplate && buttonBar}
    </DinaForm>
  );
}

export function MaterialSampleMainInfoFormLayout() {
  return (
    <div id="material-sample-section">
      <div className="row">
        <div className="col-md-6">
          <GroupSelectField name="group" enableStoredDefaultGroup={true} />
        </div>
      </div>
    </div>
  );
}

/** Fields layout re-useable between view and edit pages. */
export function MaterialSampleIdentifiersFormLayout() {
  return (
    <FieldSet
      id="identifiers-section"
      legend={<DinaMessage id="identifiers" />}
    >
      <div className="row">
        <div className="col-md-6">
          <TextField name="materialSampleName" />
          <TextField name="dwcCatalogNumber" />
        </div>
        <div className="col-md-6">
          <StringArrayField name="otherIds" readOnly={true} />
        </div>
      </div>
    </FieldSet>
  );
}

export interface CatalogueInfoFormLayoutProps {
  className?: string;
  isTemplate?: boolean;
}

export function PreparationsFormLayout({
  className,
  isTemplate
}: CatalogueInfoFormLayoutProps) {
  return (
    <FieldSet
      className={className}
      id="preparations-section"
      legend={<DinaMessage id="preparations" />}
      isTemplate={isTemplate}
    >
      <div className="row">
        <div className="col-md-6">
          <ResourceSelectField<PreparationType>
            name="preparationType"
            filter={filterBy(["name"])}
            model="collection-api/preparation-type"
            optionLabel={it => it.name}
            readOnlyLink="/collection/preparation-type/view?id="
          />
          <DinaFormSection
            readOnly={true} // Disabled until back-end supports these fields.
          >
            <TextField name="preparedBy" />
            <DateField name="datePrepared" />
          </DinaFormSection>
        </div>
      </div>
    </FieldSet>
  );
}
