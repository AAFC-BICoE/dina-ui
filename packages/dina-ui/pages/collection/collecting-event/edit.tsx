import { useLocalStorage } from "@rehooks/local-storage";
import {
  ApiClientContext,
  BackButton,
  ButtonBar,
  DinaForm,
  DinaFormOnSubmit,
  LoadingSpinner,
  Query,
  SubmitButton,
  useApiClient
} from "common-ui";
import { KitsuResponse, PersistedResource } from "kitsu";
import { orderBy } from "lodash";
import { NextRouter, useRouter } from "next/router";
import { useContext } from "react";
import { Head, Nav } from "../../../components";
import { CollectingEventFormLayout } from "../../../components/collection/CollectingEventFormLayout";
import { useAttachmentsModal } from "../../../components/object-store";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { Person } from "../../../types/agent-api/resources/Person";
import { CollectingEvent } from "../../../types/collection-api/resources/CollectingEvent";
import { CoordinateSystemEnum } from "../../../types/collection-api/resources/CoordinateSystem";
import { SRSEnum } from "../../../types/collection-api/resources/SRS";
import { Metadata } from "../../../types/objectstore-api";

interface CollectingEventFormProps {
  collectingEvent?: CollectingEvent;
  router: NextRouter;
}

export default function CollectingEventEditPage() {
  const router = useRouter();
  const {
    query: { id }
  } = router;
  const { formatMessage } = useDinaIntl();
  const { bulkGet } = useContext(ApiClientContext);

  /** Do client-side multi-API joins on one-to-many fields. */
  async function initOneToManyRelations(
    response: KitsuResponse<CollectingEvent>
  ) {
    if (response?.data?.collectors) {
      const agents = await bulkGet<Person>(
        response.data.collectors.map(collector => `/person/${collector.id}`),
        { apiBaseUrl: "/agent-api", returnNullForMissingResource: true }
      );
      // Omit null (deleted) records:
      response.data.collectors = agents.filter(it => it);
    }

    if (response?.data?.attachment) {
      const metadatas = await bulkGet<Metadata>(
        response.data.attachment.map(collector => `/metadata/${collector.id}`),
        { apiBaseUrl: "/objectstore-api", returnNullForMissingResource: true }
      );
      // Omit null (deleted) records:
      response.data.attachment = metadatas.filter(it => it);
    }

    const geoReferenceAssertions = response?.data?.geoReferenceAssertions;
    if (geoReferenceAssertions) {
      // Retrieve georeferencedBy associated agents
      for (const assertion of geoReferenceAssertions) {
        if (assertion.georeferencedBy) {
          assertion.georeferencedBy = await bulkGet<Person>(
            assertion.georeferencedBy.map(personId => `/person/${personId}`),
            {
              apiBaseUrl: "/agent-api",
              returnNullForMissingResource: true
            }
          );
        }
      }

      response.data.geoReferenceAssertions = geoReferenceAssertions;
    }

    // Order GeoReferenceAssertions by "createdOn" ascending:
    if (response?.data) {
      response.data.geoReferenceAssertions = orderBy(
        response.data.geoReferenceAssertions,
        "createdOn"
      );
    }
  }

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
            <Query<CollectingEvent>
              query={{
                path: `collection-api/collecting-event/${id}?include=collectors,geoReferenceAssertions,attachment`
              }}
              onSuccess={initOneToManyRelations}
            >
              {({ loading, response }) => (
                <div>
                  <LoadingSpinner loading={loading} />
                  {response?.data && (
                    <CollectingEventForm
                      collectingEvent={response?.data}
                      router={router}
                    />
                  )}
                </div>
              )}
            </Query>
          </div>
        ) : (
          <div>
            <h1>
              <DinaMessage id="addCollectingEventTitle" />
            </h1>
            <CollectingEventForm router={router} />
          </div>
        )}
      </main>
    </div>
  );
}

