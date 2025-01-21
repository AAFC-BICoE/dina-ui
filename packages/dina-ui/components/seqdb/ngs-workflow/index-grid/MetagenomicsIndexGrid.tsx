import {
  LoadingSpinner,
  ReactTable,
  DinaForm,
  SelectField,
  SelectOption,
  SubmitButton
} from "common-ui";
import { ColumnDef } from "@tanstack/react-table";
import { useSeqdbIntl } from "packages/dina-ui/intl/seqdb-intl";
import { MetagenomicsIndexAssignmentStepProps } from "../../metagenomics-workflow/MetagenomicsIndexAssignmentStep";
import {
  MetagenomicsIndexAssignmentResource,
  UseMetagenomicsIndexAssignmentReturn
} from "../useMetagenomicsIndexAssignmentAPI";

interface CellData {
  row: number;
}

interface MetagenomicsIndexGridProps
  extends MetagenomicsIndexAssignmentStepProps,
    UseMetagenomicsIndexAssignmentReturn {}

export function MetagenomicsIndexGrid(props: MetagenomicsIndexGridProps) {
  const {
    metagenomicsBatch,
    editMode,
    performSave,
    setPerformSave,
    loading,
    metagenomicsIndexAssignmentResources,
    materialSampleSummaries,
    ngsIndexes,
    storageUnitType,
    onSubmitGrid
  } = props;

  const { formatMessage } = useSeqdbIntl();
  const { indexSet } = metagenomicsBatch;

  // Hidden button bar is used to submit the page from the button bar in a parent component.
  const hiddenButtonBar = (
    <SubmitButton
      className="hidden"
      performSave={performSave}
      setPerformSave={setPerformSave}
    />
  );

  if (loading) {
    return <LoadingSpinner loading={true} />;
  }

  if (!storageUnitType || !indexSet) {
    return (
      <div className="alert alert-warning mt-2">
        {formatMessage("missingContainerAndIndexForAssignment")}
      </div>
    );
  }

  if (metagenomicsIndexAssignmentResources) {
    const indexAssignmentResourcesWithCoords =
      metagenomicsIndexAssignmentResources.filter(
        (indexAssignmentResource) =>
          indexAssignmentResource.storageUnitUsage?.wellRow &&
          indexAssignmentResource.storageUnitUsage?.wellColumn
      );

    // Display an error if no coordinates have been selected yet, nothing to edit.
    if (indexAssignmentResourcesWithCoords.length === 0) {
      return (
        <div className="alert alert-warning mt-2">
          {formatMessage("missingSelectedCoordinatesForAssignment")}
        </div>
      );
    }

    const cellGrid: { [key: string]: MetagenomicsIndexAssignmentResource } = {};
    for (const resource of indexAssignmentResourcesWithCoords) {
      cellGrid[
        `${resource.storageUnitUsage?.wellRow}_${resource.storageUnitUsage?.wellColumn}`
      ] = resource;
    }

    const columns: ColumnDef<CellData>[] = [];

    // Add the primer column:
    columns.push({
      cell: ({ row: { original } }) => {
        const rowLetter = String.fromCharCode(original.row + 65);

        return (
          indexSet && (
            <div style={{ padding: "7px 5px" }}>
              <SelectField
                label={rowLetter}
                name={`indexI5s[${rowLetter}]`}
                options={ngsIndexes
                  ?.filter((index) => index.direction === "I5")
                  ?.map<SelectOption<string>>((index) => ({
                    label: index.name,
                    value: index.id
                  }))}
                selectProps={{
                  isClearable: true,
                  placeholder: formatMessage("selectI5")
                }}
                removeBottomMargin={true}
              />
            </div>
          )
        );
      },
      meta: {
        style: {
          background: "white",
          boxShadow: "7px 0px 9px 0px rgba(0,0,0,0.1)"
        }
      },
      id: "rowNumber",
      accessorKey: "",
      enableResizing: false,
      enableSorting: false,
      size: 300
    });

    // Generate the columns
    for (
      let col = 0;
      col < (storageUnitType?.gridLayoutDefinition?.numberOfColumns ?? 0);
      col++
    ) {
      const columnLabel = String(col + 1);

      columns.push({
        cell: ({ row: { original } }) => {
          const rowLabel = String.fromCharCode(original.row + 65);
          const coords = `${rowLabel}_${columnLabel}`;
          const indexAssignmentResource: MetagenomicsIndexAssignmentResource =
            cellGrid[coords];

          return indexAssignmentResource ? (
            <div className="h-100 w-100 list-group-item">
              <div>
                {materialSampleSummaries?.find(
                  (sample) =>
                    sample.id ===
                    indexAssignmentResource?.materialSampleSummary?.id
                )?.materialSampleName ?? ""}
              </div>
              <div>
                {indexAssignmentResource.indexI5 && (
                  <div>
                    <strong>i5: </strong>
                    {indexAssignmentResource.indexI5.name}
                  </div>
                )}
                {indexAssignmentResource.indexI7 && (
                  <div>
                    <strong>i7: </strong>
                    {indexAssignmentResource.indexI7.name}
                  </div>
                )}
              </div>
            </div>
          ) : null;
        },
        header: () =>
          indexSet && (
            <SelectField
              label={columnLabel}
              name={`indexI7s[${columnLabel}]`}
              options={ngsIndexes
                ?.filter((index) => index.direction === "I7")
                ?.map<SelectOption<string>>((index) => ({
                  label: index.name,
                  value: index.id
                }))}
              selectProps={{
                isClearable: true,
                placeholder: formatMessage("selectI7")
              }}
              removeBottomMargin={true}
              className={"w-100"}
            />
          ),
        id: `${columnLabel}`,
        accessorKey: `${columnLabel}`,
        enableResizing: false,
        enableSorting: false,
        size: 300
      });
    }

    // Populate the table's rows using the number of rows.
    const tableData: CellData[] = [];
    const numberOfRows =
      storageUnitType?.gridLayoutDefinition?.numberOfRows ?? 0;
    for (let i = 0; i < numberOfRows; i++) {
      tableData.push({ row: i });
    }

    return (
      <DinaForm
        initialValues={{ indexI5s: {}, indexI7s: {} }}
        onSubmit={onSubmitGrid}
        readOnly={editMode === false}
      >
        {hiddenButtonBar}
        <ReactTable<CellData>
          className="-striped react-table-overflow"
          columns={columns}
          data={tableData}
          showPagination={false}
          manualPagination={true}
        />
      </DinaForm>
    );
  }

  return null;
}
