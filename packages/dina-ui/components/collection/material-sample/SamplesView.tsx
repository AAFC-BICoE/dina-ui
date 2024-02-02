import { ColumnDef } from "@tanstack/react-table";
import {
  DeleteButton,
  EditButton,
  FieldHeader,
  FieldSet,
  ReactTable,
  dateCell
} from "common-ui";
import Link from "next/link";
import { useState } from "react";
import { useDinaIntl } from "../../../../dina-ui/intl/dina-ui-intl";
import { MaterialSample } from "../../../../dina-ui/types/collection-api";
import { SplitMaterialSampleDropdownButton } from "./SplitMaterialSampleDropdownButton";

export interface SamplesViewProps {
  samples?: MaterialSample[];
  fieldSetId: JSX.Element;
}

export function SamplesView({ samples, fieldSetId }: SamplesViewProps) {
  const DEFAULT_PAGE_SIZE = 25;
  const defaultSort = [];
  const { formatMessage } = useDinaIntl();

  const CHILD_SAMPLES_COLUMNS: ColumnDef<MaterialSample>[] = [
    {
      id: "materialSampleName",
      cell: ({
        row: {
          original: { id, materialSampleName }
        }
      }) => (
        <Link href={`/collection/material-sample/view?id=${id}`}>
          <a>{materialSampleName}</a>
        </Link>
      ),
      accessorKey: "id",
      header: () => <FieldHeader name="materialSampleName" />
    },
    {
      id: "materialSampleType",
      accessorKey: "materialSampleType",
      enableSorting: false,
      header: () => <FieldHeader name="materialSampleType" />
    },
    {
      id: "createOn",
      ...dateCell("createdOn", "createdOn")
    },
    {
      id: "tags",
      cell: ({
        row: {
          original: { tags }
        }
      }) => <>{tags?.join(", ")}</>,
      accessorKey: "tags",
      header: () => <FieldHeader name="tags" />
    },
    {
      id: "actions",
      cell: ({
        row: {
          original: { id, materialSampleName, materialSampleType }
        }
      }) => (
        <div className="d-flex">
          <EditButton
            className="mx-2"
            entityId={id as string}
            entityLink="collection/material-sample"
            style={{ width: "5rem" }}
          />
          <SplitMaterialSampleDropdownButton
            ids={[id ?? "unknown"]}
            disabled={!materialSampleName}
            materialSampleType={materialSampleType}
          />
          <DeleteButton
            id={id as string}
            options={{ apiBaseUrl: "/collection-api" }}
            type="material-sample"
            reload={true}
          />
        </div>
      ),
      size: 300,
      header: () => <FieldHeader name="actions" />,
      enableSorting: false
    }
  ];

  // JSONAPI sort attribute.
  const [sortingRules, _] = useState(defaultSort);

  const totalCount = samples?.length;

  const shouldShowPagination = !!totalCount && totalCount > 25;
  return (
    <FieldSet legend={fieldSetId}>
      <ReactTable<MaterialSample>
        columns={CHILD_SAMPLES_COLUMNS}
        className="-striped react-table-overflow"
        data={samples ?? []}
        sort={sortingRules}
        showPagination={shouldShowPagination}
      />
    </FieldSet>
  );
}
