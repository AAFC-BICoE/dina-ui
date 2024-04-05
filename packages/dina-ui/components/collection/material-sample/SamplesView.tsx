import { ColumnDef } from "@tanstack/react-table";
import {
  FieldHeader,
  FieldSet,
  ReactTable,
  dateCell
} from "common-ui";
import Link from "next/link";
import { useState } from "react";
import { MaterialSample } from "../../../../dina-ui/types/collection-api";
import { materialSampleActionCell } from "./useMaterialSampleRelationshipColumns";
import { useIntl } from "react-intl";

export interface SamplesViewProps {
  samples?: MaterialSample[];
  fieldSetId: JSX.Element;
}

export function SamplesView({ samples, fieldSetId }: SamplesViewProps) {
  const defaultSort = [];
  const { formatMessage } = useIntl();

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
    materialSampleActionCell(formatMessage)
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
