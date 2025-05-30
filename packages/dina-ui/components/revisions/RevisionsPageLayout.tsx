import {
  ButtonBar,
  ColumnDefinition,
  dateCell,
  DateView,
  FieldHeader,
  KeyValueTable,
  ListPageLayout,
  LoadingSpinner,
  useFieldLabels,
  useQuery
} from "common-ui";
import { KitsuResource } from "kitsu";
import { get, pick, startCase } from "lodash";
import Link from "next/link";
import { useRouter } from "next/router";
import { Footer, Head, Nav } from "..";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import { AuditSnapshot } from "../../types/objectstore-api";
import { RevisionRowConfigsByType } from "./revision-row-config";

interface RevisionsPageLayoutProps {
  /** Audit snapshot path, including the base API path. */
  auditSnapshotPath: string;

  /** Filter by revision author. */
  author?: string;

  /** Filter by resource. */
  instanceId?: string;

  /** Custom revision table row renderering per type: */
  revisionRowConfigsByType?: RevisionRowConfigsByType;
}

export function RevisionsPageLayout({
  auditSnapshotPath,
  revisionRowConfigsByType,
  author,
  instanceId
}: RevisionsPageLayoutProps) {
  const { getFieldLabel } = useFieldLabels();
  const REVISION_TABLE_COLUMNS: ColumnDefinition<KitsuResource>[] = [
    {
      cell: ({ row }) => {
        return (
          <button
            className="btn btn-info me-1 ms-1"
            style={{ width: "max-content" }}
            onClick={row.getToggleExpandedHandler()}
          >
            <span>
              <strong>
                <DinaMessage id="showChanges" />
              </strong>
            </span>
            <span
              className={`rt-expander ${row.getIsExpanded() ? "-open" : false}`}
            >
              •
            </span>
          </button>
        );
      },
      id: "show_changes_button"
    },
    // Only show resourceName column when not searching by instanceId:
    ...(instanceId
      ? []
      : [
          {
            cell: ({ row: { original } }) => {
              const snapshot: AuditSnapshot = original;
              const [type] = snapshot.instanceId.split("/");
              const ResourceName = revisionRowConfigsByType?.[type]?.name;
              if (ResourceName) {
                return <ResourceName {...snapshot.state} />;
              } else {
                // Try the "name" field, otherwise render the instance ID:
                const name =
                  snapshot.state.name?.toString?.() || snapshot.instanceId;

                return <span title={name}>{name}</span>;
              }
            },
            accessorKey: "resourceName",
            header: () => <FieldHeader name="resourceName" />,
            id: "resource-name-cell"
          },
          {
            cell: ({ row: { original } }) => {
              const snapshot: AuditSnapshot = original;
              const [type] = snapshot.instanceId.split("/");
              return typeof type === "string" ? startCase(type) : "";
            },
            accessorKey: "resourceType",
            header: () => <FieldHeader name="resourceType" />,
            id: "resource-type-cell"
          }
        ]),
    "version",
    dateCell("commitDateTime"),
    "snapshotType",
    {
      cell: ({ row: { original } }) => (
        <div style={{ whiteSpace: "normal" }}>
          {(original as any)?.changedProperties
            ?.map((fieldName) => getFieldLabel({ name: fieldName }).fieldLabel)
            ?.join(", ")}
        </div>
      ),
      accessorKey: "changedProperties",
      header: () => <FieldHeader name={"changedProperties"} />
    },
    "author"
  ];

  return (
    <>
      <style>{`
        .rt-expandable, .rt-th:first-child {
          min-width: 12rem !important;
        }
      `}</style>
      <ListPageLayout
        id="metadata-revision-list"
        queryTableProps={{
          columns: REVISION_TABLE_COLUMNS,
          filter: {
            // Include these filters if specified in props:
            ...(author && { author }),
            ...(instanceId && { instanceId })
          },
          path: auditSnapshotPath,
          reactTableProps: {
            getRowCanExpand: () => true,
            // ExpanderComponent: ExpanderWithLabel,
            // Pop-out component to show the changes for a single revision:
            renderSubComponent: ({ row: { original } }) => {
              const snapshot: AuditSnapshot = original as any;
              const changed = pick(snapshot.state, snapshot.changedProperties);

              const [type] = snapshot.instanceId.split("/");

              return (
                <div className="p-4">
                  <h4>
                    <DinaMessage id="changedProperties" />
                  </h4>
                  <KeyValueTable
                    data={changed}
                    customValueCells={{
                      // createdOn is on almost every DTO, so handle it automatically here:
                      createdOn: ({
                        row: {
                          original: { value }
                        }
                      }) => <DateView date={value} />,
                      ...revisionRowConfigsByType?.[type]?.customValueCells
                    }}
                    tableClassName="no-hover-highlight"
                  />
                </div>
              );
            },
            sort: [],
            // Revisions are not sortable, they are pre-sorted by commit datetime.
            enableSorting: false,
            className: "no-hover-highlight"
          }
        }}
      />
    </>
  );
}

export interface RevisionsPageProps {
  /** API query path e.g. objectstore-api/metadata */
  queryPath: string;
  /** Audit snapshot path, including the base API path. */
  auditSnapshotPath: string;
  resourceType: string;
  /** Details page link e.g. "/object-store/object/view?id=" */
  detailsPageLink: string;
  /** Name field (default is "name") */
  nameField?: string;
  revisionRowConfigsByType?: RevisionRowConfigsByType;
}

/** Revisions page with header/footer and query based on "id" from the URL query string. */
export function RevisionsPage({
  queryPath,
  auditSnapshotPath,
  resourceType,
  nameField = "name",
  detailsPageLink,
  revisionRowConfigsByType
}: RevisionsPageProps) {
  const { formatMessage } = useDinaIntl();

  const router = useRouter();
  const { id, isExternalResourceMetadata } = router.query;

  const query = useQuery<KitsuResource>({ path: `${queryPath}/${id}` });
  const resource = query?.response?.data;

  const pageTitle = formatMessage("revisionsListTitle", {
    name: get(resource, nameField) ?? id
  });
  if (query?.loading) {
    return <LoadingSpinner loading={true} />;
  }
  return (
    <>
      <Head title={pageTitle} />
      <Nav marginBottom={false} />
      <ButtonBar>
        <Link
          href={`${detailsPageLink}/${
            isExternalResourceMetadata ? "external-resource-view" : "view"
          }?id=${id}`}
          className="back-button my-auto me-auto mt-2"
        >
          <DinaMessage id="detailsPageLink" />
        </Link>
      </ButtonBar>
      <main className="container-fluid">
        <h1 id="wb-cont">{pageTitle}</h1>
        <RevisionsPageLayout
          auditSnapshotPath={auditSnapshotPath}
          instanceId={`${resourceType}/${id}`}
          revisionRowConfigsByType={revisionRowConfigsByType}
        />
      </main>
      <Footer />
    </>
  );
}
