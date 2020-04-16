import {
  ColumnDefinition,
  DefaultTd,
  ListPageLayout,
  LoadingSpinner,
  useQuery
} from "common-ui";
import { pick, toPairs } from "lodash";
import { useRouter } from "next/router";
import { ComponentType } from "react";
import { useIntl } from "react-intl";
import ReactTable, { CellInfo, SubComponentFunction } from "react-table";
import titleCase from "title-case";
import { Head, Nav } from "../../components";
import { MetadataManagedAttributes } from "../../components/metadata/MetadataDetails";
import {
  ObjectStoreMessage,
  useObjectStoreIntl
} from "../../intl/objectstore-intl";
import { AuditSnapshot, Metadata } from "../../types/objectstore-api";

const REVISION_TABLE_COLUMNS: Array<ColumnDefinition<Metadata>> = [
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

export default function RevisionListPage() {
  const { formatMessage } = useObjectStoreIntl();

  const router = useRouter();
  const { id } = router.query;

  const { loading, response } = useQuery<Metadata>({
    path: `metadata/${id}`
  });

  if (loading || !id) {
    return <LoadingSpinner loading={true} />;
  }

  if (response) {
    const metadata = response.data;

    const pageTitle = formatMessage("metadataRevisionsListTitle", {
      name: metadata.originalFilename
    });

    return (
      <>
        <Head title={pageTitle} />
        <Nav />
        <div className="container-fluid">
          <h1>{pageTitle}</h1>
          {/* Override the default react-table width for the expander cell to fit the label in: */}
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
                instanceId: `metadata/${id}`
              },
              path: "audit-snapshot",
              reactTableProps: {
                ExpanderComponent: ExpanderWithLabel,
                SubComponent: ChangedPropertiesPopout,
                defaultSorted: [],
                // Revisions are not sortable, they are pre-sorted by commit datetime.
                sortable: false
              }
            }}
          />
        </div>
      </>
    );
  }

  return null;
}

interface KeyValueTableProps {
  data: Record<string, any>;
  customValueCells?: Record<string, ComponentType<CellInfo>>;
}

function KeyValueTable({ customValueCells, data }: KeyValueTableProps) {
  const { formatMessage, messages } = useIntl();

  const pairs = toPairs(data);
  const entries = pairs.map(([field, value]) => ({
    field,
    value
  }));

  return (
    <ReactTable
      className="-striped"
      columns={[
        {
          Cell: ({ original: { field } }) => {
            const messageKey = `field_${field}`;
            const fieldLabel = messages[messageKey]
              ? formatMessage({ id: messageKey as any })
              : titleCase(field);

            return <strong>{fieldLabel}</strong>;
          },
          Header: <ObjectStoreMessage id="attributeLabel" />,
          accessor: "field",
          width: 200
        },
        {
          Cell: props => {
            const CustomCell = customValueCells?.[props.original.field];
            if (CustomCell) {
              return <CustomCell {...props} />;
            }
            return props.value;
          },
          Header: <ObjectStoreMessage id="valueLabel" />,
          accessor: "value"
        }
      ]}
      data={entries}
      pageSize={entries.length || 1}
      showPagination={false}
      TdComponent={DefaultTd}
    />
  );
}

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

const ChangedPropertiesPopout: SubComponentFunction = ({ original }) => {
  const snapshot: AuditSnapshot = original;
  const changed = pick(snapshot.state, snapshot.changedProperties);

  return (
    <div className="p-4" style={{ maxWidth: "50rem" }}>
      <h4>
        <ObjectStoreMessage id="changedProperties" />
      </h4>
      <KeyValueTable
        data={changed}
        customValueCells={{
          managedAttributeMap: CustomManagedAttributeChangeCell
        }}
      />
    </div>
  );
};

function CustomManagedAttributeChangeCell({ original }) {
  return <MetadataManagedAttributes managedAttributeMap={original.value} />;
}
