import {
  CreateButton,
  descriptionCell8,
  titleCell8,
  ListPageLayout,
  ColumnDefinition8,
  FieldHeader
} from "common-ui";
import Link from "next/link";
import PageLayout from "../../../components/page/PageLayout";
import { Assemblage } from "../../../types/collection-api";

const ASSEMBLAGE_FILTER_ATTRIBUTES = ["name"];
const ASSEMBLAGE_TABLE_COLUMNS: ColumnDefinition8<Assemblage>[] = [
  {
    cell: ({
      row: {
        original: { id, name }
      }
    }) => <Link href={`/collection/assemblage/view?id=${id}`}>{name}</Link>,
    accessorKey: "name",
    header: () => <FieldHeader name="name" />
  },
  titleCell8("multilingualTitle"),
  descriptionCell8("multilingualDescription")
];

export default function assemblageListPage() {
  const buttonBarContent = <CreateButton entityLink="/collection/assemblage" />;

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
          path: "collection-api/assemblage",
          defaultSort: [
            {
              id: "name",
              desc: false
            }
          ]
        }}
      />
    </PageLayout>
  );
}
