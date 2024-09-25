import {
  ApiClientContext,
  DinaForm,
  DinaFormSubmitParams,
  filterBy,
  LoadingSpinner,
  ReactTable,
  SelectField,
  SelectOption,
  SubmitButton
} from "packages/common-ui/lib";
import { IndexAssignmentStepProps } from "./IndexAssignmentStep";
import { useContext, useState, useMemo } from "react";
import { isEqual } from "lodash";
import { LibraryPrep } from "packages/dina-ui/types/seqdb-api";
import { ColumnDef } from "@tanstack/react-table";
import { MaterialSample } from "packages/dina-ui/types/collection-api";
import { useIndexGridControls } from "./index-grid/useIndexGridControls";

interface IndexAssignmentRow {
  materialSample?: MaterialSample;
  libraryPrep?: LibraryPrep;
}

export function IndexAssignmentTable(props: IndexAssignmentStepProps) {
  const { save } = useContext(ApiClientContext);

  // Timestamp of the last table save.
  const [lastPrepTableSave, setLastPrepTableSave] = useState<number>();

  const { libraryPrepsLoading, libraryPreps, materialSamples, ngsIndexes } =
    useIndexGridControls(props);

  const { editMode, batch, performSave, setPerformSave } = props;

  // Hidden button bar is used to submit the page from the button bar in a parent component.
  const hiddenButtonBar = (
    <SubmitButton
      className="hidden"
      performSave={performSave}
      setPerformSave={setPerformSave}
    />
  );

  async function onSubmit({ submittedValues }: DinaFormSubmitParams<any>) {
    const submittedSampleSrs: IndexAssignmentRow[] = submittedValues.sampleSrs;

    // const touchedSampleSrs: IndexAssignmentRow[] = [];
    // for (const i in submittedSampleSrs) {
    //   if (!isEqual(submittedSampleSrs[i], libraryPreps[i])) {
    //     touchedSampleSrs.push(submittedSampleSrs[i]);
    //   }
    // }

    // const libraryPreps: LibraryPrep[] = [];
    // for (const submittedSr of touchedSampleSrs) {
    //   if (submittedSr.libraryPrep) {
    //     submittedSr.libraryPrep.sample = submittedSr.sample;
    //     submittedSr.libraryPrep.libraryPrepBatch = libraryPrepBatch;
    //     libraryPreps.push(submittedSr.libraryPrep);
    //   }
    // }

    // const saveArgs = libraryPreps.map(resource => ({
    //   resource,
    //   type: "libraryPrep"
    // }));

    // await save(saveArgs, { apiBaseUrl: "/seqdb-api" });

    setLastPrepTableSave(Date.now());
  }

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
      cell: ({ row: { index, original } }) =>
        batch.indexSet && (
          <SelectField
            hideLabel={true}
            name={`indexI5s[${index}]`}
            options={ngsIndexes
              ?.filter((ngsIndex) => ngsIndex.direction === "I5")
              ?.map<SelectOption<string>>((ngsIndex) => ({
                label: ngsIndex.name,
                value: ngsIndex.id
              }))}
            styles={{ menu: () => ({ zIndex: 5 }) }}
          />
        )
    },
    {
      header: "Index i7",
      cell: ({ row: { index, original } }) =>
        batch.indexSet && (
          <SelectField
            hideLabel={true}
            name={`indexI7s[${index}]`}
            options={ngsIndexes
              ?.filter((ngsIndex) => ngsIndex.direction === "I7")
              ?.map<SelectOption<string>>((ngsIndex) => ({
                label: ngsIndex.name,
                value: ngsIndex.id
              }))}
            styles={{ menu: () => ({ zIndex: 5 }) }}
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
      initialValues={{}}
      onSubmit={onSubmit}
      readOnly={editMode === false}
      enableReinitialize={true}
    >
      {hiddenButtonBar}
      <ReactTable<IndexAssignmentRow>
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
