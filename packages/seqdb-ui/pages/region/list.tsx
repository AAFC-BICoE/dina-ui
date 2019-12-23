import { ColumnDefinition } from "common-ui";
import Link from "next/link";
import {
  ButtonBar,
  CreateButton,
  Head,
  ListPageLayout,
  Nav
} from "../../components";
import { SeqdbMessage, useSeqdbIntl } from "../../intl/seqdb-intl";
import { Region } from "../../types/seqdb-api/resources/Region";

const REGION_TABLE_COLUMNS: Array<ColumnDefinition<Region>> = [
  {
    Cell: ({ original: { id, name } }) => (
      <Link href={`/region/view?id=${id}`}>
        <a>{name}</a>
      </Link>
    ),
    accessor: "name"
  },
  "description",
  "symbol"
];

const REGION_FILTER_ATTRIBUTES = ["name", "description", "symbol"];

export default function RegionListPage() {
  const { formatMessage } = useSeqdbIntl();

  return (
    <>
      <Head title={formatMessage("regionListTitle")} />
      <Nav />
      <ButtonBar>
        <CreateButton entityLink="region" />
      </ButtonBar>
      <div className="container-fluid">
        <h1>
          <SeqdbMessage id="regionListTitle" />
        </h1>
        <ListPageLayout
          filterAttributes={REGION_FILTER_ATTRIBUTES}
          id="region-list"
          queryTableProps={{
            columns: REGION_TABLE_COLUMNS,
            path: "region"
          }}
        />
      </div>
    </>
  );
}
