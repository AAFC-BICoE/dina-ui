import Kitsu, { KitsuResource, PersistedResource } from "kitsu";
import {
  DeleteArgs,
  DoOperationsOptions,
  filterBy,
  SaveArgs,
  useApiClient
} from "../../../common-ui/lib";
import { GenericMolecularAnalysisItem } from "../../types/seqdb-api/resources/GenericMolecularAnalysisItem";
import { useState } from "react";
import {
  MolecularAnalysisRunItem,
  MolecularAnalysisRunItemUsageType
} from "../../types/seqdb-api/resources/molecular-analysis/MolecularAnalysisRunItem";
import { QualityControl } from "../../types/seqdb-api/resources/QualityControl";

/**
 * Handles deleting molecular analysis workflows and unlinking and deleting any associated relationship resources
 * @param resourceIds Molecular Analysis Workflow uuids to be deleted
 */
export function useDeleteMolecularAnalysisWorkflows() {
  const { save, apiClient } = useApiClient();
  // Used to determine if the resource needs to be reloaded.
  const [reloadResource, setReloadResource] = useState<number>(Date.now());

  async function handleDeleteMolecularAnalysisWorkflows(resourceIds: string[]) {
    for (const resourceId of resourceIds) {
      // Get linked GenericMolecularAnalysisItems
      const genericMolecularAnalysisItemsResp = await apiClient.get<
        GenericMolecularAnalysisItem[]
      >(`/seqdb-api/generic-molecular-analysis-item`, {
        filter: filterBy([], {
          extraFilters: [
            {
              selector: "genericMolecularAnalysis.uuid",
              comparison: "==",
              arguments: resourceId
            }
          ]
        })(""),
        include:
          "storageUnitUsage,molecularAnalysisRunItem,molecularAnalysisRunItem.run,molecularAnalysisRunItem.result"
      });

      const genericMolecularAnalysisItems =
        genericMolecularAnalysisItemsResp.data;

      const genericMolecularAnalysisItemIds =
        genericMolecularAnalysisItemsResp.data.map(
          (genericMolecularAnalysisItem) => genericMolecularAnalysisItem.id
        );
      const storageUnitUsageIds: string[] = genericMolecularAnalysisItems
        .map(
          (genericMolecularAnalysisItem) =>
            genericMolecularAnalysisItem.storageUnitUsage?.id
        )
        .filter((id): id is string => id !== undefined);

      // Delete linked GenericMolecularAnalysisItems
      await handleDeleteGenericMolecularAnalysisItems(
        save,
        genericMolecularAnalysisItemIds
      );

      // Delete linked StorageUnitUsage
      await handleDeleteStorageUnitUsage(save, storageUnitUsageIds);

      // Delete MolecularAnalysisRun and MolecularAnalysisRunItems if exist
      if (genericMolecularAnalysisItems?.[0]?.molecularAnalysisRunItem?.id) {
        const molecularAnalysisRunItemIds: string[] =
          genericMolecularAnalysisItems
            .map(
              (genericMolecularAnalysisItem) =>
                genericMolecularAnalysisItem.molecularAnalysisRunItem?.id
            )
            .filter((id): id is string => id !== undefined);

        const molecularAnalysisRunItems = genericMolecularAnalysisItems.map(
          (genericMolecularAnalysisItem) =>
            genericMolecularAnalysisItem.molecularAnalysisRunItem
        );

        for (const molecularAnalysisRunItem of molecularAnalysisRunItems) {
          // Delete Quality Controls
          if (
            molecularAnalysisRunItem?.usageType ===
            MolecularAnalysisRunItemUsageType.QUALITY_CONTROL
          ) {
            await handleDeleteQualityControl(
              save,
              molecularAnalysisRunItem,
              apiClient
            );
          }
        }

        // Delete MolecularAnalysisRunItems
        await handeDeleteMolecularAnalysisRunItems(
          save,
          molecularAnalysisRunItemIds
        );

        // Delete MolecularAnalysisRun
        if (
          genericMolecularAnalysisItems?.[0]?.molecularAnalysisRunItem?.run?.id
        ) {
          await handleDeleteMolecularAnalysisRun(
            save,
            genericMolecularAnalysisItems[0].molecularAnalysisRunItem.run.id
          );
        }
      }
    }
    const molecularAnlysisDeleteArgs: DeleteArgs[] = resourceIds.map(
      (resourceId) => ({
        delete: {
          id: resourceId,
          type: "generic-molecular-analysis"
        }
      })
    );

    // Can delete workflow with protocol linked
    await save(molecularAnlysisDeleteArgs, {
      apiBaseUrl: `/seqdb-api/generic-molecular-analysis/`
    });
    setReloadResource(Date.now());
  }

  return {
    handleDeleteMolecularAnalysisWorkflows,
    reloadResource
  };
}

