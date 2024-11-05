import { SeqReaction } from "packages/dina-ui/types/seqdb-api";
import { MolecularAnalysisRunItem } from "packages/dina-ui/types/seqdb-api/resources/MolecularAnalysisRunItem";
import { useState } from "react";

export interface UseMolecularAnalysisRunProps {
  seqBatchId: string;
  editMode: boolean;
  performSave: boolean;
}

/**
 * Represents data to be displayed in the table.
 */
export interface SequencingRunContents {
  primaryId: string;
  coordinates: string;
  tubeNumber: string;
}

export interface UseMolecularAnalysisRunReturn {
  /**
   * Used to display if the network calls are still in progress.
   */
  loading: boolean;

  /**
   * Only 1 MolecularAnalysisRun should be present for each SeqBatch, if multiple are found this
   * will return true and a warning can be displayed in the UI.
   */
  multipleRunWarning: boolean;

  /**
   * If a sequencing run exists, a name will be returned. Otherwise it will be undefined if not
   * created yet.
   */
  sequencingRunName?: string;

  /**
   * Locally sets the sequencing run name. Changing this does not automatically update the run
   * name. Once a save is performed, then it's saved/created.
   *
   * @param newName New name to use.
   */
  setSequencingRunName: (newName: string) => void;

  /**
   * Once all the data is loaded in, the contents will be returned to be displayed in the table.
   *
   * Undefined if no data is available yet.
   */
  sequencingRunContents?: SequencingRunContents[];
}

export function useMolecularAnalysisRun({}: UseMolecularAnalysisRunProps): UseMolecularAnalysisRunReturn {
  // Used to display if the network calls are still in progress.
  const [loading, setLoading] = useState<boolean>(true);
  const [multipleRunWarning, setMultipleRunWarning] = useState<boolean>(false);
  const [sequencingRunName, setSequencingRunName] = useState<string>();

  // Run Items and Storage Unit are included
  const [seqReactions, setSeqReactions] = useState<SeqReaction[]>();

  // Run and result are included with these.
  const [molecularAnalysisRunItems, setMolecularAnalysisRunItems] =
    useState<MolecularAnalysisRunItem[]>();

  const [sequencingRunContents, setSequencingRunContents] =
    useState<SequencingRunContents[]>();

  return {
    loading,
    multipleRunWarning,
    sequencingRunName,
    setSequencingRunName,
    sequencingRunContents
  };
}
