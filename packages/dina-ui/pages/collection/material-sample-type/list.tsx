import { ButtonBar, CreateButton, ListPageLayout, dateCell } from "common-ui";
import Link from "next/link";
import { Footer, Head, Nav } from "../../../components";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";

const MATERIAL_SAMPLE_TYPE_FILTER_ATTRIBUTES = ["name", "createdBy"];
const MATERIAL_SAMPLE_TYPE_TABLE_COLUMNS = [
  {
    Cell: ({ original: { id, name } }) => (
      <Link href={`/collection/material-sample-type/view?id=${id}`}>
        {name}
      </Link>
    ),
    accessor: "name"
  },
  "createdBy",
  dateCell("createdOn")
];

export default function MaterialSampleTypeListPage() {
  const { formatMessage } = useDinaIntl();

  return (
    <div>
      <Head
        title={formatMessage("materialSampleTypeListTitle")}
        lang={formatMessage("languageOfPage")}
        creator={formatMessage("agricultureCanada")}
        subject={formatMessage("subjectTermsForPage")}
      />
      <Nav />
      <main className="container-fluid">
        <h1 id="wb-cont">
          <DinaMessage id="materialSampleTypeListTitle" />
        </h1>
        <ButtonBar>
          <CreateButton entityLink="/collection/material-sample-type" />
        </ButtonBar>
        <ListPageLayout
          filterAttributes={MATERIAL_SAMPLE_TYPE_FILTER_ATTRIBUTES}
          id="material-sample-type-list"
          queryTableProps={{
            columns: MATERIAL_SAMPLE_TYPE_TABLE_COLUMNS,
            path: "collection-api/material-sample-type"
          }}
        />
      </main>
      <Footer />
    </div>
  );
}
