import { CollapsibleSection, ReactTable } from "../../../../common-ui/lib";
import { DinaMessage } from "../../../intl/dina-ui-intl";
import { SequencingRunItem } from "./useGenericMolecularAnalysisRun";
import { ColumnDef, Row } from "@tanstack/table-core";
import DataPasteZone from "../../molecular-analysis/DataPasteZone";
import { Dispatch, SetStateAction, useState } from "react";
import { Button } from "react-bootstrap";

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
  const [rowModel, setRowModel] = useState<
    Row<SequencingRunItem>[] | undefined
  >([]);
  const onDataPaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const clipboardData = event.clipboardData.getData("text/plain");
    const names = clipboardData.trim().split("\n");
    const molecularAnalysisRunItemNamesMap = {};
    if (rowModel) {
      const newSequencingRunItemRows = [...rowModel];
      newSequencingRunItemRows?.forEach((sequencingRunitem, index) => {
        const materialSampleId = sequencingRunitem.original.materialSampleId;
        if (materialSampleId) {
          molecularAnalysisRunItemNamesMap[materialSampleId] = names[index];
          if (!sequencingRunitem.original.molecularAnalysisRunItem) {
            sequencingRunitem.original.molecularAnalysisRunItem = {
              type: "molecular-analysis-run-item",
              name: names[index],
              usageType: ""
            };
          } else {
            sequencingRunitem.original.molecularAnalysisRunItem.name =
              names[index];
          }
        }
      });
      setRowModel(newSequencingRunItemRows);
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
          {editMode && (
            <Button
              className="btn btn-primary"
              onClick={() => {
                if (rowModel) {
                  const molecularAnalysisRunItemNamesMap = {};
                  const newSequencingRunItemRows = [...rowModel];
                  newSequencingRunItemRows?.forEach((sequencingRunitem) => {
                    const materialSampleId =
                      sequencingRunitem.original.materialSampleId;
                    if (materialSampleId) {
                      molecularAnalysisRunItemNamesMap[materialSampleId] = "";
                      if (
                        !sequencingRunitem.original.molecularAnalysisRunItem
                      ) {
                        sequencingRunitem.original.molecularAnalysisRunItem = {
                          type: "molecular-analysis-run-item",
                          name: "",
                          usageType: ""
                        };
                      } else {
                        sequencingRunitem.original.molecularAnalysisRunItem.name =
                          "";
                      }
                    }
                  });
                  setRowModel(newSequencingRunItemRows);
                  setMolecularAnalysisRunItemNames?.(
                    molecularAnalysisRunItemNamesMap
                  );
                }
              }}
            >
              <DinaMessage id="clearAllNamesButtonText" />
            </Button>
          )}
        </div>
        <ReactTable<SequencingRunItem>
          className="-striped mt-2"
          columns={columns}
          data={sequencingRunItems ?? []}
          sort={[{ id: "materialSampleName", desc: false }]}
          showPagination={true}
          setResourceRowModel={setRowModel}
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
