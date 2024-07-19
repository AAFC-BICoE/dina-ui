import {
  ColumnDefinition,
  CreateButton,
  ListPageLayout,
  dateCell
} from "common-ui";
import Link from "next/link";
import { Person } from "../../types/objectstore-api";
import PageLayout from "packages/dina-ui/components/page/PageLayout";

const AGENT_FILTER_ATTRIBUTES = ["displayName", "email", "createdBy"];
const AGENT_TABLE_COLUMNS: ColumnDefinition<Person>[] = [
  {
    cell: ({
      row: {
        original: { id, displayName }
      }
    }) => <Link href={`/person/view?id=${id}`}>{displayName}</Link>,
    accessorKey: "displayName"
  },
  "email",
  "givenNames",
  "familyNames",
  {
    cell: ({
      row: {
        original: { aliases }
      }
    }) => <>{aliases?.join(", ")}</>,
    accessorKey: "aliases"
  },
  "createdBy",
  dateCell("createdOn")
];

export default function AgentListPage() {
  const buttonBarContent = (
    <div className="flex d-flex ms-auto">
      <CreateButton entityLink="/person" />
    </div>
  );

  return (
    <PageLayout titleId="personListTitle" buttonBarContent={buttonBarContent}>
      <ListPageLayout
        filterAttributes={AGENT_FILTER_ATTRIBUTES}
        id="person-list"
        queryTableProps={{
          columns: AGENT_TABLE_COLUMNS,
          path: "agent-api/person",
          defaultSort: [
            {
              id: "familyNames",
              desc: false
            },
            {
              id: "givenNames",
              desc: false
            }
          ]
        }}
      />
    </PageLayout>
  );
}
