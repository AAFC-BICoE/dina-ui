import {
  DinaForm,
  LoadingSpinner,
  ReactTable,
  SelectField,
  SelectOption,
  SubmitButton,
  useStringComparator
} from "packages/common-ui/lib";
import { useMemo } from "react";
import { PcrBatchItem } from "packages/dina-ui/types/seqdb-api";
import { ColumnDef } from "@tanstack/react-table";
import { MaterialSampleSummary } from "packages/dina-ui/types/collection-api";
import { useSeqdbIntl } from "packages/dina-ui/intl/seqdb-intl";
import { MetagenomicsIndexAssignmentStepProps } from "../metagenomics-workflow/MetagenomicsIndexAssignmentStep";
import {
  MetagenomicsIndexAssignmentResource,
  UseMetagenomicsIndexAssignmentReturn
} from "./useMetagenomicsIndexAssignmentAPI";

interface MetagenomicsIndexAssignmentRow {
  materialSampleSummary?: MaterialSampleSummary;
  metagenomicsIndexAssignmentResource?: MetagenomicsIndexAssignmentResource;
  pcrBatchItem?: PcrBatchItem;
}

interface MetagenomicsIndexAssignmentTableProps
  extends MetagenomicsIndexAssignmentStepProps,
    UseMetagenomicsIndexAssignmentReturn {}

export function MetagenomicsIndexAssignmentTable(
  props: MetagenomicsIndexAssignmentTableProps
) {
  const {
    editMode,
    metagenomicsBatch,
    performSave,
    setPerformSave,
    loading,
    metagenomicsIndexAssignmentResources,
    materialSampleSummaries,
    ngsIndexes,
    onSubmitTable
  } = props;

  const { compareByStringAndNumber } = useStringComparator();
  const { formatMessage } = useSeqdbIntl();

  // Hidden button bar is used to submit the page from the button bar in a parent component.
  const hiddenButtonBar = (
    <SubmitButton
      className="hidden"
      performSave={performSave}
      setPerformSave={setPerformSave}
    />
  );

  const COLUMNS: ColumnDef<MetagenomicsIndexAssignmentRow>[] = [
    {
      cell: ({ row: { original: sr } }) => {
        const { metagenomicsIndexAssignmentResource } =
          sr as MetagenomicsIndexAssignmentRow;
        if (
          !metagenomicsIndexAssignmentResource ||
          !metagenomicsIndexAssignmentResource.storageUnitUsage
        ) {
          return "";
        }

        const { wellRow, wellColumn } =
          metagenomicsIndexAssignmentResource.storageUnitUsage;
        const wellCoordinates =
          wellColumn === null || !wellRow ? "" : `${wellRow}${wellColumn}`;

        return wellCoordinates;
      },
      header: "Well Coordinates",
      accessorKey: "wellCoordinates",
      sortingFn: (a: any, b: any): number => {
        const aStorageUnit =
          a.original?.metagenomicsIndexAssignmentResource?.storageUnitUsage;
        const bStorageUnit =
          b.original?.metagenomicsIndexAssignmentResource?.storageUnitUsage;

        const aString =
          !aStorageUnit ||
          aStorageUnit?.wellRow === null ||
          aStorageUnit?.wellColumn === null
            ? ""
            : `${aStorageUnit?.wellRow}${aStorageUnit?.wellColumn}`;
        const bString =
          !bStorageUnit ||
          bStorageUnit?.wellRow === null ||
          bStorageUnit?.wellColumn === null
            ? ""
            : `${bStorageUnit?.wellRow}${bStorageUnit?.wellColumn}`;
        return compareByStringAndNumber(aString, bString);
      },
      enableSorting: true,
      size: 150
    },
    {
      header: "Material Sample Name",
      accessorKey: "materialSampleSummary.materialSampleName"
    },
    {
      header: "Index i5",
      cell: ({ row: { index } }) =>
        metagenomicsBatch.indexSet && (
          <SelectField
            hideLabel={true}
            name={`indexAssignment[${index}].indexI5`}
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
        metagenomicsBatch.indexSet && (
          <SelectField
            hideLabel={true}
            name={`indexAssignment[${index}].indexI7`}
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
      metagenomicsIndexAssignmentResources &&
      metagenomicsIndexAssignmentResources.length !== 0
        ? metagenomicsIndexAssignmentResources.map<MetagenomicsIndexAssignmentRow>(
            (prep) => ({
              metagenomicsIndexAssignmentResource: prep,
              materialSampleSummary: materialSampleSummaries?.find(
                (samp) => samp.id === prep?.materialSampleSummary?.id
              )
            })
          )
        : [],
    [metagenomicsIndexAssignmentResources, materialSampleSummaries]
  );

  const initialValues = useMemo(() => {
    if (
      !metagenomicsIndexAssignmentResources ||
      metagenomicsIndexAssignmentResources.length === 0
    ) {
      return {};
    }

    return {
      indexAssignment: metagenomicsIndexAssignmentResources.map((resource) => ({
        ...(resource.indexI5 ? { indexI5: resource?.indexI5?.id } : {}),
        ...(resource.indexI7 ? { indexI7: resource?.indexI7?.id } : {})
      }))
    };
  }, [metagenomicsIndexAssignmentResources]);

  if (loading) {
    return <LoadingSpinner loading={true} />;
  }

  if (!metagenomicsBatch?.indexSet?.id) {
    return (
      <div className="alert alert-warning mt-2">
        {formatMessage("missingIndexForAssignment")}
      </div>
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
      <ReactTable<MetagenomicsIndexAssignmentRow>
        className="-striped react-table-overflow"
        columns={COLUMNS}
        data={tableData}
        loading={loading}
        manualPagination={true}
        showPagination={false}
        pageSize={tableData.length}
        sort={[{ id: "wellCoordinates", desc: false }]}
      />
    </DinaForm>
  );
}
