import { useLocalStorage } from "@rehooks/local-storage";
import {
  processExtensionValuesLoading,
  processExtensionValuesSaving,
  useApiClient,
  useQuery,
  useSubmitHandler
} from "common-ui";
import { PersistedResource } from "kitsu";
import _ from "lodash";
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

  const collectingEventQuery = useQuery<CollectingEvent>(
    {
      path: `collection-api/collecting-event/${id}?include=collectors,attachment,collectionMethod,protocol,expedition`,
      header: { "include-dina-permission": "true" }
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
              assertion.georeferencedBy = _.compact(
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
        data.geoReferenceAssertions = _.orderBy(
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
        data.srcAdminLevels = srcAdminLevels;

        // Process loaded back-end data into data structure that Forkmiks can use
        if (data.extensionValues) {
          data.extensionValues = processExtensionValuesLoading(
            data.extensionValues
          );
        }
        data.attachment = _.uniqBy(data.attachment, "id");
        data.collectors = _.uniqBy(data.collectors, "id");
      }
    }
  );

  return collectingEventQuery;
}

interface UseCollectingEventSaveParams {
  fetchedCollectingEvent?: PersistedResource<CollectingEvent>;
  attachmentsConfig?: AllowAttachmentsConfig;
  onSaved?: (saved: PersistedResource<CollectingEvent>) => void | Promise<void>;
}

