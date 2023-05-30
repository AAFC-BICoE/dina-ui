import {
  ColumnDefinition,
  dateCell,
  DateView,
  KeyValueTable,
  ListPageLayout,
  useFieldLabels,
  useQuery,
  withResponse
} from "common-ui";
import { KitsuResource } from "kitsu";
import { get, pick, startCase } from "lodash";
import Link from "next/link";
import { useRouter } from "next/router";
import { Footer, Head, Nav } from "..";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import { AuditSnapshot } from "../../types/objectstore-api";
import { ReferenceLink } from "./ReferenceLink";
import { RevisionRowConfigsByType } from "./revision-row-config";
import { DinaUser } from "../../types/user-api";

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
    ...// Only show resourceName column when not searching by instanceId:
    (instanceId
      ? []
      : [
          {
            Cell: ({ original }) => {
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
            accessor: "resourceName",
            className: "resource-name-cell"
          },
          {
            Cell: ({ original }) => {
              const snapshot: AuditSnapshot = original;
              const [type] = snapshot.instanceId.split("/");
              return typeof type === "string" ? startCase(type) : "";
            },
            accessor: "resourceType",
            className: "resource-type-cell"
          }
        ]),
    "version",
    dateCell("commitDateTime"),
    "snapshotType",
    {
      Cell: ({ original: { changedProperties } }) => (
        <div style={{ whiteSpace: "normal" }}>
          {changedProperties
            ?.map((fieldName) => getFieldLabel({ name: fieldName }).fieldLabel)
            ?.join(", ")}
        </div>
      ),
      accessor: "changedProperties"
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
            ExpanderComponent: ExpanderWithLabel,
            // Pop-out component to show the changes for a single revision:
            SubComponent: ({ original }) => {
              const snapshot: AuditSnapshot = original;
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
                      createdOn: ({ original: { value } }) => (
                        <DateView date={value} />
                      ),
                      ...revisionRowConfigsByType?.[type]?.customValueCells
                    }}
                    tableClassName="no-hover-highlight"
                  />
                </div>
              );
            },
            defaultSorted: [],
            // Revisions are not sortable, they are pre-sorted by commit datetime.
            sortable: false,
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

  return withResponse(query, (response) => {
    const resource = response.data;

    const pageTitle = formatMessage("revisionsListTitle", {
      name: get(resource, nameField) ?? resource.id
    });

    return (
      <>
        <Head title={pageTitle} />
        <Nav />
        <main className="container-fluid">
          <h1 id="wb-cont">{pageTitle}</h1>
          <div className="mb-3">
            <Link
              href={`${detailsPageLink}/${
                isExternalResourceMetadata ? "external-resource-view" : "view"
              }?id=${resource.id}`}
            >
              <a>
                <DinaMessage id="detailsPageLink" />
              </a>
            </Link>
          </div>
          <RevisionsPageLayout
            auditSnapshotPath={auditSnapshotPath}
            instanceId={`${resourceType}/${id}`}
            revisionRowConfigsByType={revisionRowConfigsByType}
          />
        </main>
        <Footer />
      </>
    );
  });
}

/** "Show changes" button to show all changes of a revision. */
function ExpanderWithLabel({ isExpanded }) {
  return (
    <button className="btn btn-info" style={{ pointerEvents: "none" }}>
      <span>
        <strong>
          <DinaMessage id="showChanges" />
        </strong>
      </span>
      <span className={`rt-expander ${isExpanded ? "-open" : false}`}>•</span>
    </button>
  );
}
