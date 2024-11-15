import {
  DateField,
  DinaForm,
  DinaFormSubmitParams,
  SubmitButton,
  TextField,
  useAccount,
  useDinaFormContext
} from "common-ui";
import { PersistedResource } from "kitsu";
import { useEffect } from "react";
import { GenericMolecularAnalysis } from "packages/dina-ui/types/seqdb-api/resources/GenericMolecularAnalysis";
import { VocabularySelectField } from "../../collection/VocabularySelectField";
import { GroupSelectField } from "../../group-select/GroupSelectField";

export interface MolecularAnalysisDetailsStepProps {
  genericMolecularAnalysisId?: string;
  genericMolecularAnalysis?: GenericMolecularAnalysis;
  onSaved: (
    nextStep: number,
    molecularAnalysisSaved?: PersistedResource<GenericMolecularAnalysis>
  ) => Promise<void>;
  setEditMode: (newValue: boolean) => void;
  performSave: boolean;
  setPerformSave: (newValue: boolean) => void;
}

export function MolecularAnalysisDetailsStep({
  genericMolecularAnalysisId,
  genericMolecularAnalysis,
  onSaved,
  setEditMode,
  performSave,
  setPerformSave
}: MolecularAnalysisDetailsStepProps) {
  const { username } = useAccount();

  // If no Molecular Analysis has been created, automatically go to edit mode.
  useEffect(() => {
    if (!genericMolecularAnalysisId) {
      setEditMode(true);
    }
  }, [genericMolecularAnalysisId]);

  async function onSavedInternal(
    resource: PersistedResource<GenericMolecularAnalysis>
  ) {
    setPerformSave(false);
    await onSaved(1, resource);
  }

  const initialValues = genericMolecularAnalysis || {
    createdBy: username,
    type: "generic-molecular-analysis"
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
  }: DinaFormSubmitParams<
    GenericMolecularAnalysis & { [key: string]: string }
  >) {
    const inputResource = {
      ...submittedValues
    };

    const [savedResource] = await save<GenericMolecularAnalysis>(
      [
        {
          resource: inputResource,
          type: "generic-molecular-analysis"
        }
      ],
      { apiBaseUrl: "/seqdb-api" }
    );
    await onSavedInternal(savedResource);
  }

  return (
    <DinaForm<Partial<GenericMolecularAnalysis>>
      initialValues={initialValues}
      onSubmit={onSubmit}
    >
      {buttonBar}
      <MolecularAnalysisForm />
    </DinaForm>
  );
}

export function MolecularAnalysisForm() {
  const { readOnly } = useDinaFormContext();

  return (
    <div>
      <div className="row">
        <TextField className="col-md-6" name="name" />
        {!readOnly && (
          <GroupSelectField
            name="group"
            enableStoredDefaultGroup={true}
            className="col-md-6"
          />
        )}
        <VocabularySelectField
          className="col-md-6"
          name="analysisType"
          path="seqdb-api/vocabulary/molecularAnalysisType"
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
