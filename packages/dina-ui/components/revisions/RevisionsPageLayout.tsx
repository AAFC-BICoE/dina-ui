import { ColumnDefinition, ListPageLayout } from "common-ui";
import { pick } from "lodash";
import { DinaMessage } from "../../intl/dina-ui-intl";
import { AuditSnapshot, Metadata } from "../../types/objectstore-api";
import { KeyValueTable } from "./KeyValueTable";
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
  const REVISION_TABLE_COLUMNS: ColumnDefinition<Metadata>[] = [
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
                return snapshot.instanceId;
              }
            },
            accessor: "resourceName",
            className: "resource-name-cell"
          }
        ]),
    "version",
    "commitDateTime",
    "snapshotType",
    {
      Cell: ({ original: { changedProperties } }) => (
        <div style={{ whiteSpace: "normal" }}>
          {changedProperties?.join(", ")}
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
          min-width: 10rem !important;
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
                <div className="p-4" style={{ maxWidth: "50rem" }}>
                  <h4>
                    <DinaMessage id="changedProperties" />
                  </h4>
                  <KeyValueTable
                    data={changed}
                    customValueCells={
                      revisionRowConfigsByType?.[type]?.customValueCells
                    }
                  />
                </div>
              );
            },
            defaultSorted: [],
            // Revisions are not sortable, they are pre-sorted by commit datetime.
            sortable: false
          }
        }}
      />
    </>
  );
}

/** "Show changes" button to show all changes of a revision. */
function ExpanderWithLabel({ isExpanded }) {
  return (
    <>
      <span>
        <strong>
          <DinaMessage id="showChanges" />
        </strong>
      </span>
      <span className={`rt-expander ${isExpanded ? "-open" : false}`}>•</span>
    </>
  );
}
