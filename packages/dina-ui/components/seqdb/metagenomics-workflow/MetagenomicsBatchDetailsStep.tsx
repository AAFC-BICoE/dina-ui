import {
  DateField,
  DinaForm,
  DinaFormSubmitParams,
  filterBy,
  ResourceSelectField,
  SubmitButton,
  TextField,
  useAccount,
  useDinaFormContext
} from "common-ui";
import { PersistedResource } from "kitsu";
import { useEffect } from "react";
import { GroupSelectField } from "../../group-select/GroupSelectField";
import { Protocol } from "packages/dina-ui/types/collection-api";
import { MetagenomicsBatch } from "packages/dina-ui/types/seqdb-api/resources/metagenomics/MetagenomicsBatch";
import { IndexSet } from "packages/dina-ui/types/seqdb-api";

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
}

export function MetagenomicsBatchDetailsStep({
  metagenomicsBatchId,
  metagenomicsBatch,
  onSaved,
  editMode,
  setEditMode,
  performSave,
  setPerformSave
}: MetagenomicsBatchDetailsStepProps) {
  const { username } = useAccount();

  // If no Molecular Analysis has been created, automatically go to edit mode.
  useEffect(() => {
    if (!metagenomicsBatchId) {
      setEditMode(true);
    }
  }, [metagenomicsBatchId]);

  async function onSavedInternal(
    resource: PersistedResource<MetagenomicsBatch>
  ) {
    setPerformSave(false);
    await onSaved(1, resource);
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

    const [savedResource] = await save<MetagenomicsBatch>(
      [
        {
          resource: inputResource,
          type: "metagenomics-batch"
        }
      ],
      { apiBaseUrl: "/seqdb-api" }
    );
    await onSavedInternal(savedResource);
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
          filter={filterBy(["name"], {
            extraFilters: [
              {
                selector: "protocolType",
                comparison: "==",
                arguments: "molecular_analysis"
              }
            ]
          })}
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
