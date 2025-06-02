import {
  CreateButton,
  dateCell,
  descriptionCell,
  FieldHeader,
  QueryPage
} from "common-ui";
import Link from "next/link";
import PageLayout from "../../../components/page/PageLayout";
import { TableColumn } from "packages/common-ui/lib/list-page/types";

export const PROJECT_NON_EXPORTABLE_COLUMNS: string[] = ["selectColumn"];

const PROJECT_TABLE_COLUMNS: TableColumn<any>[] = [
  {
    id: "name",
    cell: ({ row: { original } }) => {
      return (
        <Link href={`/collection/project/view?id=${original.id}`}>
          {original.data.attributes.name}
        </Link>
      );
    },
    header: () => <FieldHeader name="name" />,
    accessorKey: "data.attributes.name"
  },
  {
    id: "status",
    header: () => <FieldHeader name="status" />,
    accessorKey: "data.attributes.status"
  },
  {
    id: "group",
    header: () => <FieldHeader name="group" />,
    accessorKey: "data.attributes.group"
  },
  descriptionCell(
    false,
    false,
    "data.attributes.multilingualDescription",
    "multilingualDescription"
  ),
  {
    id: "createdBy",
    header: () => <FieldHeader name="createdBy" />,
    accessorKey: "data.attributes.createdBy"
  },
  dateCell("createdOn", "data.attributes.createdOn")
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
      <QueryPage
        indexName={"dina_project_index"}
        uniqueName="project-list"
        reactTableProps={{
          enableSorting: true,
          enableMultiSort: true
        }}
        enableRelationshipPresence={true}
        mandatoryDisplayedColumns={["selectColumn", "name"]}
        nonExportableColumns={PROJECT_NON_EXPORTABLE_COLUMNS}
        columns={PROJECT_TABLE_COLUMNS}
        bulkDeleteButtonProps={{
          typeName: "project",
          apiBaseUrl: "/collection-api"
        }}
      />
    </PageLayout>
  );
}