async function handleDeleteQualityControl(
  save: <TData extends KitsuResource = KitsuResource>(
    args: (SaveArgs | DeleteArgs)[],
    options?: DoOperationsOptions
  ) => Promise<PersistedResource<TData>[]>,
  molecularAnalysisRunItem: MolecularAnalysisRunItem,
  apiClient: Kitsu
) {
  const qualityControlsQuery = await apiClient.get<QualityControl[]>(
    `seqdb-api/quality-control`,
    {
      filter: filterBy([], {
        extraFilters: [
          {
            selector: "molecularAnalysisRunItem.uuid",
            comparison: "==",
            arguments: molecularAnalysisRunItem.id!
          }
        ]
      })(""),
      include: "molecularAnalysisRunItem,molecularAnalysisRunItem.result"
    }
  );
  const qualityControls = qualityControlsQuery.data;
  await save(
    qualityControls.map((item) => ({
      delete: { id: item?.id ?? "", type: "quality-control" }
    })),
    { apiBaseUrl: "/seqdb-api" }
  );

  await save(
    qualityControls.map((item) => ({
      delete: {
        id: item?.molecularAnalysisRunItem?.id ?? "",
        type: "molecular-analysis-run-item"
      }
    })),
    { apiBaseUrl: "/seqdb-api" }
  );

  // Delete molecular analysis results if attachments existed.
  const resultsToDelete = qualityControls.filter(
    (item) =>
      item?.molecularAnalysisRunItem?.result?.attachments &&
      item?.molecularAnalysisRunItem?.result?.attachments.length > 0 &&
      item?.molecularAnalysisRunItem?.result?.id
  );
  if (resultsToDelete.length > 0) {
    await save(
      resultsToDelete.map((item) => {
        return {
          delete: {
            id: item?.molecularAnalysisRunItem?.result?.id ?? "",
            type: "molecular-analysis-result"
          }
        };
      }),
      { apiBaseUrl: "/seqdb-api" }
    );
  }
}

/**
 * Handles making API calls to delete GenericMolecularAnalysisItems
 * @param save From useApiClient
 * @param genericMolecularAnalysisItemIds array of GenericMolecularAnalysisItem ids to be deleted
 */
export async function handleDeleteGenericMolecularAnalysisItems(
  save: <TData extends KitsuResource = KitsuResource>(
    args: (SaveArgs | DeleteArgs)[],
    options?: DoOperationsOptions
  ) => Promise<PersistedResource<TData>[]>,
  genericMolecularAnalysisItemIds: string[]
) {
  await save(
    genericMolecularAnalysisItemIds.map((id) => ({
      delete: {
        id: id,
        type: "generic-molecular-analysis-item"
      }
    })),
    { apiBaseUrl: "/seqdb-api" }
  );
}

/**
 * Handles making API calls to delete StorageUnitUsages
 * @param save From useApiClient
 * @param storageUnitUsageIds array of StorageUnitUsage ids to be deleted
 */
export async function handleDeleteStorageUnitUsage(
  save: <TData extends KitsuResource = KitsuResource>(
    args: (SaveArgs | DeleteArgs)[],
    options?: DoOperationsOptions
  ) => Promise<PersistedResource<TData>[]>,
  storageUnitUsageIds: string[]
) {
  await save(
    storageUnitUsageIds.map((id) => ({
      delete: {
        id: id,
        type: "storage-unit-usage"
      }
    })),
    { apiBaseUrl: "/collection-api" }
  );
}

/**
 * Handles making API calls to delete MolecularAnalysisRunItems
 * @param save From useApiClient
 * @param molecularAnalysisRunItemIdsToDelete array of MolecularAnalysisRunItem ids to be deleted
 */
export async function handeDeleteMolecularAnalysisRunItems(
  save: <TData extends KitsuResource = KitsuResource>(
    args: (SaveArgs | DeleteArgs)[],
    options?: DoOperationsOptions
  ) => Promise<PersistedResource<TData>[]>,
  molecularAnalysisRunItemIdsToDelete: string[]
) {
  await save(
    molecularAnalysisRunItemIdsToDelete.map((id) => ({
      delete: {
        id: id,
        type: "molecular-analysis-run-item"
      }
    })),
    { apiBaseUrl: "/seqdb-api" }
  );
}

/**
 * Handles making API calls to delete MolecularAnalysisRun
 * @param save From useApiClient
 * @param molecularAnalysisRunItemIdsToDelete array of MolecularAnalysisRun id to be deleted
 */
export async function handleDeleteMolecularAnalysisRun(
  save: <TData extends KitsuResource = KitsuResource>(
    args: (SaveArgs | DeleteArgs)[],
    options?: DoOperationsOptions
  ) => Promise<PersistedResource<TData>[]>,
  id: string
) {
  await save(
    [
      {
        delete: {
          id: id,
          type: "molecular-analysis-run"
        }
      }
    ],
    { apiBaseUrl: "/seqdb-api" }
  );
}
