import {
  ButtonBar,
  CreateButton,
  descriptionCell,
  titleCell,
  ListPageLayout
} from "common-ui";
import Link from "next/link";
import { Footer, Head, Nav } from "../../../components";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";

const ASSEMBLAGE_FILTER_ATTRIBUTES = [
  "name",
  "multilingualTitle",
  "multilingualDescription"
];
const ASSEMBLAGE_TABLE_COLUMNS = [
  {
    Cell: ({ original: { id, name } }) => (
      <Link href={`/collection/assemblage/view?id=${id}`}>{name}</Link>
    ),
    accessor: "name"
  },
  titleCell("multilingualTitle"),
  descriptionCell("multilingualDescription")
];

export default function assemblageListPage() {
  const { formatMessage } = useDinaIntl();

  return (
    <div>
      <Head title={formatMessage("assemblageListTitle")} />
      <Nav />
      <main className="container-fluid">
        <h1 id="wb-cont">
          <DinaMessage id="assemblageListTitle" />
        </h1>
        <ButtonBar>
          <CreateButton entityLink="/collection/assemblage" />
        </ButtonBar>
        <ListPageLayout
          filterAttributes={ASSEMBLAGE_FILTER_ATTRIBUTES}
          id="assemblage-list"
          queryTableProps={{
            columns: ASSEMBLAGE_TABLE_COLUMNS,
            path: "collection-api/assemblage",
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
