import { SeqReaction } from "../../types/seqdb-api";
import { useState } from "react";
import { filterBy, useApiClient, useQuery } from "common-ui";
import { PersistedResource } from "kitsu";
import { attachGenericMolecularAnalysisItems } from "../seqdb/molecular-analysis-workflow/useGenericMolecularAnalysisRun";
import { GenericMolecularAnalysisItem } from "packages/dina-ui/types/seqdb-api/resources/GenericMolecularAnalysisItem";
import { MolecularAnalysisRunItem } from "packages/dina-ui/types/seqdb-api/resources/molecular-analysis/MolecularAnalysisRunItem";
import { MetagenomicsBatchItem } from "packages/dina-ui/types/seqdb-api/resources/metagenomics/MetagenomicsBatchItem";
import {
  attachMaterialSampleSummaryMetagenomics,
  attachMetagenomicsBatchItem,
  attachPcrBatchItemMetagenomics,
  attachStorageUnitUsageMetagenomics
} from "./useMetagenomicsWorkflowMolecularAnalysisRun";
import { QualityControl } from "packages/dina-ui/types/seqdb-api/resources/QualityControl";
import useVocabularyOptions from "../collection/useVocabularyOptions";
import { useMolecularAnalysisRunColumns } from "./useMolecularAnalysisRunColumns";
import {
  attachMaterialSampleSummary,
  attachPcrBatchItem,
  attachSeqReaction,
  attachStorageUnitUsage,
  SequencingRunItem
} from "./useMolecularAnalysisRun";

export interface UseMolecularAnalysisRunViewProps {
  molecularAnalysisRunId: string;
}

/**
 * Used for the Molecular Analysis Run View page. The Molecular Analysis Run
 * is loaded from the ViewPageLayout component.
 */
