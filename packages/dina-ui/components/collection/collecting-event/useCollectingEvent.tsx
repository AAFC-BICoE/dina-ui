import { useLocalStorage } from "@rehooks/local-storage";
import {
  isResourceEmpty,
  processExtensionValuesLoading,
  processExtensionValuesSaving,
  resourceDifference,
  useApiClient,
  useQuery
} from "common-ui";
import { FormikContextType } from "formik";
import { PersistedResource } from "kitsu";
import { compact, omit, orderBy, toPairs, isEqual, cloneDeep } from "lodash";
import { useMemo } from "react";
import * as yup from "yup";
import { useDinaIntl } from "../../../intl/dina-ui-intl";
import { CollectingEvent } from "../../../types/collection-api";
import { CoordinateSystemEnum } from "../../../types/collection-api/resources/CoordinateSystem";
import { SourceAdministrativeLevel } from "../../../types/collection-api/resources/GeographicPlaceNameSourceDetail";
import { SRSEnum } from "../../../types/collection-api/resources/SRS";
import { Person } from "../../../types/objectstore-api";
import { AllowAttachmentsConfig } from "../../object-store";
export const DEFAULT_VERBATIM_COORDSYS_KEY = "collecting-event-coord_system";
export const DEFAULT_VERBATIM_SRS_KEY = "collecting-event-srs";
import { uniqBy } from "lodash";

