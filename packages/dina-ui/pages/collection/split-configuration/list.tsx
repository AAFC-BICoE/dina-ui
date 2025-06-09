import {
  ColumnDefinition,
  CreateButton,
  dateCell,
  FieldHeader,
  ListPageLayout
} from "common-ui";
import Link from "next/link";
import { GroupSelectField } from "packages/dina-ui/components/group-select/GroupSelectField";
import PageLayout from "../../../components/page/PageLayout";

const SPLIT_CONFIG_FILTER_ATTRIBUTES = ["name", "createdBy"];
const SPLIT_CONFIG_TABLE_COLUMNS: ColumnDefinition<any>[] = [
  {
    cell: ({
      row: {
        original: { id, name }
      }
    }) => (
      <Link
        href={`/collection/split-configuration/view?id=${id}`}
        legacyBehavior
      >
        {name}
      </Link>
    ),
    accessorKey: "name",
    header: () => <FieldHeader name="name" />
  },
  "group",
  "createdBy",
  dateCell("createdOn")
];

export default function AgentListPage() {
  const buttonBarContent = (
    <div className="flex d-flex ms-auto">
      <CreateButton entityLink="/collection/split-configuration" />
    </div>
  );

  return (
    <PageLayout
      titleId="splitConfigurationTitle"
      buttonBarContent={buttonBarContent}
    >
      <ListPageLayout
        id="split-config-list"
        queryTableProps={{
          columns: SPLIT_CONFIG_TABLE_COLUMNS,
          path: "collection-api/split-configuration"
        }}
        filterAttributes={SPLIT_CONFIG_FILTER_ATTRIBUTES}
        filterFormchildren={({ submitForm }) => (
          <div className="mb-2">
            <div style={{ width: "300px" }}>
              <GroupSelectField
                onChange={() => setImmediate(submitForm)}
                name="group"
                showAnyOption={true}
              />
            </div>
          </div>
        )}
        additionalFilters={(filterForm) => ({
          // Apply group filter:
          ...(filterForm.group && { rsql: `group==${filterForm.group}` })
        })}
      />
    </PageLayout>
  );
}
