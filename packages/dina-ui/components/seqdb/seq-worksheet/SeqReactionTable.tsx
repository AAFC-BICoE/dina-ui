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

export interface SeqReactionTableProps {
  pcrBatchName?: string;
  seqReactions: SeqReaction[];
  pcrBatchItems: PcrBatchItem[];
  className?: string;
}

export function SeqReactionTable({
  pcrBatchName,
  seqReactions,
  pcrBatchItems,
  className
}: SeqReactionTableProps) {
  const seqReactionColumns: ColumnDef<SeqReaction>[] = [
    {
      id: "materialSampleName",
      accessorFn: (row) =>
        row.pcrBatchItem?.materialSample?.materialSampleName ?? "",
      header: () => <FieldHeader name={"sampleName"} />,
      enableSorting: false
    },
    {
      id: "pcrTubeNumber",
      cell: ({ row }) => row.original?.pcrBatchItem?.cellNumber || "",
      header: () => <FieldHeader name={"pcrTubeNumber"} />,
      enableSorting: false
    },
    {
      id: "pcrBatch",
      cell: ({ row }) => <div>{row.original.pcrBatchItem?.pcrBatch?.name}</div>,
      header: () => <FieldHeader name={"pcrBatch"} />,
      enableSorting: false
    },
    {
      id: "seqWellCoordinates",
      cell: ({ row }) =>
        row.original?.wellRow === null || row.original?.wellColumn === null
          ? ""
          : row.original.wellRow + "" + row.original.wellColumn,
      header: () => <FieldHeader name={"seqWellCoordinates"} />,
      enableSorting: false
    },
    {
      id: "primer",
      cell: ({ row }) => row.original?.seqPrimer?.name || "",
      header: () => <FieldHeader name={"primer"} />,
      enableSorting: false
    },
    {
      id: "direction",
      cell: ({ row }) => row.original?.seqPrimer?.direction || "",
      header: () => <FieldHeader name={"direction"} />,
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
