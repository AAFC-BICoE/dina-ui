import { useLocalStorage } from "@rehooks/local-storage";
import {
  BackButton,
  ButtonBar,
  DinaForm,
  DinaFormOnSubmit,
  SubmitButton,
  useApiClient,
  useRelationshipUsagesCount,
  withResponse,
  useModal
} from "common-ui";
import { PersistedResource } from "kitsu";
import { useRouter } from "next/router";
import {
  CollectingEventFormLayout,
  DEFAULT_VERBATIM_COORDSYS_KEY,
  DEFAULT_VERBATIM_SRS_KEY,
  Head,
  useCollectingEventQuery,
  useCollectingEventSave
} from "../../../components";
import { useDinaIntl } from "../../../intl/dina-ui-intl";
import { CollectingEvent } from "../../../types/collection-api/resources/CollectingEvent";
import PageLayout from "../../../components/page/PageLayout";
import React from "react";
import { renderConfirmationModal } from "../../../components/collection/collecting-event/CollectingEventEditAlert";

interface CollectingEventFormProps {
  collectingEvent?: PersistedResource<CollectingEvent>;
}

export default function CollectingEventEditPage() {
  const router = useRouter();
  const {
    query: { id }
  } = router;
  const { formatMessage } = useDinaIntl();

  const title = id ? "editCollectingEventTitle" : "addCollectingEventTitle";

  const collectingEventQuery = useCollectingEventQuery(id?.toString());

  return (
    <PageLayout titleId={formatMessage(title)}>
      <Head title={formatMessage(title)} />
      {id ? (
        <div>
          {withResponse(collectingEventQuery, ({ data }) => (
            <CollectingEventForm collectingEvent={data} />
          ))}
        </div>
      ) : (
        <div>
          <CollectingEventForm />
        </div>
      )}
    </PageLayout>
  );
}

function CollectingEventForm({ collectingEvent }: CollectingEventFormProps) {
  const router = useRouter();
  const { apiClient } = useApiClient();
  const { openModal } = useModal();

  const {
    collectingEventInitialValues,
    saveCollectingEvent,
    collectingEventFormSchema
  } = useCollectingEventSave({ fetchedCollectingEvent: collectingEvent });

  // Hook to check for material sample usages.
  const { usageCount: materialSampleUsageCount } = useRelationshipUsagesCount({
    apiClient,
    resourcePath: "collection-api/material-sample",
    relationshipName: "collectingEvent",
    relationshipId: collectingEvent?.id
  });

  const [, setDefaultVerbatimCoordSys] = useLocalStorage<
    string | null | undefined
  >(DEFAULT_VERBATIM_COORDSYS_KEY);

  const [, setDefaultVerbatimSRS] = useLocalStorage<string | null | undefined>(
    DEFAULT_VERBATIM_SRS_KEY
  );

  const onSubmit: DinaFormOnSubmit<CollectingEvent> = async ({
    submittedValues,
    formik
  }) => {
    const performSave = async () => {
      const savedCollectingEvent = await saveCollectingEvent(
        submittedValues,
        formik
      );
      await router.push(
        `/collection/collecting-event/view?id=${savedCollectingEvent?.id}`
      );
    };

    // Check if multiple material sample usages exist to display an confirmation.
    if (materialSampleUsageCount && materialSampleUsageCount > 1) {
      openModal(renderConfirmationModal(materialSampleUsageCount, performSave));
      return;
    }

    await performSave();
  };

  const buttonBar = (
    <ButtonBar className="mb-4">
      <div className="col-md-6 col-sm-12 mt-2">
        <BackButton
          entityId={collectingEvent?.id}
          entityLink="/collection/collecting-event"
        />
      </div>
      <div className="col-md-6 col-sm-12 d-flex">
        <SubmitButton className="ms-auto" />
      </div>
    </ButtonBar>
  );

  const initValues = {
    ...collectingEventInitialValues,
    type: "collecting-event" as const
  };

  return (
    <DinaForm<CollectingEvent>
      initialValues={initValues}
      onSubmit={onSubmit}
      enableReinitialize={true}
      validationSchema={collectingEventFormSchema}
    >
      {buttonBar}
      <CollectingEventFormLayout
        setDefaultVerbatimCoordSys={setDefaultVerbatimCoordSys}
        setDefaultVerbatimSRS={setDefaultVerbatimSRS}
        materialSampleUsageCount={materialSampleUsageCount}
      />
    </DinaForm>
  );
}
