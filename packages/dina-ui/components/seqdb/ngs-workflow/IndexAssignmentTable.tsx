import {
  DinaForm,
  LoadingSpinner,
  ReactTable,
  SelectField,
  SelectOption,
  SubmitButton
} from "packages/common-ui/lib";
import { IndexAssignmentStepProps } from "./IndexAssignmentStep";
import { useMemo } from "react";
import { LibraryPrep } from "packages/dina-ui/types/seqdb-api";
import { ColumnDef } from "@tanstack/react-table";
import { MaterialSampleSummary } from "packages/dina-ui/types/collection-api";
import { UseIndexAssignmentReturn } from "./useIndexAssignmentAPI";

interface IndexAssignmentRow {
  materialSample?: MaterialSampleSummary;
  libraryPrep?: LibraryPrep;
}

interface IndexAssignmentTableProps
  extends IndexAssignmentStepProps,
    UseIndexAssignmentReturn {}

export function IndexAssignmentTable(props: IndexAssignmentTableProps) {
  const {
    editMode,
    batch,
    performSave,
    setPerformSave,
    libraryPrepsLoading,
    libraryPreps,
    materialSamples,
    ngsIndexes,
    onSubmitTable
  } = props;

  // Hidden button bar is used to submit the page from the button bar in a parent component.
  const hiddenButtonBar = (
    <SubmitButton
      className="hidden"
      performSave={performSave}
      setPerformSave={setPerformSave}
    />
  );

  const COLUMNS: ColumnDef<IndexAssignmentRow>[] = [
    {
      cell: ({ row: { original: sr } }) => {
        const { libraryPrep } = sr as IndexAssignmentRow;
        if (!libraryPrep || !libraryPrep.storageUnitUsage) {
          return null;
        }

        const { wellRow, wellColumn } = libraryPrep.storageUnitUsage;
        const wellCoordinates =
          wellColumn === null || !wellRow ? null : `${wellRow}${wellColumn}`;

        return wellCoordinates;
      },
      header: "Well Coordinates",
      size: 150
    },
    {
      header: "Material Sample Name",
      accessorKey: "materialSample.materialSampleName"
    },
    {
      header: "Index i5",
      cell: ({ row: { index } }) =>
        batch.indexSet && (
          <SelectField
            hideLabel={true}
            name={`libraryPrep[${index}].indexI5`}
            options={ngsIndexes
              ?.filter((ngsIndex) => ngsIndex.direction === "I5")
              ?.map<SelectOption<string>>((ngsIndex) => ({
                label: ngsIndex.name,
                value: ngsIndex.id
              }))}
            selectProps={{
              isClearable: true
            }}
          />
        )
    },
    {
      header: "Index i7",
      cell: ({ row: { index } }) =>
        batch.indexSet && (
          <SelectField
            hideLabel={true}
            name={`libraryPrep[${index}].indexI7`}
            options={ngsIndexes
              ?.filter((ngsIndex) => ngsIndex.direction === "I7")
              ?.map<SelectOption<string>>((ngsIndex) => ({
                label: ngsIndex.name,
                value: ngsIndex.id
              }))}
            selectProps={{
              isClearable: true
            }}
          />
        )
    }
  ];

  const tableData = useMemo(
    () =>
      libraryPreps && libraryPreps.length !== 0
        ? libraryPreps.map<IndexAssignmentRow>((prep) => ({
            libraryPrep: prep,
            materialSample: materialSamples?.find(
              (samp) => samp.id === prep?.materialSample?.id
            )
          }))
        : [],
    [libraryPreps, materialSamples]
  );

  const initialValues = useMemo(() => {
    if (!libraryPreps || libraryPreps.length === 0) {
      return {};
    }

    return {
      libraryPrep: libraryPreps.map((prep) => ({
        ...(prep.indexI5 ? { indexI5: prep?.indexI5?.id } : {}),
        ...(prep.indexI7 ? { indexI7: prep?.indexI7?.id } : {})
      }))
    };
  }, [libraryPreps]);

  if (libraryPrepsLoading) {
    return <LoadingSpinner loading={true} />;
  }

  if (!batch?.indexSet?.id) {
    return (
      <span className="alert alert-warning">
        Index Set must be set on the Library Prep Batch to assign indexes.
      </span>
    );
  }

  return (
    <DinaForm
      initialValues={initialValues}
      onSubmit={onSubmitTable}
      readOnly={editMode === false}
      enableReinitialize={true}
    >
      {hiddenButtonBar}
      <ReactTable<IndexAssignmentRow>
        className="-striped react-table-overflow"
        columns={COLUMNS}
        data={tableData}
        loading={libraryPrepsLoading}
        manualPagination={true}
        showPagination={false}
        pageSize={tableData.length}
      />
    </DinaForm>
  );
}
