import {
  ButtonBar,
  CreateButton,
  ListPageLayout,
  dateCell,
  ColumnDefinition,
  booleanCell,
  useAccount,
  Tooltip
} from "common-ui";
import Link from "next/link";
import { FormTemplate } from "../../../types/collection-api";
import { Footer, GroupSelectField, Head, Nav } from "../../../components";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";

const FILTER_ATTRIBUTES = ["name", "createdBy"];

export default function MaterialSampleFormTemplateListPage() {
  const { formatMessage } = useDinaIntl();
  const { groupNames, username } = useAccount();

  const TABLE_COLUMNS: ColumnDefinition<FormTemplate>[] = [
    {
      Cell: ({ original: { id, name } }) => (
        <Link href={`/collection/form-template/edit?id=${id}`}>{name}</Link>
      ),
      accessor: "name"
    },
    "group",
    booleanCell("field_restrictToCreatedBy", "restrictToCreatedBy"),
    "createdBy",
    dateCell("createdOn"),
    {
      Cell: ({ original: { id, createdBy } }) => (
        <div className="list-inline">
          {createdBy === username ? (
            <Link href={`/collection/form-template/edit?id=${id}`}>
              <a className="list-inline-item btn btn-dark">
                <DinaMessage id="editButtonText" />
              </a>
            </Link>
          ) : (
            <Tooltip
              id="formTemplateEditPermission_tooltip"
              placement="left"
              disableSpanMargin={true}
              visibleElement={
                <button
                  className="list-inline-item btn btn-dark"
                  disabled={true}
                >
                  <DinaMessage id="editButtonText" />
                </button>
              }
            />
          )}
          <Link href={`/collection/material-sample/edit/?formTemplateId=${id}`}>
            <a className="list-inline-item btn btn-primary">
              <DinaMessage id="createSampleWithFormTemplate" />
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
      <Head title={formatMessage("materialSampleFormTemplates")} />
      <Nav />
      <main className="container-fluid">
        <h1 id="wb-cont">
          <DinaMessage id="materialSampleFormTemplates" />
        </h1>
        <ButtonBar>
          <CreateButton entityLink="/collection/form-template" />
        </ButtonBar>
        <ListPageLayout
          additionalFilters={(filterForm) => ({
            // Display all user form templates and public to the group templates.
            ...(filterForm.group
              ? {
                  rsql: `group==${filterForm.group};(createdBy==${username},restrictToCreatedBy==false)`
                }
              : {
                  rsql: `group=in=(${groupNames});(createdBy==${username},restrictToCreatedBy==false)`
                })
          })}
          filterAttributes={FILTER_ATTRIBUTES}
          id="material-sample-form-template-list"
          queryTableProps={{
            columns: TABLE_COLUMNS,
            path: "collection-api/form-template"
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
