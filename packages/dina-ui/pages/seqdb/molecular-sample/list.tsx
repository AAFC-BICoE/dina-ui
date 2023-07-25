import {
  ButtonBar,
  ColumnDefinition8,
  CreateButton,
  dateCell,
  ListPageLayout
} from "common-ui";
import Link from "next/link";
import { Footer, GroupSelectField, Head, Nav } from "../../../components";
import { SeqdbMessage, useSeqdbIntl } from "../../../intl/seqdb-intl";
import { MolecularSample } from "../../../types/seqdb-api";

const FILTER_ATTRIBUTES = ["name", "createdBy"];
const TABLE_COLUMNS: ColumnDefinition8<MolecularSample>[] = [
  {
    cell: ({
      row: {
        original: { id, name }
      }
    }) => <Link href={`/seqdb/molecular-sample/view?id=${id}`}>{name}</Link>,
    accessorKey: "name"
  },
  "sampleType",
  "group",
  "createdBy",
  dateCell("createdOn")
];

export default function MolecularSampleListPage() {
  const { formatMessage } = useSeqdbIntl();

  return (
    <div>
      <Head title={formatMessage("molecularSampleListTitle")} />
      <Nav />
      <main className="container-fluid">
        <h1 id="wb-cont">
          <SeqdbMessage id="molecularSampleListTitle" />
        </h1>
        <ButtonBar>
          <CreateButton entityLink="/seqdb/molecular-sample" />
        </ButtonBar>
        <ListPageLayout
          additionalFilters={(filterForm) => ({
            // Apply group filter:
            ...(filterForm.group && { rsql: `group==${filterForm.group}` })
          })}
          filterAttributes={FILTER_ATTRIBUTES}
          id="molecular-sample-list"
          queryTableProps={{
            columns: TABLE_COLUMNS,
            path: "seqdb-api/molecular-sample"
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
