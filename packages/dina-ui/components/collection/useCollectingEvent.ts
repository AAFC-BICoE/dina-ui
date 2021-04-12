import { SaveArgs, useApiClient, useQuery } from "common-ui";
import { FormikContextType } from "formik";
import { PersistedResource } from "kitsu";
import { orderBy } from "lodash";
import { useDinaIntl } from "../../intl/dina-ui-intl";
import {
  CollectingEvent,
  GeoReferenceAssertion
} from "../../types/collection-api";
import { Metadata, Person } from "../../types/objectstore-api";
import { useAttachmentsModal } from "../object-store";

export function useCollectingEventQuery(id?: string) {
  const { bulkGet } = useApiClient();

  // TODO disable the fetch query when the ID is undefined.
  const collectingEventQuery = useQuery<CollectingEvent>(
    {
      path: `collection-api/collecting-event/${id}?include=collectors,geoReferenceAssertions,attachment`
    },
    {
      // Return undefined when ID is undefined:
      disabled: !id,
      onSuccess: async ({ data }) => {
        // Do client-side multi-API joins on one-to-many fields:

        if (data.collectors) {
          const agents = await bulkGet<Person>(
            data.collectors.map(collector => `/person/${collector.id}`),
            { apiBaseUrl: "/agent-api", returnNullForMissingResource: true }
          );
          // Omit null (deleted) records:
          data.collectors = agents.filter(it => it);
        }

        if (data.attachment) {
          const metadatas = await bulkGet<Metadata>(
            data.attachment.map(collector => `/metadata/${collector.id}`),
            {
              apiBaseUrl: "/objectstore-api",
              returnNullForMissingResource: true
            }
          );
          // Omit null (deleted) records:
          data.attachment = metadatas.filter(it => it);
        }

        if (data.geoReferenceAssertions) {
          // Retrieve georeferenceAssertion with georeferencedBy
          const geoReferenceAssertions = await bulkGet<GeoReferenceAssertion>(
            data.geoReferenceAssertions.map(
              it => `/georeference-assertion/${it.id}?include=georeferencedBy`
            ),
            {
              apiBaseUrl: "/collection-api",
              returnNullForMissingResource: true
            }
          );

          // Retrieve georeferencedBy agent arrays on GeoReferenceAssertions.
          for (const assertion of geoReferenceAssertions) {
            if (assertion.georeferencedBy) {
              assertion.georeferencedBy = await bulkGet<Person>(
                assertion.georeferencedBy.map(it => `/person/${it.id}`),
                {
                  apiBaseUrl: "/agent-api",
                  returnNullForMissingResource: true
                }
              );
            }
          }
          data.geoReferenceAssertions = geoReferenceAssertions;
        }

        // Order GeoReferenceAssertions by "createdOn" ascending:
        data.geoReferenceAssertions = orderBy(
          data.geoReferenceAssertions,
          "createdOn"
        );
      }
    }
  );

  return collectingEventQuery;
}

/** CollectingEvent save method to be re-used by CollectingEvent and PhysicalEntity forms. */
export function useCollectingEventSave(
  fetchedCollectingEvent?: PersistedResource<CollectingEvent>
) {
  const { save } = useApiClient();
  const { formatMessage } = useDinaIntl();

  const collectingEventInitialValues = fetchedCollectingEvent
    ? {
        ...fetchedCollectingEvent,
        dwcOtherRecordNumbers:
          fetchedCollectingEvent.dwcOtherRecordNumbers?.concat("").join("\n") ??
          "",
        geoReferenceAssertions:
          fetchedCollectingEvent.geoReferenceAssertions ?? []
      }
    : {
        type: "collecting-event",
        collectors: [],
        collectorGroups: [],
        geoReferenceAssertions: [{}]
      };

  // The selected Metadatas to be attached to this Collecting Event:
  const { selectedMetadatas, attachedMetadatasUI } = useAttachmentsModal({
    initialMetadatas: fetchedCollectingEvent?.attachment as PersistedResource<Metadata>[]
  });

  async function saveGeoReferenceAssertion(
    assertionsToSave: GeoReferenceAssertion[],
    linkedCollectingEvent: PersistedResource<CollectingEvent>
  ) {
    const existingAssertions = collectingEventInitialValues.geoReferenceAssertions as PersistedResource<GeoReferenceAssertion>[];

    const assertionIdsToSave = assertionsToSave.map(it => it.id);
    const assertionsToDelete = existingAssertions.filter(
      existingAssertion =>
        existingAssertion.id &&
        !assertionIdsToSave.includes(existingAssertion.id)
    );

    const saveArgs: SaveArgs[] = assertionsToSave
      .filter(assertion => Object.keys(assertion).length > 0)
      .map(assertion => {
        return {
          resource: {
            ...assertion,
            type: "georeference-assertion",
            collectingEvent: {
              type: linkedCollectingEvent.type,
              id: linkedCollectingEvent.id
            }
          },
          type: "georeference-assertion"
        };
      });

    const deleteArgs = assertionsToDelete.map(assertion => ({
      delete: assertion
    }));

    if (saveArgs.length) {
      await save(saveArgs, { apiBaseUrl: "/collection-api" });
    }
    // Call the saves and deleted separately for now.
    // TODO find out why an operations request with 1 save + 1 delete causes the delete to be ignored.
    if (deleteArgs.length) {
      await save(deleteArgs, { apiBaseUrl: "/collection-api" });
    }
  }

  async function saveCollectingEvent(
    submittedValues,
    formik: FormikContextType<any>
  ) {
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
    submittedValues.geoReferenceAssertions?.map(assertion => {
      if (assertion.georeferencedBy) {
        assertion.relationships = {};
        assertion.relationships.georeferencedBy = {
          data: assertion.georeferencedBy.map(it => ({
            id: it.id,
            type: "agent"
          }))
        };
      }
      delete assertion.georeferencedBy;
    });

    const geoReferenceAssertionsToSave = submittedValues.geoReferenceAssertions;
    delete submittedValues.geoReferenceAssertions;

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

    // save georeference assertions:
    await saveGeoReferenceAssertion(
      geoReferenceAssertionsToSave,
      savedCollectingEvent
    );

    return savedCollectingEvent;
  }

  return {
    collectingEventInitialValues,
    saveCollectingEvent,
    attachedMetadatasUI
  };
}
