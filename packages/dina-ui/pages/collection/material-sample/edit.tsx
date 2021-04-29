import {
  BackButton,
  ButtonBar,
  DateField,
  DinaForm,
  DinaFormSubmitParams,
  FieldSet,
  FormikButton,
  SubmitButton,
  TextField,
  useAccount,
  useApiClient,
  useDinaFormContext,
  useQuery,
  withResponse
} from "common-ui";
import { FormikProps } from "formik";
import { InputResource, PersistedResource } from "kitsu";
import { cloneDeep } from "lodash";
import Link from "next/link";
import { useRouter } from "next/router";
import { useRef, useState } from "react";
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
      include: "collectingEvent,attachment"
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
}

export function MaterialSampleForm({
  materialSample,
  onSaved
}: MaterialSampleFormProps) {
  const { username } = useAccount();

  const [enableCollectingEvent, setEnableCollectingEvent] = useState(
    !!materialSample?.collectingEvent
  );
  const [enableCatalogueInfo, setEnableCatalogueInfo] = useState(false);

  /** YYYY-MM-DD format. */
  const todayDate = new Date().toISOString().slice(0, 10);

  const initialValues: InputResource<MaterialSample> = materialSample
    ? { ...materialSample }
    : {
        type: "material-sample",
        name: `${username}-${todayDate}`
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
    attachedMetadatasUI: colEventAttachmentsUI
  } = useCollectingEventSave(colEventQuery.response?.data);

  const {
    attachedMetadatasUI: materialSampleAttachmentsUI,
    selectedMetadatas
  } = useAttachmentsModal({
    initialMetadatas: materialSample?.attachment as PersistedResource<Metadata>[],
    deps: [materialSample?.id],
    title: <DinaMessage id="materialSampleAttachments" />
  });

  async function onSubmit({
    api: { save },
    submittedValues
  }: DinaFormSubmitParams<InputResource<MaterialSample>>) {
    // Init relationships object for one-to-many relations:
    (submittedValues as any).relationships = {};

    /** Input to submit to the back-end API. */
    const { ...materialSampleInput } = submittedValues;

    if (!enableCollectingEvent) {
      // Unlink the CollectingEvent if its switch is unchecked:
      materialSampleInput.collectingEvent = {
        id: null,
        type: "collecting-event"
      };
    } else if (colEventFormRef.current) {
      // Save the linked CollectingEvent if included:
      const submittedCollectingEvent = cloneDeep(
        colEventFormRef.current?.values
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

    // TODO enable this when the back-end supports it:
    delete materialSampleInput.name;

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
      <SubmitButton className="ml-auto" />
    </ButtonBar>
  );

  /** Re-use the CollectingEvent form layout from the Collecting Event edit page. */
  const nestedCollectingEventForm = (
    <DinaForm
      innerRef={colEventFormRef}
      initialValues={collectingEventInitialValues}
    >
      <CollectingEventFormLayout />
      <div className="form-group">{colEventAttachmentsUI}</div>
    </DinaForm>
  );

  return (
    <DinaForm<InputResource<MaterialSample>>
      initialValues={initialValues}
      onSubmit={onSubmit}
    >
      {buttonBar}
      <MaterialSampleFormLayout />
      <FieldSet legend={<DinaMessage id="components" />}>
        <div className="row">
          <label className="d-flex align-items-center col-sm-3">
            <strong>
              <DinaMessage id="collectingEvent" />
            </strong>
            <div className="mx-2">
              <Switch
                checked={enableCollectingEvent}
                onChange={setEnableCollectingEvent}
              />
            </div>
          </label>
          <label className="d-flex align-items-center col-sm-3">
            <strong>
              <DinaMessage id="catalogueInfo" />
            </strong>
            <div className="mx-2">
              <Switch
                checked={enableCatalogueInfo}
                onChange={setEnableCatalogueInfo}
              />
            </div>
          </label>
        </div>
      </FieldSet>
      <div className={enableCollectingEvent ? "" : "d-none"}>
        <FieldSet legend={<DinaMessage id="collectingEvent" />}>
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
                  ? withResponse(colEventQuery, () => (
                      <>
                        <div className="form-group d-flex justify-content-end align-items-center">
                          <Link
                            href={`/collection/collecting-event/view?id=${colEventId}`}
                          >
                            <a target="_blank">
                              <DinaMessage id="collectingEventDetailsPageLink" />
                            </a>
                          </Link>
                          <FormikButton
                            className="btn btn-danger detach-collecting-event-button ml-5"
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
            <TabPanel>
              <CollectingEventLinker
                onCollectingEventSelect={colEventToLink => {
                  setColEventId(colEventToLink.id);
                }}
              />
            </TabPanel>
          </Tabs>
        </FieldSet>
      </div>
      <div className={enableCatalogueInfo ? "" : "d-none"}>
        <FieldSet
          readOnly={true} // Disabled until back-end supports these fields.
          legend={<DinaMessage id="catalogueInfo" />}
        >
          <CatalogueInfoFormLayout />
        </FieldSet>
      </div>
      {materialSampleAttachmentsUI}
      {buttonBar}
    </DinaForm>
  );
}

/** Fields layout re-useable between view and edit pages. */
export function MaterialSampleFormLayout() {
  return (
    <div>
      <div className="row">
        <GroupSelectField
          name="group"
          enableStoredDefaultGroup={true}
          className="col-md-6"
        />
      </div>
      <div className="row">
        <TextField name="name" className="col-md-6" />
      </div>
    </div>
  );
}

export function CatalogueInfoFormLayout() {
  const { readOnly } = useDinaFormContext();

  return (
    <div>
      <div className="row">
        <div className="col-md-6">
          <FieldSet legend={<DinaMessage id="preparation" />} horizontal={true}>
            <TextField name="preparationMethod" />
            <TextField name="preparedBy" />
            <DateField name="datePrepared" />
          </FieldSet>
        </div>
        <div className="col-md-6">
          <FieldSet legend={<DinaMessage id="catalogueInfo" />}>
            <TextField name="dwcCatalogNumber" />
            {!readOnly && (
              <FormikButton
                // TODO onClick
                onClick={() => undefined}
                className="btn btn-primary"
                buttonProps={() => ({ style: { width: "20rem" } })}
              >
                <DinaMessage id="makeThisThePrimaryIdentifier" />
              </FormikButton>
            )}
          </FieldSet>
        </div>
      </div>
    </div>
  );
}