function CollectingEventForm({
  collectingEvent,
  router
}: CollectingEventFormProps) {
  const { id } = router.query;
  const { formatMessage } = useDinaIntl();
  const DEFAULT_VERBATIM_COORDSYS_KEY = "collecting-event-coord_system";
  const DEFAULT_VERBATIM_SRS_KEY = "collecting-event-srs";

  // The selected Metadatas to be attached to this Collecting Event:
  const { selectedMetadatas, attachedMetadatasUI } = useAttachmentsModal({
    initialMetadatas: collectingEvent?.attachment as PersistedResource<Metadata>[]
  });

  const [defaultVerbatimCoordSys, setDefaultVerbatimCoordSys] = useLocalStorage<
    string | null | undefined
  >(DEFAULT_VERBATIM_COORDSYS_KEY);

  const [defaultVerbatimSRS, setDefaultVerbatimSRS] = useLocalStorage<
    string | null | undefined
  >(DEFAULT_VERBATIM_SRS_KEY);

  const initialValues = collectingEvent
    ? {
        ...collectingEvent,
        dwcOtherRecordNumbers:
          collectingEvent.dwcOtherRecordNumbers?.concat("").join("\n") ?? "",
        geoReferenceAssertions: collectingEvent.geoReferenceAssertions ?? []
      }
    : {
        type: "collecting-event",
        collectors: [],
        collectorGroups: [],
        startEventDateTime: "YYYY-MM-DDTHH:MM:SS.MMM",
        geoReferenceAssertions: [{}],
        dwcVerbatimCoordinateSystem:
          defaultVerbatimCoordSys ?? CoordinateSystemEnum.DECIMAL_DEGREE,
        dwcVerbatimSRS: defaultVerbatimSRS ?? SRSEnum.WGS84
      };

  const { save } = useApiClient();

  const onSubmit: DinaFormOnSubmit = async ({ submittedValues, formik }) => {
    // Init relationships object for one-to-many relations:
    submittedValues.relationships = {};

    if (!submittedValues.startEventDateTime) {
      throw new Error(
        formatMessage("field_collectingEvent_startDateTimeError")
      );
    }
    const matcher = /([^\d]+)/g;
    const startDateTime = submittedValues.startEventDateTime.replace(
      matcher,
      ""
    );
    const datePrecision = [4, 6, 8, 12, 14, 17];
    if (!datePrecision.includes(startDateTime.length)) {
      throw new Error(
        formatMessage("field_collectingEvent_startDateTimeError")
      );
    }
    if (submittedValues.endEventDateTime) {
      const endDateTime = submittedValues.endEventDateTime.replace(matcher, "");
      if (!datePrecision.includes(endDateTime.length)) {
        throw new Error(
          formatMessage("field_collectingEvent_endDateTimeError")
        );
      }
    }
    // handle converting to relationship manually due to crnk bug
    if (submittedValues.collectors?.length > 0) {
      submittedValues.relationships.collectors = {
        data: submittedValues.collectors.map(collector => ({
          id: collector.id,
          type: "agent"
        }))
      };
    }
    delete submittedValues.collectors;

    if (submittedValues.collectorGroups?.id)
      submittedValues.collectorGroupUuid = submittedValues.collectorGroups.id;
    delete submittedValues.collectorGroups;

    // Convert user-suplied string to string array:
    submittedValues.dwcOtherRecordNumbers = (
      submittedValues.dwcOtherRecordNumbers?.toString() || ""
    )
      // Split by line breaks:
      .match(/[^\r\n]+/g)
      // Remove empty lines:
      ?.filter(line => line.trim());

    // Treat empty array or undefined as null:
    if (!submittedValues.dwcOtherRecordNumbers?.length) {
      submittedValues.dwcOtherRecordNumbers = null;
    }

    // Add attachments if they were selected:
    if (selectedMetadatas.length) {
      submittedValues.relationships.attachment = {
        data: selectedMetadatas.map(it => ({ id: it.id, type: it.type }))
      };
    }
    // Delete the 'attachment' attribute because it should stay in the relationships field:
    delete submittedValues.attachment;

    // Convert georeferenceByAgents to relationship
    for (const assertion of submittedValues.geoReferenceAssertions || []) {
      assertion.georeferencedBy = assertion.georeferencedBy?.map(it => it.id);
    }

    const [savedCollectingEvent] = await save<CollectingEvent>(
      [
        {
          resource: submittedValues,
          type: "collecting-event"
        }
      ],
      {
        apiBaseUrl: "/collection-api"
      }
    );

    // Set the Collecting Event ID so if there is an error after this,
    // then subsequent submissions use PATCH instea of POST:
    formik.setFieldValue("id", savedCollectingEvent.id);

    await router.push(
      `/collection/collecting-event/view?id=${savedCollectingEvent.id}`
    );
  };

  const buttonBar = (
    <ButtonBar>
      <BackButton
        entityId={id as string}
        entityLink="/collection/collecting-event"
      />
      <SubmitButton className="ml-auto" />
    </ButtonBar>
  );

  return (
    <DinaForm
      initialValues={initialValues}
      onSubmit={onSubmit}
      enableReinitialize={true}
    >
      {buttonBar}
      <CollectingEventFormLayout
        setDefaultVerbatimCoordSys={setDefaultVerbatimCoordSys}
        setDefaultVerbatimSRS={setDefaultVerbatimSRS}
      />
      <div className="form-group">{attachedMetadatasUI}</div>
      {buttonBar}
    </DinaForm>
  );
}
