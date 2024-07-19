import {
  ButtonBar,
  ColumnDefinition,
  CreateButton,
  ListPageLayout,
  dateCell
} from "common-ui";
import Link from "next/link";
import { Footer, groupCell, Head, Nav } from "../../../components";
import { SeqdbMessage, useSeqdbIntl } from "../../../intl/seqdb-intl";
import { Region } from "../../../types/seqdb-api/resources/Region";

const REGION_TABLE_COLUMNS: ColumnDefinition<Region>[] = [
  {
    cell: ({
      row: {
        original: { id, name }
      }
    }) => <Link href={`/seqdb/region/view?id=${id}`}>{name}</Link>,
    accessorKey: "name"
  },
  "description",
  "symbol",
  groupCell("group"),
  "createdBy",
  dateCell("createdOn")
];

const REGION_FILTER_ATTRIBUTES = ["name", "description", "symbol"];

export default function RegionListPage() {
  const { formatMessage } = useSeqdbIntl();

  return (
    <>
      <Head title={formatMessage("regionListTitle")} />
      <Nav marginBottom={false} />
      <ButtonBar>
        <div className="flex d-flex ms-auto">
          <CreateButton entityLink="/seqdb/region" />
        </div>
      </ButtonBar>
      <main className="container-fluid">
        <h1 id="wb-cont">
          <SeqdbMessage id="regionListTitle" />
        </h1>
        <ListPageLayout
          filterAttributes={REGION_FILTER_ATTRIBUTES}
          id="region-list"
          queryTableProps={{
            columns: REGION_TABLE_COLUMNS,
            path: "seqdb-api/region"
          }}
        />
      </main>
      <Footer />
    </>
  );
}
