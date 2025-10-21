import {
  DateField,
  DinaForm,
  DinaFormSubmitParams,
  filterBy,
  ResourceSelectField,
  SaveArgs,
  SimpleSearchFilterBuilder,
  SubmitButton,
  TextField,
  useAccount,
  useApiClient,
  useDinaFormContext
} from "common-ui";
import { PersistedResource } from "kitsu";
import { useEffect, useState } from "react";
import { GroupSelectField } from "../../group-select/GroupSelectField";
import { Protocol } from "../../../types/collection-api";
import { MetagenomicsBatch } from "../../../types/seqdb-api/resources/metagenomics/MetagenomicsBatch";
import { IndexSet, PcrBatch, PcrBatchItem } from "../../../types/seqdb-api";
import { MetagenomicsBatchItem } from "../../../types/seqdb-api/resources/metagenomics/MetagenomicsBatchItem";

export interface MetagenomicsBatchDetailsStepProps {
  metagenomicsBatchId?: string;
  metagenomicsBatch?: MetagenomicsBatch;
  onSaved: (
    nextStep: number,
    metagenomicsBatch?: PersistedResource<MetagenomicsBatch>
  ) => Promise<void>;
  editMode: boolean;
  setEditMode: (newValue: boolean) => void;
  performSave: boolean;
  setPerformSave: (newValue: boolean) => void;
  pcrBatch?: PcrBatch;
}

export function MetagenomicsBatchDetailsStep({
  metagenomicsBatchId,
  metagenomicsBatch,
  onSaved,
  editMode,
  setEditMode,
  performSave,
  setPerformSave,
  pcrBatch
}: MetagenomicsBatchDetailsStepProps) {
  const { username } = useAccount();
  const { apiClient } = useApiClient();
  const [pcrBatchItems, setPcrBatchItems] = useState<PcrBatchItem[]>([]);

  /**
   * Retrieve all of the PCR Batch Items that are associated with the PCR Batch from step 1.
   */
  async function fetchPcrBatchItems() {
    await apiClient
      .get<PcrBatchItem[]>("/seqdb-api/pcr-batch-item", {
        filter: filterBy([], {
          extraFilters: [
            {
              selector: "pcrBatch.uuid",
              comparison: "==",
              arguments: pcrBatch!.id!
            }
          ]
        })("")
      })
      .then((response) => {
        setPcrBatchItems(response?.data);
      });
  }

  // If no Metagenomics Batch has been created, automatically go to edit mode.
  useEffect(() => {
    if (!metagenomicsBatchId) {
      setEditMode(true);
    }
  }, [metagenomicsBatchId]);

  /**
   * When the page is first loaded, get PcrBatchItems
   */
  useEffect(() => {
    fetchPcrBatchItems();
  }, [editMode]);

  async function onSavedInternal(
    resource: PersistedResource<MetagenomicsBatch>
  ) {
    setPerformSave(false);
    await onSaved(5, resource);
  }

  const initialValues = metagenomicsBatch || {
    createdBy: username,
    type: "metagenomics-batch"
  };

  const buttonBar = (
    <>
      <SubmitButton
        className="hidden"
        performSave={performSave}
        setPerformSave={setPerformSave}
      />
    </>
  );

  async function onSubmit({
    submittedValues,
    api: { save }
  }: DinaFormSubmitParams<MetagenomicsBatch & { [key: string]: string }>) {
    const inputResource = {
      ...submittedValues
    };
    // Save MetagenomicsBatch
    const [savedMetagenomicsBatch] = await save<MetagenomicsBatch>(
      [
        {
          resource: inputResource,
          type: "metagenomics-batch"
        }
      ],
      { apiBaseUrl: "/seqdb-api" }
    );

    // Save MetagenomicsBatchItems
    const metagenomicsBatchItemSaveArgs: SaveArgs<MetagenomicsBatchItem>[] =
      pcrBatchItems.map((pcrBatchItem) => {
        return {
          type: "metagenomics-batch-item",
          resource: {
            type: "metagenomics-batch-item",
            relationships: {
              metagenomicsBatch: {
                data: {
                  id: savedMetagenomicsBatch.id,
                  type: "metagenomics-batch"
                }
              },
              pcrBatchItem: {
                data: {
                  id: pcrBatchItem.id,
                  type: "pcr-batch-item"
                }
              }
            }
          }
        };
      });

    await save<MetagenomicsBatchItem>(metagenomicsBatchItemSaveArgs, {
      apiBaseUrl: "/seqdb-api"
    });

    await onSavedInternal(savedMetagenomicsBatch);
  }

  return (
    <DinaForm<Partial<MetagenomicsBatch>>
      initialValues={initialValues}
      onSubmit={onSubmit}
      readOnly={!editMode}
    >
      {buttonBar}
      <MetagenomicsBatchForm />
    </DinaForm>
  );
}

export function MetagenomicsBatchForm() {
  const { readOnly } = useDinaFormContext();

  return (
    <div>
      <div className="row">
        <TextField className="col-md-6" name="name" />
        <GroupSelectField
          name="group"
          enableStoredDefaultGroup={true}
          className="col-md-6"
        />
      </div>
      <div className="row">
        <ResourceSelectField<Protocol>
          className="col-md-6"
          name="protocol"
          filter={(searchValue: string) =>
            SimpleSearchFilterBuilder.create<Protocol>()
              .searchFilter("name", searchValue)
              .where("protocolType", "EQ", "molecular_analysis")
              .build()
          }
          model="collection-api/protocol"
          optionLabel={(protocol) => protocol.name}
          readOnlyLink="/collection/protocol/view?id="
        />
        <ResourceSelectField<IndexSet>
          className="col-md-6"
          name="indexSet"
          filter={filterBy(["name"])}
          model="seqdb-api/index-set"
          optionLabel={(set) => set.name}
          readOnlyLink="/seqdb/index-set/view?id="
        />
      </div>
      {readOnly && (
        <div className="row">
          <DateField className="col-md-6" name="createdOn" />
          <TextField className="col-md-6" name="createdBy" />
        </div>
      )}
    </div>
  );
}
