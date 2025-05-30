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
import { PreparationType } from "../../../types/collection-api";

const PROJECT_FILTER_ATTRIBUTES = ["name", "status", "multilingualDescription"];
const PROJECT_TABLE_COLUMNS: ColumnDefinition<PreparationType>[] = [
  {
    cell: ({
      row: {
        original: { id, name }
      }
    }) => (
      <Link href={`/collection/project/view?id=${id}`} legacyBehavior>
        {name}
      </Link>
    ),
    accessorKey: "name"
  },
  "status",
  descriptionCell(false, false, "multilingualDescription"),
  groupCell("group"),
  "createdBy",
  dateCell("createdOn")
];

export default function collectionMethodListPage() {
  return (
    <PageLayout
      titleId="projectListTitle"
      buttonBarContent={
        <div className="flex d-flex ms-auto">
          <CreateButton entityLink="/collection/project" />
        </div>
      }
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
