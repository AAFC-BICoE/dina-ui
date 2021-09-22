import { LimitOffsetPageSpec } from "../../../common-ui/lib/api-client/operations-types";
import { MaterialSample } from "../../../dina-ui/types/collection-api";
import { useState } from "react";
import ReactTable from "react-table";
import { CommonMessage } from "../../../common-ui/lib/intl/common-ui-intl";
import Link from "next/link";
import { dateCell } from "../../../common-ui/lib/table/date-cell";
import { DinaMessage, useDinaIntl } from "../../../dina-ui/intl/dina-ui-intl";
import { FieldSet } from "../../../common-ui/lib";

export interface ChildSampleViewProps {
  childSamples?: Partial<MaterialSample>[];
}

export function ChildSamplesView({ childSamples }: ChildSampleViewProps) {
  const DEFAULT_PAGE_SIZE = 25;
  const defaultSort = [];
  const { formatMessage } = useDinaIntl();

  const CHILD_SAMPLES_COLUMNS = [
    {
      Cell: ({ original: { id, materialSampleName } }) => (
        <Link href={`/collection/material-sample/view?id=${id}`}>
          <a target="_blank">{materialSampleName}</a>
        </Link>
      ),
      accessor: "id",
      Header: formatMessage("primaryId")
    },
    { ...dateCell("createdOn"), Header: formatMessage("field_createdOn") }
  ];

  // JSONAPI sort attribute.
  const [sortingRules, _] = useState(defaultSort);
  // JSONAPI page spec.
  const [page, _setPage] = useState<LimitOffsetPageSpec>({
    limit: DEFAULT_PAGE_SIZE,
    offset: 0
  });

  const totalCount = childSamples?.length;

  const numberOfPages = totalCount
    ? Math.ceil(totalCount / page.limit)
    : undefined;

  return (
    <FieldSet legend={<DinaMessage id="childMaterialSamples" />}>
      <ReactTable
        showPagination={false}
        columns={CHILD_SAMPLES_COLUMNS}
        className="-striped"
        data={childSamples}
        defaultSorted={sortingRules}
        minRows={1}
        pageSizeOptions={[25, 50, 100, 200, 500]}
        pages={numberOfPages}
        ofText={<CommonMessage id="of" />}
        rowsText={formatMessage("rows")}
      />
    </FieldSet>
  );
}
