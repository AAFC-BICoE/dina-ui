import { useLocalStorage } from "@rehooks/local-storage";
import { useApiClient, useQuery } from "common-ui";
import { FormikContextType } from "formik";
import { PersistedResource } from "kitsu";
import { orderBy } from "lodash";
import { useMemo } from "react";
import * as yup from "yup";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import {
  CollectingEvent,
  GeoReferenceAssertion
} from "../../types/collection-api";
import { CoordinateSystemEnum } from "../../types/collection-api/resources/CoordinateSystem";
import { SourceAdministrativeLevel } from "../../types/collection-api/resources/GeographicPlaceNameSourceDetail";
import { SRSEnum } from "../../types/collection-api/resources/SRS";
import { Metadata, Person } from "../../types/objectstore-api";
import { useAttachmentsModal } from "../object-store";

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
        // Parse place names into srcAdminLevels
        let srcAdminLevels: SourceAdministrativeLevel[] = [];

        if (data?.geographicPlaceNameSourceDetail?.customGeographicPlace) {
          const customPlaceNameAsInSrcAdmnLevel: SourceAdministrativeLevel = {};
          customPlaceNameAsInSrcAdmnLevel.name =
            data.geographicPlaceNameSourceDetail.customGeographicPlace;
          srcAdminLevels.push(customPlaceNameAsInSrcAdmnLevel);
        }
        if (data.geographicPlaceNameSourceDetail?.selectedGeographicPlace)
          srcAdminLevels.push(
            data.geographicPlaceNameSourceDetail?.selectedGeographicPlace
          );
        if (data.geographicPlaceNameSourceDetail?.higherGeographicPlaces)
          srcAdminLevels = srcAdminLevels.concat(
            data.geographicPlaceNameSourceDetail?.higherGeographicPlaces
          );

        srcAdminLevels?.map(
          admn =>
            (admn.name += admn.placeType ? " [ " + admn.placeType + " ] " : "")
        );
        data.srcAdminLevels = srcAdminLevels;
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
  const collectingEventFormSchema = useCollectingEventFormSchema();

  const [defaultVerbatimCoordSys] = useLocalStorage<string | null | undefined>(
    DEFAULT_VERBATIM_COORDSYS_KEY
  );

  const [defaultVerbatimSRS] = useLocalStorage<string | null | undefined>(
    DEFAULT_VERBATIM_SRS_KEY
  );

  const collectingEventInitialValues = fetchedCollectingEvent
    ? {
        ...fetchedCollectingEvent,
        geoReferenceAssertions:
          fetchedCollectingEvent.geoReferenceAssertions ?? [],
        srcAdminLevels: fetchedCollectingEvent.srcAdminLevels
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
        dwcVerbatimSRS: defaultVerbatimSRS ?? SRSEnum.WGS84,
        managedAttributeValues: {}
      };

  // The selected Metadatas to be attached to this Collecting Event:
  const { selectedMetadatas, attachedMetadatasUI } = useAttachmentsModal({
    initialMetadatas: fetchedCollectingEvent?.attachment as PersistedResource<Metadata>[],
    deps: [fetchedCollectingEvent?.id],
    title: <DinaMessage id="collectingEventAttachments" />
  });

  async function saveCollectingEvent(
    submittedValues,
    collectingEventFormik: FormikContextType<any>
  ) {
    // Init relationships object for one-to-many relations:
    submittedValues.relationships = {};

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
    // Reset the 3 fields which should be updated with user address entries : srcAdminLevels
    if (submittedValues.geographicPlaceNameSourceDetail) {
      submittedValues.geographicPlaceNameSourceDetail.higherGeographicPlaces = null;
      submittedValues.geographicPlaceNameSourceDetail.selectedGeographicPlace = null;
      submittedValues.geographicPlaceNameSourceDetail.customGeographicPlace = null;
    }

    if (submittedValues.srcAdminLevels?.length > 0) {
      if (submittedValues.srcAdminLevels?.length > 1)
        submittedValues.geographicPlaceNameSourceDetail.higherGeographicPlaces = [];
      submittedValues.srcAdminLevels.map((srcAdminLevel, idx) => {
        // remove the braceket from placeName
        const typeStart = srcAdminLevel.name.indexOf("[");
        srcAdminLevel.name = srcAdminLevel.name
          .slice(0, typeStart !== -1 ? typeStart : srcAdminLevel.name.length)
          .trim();
        // the first one can either be selectedGeographicPlace or customGeographicPlace
        // when the entry only has name in it, it is user entered customPlaceName entry
        // when the enry does not have osm_id, it will be saved as customPlaceName (e.g central experimental farm)
        if (idx === 0) {
          if (!srcAdminLevel.id) {
            submittedValues.geographicPlaceNameSourceDetail.customGeographicPlace =
              srcAdminLevel.name;
          } else {
            submittedValues.geographicPlaceNameSourceDetail.selectedGeographicPlace = srcAdminLevel;
          }
        } else {
          submittedValues.geographicPlaceNameSourceDetail.higherGeographicPlaces.push(
            srcAdminLevel
          );
        }
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
    attachedMetadatasUI,
    collectingEventFormSchema
  };
}

function useCollectingEventFormSchema() {
  const { formatMessage, locale } = useDinaIntl();

  return useMemo(() => {
    const datePrecision = [4, 6, 8, 12, 14, 17];
    function isValidDatePrecision(value?: string) {
      return Boolean(
        value && datePrecision.includes(value.replace(/([^\d]+)/g, "").length)
      );
    }

    function decimal(label: string) {
      return yup
        .number()
        .nullable()
        .notRequired()
        .typeError(formatMessage("mustBeValidDecimalValue"))
        .label(label);
    }

    function integer(label: string) {
      return yup
        .number()
        .integer()
        .nullable()
        .notRequired()
        .typeError(formatMessage("mustBeValidIntegerValue"))
        .label(label);
    }

    const geoAssertionFormSchema: yup.SchemaOf<
      Pick<
        GeoReferenceAssertion,
        | "dwcDecimalLatitude"
        | "dwcDecimalLongitude"
        | "dwcCoordinateUncertaintyInMeters"
      >
    > = yup.object({
      dwcDecimalLatitude: decimal(formatMessage("field_dwcDecimalLatitude"))
        .min(-90)
        .max(90),
      dwcDecimalLongitude: decimal(formatMessage("field_dwcDecimalLongitude"))
        .min(-180)
        .max(180),
      dwcCoordinateUncertaintyInMeters: integer(
        formatMessage("field_dwcCoordinateUncertaintyInMeters")
      )
    });

    /** Form validation schema. */
    const collectingEventFormSchema: yup.SchemaOf<
      Pick<
        CollectingEvent,
        "startEventDateTime" | "endEventDateTime" | "geoReferenceAssertions"
      >
    > = yup.object({
      startEventDateTime: yup
        .string()
        .required(formatMessage("field_collectingEvent_startDateTimeError"))
        .test({
          test: isValidDatePrecision,
          message: formatMessage("field_collectingEvent_startDateTimeError")
        }),
      endEventDateTime: yup
        .string()
        .nullable()
        .test({
          test: val => (val ? isValidDatePrecision(val) : true),
          message: formatMessage("field_collectingEvent_endDateTimeError")
        }),
      geoReferenceAssertions: yup.array().of(geoAssertionFormSchema as any)
    });

    return collectingEventFormSchema;
  }, [locale]);
}