/** CollectingEvent save method to be re-used by CollectingEvent and MaterialSample forms. */
export function useCollectingEventSave({
  fetchedCollectingEvent,
  onSaved,
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

  // --- TRANSFORMS ---

  // 1. Logic for preparing Geographic Place Name details
  const preparePlaceNameDetails = (values: Partial<CollectingEvent>) => {
    const modified = { ...values };
    const newSourceDetail: any = {
      ...(modified.geographicPlaceNameSourceDetail || {})
    };

    if (modified.srcAdminLevels && modified.srcAdminLevels.length > 0) {
      const sectionIds = _.toPairs((modified as any).selectedSections)
        .filter((pair) => pair[1])
        .map((pair) => pair[0]);

      if (modified.srcAdminLevels.length > 1) {
        newSourceDetail.higherGeographicPlaces = [];
      }

      modified.srcAdminLevels
        .filter((lvl) => lvl)
        .forEach((srcAdminLevel, idx) => {
          if (idx === 0) {
            // First entry: either Custom or Selected
            if (!srcAdminLevel.id) {
              newSourceDetail.customGeographicPlace = srcAdminLevel.name;
              newSourceDetail.selectedGeographicPlace = null;
            } else {
              if (
                sectionIds.includes(srcAdminLevel.shortId?.toString() ?? "")
              ) {
                newSourceDetail.selectedGeographicPlace = _.omit(
                  srcAdminLevel,
                  ["shortId", "type"]
                );
              }
              newSourceDetail.customGeographicPlace = null;
            }
          } else {
            // Subsequent entries: Higher Geog Places
            if (sectionIds.includes(srcAdminLevel.shortId?.toString() ?? "")) {
              newSourceDetail.higherGeographicPlaces?.push(
                _.omit(srcAdminLevel, ["shortId", "type"])
              );
            }
          }
        });
    }

    // Determine if we should update or delete the detail field
    const initialSourceDetail =
      collectingEventInitialValues.geographicPlaceNameSourceDetail ?? null;
    const submittedSourceDetail =
      modified.geographicPlaceNameSourceDetail ?? null;

    // Logic: If creating new OR if calculated details changed
    if (
      !collectingEventInitialValues.id ||
      !_.isEqual(initialSourceDetail, newSourceDetail)
    ) {
      if (Object.keys(newSourceDetail).length > 0) {
        modified.geographicPlaceNameSourceDetail = _.cloneDeep(newSourceDetail);
      } else {
        // Handle deletion case
        if (
          !_.isEqual(initialSourceDetail, submittedSourceDetail) &&
          submittedSourceDetail === null
        ) {
          modified.geographicPlaceNameSourceDetail = undefined;
          (modified as any).geographicPlaceNameSource = null;
        }
      }
    } else {
      // No changes to this complex object, so remove it to avoid sending it in diff
      delete modified.geographicPlaceNameSourceDetail;
    }

    // Cleanup UI fields
    delete modified.srcAdminLevels;
    delete (modified as any).selectedSections;
    delete (modified as any).selectAll;

    return modified;
  };

  // 2. Main Transformation Pipeline
  const saveTransforms = [
    (values: CollectingEvent) => {
      const modified = { ...values };

      // Handle Collector Groups
      if ((modified.collectorGroups as any)?.id) {
        modified.collectorGroupUuid = (modified.collectorGroups as any).id;
      }
      delete modified.collectorGroups;

      // Handle Other Record Numbers
      if (
        modified.otherRecordNumbers &&
        modified.otherRecordNumbers.length === 0
      ) {
        modified.otherRecordNumbers = null as any;
      }

      // Handle GeoReference Assertions (Person Objects -> IDs)
      if (
        modified.geoReferenceAssertions &&
        modified.geoReferenceAssertions.length > 0
      ) {
        modified.geoReferenceAssertions.forEach((assertion) => {
          const referenceBy = assertion.georeferencedBy;
          if (referenceBy && Array.isArray(referenceBy)) {
            assertion.georeferencedBy = referenceBy.map((it: any) =>
              it?.id ? it.id : null
            );
          }
        });
      }

      // Handle Coordinate System cleanup for new records
      if (
        !modified.id &&
        !modified.dwcVerbatimCoordinates?.trim?.() &&
        !modified.dwcVerbatimLatitude?.trim?.() &&
        !modified.dwcVerbatimLongitude?.trim?.()
      ) {
        modified.dwcVerbatimCoordinateSystem = null;
      }

      // Handle Extensions
      if (modified.extensionValues) {
        modified.extensionValues = processExtensionValuesSaving(
          modified.extensionValues
        );
      }

      // Run the Place Name logic
      return preparePlaceNameDetails(modified) as CollectingEvent;
    }
  ];

  // --- SAVE HANDLER ---
  const saveCollectingEvent = useSubmitHandler<CollectingEvent>({
    original: collectingEventInitialValues as CollectingEvent,
    resourceType: "collecting-event",
    saveOptions: { apiBaseUrl: "/collection-api" },
    transforms: saveTransforms,

    // Permissions check: Custom save function wrapper
    saveFn: async (ops, options) => {
      const payload = ops[0].resource;
      // Check permissions
      const permissionsProvided = payload.meta?.permissionsProvider;
      const canEdit = permissionsProvided
        ? payload.meta?.permissions?.includes(
            collectingEventInitialValues.id ? "update" : "create"
          ) ?? false
        : true;

      if (!canEdit) {
        // If no permission, do not call API. Return the payload as if it was saved.
        return [payload];
      }

      // Proceed with normal save
      return save(ops, options);
    },
    onSuccess: async (saved) => {
       if (onSaved) await onSaved(saved);
    },

    relationshipMappings: [
      {
        sourceAttribute: "collectors",
        relationshipName: "collectors",
        removeSourceAttribute: true,
        toRelationshipData: (val) =>
          val?.map((c: any) => ({ id: c.id, type: "person" })) ?? []
      },
      {
        sourceAttribute: "attachment",
        relationshipName: "attachment",
        removeSourceAttribute: true,
        toRelationshipData: (val) =>
          val?.map((a: any) => ({ id: a.id, type: a.type })) ?? []
      },
      {
        sourceAttribute: "expedition",
        relationshipName: "expedition",
        removeSourceAttribute: true,
        toRelationshipData: (val) =>
          val?.id ? [{ id: val.id, type: "collecting-event" }] : [] // Original logic: _.pick(expedition, "id", "type") which implies single object or null
      }
    ]
  });

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
