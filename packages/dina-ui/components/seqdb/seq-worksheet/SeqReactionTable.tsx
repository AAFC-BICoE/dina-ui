import { ColumnDef } from "@tanstack/react-table";
import {
  FieldHeader,
  ReactTable8,
  useGroupedCheckBoxes
} from "../../../../common-ui/lib";
import {
  SeqReaction,
  PcrBatchItem,
  pcrBatchItemResultColor
} from "../../../../dina-ui/types/seqdb-api";
import { DataRow } from "../..";
import { DinaMessage } from "packages/dina-ui/intl/dina-ui-intl";

export interface SeqReactionTableProps {
  seqReactions: SeqReaction[];
  className?: string;
}

export function SeqReactionTable({
  seqReactions,
  className
}: SeqReactionTableProps) {
  const seqReactionColumns: ColumnDef<SeqReaction>[] = [
    {
      id: "materialSampleName",
      cell: ({ row: { original } }) => (
        <div>
          {original.pcrBatchItem?.materialSample?.materialSampleName ?? ""}
        </div>
      ),
      header: () => (
        <b>
          <DinaMessage id={"materialSampleName"} />
        </b>
      ),
      enableSorting: false
    },
    {
      id: "pcrTubeNumber",
      cell: ({ row: { original } }) => (
        <div>{original?.pcrBatchItem?.cellNumber || ""}</div>
      ),
      header: () => (
        <b>
          <DinaMessage id={"pcrTubeNumber"} />
        </b>
      ),
      enableSorting: false
    },
    {
      id: "pcrBatch",
      cell: ({ row }) => <div>{row.original.pcrBatchItem?.pcrBatch?.name}</div>,
      header: () => (
        <b>
          <DinaMessage id={"pcrBatch"} />
        </b>
      ),
      enableSorting: false
    },
    {
      id: "pcrWellCoordinates",
      cell: ({ row }) => (
        <div>
          {(row.original.pcrBatchItem?.wellRow ?? "") +
            "" +
            (row.original.pcrBatchItem?.wellColumn ?? "")}
        </div>
      ),
      header: () => (
        <b>
          <DinaMessage id={"pcrWellCoordinates"} />
        </b>
      ),
      enableSorting: false
    },
    {
      id: "seqWellCoordinates",
      cell: ({ row }) => (
        <div>
          {(row.original.wellRow ?? "") + "" + (row.original.wellColumn ?? "")}
        </div>
      ),
      header: () => (
        <b>
          <DinaMessage id={"seqWellCoordinates"} />
        </b>
      ),
      enableSorting: false
    },
    {
      id: "seqTubeNumber",
      cell: ({ row }) => <div>{row.original?.cellNumber ?? ""}</div>,
      header: () => (
        <b>
          <DinaMessage id={"seqTubeNumber"} />
        </b>
      ),
      enableSorting: false
    },
    {
      id: "primer",
      cell: ({ row }) => <div>{row.original?.seqPrimer?.name ?? ""}</div>,
      header: () => (
        <b>
          <DinaMessage id={"primerName"} />
        </b>
      ),
      enableSorting: false
    }
  ];

  return (
    <ReactTable8<SeqReaction>
      className={className}
      columns={seqReactionColumns}
      data={seqReactions}
    />
  );
}
