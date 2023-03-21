import {
  CommonMessage,
  dateCell,
  DeleteButton,
  EditButton,
  FieldSet,
  LimitOffsetPageSpec
} from "common-ui";
import Link from "next/link";
import { useState } from "react";
import ReactTable from "react-table";
import { useDinaIntl } from "../../../../dina-ui/intl/dina-ui-intl";
import { MaterialSample } from "../../../../dina-ui/types/collection-api";
import { SplitMaterialSampleDropdownButton } from "./SplitMaterialSampleDropdownButton";

export interface SamplesViewProps {
  samples?: Partial<MaterialSample>[];
  fieldSetId: JSX.Element;
}

export function SamplesView({ samples, fieldSetId }: SamplesViewProps) {
  const DEFAULT_PAGE_SIZE = 25;
  const defaultSort = [];
  const { formatMessage } = useDinaIntl();

  const CHILD_SAMPLES_COLUMNS = [
    {
      Cell: ({ original: { id, materialSampleName } }) => (
        <Link href={`/collection/material-sample/view?id=${id}`}>
          <a>{materialSampleName}</a>
        </Link>
      ),
      accessor: "id",
      Header: formatMessage("field_materialSampleName")
    },
    {
      accessor: "materialSampleType",
      sortable: false,
      Header: formatMessage("field_materialSampleType")
    },
    {
      ...dateCell("createdOn"),
      Header: formatMessage("field_createdOn")
    },
    {
      Cell: ({ original: { tags } }) => <>{tags?.join(", ")}</>,
      accessor: "tags",
      Header: formatMessage("tags")
    },
    {
      Cell: ({ original: { id, materialSampleName, materialSampleType } }) => (
        <div className="d-flex">
          <EditButton
            className="mx-2"
            entityId={id as string}
            entityLink="collection/material-sample"
            style={{ width: "5rem" }}
          />
          <SplitMaterialSampleDropdownButton
            ids={[id]}
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
      Header: formatMessage("actions"),
      sortable: false
    }
  ];

  // JSONAPI sort attribute.
  const [sortingRules, _] = useState(defaultSort);
  // JSONAPI page spec.
  const [page, _setPage] = useState<LimitOffsetPageSpec>({
    limit: DEFAULT_PAGE_SIZE,
    offset: 0
  });

  const totalCount = samples?.length;

  const numberOfPages = totalCount
    ? Math.ceil(totalCount / page.limit)
    : undefined;

  const shouldShowPagination = !!totalCount && totalCount > 25;
  return (
    <FieldSet legend={fieldSetId}>
      <ReactTable
        columns={CHILD_SAMPLES_COLUMNS}
        className="-striped react-table-overflow"
        data={samples}
        defaultSorted={sortingRules}
        minRows={1}
        pageSizeOptions={[25, 50, 100, 200, 500]}
        pages={numberOfPages}
        ofText={<CommonMessage id="of" />}
        rowsText={formatMessage("rows")}
        showPagination={shouldShowPagination}
      />
    </FieldSet>
  );
}
