import { ColumnDef } from "@tanstack/react-table";
import {
  FieldHeader,
  ReactTable,
  useGroupedCheckBoxes,
  useStringComparator
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

  const { compareByStringAndNumber } = useStringComparator();

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
      accessorKey: "materialSampleName"
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
      accessorKey: "result",
      sortingFn: (a: any, b: any): number => {
        const aString = a.original?.pcrBatchItem?.result;
        const bString = b.original?.pcrBatchItem?.result;
        return compareByStringAndNumber(aString, bString);
      }
    },
    {
      id: "wellCoordinates",
      cell: ({ row }) =>
        row.original?.pcrBatchItem?.storageUnitUsage?.wellRow === null ||
        row.original?.pcrBatchItem?.storageUnitUsage?.wellColumn === null
          ? ""
          : row.original.pcrBatchItem?.storageUnitUsage?.wellRow +
            "" +
            row.original.pcrBatchItem?.storageUnitUsage?.wellColumn,
      header: () => <FieldHeader name={"wellCoordinates"} />,
      accessorKey: "wellCoordinates",
      sortingFn: (a: any, b: any): number => {
        const aString =
          a.original?.pcrBatchItem?.storageUnitUsage?.wellRow === null ||
          a.original?.pcrBatchItem?.storageUnitUsage?.wellColumn === null
            ? ""
            : a.original.pcrBatchItem?.storageUnitUsage?.wellRow +
              "" +
              a.original.pcrBatchItem?.storageUnitUsage?.wellColumn;
        const bString =
          b.original?.pcrBatchItem?.storageUnitUsage?.wellRow === null ||
          b.original?.pcrBatchItem?.storageUnitUsage?.wellColumn === null
            ? ""
            : b.original.pcrBatchItem?.storageUnitUsage?.wellRow +
              "" +
              b.original.pcrBatchItem?.storageUnitUsage?.wellColumn;
        return compareByStringAndNumber(aString, bString);
      }
    },
    {
      id: "tubeNumber",
      cell: ({ row }) =>
        row.original?.pcrBatchItem?.storageUnitUsage?.cellNumber || "",
      header: () => <FieldHeader name={"tubeNumber"} />,
      accessorKey: "tubeNumber",
      sortingFn: (a: any, b: any): number =>
        compareByStringAndNumber(
          a.original?.pcrBatchItem?.storageUnitUsage?.cellNumber.toString(),
          b.original?.pcrBatchItem?.storageUnitUsage?.cellNumber.toString()
        )
    },
    {
      id: "primer",
      cell: ({ row }) => row.original?.seqPrimer?.name || "",
      header: () => <FieldHeader name={"primer"} />,
      accessorKey: "primer",
      sortingFn: (a: any, b: any): number =>
        compareByStringAndNumber(
          a.original?.seqPrimer?.name || "",
          b.original?.seqPrimer?.name || ""
        )
    },
    {
      id: "direction",
      cell: ({ row }) => row.original?.seqPrimer?.direction || "",
      header: () => <FieldHeader name={"direction"} />,
      accessorKey: "direction",
      sortingFn: (a: any, b: any): number =>
        compareByStringAndNumber(
          a.original?.seqPrimer?.direction || "",
          b.original?.seqPrimer?.direction || ""
        )
    }
  ];

  function onRowMove(draggedRowIndex: number, targetRowIndex: number) {
    if (!!selectedSeqReactions) {
      selectedSeqReactions.splice(
        targetRowIndex,
        0,
        selectedSeqReactions.splice(draggedRowIndex, 1)[0] as SeqReaction
      );
      if (!!setSelectedSeqReactions) {
        setSelectedSeqReactions([...selectedSeqReactions]);
      }
    }
  }

  return (
    <ReactTable<SeqReaction>
      className={className}
      columns={seqReactionColumns}
      data={selectedSeqReactions}
      onRowMove={onRowMove}
      enableDnd={editMode}
      pageSize={1000}
      enableSorting={true}
      sort={[
        {
          id: "tubeNumber",
          desc: false
        }
      ]}
    />
  );
}