export function useMolecularAnalysisRunView({
  molecularAnalysisRunId
}: UseMolecularAnalysisRunViewProps) {
  const { apiClient, bulkGet } = useApiClient();
  const [columns, setColumns] = useState<any[]>([]);
  // Run Items
  const [sequencingRunItems, setSequencingRunItems] =
    useState<SequencingRunItem[]>();
  const [loading, setLoading] = useState<boolean>(true);

  // Quality control items
  const [qualityControls, setQualityControls] = useState<QualityControl[]>([]);
  const { loading: loadingVocabularyItems, vocabOptions: qualityControlTypes } =
    useVocabularyOptions({
      path: "seqdb-api/vocabulary/qualityControlType"
    });
  const molecularAnalysisRunItemQuery = useQuery<MolecularAnalysisRunItem[]>(
    {
      path: `seqdb-api/molecular-analysis-run-item`,
      filter: filterBy([], {
        extraFilters: [
          {
            selector: "run.uuid",
            comparison: "==",
            arguments: molecularAnalysisRunId
          }
        ]
      })("")
    },
    {
      onSuccess: async ({ data: molecularAnalysisRunItems }) => {
        async function fetchSeqReactions() {
          const fetchPaths = molecularAnalysisRunItems.map(
            (molecularAnalysisRunItem) =>
              `seqdb-api/seq-reaction?include=storageUnitUsage,pcrBatchItem,seqPrimer&filter[rsql]=molecularAnalysisRunItem.uuid==${molecularAnalysisRunItem.id}`
          );
          const seqReactions: PersistedResource<SeqReaction>[] = [];
          for (const path of fetchPaths) {
            const seqReaction = await apiClient.get<SeqReaction[]>(path, {});
            seqReactions.push(seqReaction.data[0]);
          }
          return seqReactions;
        }

        async function fetchGenericMolecularAnalysisItems() {
          const fetchPaths = molecularAnalysisRunItems
            .filter((runItem) => runItem.usageType !== "quality-control")
            .map(
              (molecularAnalysisRunItem) =>
                `seqdb-api/generic-molecular-analysis-item?include=storageUnitUsage,materialSample,molecularAnalysisRunItem&filter[rsql]=molecularAnalysisRunItem.uuid==${molecularAnalysisRunItem.id}`
            );
          const genericMolecularAnalysisItems: PersistedResource<GenericMolecularAnalysisItem>[] =
            [];
          for (const path of fetchPaths) {
            const genericMolecularAnalysisItem = await apiClient.get<
              GenericMolecularAnalysisItem[]
            >(path, {});
            genericMolecularAnalysisItems.push(
              genericMolecularAnalysisItem.data[0]
            );
          }
          return genericMolecularAnalysisItems;
        }

        async function fetchMetagenomicsBatchItems() {
          const fetchPaths = molecularAnalysisRunItems.map(
            (molecularAnalysisRunItem) =>
              `seqdb-api/metagenomics-batch-item?include=pcrBatchItem&filter[rsql]=molecularAnalysisRunItem.uuid==${molecularAnalysisRunItem.id}`
          );
          const metagenomicsBatchItems: PersistedResource<MetagenomicsBatchItem>[] =
            [];
          for (const path of fetchPaths) {
            const metagenomicsBatchItem = await apiClient.get<
              MetagenomicsBatchItem[]
            >(path, {});
            metagenomicsBatchItems.push(metagenomicsBatchItem.data[0]);
          }
          return metagenomicsBatchItems;
        }

        const usageType = molecularAnalysisRunItems.filter(
          (runItem) => runItem.usageType !== "quality-control"
        )?.[0]?.usageType;

        if (!usageType) {
          setLoading(false);
          return;
        }

        setColumns(
          useMolecularAnalysisRunColumns({
            type: usageType,
            readOnly: true
          })
        );

        if (usageType === "seq-reaction") {
          let seqReactions = await fetchSeqReactions();
          seqReactions = seqReactions.filter((item) => item !== undefined);

          // Chain it all together to create one object.
          let sequencingRunItemsChain = attachSeqReaction(seqReactions);
          sequencingRunItemsChain = await attachStorageUnitUsage(
            sequencingRunItemsChain,
            bulkGet
          );

          sequencingRunItemsChain = await attachPcrBatchItem(
            sequencingRunItemsChain,
            bulkGet
          );
          sequencingRunItemsChain = await attachMaterialSampleSummary(
            sequencingRunItemsChain,
            bulkGet
          );

          // All finished loading.
          setSequencingRunItems(sequencingRunItemsChain);
          setLoading(false);
        } else if (usageType === "generic-molecular-analysis-item") {
          let genericMolecularAnalysisItems =
            await fetchGenericMolecularAnalysisItems();
          genericMolecularAnalysisItems = genericMolecularAnalysisItems.filter(
            (item) => item !== undefined
          );

          let sequencingRunItemsChain = attachGenericMolecularAnalysisItems(
            genericMolecularAnalysisItems
          );

          sequencingRunItemsChain = await attachStorageUnitUsage(
            sequencingRunItemsChain,
            bulkGet
          );

          sequencingRunItemsChain = await attachMaterialSampleSummary(
            sequencingRunItemsChain,
            bulkGet
          );

          const qualityControlRunItems = molecularAnalysisRunItems.filter(
            (runItem) => runItem.usageType === "quality-control"
          );

          // Get quality controls
          if (qualityControlRunItems && qualityControlRunItems?.length > 0) {
            const newQualityControls: QualityControl[] = [];

            // Go through each quality control run item and then we do a query for each quality control.
            for (const item of qualityControlRunItems) {
              const qualityControlQuery = await apiClient.get<QualityControl>(
                `seqdb-api/quality-control`,
                {
                  filter: filterBy([], {
                    extraFilters: [
                      {
                        selector: "molecularAnalysisRunItem.uuid",
                        comparison: "==",
                        arguments: item?.id
                      }
                    ]
                  })(""),
                  include: "molecularAnalysisRunItem"
                }
              );

              const qualityControlFound = qualityControlQuery
                ?.data?.[0] as QualityControl;
              if (qualityControlFound) {
                newQualityControls.push({
                  ...qualityControlFound
                });
              }
            }

            setQualityControls(newQualityControls);
          }

          // All finished loading.
          setSequencingRunItems(sequencingRunItemsChain);
          setLoading(false);
        } else if (usageType === "metagenomics-batch-item") {
          let metagenomicsBatchItems = await fetchMetagenomicsBatchItems();
          metagenomicsBatchItems = metagenomicsBatchItems.filter(
            (item) => item !== undefined
          );

          // Chain it all together to create one object.
          let sequencingRunItemsChain = attachMetagenomicsBatchItem(
            metagenomicsBatchItems
          );
          sequencingRunItemsChain = await attachPcrBatchItemMetagenomics(
            sequencingRunItemsChain,
            bulkGet
          );
          sequencingRunItemsChain = await attachStorageUnitUsageMetagenomics(
            sequencingRunItemsChain,
            bulkGet
          );
          sequencingRunItemsChain =
            await attachMaterialSampleSummaryMetagenomics(
              sequencingRunItemsChain,
              bulkGet
            );
          // All finished loading.
          setSequencingRunItems(sequencingRunItemsChain);
          setLoading(false);
        }
      }
    }
  );
  return {
    loading:
      molecularAnalysisRunItemQuery.loading ||
      loadingVocabularyItems ||
      loading,
    sequencingRunItems,
    columns,
    qualityControls,
    qualityControlTypes
  };
}
