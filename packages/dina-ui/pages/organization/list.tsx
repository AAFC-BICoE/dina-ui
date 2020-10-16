import {
  ButtonBar,
  CreateButton,
  ListPageLayout,
  dateCell,
  stringArrayCell
} from "common-ui";
import Link from "next/link";
import { Footer, Head, Nav } from "../../components";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";

const ORGANIZATION_FILTER_ATTRIBUTES = ["name", "aliases", "createdBy"];
const ORGANIZATION_TABLE_COLUMNS = [
  {
    Cell: ({ original: { id, names } }) => (
      <Link href={`/organization/view?id=${id}`}>
        {names.length === 2 ? (
          <a>
            {names[0].languageCode === "EN"
              ? names[0].name + "|" + names[1].name
              : names[1].name + "|" + names[0].name}
          </a>
        ) : (
          <a>names[0].name</a>
        )}
      </Link>
    ),
    accessor: "name"
  },
  stringArrayCell("aliases"),
  "createdBy",
  dateCell("createdOn")
];

export default function OrganizationListPage() {
  const { formatMessage } = useDinaIntl();

  return (
    <div>
      <Head title={formatMessage("organizationListTitle")} />
      <Nav />
      <div className="container-fluid">
        <h1>
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
      </div>
      <Footer />
    </div>
  );
}
