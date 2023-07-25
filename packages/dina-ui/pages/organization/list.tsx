import {
  ButtonBar,
  ColumnDefinition8,
  CreateButton,
  ListPageLayout,
  dateCell,
  stringArrayCell8
} from "common-ui";
import Link from "next/link";
import { Footer, Head, Nav } from "../../components";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import { Organization } from "../../types/agent-api";

const ORGANIZATION_FILTER_ATTRIBUTES = ["createdBy"];
const ORGANIZATION_TABLE_COLUMNS: ColumnDefinition8<Organization>[] = [
  {
    cell: ({
      row: {
        original: { id, names }
      }
    }) => (
      <Link href={`/organization/view?id=${id}`}>
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
  stringArrayCell8("aliases"),
  "createdBy",
  dateCell("createdOn")
];

export default function OrganizationListPage() {
  const { formatMessage } = useDinaIntl();

  return (
    <div>
      <Head title={formatMessage("organizationListTitle")} />
      <Nav />
      <main className="container-fluid">
        <h1 id="wb-cont">
          <DinaMessage id="organizationListTitle" />
        </h1>
        <ButtonBar>
          <CreateButton entityLink="/organization" />
        </ButtonBar>
        <ListPageLayout
          filterAttributes={ORGANIZATION_FILTER_ATTRIBUTES}
          id="organization-list"
          queryTableProps={{
            columns: ORGANIZATION_TABLE_COLUMNS,
            path: "agent-api/organization"
          }}
        />
      </main>
      <Footer />
    </div>
  );
}
