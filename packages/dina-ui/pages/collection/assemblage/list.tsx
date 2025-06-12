import {
  ColumnDefinition,
  CreateButton,
  FieldHeader,
  ListPageLayout,
  dateCell,
  descriptionCell,
  titleCell
} from "common-ui";
import Link from "next/link";
import { groupCell } from "../../../components";
import PageLayout from "../../../components/page/PageLayout";
import { Assemblage } from "../../../types/collection-api";

const ASSEMBLAGE_FILTER_ATTRIBUTES = ["name"];
const ASSEMBLAGE_TABLE_COLUMNS: ColumnDefinition<Assemblage>[] = [
  {
    cell: ({
      row: {
        original: { id, name }
      }
    }) => (
      <Link href={`/collection/assemblage/view?id=${id}`} legacyBehavior>
        {name}
      </Link>
    ),
    accessorKey: "name",
    header: () => <FieldHeader name="name" />
  },
  titleCell(false, false, "multilingualTitle"),
  descriptionCell(false, false, "multilingualDescription"),
  groupCell("group"),
  "createdBy",
  dateCell("createdOn")
];

export default function assemblageListPage() {
  const buttonBarContent = (
    <div className="flex d-flex ms-auto">
      <CreateButton entityLink="/collection/assemblage" />
    </div>
  );

  return (
    <PageLayout
      titleId="assemblageListTitle"
      headingTooltip={{
        id: "assemblage_tooltip",
        link: "https://aafc-bicoe.github.io/dina-documentation/#assemblage",
        linkText: "fromDinaUserGuide",
        placement: "right"
      }}
      buttonBarContent={buttonBarContent}
    >
      <ListPageLayout
        filterAttributes={ASSEMBLAGE_FILTER_ATTRIBUTES}
        id="assemblage-list"
        queryTableProps={{
          columns: ASSEMBLAGE_TABLE_COLUMNS,
          path: "collection-api/assemblage"
        }}
      />
    </PageLayout>
  );
}
