import {
  BackButton,
  ButtonBar,
  DinaForm,
  DinaFormSubmitParams,
  FieldSet,
  FormikButton,
  SubmitButton,
  TextField,
  useAccount,
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
import { CollectingEventFormLayout } from "../../../components/collection/CollectingEventFormLayout";
import { CollectingEventLinker } from "../../../components/collection/CollectingEventLinker";
import {
  useCollectingEventQuery,
  useCollectingEventSave
} from "../../../components/collection/useCollectingEvent";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { MaterialSample } from "../../../types/collection-api";

export default function MaterialSampleEditPage() {
  const router = useRouter();
  const {
    query: { id }
  } = router;
  const { formatMessage } = useDinaIntl();

  const materialSampleQuery = useQuery<MaterialSample>(
    {
      path: `collection-api/material-sample/${id}`,
      include: "collectingEvent"
    },
    { disabled: !id }
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

  const [showCollectingEvent, setShowCollectingEvent] = useState(
    !!materialSample?.collectingEvent
  );
  const [showCatalogueInfo, setCatalogueInfo] = useState(false);

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
    attachedMetadatasUI
  } = useCollectingEventSave(colEventQuery.response?.data);

  async function onSubmit({
    api: { save },
    submittedValues
  }: DinaFormSubmitParams<InputResource<MaterialSample>>) {
    const { ...materialSampleValues } = submittedValues;

    /** Input to submit to the back-end API. */
    const materialSampleInput = {
      ...materialSampleValues
    };

    // Save the linked CollectingEvent if included:
    if (colEventFormRef.current) {
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
      <div className="form-group">{attachedMetadatasUI}</div>
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
                checked={showCollectingEvent}
                onChange={setShowCollectingEvent}
              />
            </div>
          </label>
          <label className="d-flex align-items-center col-sm-3">
            <strong>
              <DinaMessage id="catalogueInfo" />
            </strong>
            <div className="mx-2">
              <Switch checked={showCatalogueInfo} onChange={setCatalogueInfo} />
            </div>
          </label>
        </div>
      </FieldSet>
      {showCollectingEvent && (
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
      )}
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