export function useCollectingEventQuery(id?: string | null) {
  const { bulkGet } = useApiClient();

  // TODO disable the fetch query when the ID is undefined.
  const collectingEventQuery = useQuery<CollectingEvent>(
    {
      path: `collection-api/collecting-event/${id}?include=collectors,attachment,collectionMethod,protocol`
    },
    {
      // Return undefined when ID is undefined:
      disabled: !id,
      onSuccess: async ({ data }) => {
        // Do client-side multi-API joins on one-to-many fields:
        if (data.geoReferenceAssertions) {
          // Retrieve georeferencedBy agent arrays on GeoReferenceAssertions.
          for (const assertion of data.geoReferenceAssertions) {
            if (assertion.georeferencedBy) {
              assertion.georeferencedBy = compact(
                await bulkGet<Person, true>(
                  assertion.georeferencedBy.map(
                    (personId: string) => `/person/${personId}`
                  ),
                  {
                    apiBaseUrl: "/agent-api",
                    returnNullForMissingResource: true
                  }
                )
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
          (admn) =>
            (admn.name += admn.placeType ? " [ " + admn.placeType + " ] " : "")
        );
        data.srcAdminLevels = srcAdminLevels;

        // Process loaded back-end data into data structure that Forkmiks can use
        if (data.extensionValues) {
          data.extensionValues = processExtensionValuesLoading(
            data.extensionValues
          );
        }
        data.attachment = uniqBy(data.attachment, "id");
        data.collectors = uniqBy(data.collectors, "id");
      }
    }
  );

  return collectingEventQuery;
}

interface UseCollectingEventSaveParams {
  fetchedCollectingEvent?: PersistedResource<CollectingEvent>;
  attachmentsConfig?: AllowAttachmentsConfig;
}

/** CollectingEvent save method to be re-used by CollectingEvent and MaterialSample forms. */
export function useCollectingEventSave({
  fetchedCollectingEvent,
  attachmentsConfig
}: UseCollectingEventSaveParams) {
  const { save } = useApiClient();
  const collectingEventFormSchema = useCollectingEventFormSchema();

  const [defaultVerbatimCoordSys] = useLocalStorage<string | null | undefined>(
    DEFAULT_VERBATIM_COORDSYS_KEY
  );

  const [defaultVerbatimSRS] = useLocalStorage<string | null | undefined>(
    DEFAULT_VERBATIM_SRS_KEY
  );

  const collectingEventInitialValues: Partial<CollectingEvent> =
    fetchedCollectingEvent
      ? {
          ...fetchedCollectingEvent,
          geoReferenceAssertions:
            fetchedCollectingEvent.geoReferenceAssertions ?? [],
          srcAdminLevels: fetchedCollectingEvent.srcAdminLevels
        }
      : {
          type: "collecting-event",
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
          publiclyReleasable: true
        };

  async function saveCollectingEvent(
    submittedValues: CollectingEvent,
    collectingEventFormik: FormikContextType<any>
  ) {
    // Only submit the changed values to the back-end:
    const collectingEventDiff = collectingEventInitialValues.id
      ? resourceDifference({
          original: collectingEventInitialValues as CollectingEvent,
          updated: submittedValues
        })
      : submittedValues;

    // Init relationships object for one-to-many relations:
    (collectingEventDiff as any).relationships = {};

    // handle converting to relationship manually due to crnk bug
    if (
      collectingEventDiff &&
      collectingEventDiff.collectors &&
      collectingEventDiff.collectors.length > 0
    ) {
      (collectingEventDiff as any).relationships.collectors = {
        data: collectingEventDiff?.collectors.map((collector) => ({
          id: collector.id,
          type: "person"
        }))
      };
    }
    delete collectingEventDiff.collectors;

    if ((collectingEventDiff.collectorGroups as any)?.id)
      collectingEventDiff.collectorGroupUuid = (
        collectingEventDiff.collectorGroups as any
      ).id;
    delete collectingEventDiff.collectorGroups;

    // If going from an array of other record numbers to empty, set it null.
    if (
      collectingEventDiff?.otherRecordNumbers &&
      collectingEventDiff.otherRecordNumbers.length === 0
    ) {
      collectingEventDiff.otherRecordNumbers = null as any;
    }

    // Add attachments if they were selected:
    if (collectingEventDiff?.attachment) {
      (collectingEventDiff as any).relationships.attachment = {
        data:
          collectingEventDiff.attachment?.map((it) => ({
            id: it.id,
            type: it.type
          })) ?? []
      };

      // Delete the 'attachment' attribute because it should stay in the relationships field:
      delete collectingEventDiff.attachment;
    }

    // Convert georeferenceByAgents to relationship
    if (
      collectingEventDiff.geoReferenceAssertions &&
      collectingEventDiff.geoReferenceAssertions.length > 0
    ) {
      for (const assertion of collectingEventDiff.geoReferenceAssertions) {
        const referenceBy = assertion.georeferencedBy;
        if (referenceBy && typeof referenceBy !== "string") {
          assertion.georeferencedBy = referenceBy.map((it) =>
            typeof it !== "string" ? it.id : (null as any)
          );
        }
      }
    }

    // First create a copy of what would be the new geographicPlaceNameSourceDetail
    const newSourceDetail = {
      ...(collectingEventDiff.geographicPlaceNameSourceDetail || {})
    } as any;

    if (
      collectingEventDiff.srcAdminLevels &&
      collectingEventDiff.srcAdminLevels.length > 0
    ) {
      // Parse srcAdminLevels to geographicPlaceNameSourceDetail
      // Reset the 3 fields which should be updated with user address entries : srcAdminLevels
      const sectionIds = toPairs(collectingEventDiff.selectedSections)
        .filter((pair) => pair[1])
        .map((pair) => pair[0]);

      if (collectingEventDiff.srcAdminLevels.length > 1)
        newSourceDetail.higherGeographicPlaces = [];

      collectingEventDiff.srcAdminLevels
        .filter((srcAdminLevel) => srcAdminLevel)
        .map((srcAdminLevel, idx) => {
          // the first one can either be selectedGeographicPlace or customGeographicPlace
          // when the entry only has name in it, it is user entered customPlaceName entry
          // when the enry does not have osm_id, it will be saved as customPlaceName (e.g central experimental farm)
          if (idx === 0) {
            if (!srcAdminLevel.id) {
              newSourceDetail.customGeographicPlace = srcAdminLevel.name;
            } else {
              if (
                sectionIds.filter(
                  (id) => id === srcAdminLevel.shortId?.toString()
                ).length
              )
                newSourceDetail.selectedGeographicPlace = omit(srcAdminLevel, [
                  "shortId",
                  "type"
                ]);
            }
          } else {
            if (
              sectionIds.filter(
                (id) => id === srcAdminLevel.shortId?.toString()
              ).length
            ) {
              newSourceDetail.higherGeographicPlaces?.push(
                omit(srcAdminLevel, ["shortId", "type"])
              );
            }
          }
        });
    }

    // Only apply changes if different from initial values or if creating a new record
    if (
      !collectingEventInitialValues.id || // For new collecting events
      !isEqual(
        collectingEventInitialValues.geographicPlaceNameSourceDetail,
        newSourceDetail
      )
    ) {
      if (Object.keys(newSourceDetail).length > 0) {
        // Clean place names before saving
        const cleanedSourceDetail = cloneDeep(newSourceDetail);

        // Clean the selectedGeographicPlace name
        if (cleanedSourceDetail.selectedGeographicPlace?.name) {
          const name = cleanedSourceDetail.selectedGeographicPlace.name;
          const typeStart = name.indexOf("[");
          cleanedSourceDetail.selectedGeographicPlace.name =
            typeStart !== -1 ? name.slice(0, typeStart).trim() : name.trim();
        }

        // Clean the higherGeographicPlaces names
        if (cleanedSourceDetail.higherGeographicPlaces?.length) {
          cleanedSourceDetail.higherGeographicPlaces =
            cleanedSourceDetail.higherGeographicPlaces.map((place) => {
              if (place.name) {
                const typeStart = place.name.indexOf("[");
                place.name =
                  typeStart !== -1
                    ? place.name.slice(0, typeStart).trim()
                    : place.name.trim();
              }
              return place;
            });
        }

        // Save the cleaned data
        collectingEventDiff.geographicPlaceNameSourceDetail =
          cleanedSourceDetail;
      } else if (
        collectingEventFormik?.values?.geographicPlaceNameSourceDetail === null
      ) {
        (collectingEventDiff.geographicPlaceNameSourceDetail as any) = null;
      }
    } else {
      // If no changes, remove this field from the diff
      delete collectingEventDiff.geographicPlaceNameSourceDetail;
    }

    delete collectingEventDiff.srcAdminLevels;
    delete collectingEventDiff.selectedSections;
    delete (collectingEventDiff as any).selectAll;

    // Remove the coord system for new Collecting events with no coordinates specified:
    if (
      !collectingEventDiff.id &&
      !collectingEventDiff.dwcVerbatimCoordinates?.trim?.() &&
      !collectingEventDiff.dwcVerbatimLatitude?.trim?.() &&
      !collectingEventDiff.dwcVerbatimLongitude?.trim?.()
    ) {
      collectingEventDiff.dwcVerbatimCoordinateSystem = null;
    }

    if (collectingEventDiff.extensionValues) {
      collectingEventDiff.extensionValues = processExtensionValuesSaving(
        collectingEventDiff.extensionValues
      );
    }

    // If the relationship section is empty, remove it from the query.
    if (Object.keys((collectingEventDiff as any).relationships).length === 0) {
      delete (collectingEventDiff as any).relationships;
    }

    // Do not perform any request if it's empty...
    if (isResourceEmpty(collectingEventDiff)) {
      collectingEventFormik.setFieldValue("id", collectingEventDiff.id);
      return collectingEventDiff as PersistedResource<CollectingEvent>;
    }

    const [savedCollectingEvent] = await save<CollectingEvent>(
      [
        {
          resource: collectingEventDiff,
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
    attachmentsConfig,
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

    /** Form validation schema. */
    const collectingEventFormSchema: yup.SchemaOf<
      Pick<CollectingEvent, "startEventDateTime" | "endEventDateTime">
    > = yup.object({
      startEventDateTime: yup
        .string()
        .nullable()
        .test({
          test: (val) => (val ? isValidDatePrecision(val) : true),
          message: formatMessage("field_collectingEvent_startDateTimeError")
        }),
      endEventDateTime: yup
        .string()
        .nullable()
        .test({
          test: (val) => (val ? isValidDatePrecision(val) : true),
          message: formatMessage("field_collectingEvent_endDateTimeError")
        })
    });

    return collectingEventFormSchema;
  }, [locale]);
}
