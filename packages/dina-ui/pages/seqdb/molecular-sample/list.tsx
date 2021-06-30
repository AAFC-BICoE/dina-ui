import { ButtonBar, CreateButton, dateCell, ListPageLayout } from "common-ui";
import Link from "next/link";
import { Footer, GroupSelectField, Head, Nav } from "../../../components";
import { useSeqdbIntl } from "../../../intl/seqdb-intl";

const FILTER_ATTRIBUTES = ["name", "createdBy"];
const TABLE_COLUMNS = [
  {
    Cell: ({ original: { id, name } }) => (
      <Link href={`/seqdb/molecular-sample/view?id=${id}`}>{name}</Link>
    ),
    accessor: "name"
  },
  "version",
  "sampleType",
  "group",
  "createdBy",
  dateCell("createdOn")
];

export default function MolecularSampleListPage() {
  const { formatMessage } = useSeqdbIntl();

  const title = formatMessage("molecularSampleListTitle");

  return (
    <div>
      <Head title={title} />
      <Nav />
      <main className="container-fluid">
        <h1>{title}</h1>
        <ButtonBar>
          <CreateButton entityLink="/seqdb/molecular-sample" />
        </ButtonBar>
        <ListPageLayout
          additionalFilters={filterForm => ({
            // Apply group filter:
            ...(filterForm.group && { rsql: `group==${filterForm.group}` })
          })}
          filterAttributes={FILTER_ATTRIBUTES}
          id="molecular-sample-list"
          queryTableProps={{
            columns: TABLE_COLUMNS,
            path: "seqdb-api/molecularSample"
          }}
          filterFormchildren={({ submitForm }) => (
            <div className="mb-3">
              <div style={{ width: "300px" }}>
                <GroupSelectField
                  onChange={() => setImmediate(submitForm)}
                  name="group"
                  showAnyOption={true}
                />
              </div>
            </div>
          )}
        />
      </main>
      <Footer />
    </div>
  );
}
