import {
  ButtonBar,
  ColumnDefinition,
  CreateButton,
  ListPageLayout
} from "common-ui";
import Link from "next/link";
import { groupCell, Head, Nav } from "../../../components";
import { SeqdbMessage, useSeqdbIntl } from "../../../intl/seqdb-intl";
import { SequencingFacility } from "../../../types/seqdb-api/resources/SequencingFacility";

const SUBMISSION_FACILITY_TABLE_COLUMNS: ColumnDefinition<SequencingFacility>[] =
  [
    {
      Cell: ({ original: { id, name } }) => (
        <Link href={`/seqdb/sequencing-facility/view?id=${id}`}>
          <a>{name || id}</a>
        </Link>
      ),
      accessor: "name"
    },
    groupCell("group")
  ];

const SUBMISSION_FACILITY_FILTER_ATTRIBUTES = ["name"];

export default function RegionListPage() {
  const { formatMessage } = useSeqdbIntl();

  return (
    <>
      <Head title={formatMessage("sequencingFacilityListTitle")} />
      <Nav />
      <ButtonBar>
        <CreateButton entityLink="/seqdb/sequencing-facility" />
      </ButtonBar>
      <main className="container-fluid">
        <h1 id="wb-cont">
          <SeqdbMessage id="sequencingFacilityListTitle" />
        </h1>
        <ListPageLayout
          filterAttributes={SUBMISSION_FACILITY_FILTER_ATTRIBUTES}
          id="sequencing-facility-list"
          queryTableProps={{
            columns: SUBMISSION_FACILITY_TABLE_COLUMNS,
            path: "seqdb-api/sequencing-facility"
          }}
        />
      </main>
    </>
  );
}
