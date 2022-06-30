import { useLocalStorage } from "@rehooks/local-storage";
import {
  BackButton,
  ButtonBar,
  ButtonBarRight,
  DinaForm,
  DinaFormOnSubmit,
  SubmitButton,
  withResponse
} from "common-ui";
import { PersistedResource } from "kitsu";
import { useRouter } from "next/router";
import {
  CollectingEventFormLayout,
  DEFAULT_VERBATIM_COORDSYS_KEY,
  DEFAULT_VERBATIM_SRS_KEY,
  Footer,
  Head,
  Nav,
  useCollectingEventQuery,
  useCollectingEventSave
} from "../../../components";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { CollectingEvent } from "../../../types/collection-api/resources/CollectingEvent";

interface CollectingEventFormProps {
  collectingEvent?: PersistedResource<CollectingEvent>;
  title: "editCollectingEventTitle" | "addCollectingEventTitle";
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
    <>
      <Head title={formatMessage(title)} />
      <Nav />
      {id ? (
        <>
          {withResponse(collectingEventQuery, ({ data }) => (
            <CollectingEventForm
              collectingEvent={data}
              title={"editCollectingEventTitle"}
            />
          ))}
        </>
      ) : (
        <CollectingEventForm title={"addCollectingEventTitle"} />
      )}
      <Footer />
    </>
  );
}

function CollectingEventForm({
  collectingEvent,
  title
}: CollectingEventFormProps) {
  const router = useRouter();

  const {
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

  const onSubmit: DinaFormOnSubmit<CollectingEvent> = async ({
    submittedValues,
    formik
  }) => {
    const savedCollectingEvent = await saveCollectingEvent(
      submittedValues,
      formik
    );

    await router.push(
      `/collection/collecting-event/view?id=${savedCollectingEvent.id}`
    );
  };

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
      <ButtonBar>
        <BackButton
          entityId={collectingEvent?.id}
          entityLink="/collection/collecting-event"
        />
        <ButtonBarRight>
          <SubmitButton className="ms-auto" />
        </ButtonBarRight>
      </ButtonBar>
      <main className="container-fluid px-5">
        <h1 id="wb-cont">
          <DinaMessage id={title} />
        </h1>
        <CollectingEventFormLayout
          setDefaultVerbatimCoordSys={setDefaultVerbatimCoordSys}
          setDefaultVerbatimSRS={setDefaultVerbatimSRS}
        />
      </main>
    </DinaForm>
  );
}
