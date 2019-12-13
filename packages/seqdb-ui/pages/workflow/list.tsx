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

const WORKFLOW_TABLE_COLUMNS: Array<ColumnDefinition<any>> = [
  {
    Cell: ({ original: { id, name } }) => (
      <Link href={`/workflow/view?id=${id}`}>
        <a>{name}</a>
      </Link>
    ),
    accessor: "name"
  },
  "dateCreated",
  "chainTemplate.name",
  "group.groupName"
];

const WORKFLOW_FILTER_ATTRIBUTES = [
  "name",
  "chainTemplate.name",
  "group.groupName"
];

export default function WorkflowListPage() {
  const { formatMessage } = useSeqdbIntl();

  return (
    <>
      <Head title={formatMessage("workflowListTitle")} />
      <Nav />
      <ButtonBar>
        <CreateButton entityLink="workflow" />
      </ButtonBar>
      <div className="container-fluid">
        <h1>
          <SeqdbMessage id="workflowListTitle" />
        </h1>
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
