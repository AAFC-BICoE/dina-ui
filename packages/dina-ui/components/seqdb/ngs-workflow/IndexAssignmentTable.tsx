import {
  ApiClientContext,
  DinaForm,
  DinaFormSubmitParams,
  filterBy,
  ReactTable,
  ResourceSelectField,
  SelectField
} from "packages/common-ui/lib";
import { IndexAssignmentStepProps } from "./IndexAssignmentStep";
import { useContext, useState } from "react";
import { isEqual, startCase } from "lodash";
import { LibraryPrep } from "packages/dina-ui/types/seqdb-api";
import { ColumnDef } from "@tanstack/react-table";
import { MaterialSample } from "packages/dina-ui/types/collection-api";
import { useIndexGridControls } from "./index-grid/useIndexGridControls";

interface IndexAssignmentRow {
  materialSample: MaterialSample;
  libraryPrep: LibraryPrep;
}

export function IndexAssignmentTable(props: IndexAssignmentStepProps) {
  const { save } = useContext(ApiClientContext);

  // Current sample StepResources in the "sample selection" table.
  const [sampleSrs, setSampleSrs] = useState<IndexAssignmentRow[]>([]);

  // The values to initialize the Formik form.
  const [formikValues, setFormikValues] = useState({
    sampleSrs: [] as IndexAssignmentRow[]
  });

  // Timestamp of the last table save.
  const [lastPrepTableSave, setLastPrepTableSave] = useState<number>();

  const { libraryPrepsLoading, libraryPreps, materialSamples, ngsIndexes } =
    useIndexGridControls(props);

  const { editMode, batch } = props;

  async function onSubmit({ submittedValues }: DinaFormSubmitParams<any>) {
    const submittedSampleSrs: IndexAssignmentRow[] = submittedValues.sampleSrs;

    const touchedSampleSrs: IndexAssignmentRow[] = [];
    for (const i in submittedSampleSrs) {
      if (!isEqual(submittedSampleSrs[i], sampleSrs[i])) {
        touchedSampleSrs.push(submittedSampleSrs[i]);
      }
    }

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
    // {
    //   cell: ({ row: { original: sr } }) => {
    //     const { libraryPrep } = sr as IndexAssignmentRow;
    //     if (!libraryPrep) {
    //       return null;
    //     }

    //     const { wellColumn, wellRow } = libraryPrep;
    //     const wellCoordinates =
    //       wellColumn === null || !wellRow
    //         ? null
    //         : `${wellRow}${String(wellColumn).padStart(2, "0")}`;

    //     return wellCoordinates;
    //   },
    //   header: "Well Coordinates",
    //   enableSorting: false
    // },
    {
      header: "Material Sample Name",
      accessorKey: "sample.name"
    }
    // ...["indexI5", "indexI7"].map(fieldName => ({
    //   cell: ({row: { index, original }}) =>
    //     batch.indexSet && (
    //       <SelectField
    //         label={rowLetter}
    //         name={`indexI5s[${rowLetter}]`}
    //         options={ngsIndexes
    //           ?.filter((index) => index.direction === "I5")
    //           ?.map<SelectOption<string>>((index) => ({
    //             label: index.name,
    //             value: index.id
    //           }))}
    //         styles={{ menu: () => ({ zIndex: 5 }) }}
    //       />
    //     ),
    //   header: startCase(fieldName),
    //   enableSorting: false
    // }))
  ];

  return (
    <>
      <DinaForm
        initialValues={{ indexI5s: {}, indexI7s: {} }}
        onSubmit={onSubmit}
        readOnly={editMode === false}
      >
        <ReactTable
          columns={COLUMNS}
          data={formikValues.sampleSrs}
          loading={libraryPrepsLoading}
          showPagination={false}
          pageSize={sampleSrs.length}
        />
      </DinaForm>
    </>
  );
}
