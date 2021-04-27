import {
  BackButton,
  ButtonBar,
  DateField,
  DinaForm,
  DinaFormOnSubmit,
  DinaFormSection,
  FieldSet,
  FormikButton,
  LoadingSpinner,
  Query,
  SubmitButton,
  TextField,
  useApiClient,
  withResponse
} from "common-ui";
import { FormikProps } from "formik";
import { cloneDeep } from "lodash";
import Link from "next/link";
import { useRouter } from "next/router";
import { useRef, useState } from "react";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import { GroupSelectField, Head, Nav } from "../../../components";
import { CollectingEventFormLayout } from "../../../components/collection/CollectingEventFormLayout";
import { CollectingEventLinker } from "../../../components/collection/CollectingEventLinker";
import {
  useCollectingEventQuery,
  useCollectingEventSave
} from "../../../components/collection/useCollectingEvent";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { CollectingEvent, PhysicalEntity } from "../../../types/collection-api";

export default function CataloguedObjectEditPage() {
  const router = useRouter();
  const {
    query: { id }
  } = router;
  const { formatMessage } = useDinaIntl();

  async function moveToViewPage(savedId: string) {
    await router.push(`/collection/catalogued-object/view?id=${savedId}`);
  }

  return (
    <div>
      <Head title={formatMessage("editCataloguedObjectTitle")} />
      <Nav />
      <div className="container-fluid">
        {id ? (
          <div>
            <h1>
              <DinaMessage id="editCataloguedObjectTitle" />
            </h1>
            <Query<PhysicalEntity>
              query={{
                path: `collection-api/physical-entity/${id}?include=collectingEvent`
              }}
            >
              {({ loading, response }) => (
                <div>
                  <LoadingSpinner loading={loading} />
                  {response?.data && (
                    <CataloguedObjectForm
                      cataloguedObject={response?.data}
                      onSaved={moveToViewPage}
                    />
                  )}
                </div>
              )}
            </Query>
          </div>
        ) : (
          <div>
            <h1>
              <DinaMessage id="addCataloguedObjectTitle" />
            </h1>
            <CataloguedObjectForm onSaved={moveToViewPage} />
          </div>
        )}
      </div>
    </div>
  );
}

export interface CataloguedObjectFormProps {
  cataloguedObject?: PhysicalEntity;
  onSaved?: (id: string) => Promise<void>;
}

/** Editable CataloguedObject Form. */
export function CataloguedObjectForm({
  cataloguedObject,
  onSaved
}: CataloguedObjectFormProps) {
  const { save } = useApiClient();

  /** Used to get the values of the nested CollectingEvent form. */
  const colEventFormRef = useRef<FormikProps<any>>(null);

  const [colEventId, setColEventId] = useState<string | null | undefined>(
    cataloguedObject?.collectingEvent?.id
  );
  const colEventQuery = useCollectingEventQuery(colEventId);

  const {
    collectingEventInitialValues,
    saveCollectingEvent,
    attachedMetadatasUI
  } = useCollectingEventSave(colEventQuery.response?.data);

  const onSubmit: DinaFormOnSubmit<PhysicalEntity> = async ({
    submittedValues
  }) => {
    const { ...cataloguedObjectValues } = submittedValues;

    /** Input to submit to the back-end API. */
    const cataloguedObjectInput = {
      ...cataloguedObjectValues
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

      // Link the PhysicalEntity to the CollectingEvent:
      cataloguedObjectInput.collectingEvent = {
        id: savedCollectingEvent.id,
        type: savedCollectingEvent.type
      } as CollectingEvent;
    }

    // Save the PhysicalEntity:
    const [savedPhysicalEntity] = await save<PhysicalEntity>(
      [
        {
          resource: cataloguedObjectInput,
          type: "physical-entity"
        }
      ],
      { apiBaseUrl: "/collection-api" }
    );

    await onSaved?.(savedPhysicalEntity.id);
  };

  const buttonBar = (
    <ButtonBar>
      <BackButton
        entityId={cataloguedObject?.id}
        entityLink="/collection/catalogued-object"
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

  // Wait for the CollectingEvent (if linked) to be ready before rendering:
  return (
    <DinaForm initialValues={cataloguedObject ?? {}} onSubmit={onSubmit}>
      {buttonBar}
      <CataloguedObjectFormLayout />
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
      {buttonBar}
    </DinaForm>
  );
}

/** Fields layout re-useable between view and edit pages. */
export function CataloguedObjectFormLayout() {
  return (
    <div>
      <div className="row">
        <div className="col-md-6">
          <DinaFormSection horizontal={true}>
            <GroupSelectField name="group" enableStoredDefaultGroup={true} />
            <TextField name="dwcCatalogNumber" />
          </DinaFormSection>
        </div>
        <div className="col-md-6">
          <FieldSet
            legend={<DinaMessage id="preparationData" />}
            horizontal={true}
            readOnly={true} // Disabled until back-end supports these fields.
          >
            <TextField name="preparationMethod" />
            <TextField name="preparedBy" />
            <DateField name="datePrepared" />
          </FieldSet>
        </div>
      </div>
    </div>
  );
}
