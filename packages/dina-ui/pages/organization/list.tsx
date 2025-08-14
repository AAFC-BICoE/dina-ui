import {
  ColumnDefinition,
  CreateButton,
  ListPageLayout,
  dateCell,
  stringArrayCell
} from "common-ui";
import Link from "next/link";
import { Organization } from "../../types/agent-api";
import PageLayout from "packages/dina-ui/components/page/PageLayout";

const ORGANIZATION_FILTER_ATTRIBUTES = ["createdBy"];
const ORGANIZATION_TABLE_COLUMNS: ColumnDefinition<Organization>[] = [
  {
    cell: ({
      row: {
        original: { id, names }
      }
    }) => (
      <Link href={`/organization/view?id=${id}`} legacyBehavior>
        {names.length === 2 ? (
          <a>
            {names[0].languageCode === "EN"
              ? "EN: " + names[0].name + " | FR: " + names[1].name
              : "EN: " + names[1].name + " | FR: " + names[0].name}
          </a>
        ) : (
          <a>{`${names[0].languageCode}: ${names[0].name}`}</a>
        )}
      </Link>
    ),
    accessorKey: "name",
    enableSorting: false
  },
  stringArrayCell("aliases"),
  "createdBy",
  dateCell("createdOn")
];

export default function OrganizationListPage() {
  const buttonBarContent = (
    <div className="flex d-flex ms-auto">
      <CreateButton entityLink="/organization" />
    </div>
  );

  return (
    <PageLayout
      titleId="organizationListTitle"
      buttonBarContent={buttonBarContent}
    >
      <ListPageLayout
        filterAttributes={ORGANIZATION_FILTER_ATTRIBUTES}
        id="organization-list"
        queryTableProps={{
          columns: ORGANIZATION_TABLE_COLUMNS,
          path: "agent-api/organization"
        }}
        useFiql={true}
      />
    </PageLayout>
  );
}
