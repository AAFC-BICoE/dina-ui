import { ColumnDef } from "@tanstack/react-table";
import {
  FieldHeader,
  ReactTable8,
  useGroupedCheckBoxes
} from "../../../../../common-ui/lib";
import {
  SeqReaction,
  pcrBatchItemResultColor
} from "../../../../../dina-ui/types/seqdb-api";

export interface SeqReactionDnDTableProps {
  selectedSeqReactions: SeqReaction[];
  setSelectedSeqReactions?: (seqReactions: SeqReaction[]) => void;
  editMode: boolean;
  className?: string;
}

export function SeqReactionDndTable({
  selectedSeqReactions,
  setSelectedSeqReactions,
  editMode,
  className
}: SeqReactionDnDTableProps) {
  // Checkbox for second table where selected/to be deleted items are displayed
  const {
    CheckBoxField: DeselectCheckBox,
    CheckBoxHeader: DeselectCheckBoxHeader
  } = useGroupedCheckBoxes({
    fieldName: "itemIdsToDelete",
    defaultAvailableItems: selectedSeqReactions
  });

  const SELECTED_RESOURCE_SELECT_ALL_HEADER: ColumnDef<SeqReaction>[] = editMode
    ? [
        {
          id: "selectColumn",
          cell: ({ row }) => (
            <DeselectCheckBox
              key={`${row.original?.pcrBatchItem?.id}_${row.original?.seqPrimer?.id}`}
              resource={row.original}
            />
          ),
          header: () => <DeselectCheckBoxHeader />,
          enableSorting: false
        }
      ]
    : [];

  const seqReactionColumns: ColumnDef<SeqReaction>[] = [
    ...SELECTED_RESOURCE_SELECT_ALL_HEADER,
    {
      id: "materialSampleName",
      accessorFn: (row) =>
        row.pcrBatchItem?.materialSample?.materialSampleName ?? "",
      header: () => <FieldHeader name={"sampleName"} />,
      enableSorting: false
    },
    {
      id: "result",
      cell: ({ row }) => (
        <div
          style={{
            backgroundColor:
              "#" + pcrBatchItemResultColor(row.original?.pcrBatchItem?.result),
            borderRadius: "5px",
            paddingLeft: "5px"
          }}
        >
          {row.original?.pcrBatchItem?.result ?? ""}
        </div>
      ),
      header: () => <FieldHeader name={"result"} />,
      enableSorting: false
    },
    {
      id: "wellCoordinates",
      cell: ({ row }) =>
        row.original?.pcrBatchItem?.wellRow === null ||
        row.original?.pcrBatchItem?.wellColumn === null
          ? ""
          : row.original.pcrBatchItem?.wellRow +
            "" +
            row.original.pcrBatchItem?.wellColumn,
      header: () => <FieldHeader name={"wellCoordinates"} />,
      enableSorting: false
    },
    {
      id: "tubeNumber",
      cell: ({ row }) => row.original?.pcrBatchItem?.cellNumber || "",
      header: () => <FieldHeader name={"tubeNumber"} />,
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
      data={selectedSeqReactions}
      setData={setSelectedSeqReactions}
      enableDnd={editMode}
    />
  );
}
