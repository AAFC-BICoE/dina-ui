import Link from "next/link";
import {
  ButtonBar,
  ColumnDefinition,
  Head,
  ListPageLayout,
  Nav
} from "../../components";
import { Region } from "../../types/seqdb-api/resources/Region";

const REGION_TABLE_COLUMNS: Array<ColumnDefinition<Region>> = [
  {
    Cell: ({ original: { id, name } }) => (
      <Link href={`/region/view?id=${id}`}>
        <a>{name}</a>
      </Link>
    ),
    Header: "Name",
    accessor: "name"
  },
  "description",
  "symbol"
];

const REGION_FILTER_ATTRIBUTES = ["name", "description", "symbol"];

export default function RegionListPage() {
  return (
    <>
      <Head title="Gene Regions" />
      <Nav />
      <ButtonBar>
        <Link href="/region/edit" prefetch={true}>
          <button className="btn btn-primary">Add Gene Region</button>
        </Link>
      </ButtonBar>
      <div className="container-fluid">
        <h1>Gene Regions</h1>
        <ListPageLayout
          filterAttributes={REGION_FILTER_ATTRIBUTES}
          queryTableProps={{
            columns: REGION_TABLE_COLUMNS,
            path: "region"
          }}
        />
      </div>
    </>
  );
}
