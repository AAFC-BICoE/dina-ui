import {
  useAccount,
  ListPageLayout,
  ColumnDefinition,
  dateCell,
  BackToListButton
} from "../../../common-ui/lib";
import PageLayout from "../../components/page/PageLayout";
import { DataExport } from "packages/dina-ui/types/dina-export-api";

export default function DataExportListPage() {
  const { username } = useAccount();
  const TABLE_COLUMNS: ColumnDefinition<DataExport>[] = [
    "id",
    "status",
    "createdBy",
    dateCell("createdOn")
  ];
  return (
    <PageLayout
      titleId="dataExports"
      buttonBarContent={
        <BackToListButton entityLink="/collection/material-sample" />
      }
    >
      <ListPageLayout
        additionalFilters={{
          rsql: `createdBy==${username}`
        }}
        id="data-export-list"
        queryTableProps={{
          columns: TABLE_COLUMNS,
          path: `dina-export-api/data-export/`
        }}
      />
    </PageLayout>
  );
}
