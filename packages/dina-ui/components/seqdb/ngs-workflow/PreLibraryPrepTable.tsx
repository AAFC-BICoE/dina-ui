import { ColumnDef } from "@tanstack/react-table";
import { ReactTable, TextInputCell } from "packages/common-ui/lib";
import { DinaMessage } from "packages/dina-ui/intl/dina-ui-intl";
import { PreLibraryPrep2 } from "packages/dina-ui/types/seqdb-api";
import { Dispatch, SetStateAction } from "react";

export interface PreLibraryPrepTableProps {
  readOnly: boolean;
  data: PreLibraryPrep2[];
  setData: Dispatch<SetStateAction<PreLibraryPrep2[] | undefined>>;
}

export function PreLibraryPrepTable({
  readOnly = true,
  data,
  setData
}: PreLibraryPrepTableProps) {
  const tableColumns: ColumnDef<PreLibraryPrep2>[] = [
    {
      id: "materialSampleName",
      cell: ({ row: { original } }) => (
        <div>
          {original.libraryPrep.materialSample?.materialSampleName ?? ""}
        </div>
      ),
      header: () => (
        <b>
          <DinaMessage id={"materialSampleName"} />
        </b>
      ),
      enableSorting: true
    },
    {
      id: "inputAmount",
      cell: TextInputCell,
      header: () => (
        <b>
          <DinaMessage id={"field_inputAmount"} />
        </b>
      ),
      enableSorting: false
    },
    {
      id: "concentration",
      cell: TextInputCell,
      header: () => (
        <b>
          <DinaMessage id={"field_concentration"} />
        </b>
      ),
      enableSorting: false
    }
  ];

  return (
    <ReactTable
      data={data}
      columns={tableColumns}
      onDataChanged={setData}
      enableEditing={!readOnly}
    />
  );
}
