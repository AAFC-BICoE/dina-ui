import {
  ButtonBar,
  CreateButton,
  descriptionCell,
  ListPageLayout
} from "common-ui";
import Link from "next/link";
import { Footer, Head, Nav } from "../../../components";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";

const PROJECT_FILTER_ATTRIBUTES = ["name", "status", "multilingualDescription"];
const PROJECT_TABLE_COLUMNS = [
  {
    Cell: ({ original: { id, name } }) => (
      <Link href={`/collection/project/view?id=${id}`}>{name}</Link>
    ),
    accessor: "name"
  },
  "status",
  descriptionCell("multilingualDescription")
];

export default function collectionMethodListPage() {
  const { formatMessage } = useDinaIntl();

  return (
    <div>
      <Head title={formatMessage("projectListTitle")} />
      <Nav />
      <main className="container-fluid">
        <h1 id="wb-cont">
          <DinaMessage id="projectListTitle" />
        </h1>
        <ButtonBar>
          <CreateButton entityLink="/collection/project" />
        </ButtonBar>
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
      </main>
      <Footer />
    </div>
  );
}
