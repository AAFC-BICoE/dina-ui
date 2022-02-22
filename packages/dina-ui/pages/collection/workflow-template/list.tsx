import {
  ButtonBar,
  CreateButton,
  ListPageLayout,
  dateCell,
  ColumnDefinition
} from "common-ui";
import Link from "next/link";
import { CustomView } from "../../../types/collection-api";
import { Footer, GroupSelectField, Head, Nav } from "../../../components";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";

const FILTER_ATTRIBUTES = ["name", "createdBy"];

export default function WorkflowTemplateListPage() {
  const { formatMessage } = useDinaIntl();

  const TABLE_COLUMNS: ColumnDefinition<CustomView>[] = [
    {
      Cell: ({ original: { id, name } }) => (
        <Link href={`/collection/workflow-template/edit?id=${id}`}>{name}</Link>
      ),
      accessor: "name"
    },
    "group",
    "createdBy",
    dateCell("createdOn"),
    {
      Cell: ({ original: { id } }) => (
        <div className="list-inline">
          <Link href={`/collection/workflow-template/edit?id=${id}`}>
            <a className="list-inline-item btn btn-dark">
              <DinaMessage id="editButtonText" />
            </a>
          </Link>
          <Link href={`/collection/workflow-template/run?id=${id}`}>
            <a className="list-inline-item btn btn-primary">
              <DinaMessage id="runWorkflow" />
            </a>
          </Link>
        </div>
      ),
      Header: "",
      sortable: false
    }
  ];

  return (
    <div>
      <Head title={formatMessage("workflowTemplateListTitle")} />
      <Nav />
      <main className="container-fluid">
        <h1 id="wb-cont">
          <DinaMessage id="workflowTemplateListTitle" />
        </h1>
        <ButtonBar>
          <CreateButton entityLink="/collection/workflow-template" />
        </ButtonBar>
        <ListPageLayout
          additionalFilters={filterForm => ({
            // Apply group filter:
            ...(filterForm.group && { rsql: `group==${filterForm.group}` })
          })}
          filterAttributes={FILTER_ATTRIBUTES}
          id="material-sample-form-custom-view-list"
          queryTableProps={{
            columns: TABLE_COLUMNS,
            path: "collection-api/custom-view",
            filter: {
              "viewConfiguration.type": "material-sample-form-custom-view"
            }
          }}
          filterFormchildren={({ submitForm }) => (
            <div className="mb-3">
              <div style={{ width: "300px" }}>
                <GroupSelectField
                  onChange={() => setImmediate(submitForm)}
                  name="group"
                  showAnyOption={true}
                />
              </div>
            </div>
          )}
        />
      </main>
      <Footer />
    </div>
  );
}
