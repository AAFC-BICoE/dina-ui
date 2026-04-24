import {
  ColumnDefinition,
  FieldHeader,
  ListPageLayout,
  dateCell
} from "common-ui";
import Link from "next/link";
import { groupCell } from "../../../components";
import PageLayout from "../../../components/page/PageLayout";
import { MolecularAnalysisRun } from "../../../types/seqdb-api/resources/molecular-analysis/MolecularAnalysisRun";

const MOLECULAR_ANALYSIS_RUN_FILTER_ATTRIBUTES = ["name"];
const MOLECULAR_ANALYSIS_RUN_TABLE_COLUMNS: ColumnDefinition<MolecularAnalysisRun>[] =
  [
    {
      cell: ({
        row: {
          original: { id, name }
        }
      }) => (
        <Link href={`/seqdb/molecular-analysis-run/view?id=${id}`}>{name}</Link>
      ),
      accessorKey: "name",
      header: () => <FieldHeader name="name" />
    },
    groupCell("group"),
    "createdBy",
    dateCell("createdOn")
  ];

export default function MolecularAnalysisListPage() {
  return (
    <PageLayout titleId="molecularAnalysisRunListTitle">
      <ListPageLayout
        filterAttributes={MOLECULAR_ANALYSIS_RUN_FILTER_ATTRIBUTES}
        id="molecular-analysis-list"
        queryTableProps={{
          columns: MOLECULAR_ANALYSIS_RUN_TABLE_COLUMNS,
          path: "seqdb-api/molecular-analysis-run"
        }}
      />
    </PageLayout>
  );
}
