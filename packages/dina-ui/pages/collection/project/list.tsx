import {
  ColumnDefinition,
  CreateButton,
  dateCell,
  descriptionCell,
  ListPageLayout
} from "common-ui";
import Link from "next/link";
import { groupCell } from "../../../components";
import PageLayout from "../../../components/page/PageLayout";
import { useDinaIntl } from "../../../intl/dina-ui-intl";
import { PreparationType } from "../../../types/collection-api";

const PROJECT_FILTER_ATTRIBUTES = ["name", "status", "multilingualDescription"];
const PROJECT_TABLE_COLUMNS: ColumnDefinition<PreparationType>[] = [
  {
    cell: ({
      row: {
        original: { id, name }
      }
    }) => <Link href={`/collection/project/view?id=${id}`}>{name}</Link>,
    accessorKey: "name"
  },
  "status",
  descriptionCell("multilingualDescription"),
  groupCell("group"),
  "createdBy",
  dateCell("createdOn")
];

export default function collectionMethodListPage() {
  const { formatMessage } = useDinaIntl();

  return (
    <PageLayout
      titleId="projectListTitle"
      buttonBarContent={<CreateButton entityLink="/collection/project" />}
    >
      <ListPageLayout
        filterAttributes={PROJECT_FILTER_ATTRIBUTES}
        id="project-list"
        queryTableProps={{
          columns: PROJECT_TABLE_COLUMNS,
          path: "collection-api/project",
          defaultSort: [
            {
              id: "name",
              desc: false
            }
          ]
        }}
      />
    </PageLayout>
  );
}
