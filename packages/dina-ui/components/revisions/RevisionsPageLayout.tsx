import { ColumnDefinition, ListPageLayout } from "common-ui";
import { pick } from "lodash";
import { ComponentType } from "react";
import { CellInfo } from "react-table";
import { DinaMessage } from "../../intl/dina-ui-intl";
import { AuditSnapshot, Metadata } from "../../types/objectstore-api";
import { KeyValueTable } from "./KeyValueTable";

const REVISION_TABLE_COLUMNS: ColumnDefinition<Metadata>[] = [
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

interface RevisionsPageLayoutProps {
  /** Audit snapshot path, including the base API path. */
  auditSnapshotPath: string;
  instanceId: string;
  customValueCells?: Record<string, ComponentType<CellInfo>>;
}

export function RevisionsPageLayout({
  auditSnapshotPath,
  customValueCells,
  instanceId
}: RevisionsPageLayoutProps) {
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
          filter: { instanceId },
          path: auditSnapshotPath,
          reactTableProps: {
            ExpanderComponent: ExpanderWithLabel,
            // Pop-out component to show the changes for a single revision:
            SubComponent: ({ original }) => {
              const snapshot: AuditSnapshot = original;
              const changed = pick(snapshot.state, snapshot.changedProperties);

              return (
                <div className="p-4" style={{ maxWidth: "50rem" }}>
                  <h4>
                    <DinaMessage id="changedProperties" />
                  </h4>
                  <KeyValueTable
                    data={changed}
                    customValueCells={customValueCells}
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
        <strong>Show changes</strong>
      </span>
      <span className={`rt-expander ${isExpanded ? "-open" : false}`}>•</span>
    </>
  );
}
