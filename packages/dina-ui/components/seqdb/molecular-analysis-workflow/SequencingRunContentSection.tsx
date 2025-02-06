import { CollapsibleSection, ReactTable } from "packages/common-ui/lib";
import { DinaMessage } from "packages/dina-ui/intl/dina-ui-intl";
import { SequencingRunItem } from "./useGenericMolecularAnalysisRun";
import { ColumnDef } from "@tanstack/table-core";
import DataPasteZone from "../../molecular-analysis/DataPasteZone";
import { Dispatch, SetStateAction, useState } from "react";

interface SequencingRunContentSectionProps {
  columns: ColumnDef<SequencingRunItem>[];
  sequencingRunItems: SequencingRunItem[] | undefined;
  editMode?: boolean;
  setMolecularAnalysisRunItemNames:
    | Dispatch<SetStateAction<Record<string, string>>>
    | undefined;
}

export default function SequencingRunContentSection({
  columns,
  sequencingRunItems,
  editMode,
  setMolecularAnalysisRunItemNames
}: SequencingRunContentSectionProps) {
  const [sequencingRunItemsInternal, setSequencingRunItemsInternal] = useState<
    SequencingRunItem[] | undefined
  >(sequencingRunItems);
  const onDataPaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const clipboardData = event.clipboardData.getData("text/plain");
    const names = clipboardData.trim().split("\n");
    const molecularAnalysisRunItemNamesMap = {};
    if (sequencingRunItemsInternal) {
      const newSequencingRunItems = [...sequencingRunItemsInternal];
      newSequencingRunItems?.forEach((sequencingRunitem, index) => {
        const materialSampleId = sequencingRunitem.materialSampleId;
        if (materialSampleId) {
          molecularAnalysisRunItemNamesMap[materialSampleId] = names[index];
          if (!sequencingRunitem.molecularAnalysisRunItem) {
            sequencingRunitem.molecularAnalysisRunItem = {
              type: "molecular-analysis-run-item",
              name: names[index],
              usageType: ""
            };
          } else {
            sequencingRunitem.molecularAnalysisRunItem.name = names[index];
          }
        }
      });
      setSequencingRunItemsInternal(newSequencingRunItems);
      setMolecularAnalysisRunItemNames?.(molecularAnalysisRunItemNamesMap);
    }
  };

  return (
    <div className="col-12 mt-3 mb-3">
      <div className="card p-3">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h2 className="fieldset-h2-adjustment">
            <DinaMessage id="molecularAnalysisRunStep_sequencingRunContent" />
          </h2>
        </div>
        <ReactTable<SequencingRunItem>
          className="-striped mt-2"
          columns={columns}
          data={sequencingRunItems ?? []}
          sort={[{ id: "materialSampleName", desc: false }]}
        />
        {editMode && (
          <div className="mt-3">
            <CollapsibleSection
              id={"pasteRunItemName"}
              headerKey={"pasteRunItemName"}
            >
              <DataPasteZone onDataPaste={onDataPaste} />
            </CollapsibleSection>
          </div>
        )}
      </div>
    </div>
  );
}
