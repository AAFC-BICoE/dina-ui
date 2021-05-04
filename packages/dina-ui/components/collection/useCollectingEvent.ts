import { useLocalStorage } from "@rehooks/local-storage";
import { useApiClient, useQuery } from "common-ui";
import { FormikContextType } from "formik";
import { PersistedResource } from "kitsu";
import { orderBy } from "lodash";
import { useDinaIntl } from "../../intl/dina-ui-intl";
import { CollectingEvent } from "../../types/collection-api";
import { CoordinateSystemEnum } from "../../types/collection-api/resources/CoordinateSystem";
import { SRSEnum } from "../../types/collection-api/resources/SRS";
import { Metadata, Person } from "../../types/objectstore-api";
import { useAttachmentsModal } from "../object-store";
import { SourceAdministrativeLevel } from "../../types/collection-api/resources/GeographicPlaceNameSourceDetail";

export const DEFAULT_VERBATIM_COORDSYS_KEY = "collecting-event-coord_system";
export const DEFAULT_VERBATIM_SRS_KEY = "collecting-event-srs";

export function useCollectingEventQuery(id?: string | null) {
  const { bulkGet } = useApiClient();

  // TODO disable the fetch query when the ID is undefined.
  const collectingEventQuery = useQuery<CollectingEvent>(
    {
      path: `collection-api/collecting-event/${id}?include=collectors,attachment`
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

        if (data.geoReferenceAssertions) {
          // Retrieve georeferencedBy agent arrays on GeoReferenceAssertions.
          for (const assertion of data.geoReferenceAssertions) {
            if (assertion.georeferencedBy) {
              assertion.georeferencedBy = await bulkGet<Person>(
                assertion.georeferencedBy.map(
                  (personId: string) => `/person/${personId}`
                ),
                {
                  apiBaseUrl: "/agent-api",
                  returnNullForMissingResource: true
                }
              );
            }
          }
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

/** CollectingEvent save method to be re-used by CollectingEvent and MaterialSample forms. */
export function useCollectingEventSave(
  fetchedCollectingEvent?: PersistedResource<CollectingEvent>
) {
  const { save } = useApiClient();
  const { formatMessage } = useDinaIntl();

  const [defaultVerbatimCoordSys] = useLocalStorage<string | null | undefined>(
    DEFAULT_VERBATIM_COORDSYS_KEY
  );

  const [defaultVerbatimSRS] = useLocalStorage<string | null | undefined>(
    DEFAULT_VERBATIM_SRS_KEY
  );

  let srcAdminLevels: SourceAdministrativeLevel[] = [];

  if (
    fetchedCollectingEvent?.geographicPlaceNameSourceDetail
      ?.selectedGeographicPlace
  )
    srcAdminLevels.push(
      fetchedCollectingEvent?.geographicPlaceNameSourceDetail
        ?.selectedGeographicPlace
    );
  if (
    fetchedCollectingEvent?.geographicPlaceNameSourceDetail
      ?.higherGeographicPlaces
  )
    srcAdminLevels = srcAdminLevels.concat(
      fetchedCollectingEvent?.geographicPlaceNameSourceDetail
        ?.higherGeographicPlaces
    );

  const collectingEventInitialValues = fetchedCollectingEvent
    ? {
        ...fetchedCollectingEvent,
        dwcOtherRecordNumbers:
          fetchedCollectingEvent.dwcOtherRecordNumbers?.concat("").join("\n") ??
          "",
        geoReferenceAssertions:
          fetchedCollectingEvent.geoReferenceAssertions ?? [],
        srcAdminLevels
      }
    : {
        type: "collecting-event",
        // This value needs to be here or else Cleave throws an error when Enzyme simulates a change:
        startEventDateTime: "YYYY-MM-DDTHH:MM:SS.MMM",
        collectors: [],
        collectorGroups: [],
        geoReferenceAssertions: [
          {
            isPrimary: true
          }
        ],
        dwcVerbatimCoordinateSystem:
          defaultVerbatimCoordSys ?? CoordinateSystemEnum.DECIMAL_DEGREE,
        dwcVerbatimSRS: defaultVerbatimSRS ?? SRSEnum.WGS84
      };

  // The selected Metadatas to be attached to this Collecting Event:
  const { selectedMetadatas, attachedMetadatasUI } = useAttachmentsModal({
    initialMetadatas: fetchedCollectingEvent?.attachment as PersistedResource<Metadata>[],
    deps: [fetchedCollectingEvent?.id]
  });

  async function saveCollectingEvent(
    submittedValues,
    collectingEventFormik: FormikContextType<any>
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
    for (const assertion of submittedValues.geoReferenceAssertions || []) {
      assertion.georeferencedBy = assertion.georeferencedBy?.map(it => it.id);
    }

    // Parse srcAdminLevels to geographicPlaceNameSourceDetail
    if (submittedValues.srcAdminLevels?.length > 0) {
      if (submittedValues.srcAdminLevels?.length > 1)
        submittedValues.geographicPlaceNameSourceDetail.higerGeographicPlaces = [];
      submittedValues.srcAdminLevels.map((srcAdminLevel, idx) => {
        // remove the braceket from placeName
        const typeStart = srcAdminLevel.name.indexOf("[");
        srcAdminLevel.name = srcAdminLevel.name
          .slice(0, typeStart !== -1 ? typeStart : srcAdminLevel.name.length)
          .trim();

        idx === 0
          ? (submittedValues.geographicPlaceNameSourceDetail.selectedGeographicPlace = srcAdminLevel)
          : submittedValues.geographicPlaceNameSourceDetail.higerGeographicPlaces.push(
              srcAdminLevel
            );
      });
    }

    delete submittedValues.srcAdminLevels;

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
    collectingEventFormik.setFieldValue("id", savedCollectingEvent.id);

    return savedCollectingEvent;
  }

  return {
    collectingEventInitialValues,
    saveCollectingEvent,
    attachedMetadatasUI
  };
}
