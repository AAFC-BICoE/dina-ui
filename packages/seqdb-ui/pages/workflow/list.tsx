import { ColumnDefinition } from "common-ui";
import Link from "next/link";
import { Head, ListPageLayout, Nav } from "../../components";

const WORKFLOW_TABLE_COLUMNS: Array<ColumnDefinition<any>> = [
  {
    Cell: ({ original: { id, name } }) => (
      <Link href={`/workflow/view?id=${id}`}>
        <a>{name}</a>
      </Link>
    ),
    Header: "Name",
    accessor: "name"
  },
  "dateCreated",
  "chainTemplate.name",
  {
    Header: "Group",
    accessor: "group.groupName"
  }
];

const WORKFLOW_FILTER_ATTRIBUTES = [
  "name",
  "chainTemplate.name",
  "group.groupName"
];

export default function WorkflowListPage() {
  return (
    <>
      <Head title="NGS Workflows" />
      <Nav />
      <div className="container-fluid">
        <h1>NGS Workflows</h1>
        <Link href="/workflow/edit" prefetch={true}>
          <a>Add New NGS Workflow</a>
        </Link>
        <ListPageLayout
          filterAttributes={WORKFLOW_FILTER_ATTRIBUTES}
          id="workflow-list"
          queryTableProps={{
            columns: WORKFLOW_TABLE_COLUMNS,
            include: "chainTemplate,group",
            path: "chain"
          }}
        />
      </div>
    </>
  );
}
