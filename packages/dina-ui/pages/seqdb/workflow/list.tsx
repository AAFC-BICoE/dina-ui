import {
  ButtonBar,
  ColumnDefinition,
  CreateButton,
  ListPageLayout
} from "common-ui";
import Link from "next/link";
import { Head, Nav } from "../../../components";
import { SeqdbMessage, useSeqdbIntl } from "../../../intl/seqdb-intl";

const WORKFLOW_TABLE_COLUMNS: ColumnDefinition<any>[] = [
  {
    Cell: ({ original: { id, name } }) => (
      <Link href={`/workflow/view?id=${id}`}>
        <a>{name}</a>
      </Link>
    ),
    accessor: "name"
  },
  "group",
  "createdOn",
  "chainTemplate.name"
];

const WORKFLOW_FILTER_ATTRIBUTES = ["name", "chainTemplate.name"];

export default function WorkflowListPage() {
  const { formatMessage } = useSeqdbIntl();

  return (
    <>
      <Head title={formatMessage("workflowListTitle")} />
      <Nav />
      <ButtonBar>
        <CreateButton entityLink="/seqdb/workflow" />
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
            include: "chainTemplate",
            path: "seqdb-api/chain"
          }}
        />
      </div>
    </>
  );
}
