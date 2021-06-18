import { useLocalStorage } from "@rehooks/local-storage";
import {
  BackButton,
  ButtonBar,
  DinaForm,
  DinaFormOnSubmit,
  SubmitButton,
  withResponse
} from "common-ui";
import { PersistedResource } from "kitsu";
import { useRouter } from "next/router";
import { Head, Nav } from "../../../components";
import { CollectingEventFormLayout } from "../../../components/collection/CollectingEventFormLayout";
import {
  DEFAULT_VERBATIM_COORDSYS_KEY,
  DEFAULT_VERBATIM_SRS_KEY,
  useCollectingEventQuery,
  useCollectingEventSave
} from "../../../components/collection/useCollectingEvent";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { CollectingEvent } from "../../../types/collection-api/resources/CollectingEvent";

interface CollectingEventFormProps {
  collectingEvent?: PersistedResource<CollectingEvent>;
}

export default function CollectingEventEditPage() {
  const router = useRouter();
  const {
    query: { id }
  } = router;
  const { formatMessage } = useDinaIntl();

  const collectingEventQuery = useCollectingEventQuery(id?.toString());

  return (
    <div>
      <Head title={formatMessage("editCollectingEventTitle")} />
      <Nav />
      <main className="container-fluid">
        {id ? (
          <div>
            <h1>
              <DinaMessage id="editCollectingEventTitle" />
            </h1>
            {withResponse(collectingEventQuery, ({ data }) => (
              <CollectingEventForm collectingEvent={data} />
            ))}
          </div>
        ) : (
          <div>
            <h1>
              <DinaMessage id="addCollectingEventTitle" />
            </h1>
            <CollectingEventForm />
          </div>
        )}
      </main>
    </div>
  );
}

function CollectingEventForm({ collectingEvent }: CollectingEventFormProps) {
  const router = useRouter();

  const {
    attachedMetadatasUI,
    collectingEventInitialValues,
    saveCollectingEvent,
    collectingEventFormSchema
  } = useCollectingEventSave({ fetchedCollectingEvent: collectingEvent });

  const [, setDefaultVerbatimCoordSys] = useLocalStorage<
    string | null | undefined
  >(DEFAULT_VERBATIM_COORDSYS_KEY);

  const [, setDefaultVerbatimSRS] = useLocalStorage<string | null | undefined>(
    DEFAULT_VERBATIM_SRS_KEY
  );

  const onSubmit: DinaFormOnSubmit = async ({ submittedValues, formik }) => {
    const savedCollectingEvent = await saveCollectingEvent(
      submittedValues,
      formik
    );

    await router.push(
      `/collection/collecting-event/view?id=${savedCollectingEvent.id}`
    );
  };

  const buttonBar = (
    <ButtonBar>
      <BackButton
        entityId={collectingEvent?.id}
        entityLink="/collection/collecting-event"
      />
      <SubmitButton className="ms-auto" />
    </ButtonBar>
  );

  return (
    <DinaForm
      initialValues={collectingEventInitialValues}
      onSubmit={onSubmit}
      enableReinitialize={true}
      validationSchema={collectingEventFormSchema}
    >
      {buttonBar}
      <CollectingEventFormLayout
        setDefaultVerbatimCoordSys={setDefaultVerbatimCoordSys}
        setDefaultVerbatimSRS={setDefaultVerbatimSRS}
      />
      <div className="mb-3">{attachedMetadatasUI}</div>
      {buttonBar}
    </DinaForm>
  );
}
