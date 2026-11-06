import { Dispatch, SetStateAction, useState } from "react";
import { IFileWithMeta, SaveArgs, useAccount, useApiClient } from "common-ui";
import { SequencingRunItem } from "./useMolecularAnalysisRun";
import { MolecularAnalysisResult } from "../../types/seqdb-api/resources/molecular-analysis/MolecularAnalysisResult";
import { MolecularAnalysisRunItem } from "../../types/seqdb-api/resources/molecular-analysis/MolecularAnalysisRunItem";
import { useWorkbookConversion } from "../workbook/utils/useWorkbookConversion";
import { toTabularResults } from "./tabularResultsUtils";

export interface UseTabularResultsUploadProps {
  sequencingRunItem: SequencingRunItem;
  setSequencingRunItems?: Dispatch<
    SetStateAction<SequencingRunItem[] | undefined>
  >;
}

/**
 * Handles uploading/replacing/removing the TSV of a single run item. The file is parsed by the
 * workbook converter and only the parsed table is saved on the run item's result.
 */
export function useTabularResultsUpload({
  sequencingRunItem,
  setSequencingRunItems
}: UseTabularResultsUploadProps) {
  const { save } = useApiClient();
  const { groupNames, username } = useAccount();
  const { convertWorkbookFile } = useWorkbookConversion();

  const [status, setStatus] = useState<"idle" | "busy" | "error">("idle");
  const [fileName, setFileName] = useState<string>("");

  /** This will update the table row in memory and not trigger a full reload of the table. */
  function patchRow(result: MolecularAnalysisResult) {
    setSequencingRunItems?.((previous) =>
      previous?.map((item) =>
        item.molecularAnalysisRunItem?.id ===
        sequencingRunItem.molecularAnalysisRunItem?.id
          ? {
              ...item,
              molecularAnalysisRunItem: {
                ...item.molecularAnalysisRunItem!,
                result
              }
            }
          : item
      )
    );
  }

  async function saveTabularResults(
    tabularResults: MolecularAnalysisResult["tabularResults"]
  ) {
    const runItem = sequencingRunItem.molecularAnalysisRunItem;
    const existingResult = runItem?.result;

    // If an existing result exists, update it with the new tabular results.
    if (existingResult?.id) {
      await save<MolecularAnalysisResult>(
        [
          {
            type: "molecular-analysis-result",
            resource: {
              id: existingResult.id,
              type: "molecular-analysis-result",
              tabularResults
            }
          } as SaveArgs<MolecularAnalysisResult>
        ],
        { apiBaseUrl: "/seqdb-api" }
      );
      patchRow({ ...existingResult, tabularResults });
      return;
    }

    // If no existing result exists, create a new one and link it to the run item.
    const [savedResult] = await save<MolecularAnalysisResult>(
      [
        {
          type: "molecular-analysis-result",
          resource: {
            type: "molecular-analysis-result",
            group: groupNames?.[0],
            createdBy: username,
            tabularResults
          }
        } as SaveArgs<MolecularAnalysisResult>
      ],
      { apiBaseUrl: "/seqdb-api" }
    );

    // Link the newly created result to the run item.
    await save<MolecularAnalysisRunItem>(
      [
        {
          type: "molecular-analysis-run-item",
          resource: {
            ...runItem,
            relationships: {
              result: {
                data: { id: savedResult.id, type: "molecular-analysis-result" }
              }
            }
          }
        } as any
      ],
      { apiBaseUrl: "/seqdb-api" }
    );
    patchRow({
      id: savedResult.id,
      type: "molecular-analysis-result",
      attachments: [],
      tabularResults
    } as MolecularAnalysisResult);
  }

  /** Upload (or replace) with a file. Resolves true when parsed and saved. */
  async function submit(file: File): Promise<boolean> {
    setFileName(file.name);
    setStatus("busy");
    try {
      const converted = await convertWorkbookFile([{ file } as IFileWithMeta]);
      const tabularResults = toTabularResults(converted);
      if (!tabularResults) {
        setStatus("error");
        return false;
      }
      await saveTabularResults(tabularResults);
      setStatus("idle");
      return true;
    } catch (error) {
      console.error(error);
      setStatus("error");
      return false;
    }
  }

  async function remove(): Promise<boolean> {
    try {
      await saveTabularResults(null);
      setStatus("idle");
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  return {
    status,
    fileName,
    submit,
    remove
  };
}
