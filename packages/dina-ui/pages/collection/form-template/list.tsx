import {
  CreateButton,
  ListPageLayout,
  useAccount,
  Tooltip,
  ColumnDefinition,
  booleanCell,
  dateCell,
  FieldHeader,
  SimpleSearchFilterBuilder
} from "common-ui";
import Link from "next/link";
import { FormTemplate } from "../../../types/collection-api";
import { GroupSelectField } from "../../../components";
import { DinaMessage } from "../../../intl/dina-ui-intl";
import PageLayout from "../../../components/page/PageLayout";

const FILTER_ATTRIBUTES = ["name", "createdBy"];

export default function MaterialSampleFormTemplateListPage() {
  const { groupNames, username } = useAccount();

  const TABLE_COLUMNS: ColumnDefinition<FormTemplate>[] = [
    {
      cell: ({
        row: {
          original: { id, name }
        }
      }) => (
        <Link href={`/collection/form-template/edit?id=${id}`} legacyBehavior>
          {name}
        </Link>
      ),
      accessorKey: "name",
      header: () => <FieldHeader name="name" />
    },
    "group",
    booleanCell("restrictToCreatedBy"),
    "createdBy",
    dateCell("createdOn"),
    {
      cell: ({
        row: {
          original: { id, createdBy }
        }
      }) => (
        <div className="list-inline">
          {createdBy === username ? (
            <Link
              href={`/collection/form-template/edit?id=${id}`}
              className="list-inline-item btn btn-dark"
            >
              <DinaMessage id="editButtonText" />
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
          <Link
            href={`/collection/material-sample/edit/?formTemplateId=${id}`}
            className="list-inline-item btn btn-primary"
          >
            <DinaMessage id="createSampleWithFormTemplate" />
          </Link>
        </div>
      ),
      id: "buttons",
      enableSorting: false
    }
  ];

  return (
    <PageLayout
      titleId="materialSampleFormTemplates"
      buttonBarContent={
        <div className="flex d-flex ms-auto">
          <CreateButton entityLink="/collection/form-template" />
        </div>
      }
    >
      <ListPageLayout<FormTemplate>
        additionalFilters={(filterForm) =>
          SimpleSearchFilterBuilder.create<FormTemplate>()
            // Restrict to selected group or user's groups. Users without groups have no restrictions.
            // The API only returns readable items.
            .when(
              !!filterForm.group,
              (b) => b.where("group", "EQ", filterForm.group),
              (b) => b.whereIn("group", groupNames)
            )
            // Templates created by the user or open to everyone:
            .or((b) =>
              b
                .whereProvided("createdBy", "EQ", username)
                .where("restrictToCreatedBy", "EQ", false)
            )
            .build()
        }
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
    </PageLayout>
  );
}
