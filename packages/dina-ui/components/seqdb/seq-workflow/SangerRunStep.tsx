import Link from "next/link";
import { SeqBatch } from "packages/dina-ui/types/seqdb-api";
import {
  SequencingRunItem,
  useMolecularAnalysisRun
} from "./useMolecularAnalysisRun";
import {
  FieldHeader,
  LoadingSpinner,
  ReactTable,
  useStringComparator
} from "common-ui";
import { Alert } from "react-bootstrap";
import { ColumnDef } from "@tanstack/react-table";

export interface SangerRunStepProps {
  seqBatchId: string;
  seqBatch: SeqBatch;
  editMode: boolean;
  setEditMode: (newValue: boolean) => void;
  performSave: boolean;
  setPerformSave: (newValue: boolean) => void;
}

export function SangerRunStep({
  seqBatchId,
  editMode,
  setEditMode,
  performSave,
  setPerformSave
}: SangerRunStepProps) {
  const { compareByStringAndNumber } = useStringComparator();

  const {
    loading,
    errorMessage,
    multipleRunWarning,
    setSequencingRunName,
    sequencingRunName,
    sequencingRunItems
  } = useMolecularAnalysisRun({
    editMode,
    setEditMode,
    performSave,
    setPerformSave,
    seqBatchId
  });

  // Table columns to display for the sequencing run.
  const COLUMNS: ColumnDef<SequencingRunItem>[] = [
    {
      id: "wellCoordinates",
      cell: ({ row }) => {
        return (
          <>
            {!row.original?.storageUnitUsage ||
            row.original?.storageUnitUsage?.wellRow === null ||
            row.original?.storageUnitUsage?.wellColumn === null
              ? ""
              : `${row.original.storageUnitUsage?.wellRow}${row.original.storageUnitUsage?.wellColumn}`}
          </>
        );
      },
      header: () => <FieldHeader name={"wellCoordinates"} />,
      accessorKey: "wellCoordinates",
      sortingFn: (a: any, b: any): number => {
        const aString =
          !a.original?.storageUnitUsage ||
          a.original?.storageUnitUsage?.wellRow === null ||
          a.original?.storageUnitUsage?.wellColumn === null
            ? ""
            : `${a.original.storageUnitUsage?.wellRow}${a.original.storageUnitUsage?.wellColumn}`;
        const bString =
          !b.original?.storageUnitUsage ||
          b.original?.storageUnitUsage?.wellRow === null ||
          b.original?.storageUnitUsage?.wellColumn === null
            ? ""
            : `${b.original.storageUnitUsage?.wellRow}${b.original.storageUnitUsage?.wellColumn}`;
        return compareByStringAndNumber(aString, bString);
      }
    },
    {
      id: "tubeNumber",
      cell: ({ row: { original } }) =>
        original?.storageUnitUsage?.cellNumber === undefined ? (
          <></>
        ) : (
          <>{original.storageUnitUsage?.cellNumber}</>
        ),
      header: () => <FieldHeader name={"tubeNumber"} />,
      accessorKey: "tubeNumber",
      sortingFn: (a: any, b: any): number =>
        compareByStringAndNumber(
          a?.original?.storageUnitUsage?.cellNumber?.toString(),
          b?.original?.storageUnitUsage?.cellNumber?.toString()
        )
    },
    {
      id: "materialSampleName",
      cell: ({ row: { original } }) => {
        const materialSampleName =
          original?.materialSampleSummary?.materialSampleName;
        return (
          <Link
            href={`/collection/material-sample/view?id=${original.materialSampleId}`}
          >
            <a>{materialSampleName || original.materialSampleId}</a>
          </Link>
        );
      },
      header: () => <FieldHeader name="materialSampleName" />,
      accessorKey: "data.attributes.materialSampleName",
      sortingFn: (a: any, b: any): number =>
        compareByStringAndNumber(
          a?.original?.materialSampleName,
          b?.original?.materialSampleName
        ),
      enableSorting: true
    }
  ];

  // Display loading if network requests from hook are still loading in...
  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center">
        <LoadingSpinner loading={true} />
      </div>
    );
  }

  return (
    <>
      {/* Worksheet Buttton */}
      {!editMode && (
        <div className="row">
          <div className="col-12 text-end">
            <Link href={`/seqdb/seq-workflow/worksheet?id=${seqBatchId}`}>
              <a target="_blank" className="btn btn-primary">
                Worksheet
              </a>
            </Link>
          </div>
        </div>
      )}

      {/* Multiple Runs Exist Warning */}
      {multipleRunWarning && (
        <div className="row">
          <Alert variant="warning" className="mb-0">
            <Alert.Heading>Multiple runs exist for this SeqBatch</Alert.Heading>
            <p>Only one run should exist per SeqBatch.</p>
          </Alert>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="row">
          <Alert variant="danger" className="mb-0">
            <p>{errorMessage}</p>
          </Alert>
        </div>
      )}

      {/* Run Information */}
      <div className="row">
        <div className="col-4">
          <strong>Sequencing Run:</strong>
          <input
            className="form-control"
            name="sequencingRunName"
            value={sequencingRunName}
            onChange={(newValue) =>
              setSequencingRunName(newValue.target.value ?? "")
            }
          />
        </div>
        <div className="col-12">
          <strong>Sequencing Run Content:</strong>
          <ReactTable<SequencingRunItem>
            className="-striped"
            columns={COLUMNS}
            data={sequencingRunItems ?? []}
          />
        </div>
      </div>
    </>
  );
}
