import { useLocalStorage } from "@rehooks/local-storage";
import {
  processExtensionValuesLoading,
  processExtensionValuesSaving,
  useApiClient,
  useQuery
} from "common-ui";
import { FormikContextType } from "formik";
import { PersistedResource } from "kitsu";
import { compact, omit, orderBy, toPairs } from "lodash";
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
          data.extensionValuesForm = processExtensionValuesLoading(
            data.extensionValues
          );
          delete data.extensionValues;
        }
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
    // Init relationships object for one-to-many relations:
    (submittedValues as any).relationships = {};

    // handle converting to relationship manually due to crnk bug
    if (
      submittedValues &&
      submittedValues.collectors &&
      submittedValues.collectors.length > 0
    ) {
      (submittedValues as any).relationships.collectors = {
        data: submittedValues?.collectors.map((collector) => ({
          id: collector.id,
          type: "person"
        }))
      };
    }
    delete submittedValues.collectors;

    if ((submittedValues.collectorGroups as any)?.id)
      submittedValues.collectorGroupUuid = (
        submittedValues.collectorGroups as any
      ).id;
    delete submittedValues.collectorGroups;

    // Treat empty array or undefined as null:
    if (!submittedValues.otherRecordNumbers?.length) {
      submittedValues.otherRecordNumbers = null as any;
    }

    // Add attachments if they were selected:
    (submittedValues as any).relationships.attachment = {
      data:
        submittedValues.attachment?.map((it) => ({
          id: it.id,
          type: it.type
        })) ?? []
    };
    // Delete the 'attachment' attribute because it should stay in the relationships field:
    delete submittedValues.attachment;

    // Convert georeferenceByAgents to relationship
    if (
      submittedValues.geoReferenceAssertions &&
      submittedValues.geoReferenceAssertions.length > 0
    ) {
      for (const assertion of submittedValues.geoReferenceAssertions) {
        const referenceBy = assertion.georeferencedBy;
        if (referenceBy && typeof referenceBy !== "string") {
          assertion.georeferencedBy = referenceBy.map((it) =>
            typeof it !== "string" ? it.id : (null as any)
          );
        }
      }
    }

    // Parse srcAdminLevels to geographicPlaceNameSourceDetail
    // Reset the 3 fields which should be updated with user address entries : srcAdminLevels
    const srcDetail = submittedValues.geographicPlaceNameSourceDetail;
    const srcAdminLevels = submittedValues.srcAdminLevels;

    if (srcDetail) {
      srcDetail.higherGeographicPlaces = null as any;
      srcDetail.selectedGeographicPlace = null as any;
      srcDetail.customGeographicPlace = null as any;
    }

    if (srcAdminLevels && srcAdminLevels.length > 0 && srcDetail) {
      const sectionIds = toPairs(submittedValues.selectedSections)
        .filter((pair) => pair[1])
        .map((pair) => pair[0]);
      if (srcAdminLevels.length > 1) srcDetail.higherGeographicPlaces = [];
      srcAdminLevels
        .filter((srcAdminLevel) => srcAdminLevel)
        .map((srcAdminLevel, idx) => {
          const srcAdminLevelName = srcAdminLevel?.name;
          // remove the braceket from placeName
          const typeStart = srcAdminLevelName?.indexOf("[");
          srcAdminLevel.name = srcAdminLevelName
            ?.slice(0, typeStart !== -1 ? typeStart : srcAdminLevelName.length)
            .trim();
          // the first one can either be selectedGeographicPlace or customGeographicPlace
          // when the entry only has name in it, it is user entered customPlaceName entry
          // when the enry does not have osm_id, it will be saved as customPlaceName (e.g central experimental farm)
          if (idx === 0) {
            if (!srcAdminLevel.id) {
              srcDetail.customGeographicPlace = srcAdminLevel.name;
            } else {
              if (
                sectionIds.filter(
                  (id) => id === srcAdminLevel.shortId?.toString()
                ).length
              )
                srcDetail.selectedGeographicPlace = omit(srcAdminLevel, [
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
              srcDetail.higherGeographicPlaces?.push(
                omit(srcAdminLevel, ["shortId", "type"])
              );
            }
          }
        });
    }
    delete submittedValues.srcAdminLevels;
    delete submittedValues.selectedSections;

    // Remove the coord system for new Collecting events with no coordinates specified:
    if (
      !submittedValues.id &&
      !submittedValues.dwcVerbatimCoordinates?.trim?.() &&
      !submittedValues.dwcVerbatimLatitude?.trim?.() &&
      !submittedValues.dwcVerbatimLongitude?.trim?.()
    ) {
      submittedValues.dwcVerbatimCoordinateSystem = null;
    }
    if (submittedValues.extensionValuesForm) {
      submittedValues.extensionValues = processExtensionValuesSaving(
        submittedValues.extensionValuesForm
      );
    }
    delete submittedValues.extensionValuesForm;

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
