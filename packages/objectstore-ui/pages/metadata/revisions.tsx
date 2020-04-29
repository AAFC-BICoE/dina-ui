import {
  ColumnDefinition,
  DefaultTd,
  ListPageLayout,
  useQuery,
  withResponse
} from "common-ui";
import { KitsuResource } from "kitsu";
import { pick, toPairs } from "lodash";
import Link from "next/link";
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
import {
  AuditSnapshot,
  AuditToEntityReference,
  Metadata
} from "../../types/objectstore-api";

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

  const metadataQuery = useQuery<Metadata>({
    path: `metadata/${id}`
  });

  return withResponse(metadataQuery, response => {
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
  });
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
          // Link to the original metadata:
          acDerivedFrom: ({ original: { value } }) => {
            return (
              <ReferenceLink<Metadata>
                instanceId={value}
                link={({ id, originalFilename }) => (
                  <Link href={`/object/view?id=${id}`}>
                    <a>{originalFilename}</a>
                  </Link>
                )}
              />
            );
          },
          managedAttributeMap: CustomManagedAttributeChangeCell
        }}
      />
    </div>
  );
};

function CustomManagedAttributeChangeCell({ original }) {
  return <MetadataManagedAttributes managedAttributeMap={original.value} />;
}

interface ReferenceLinkProps<TResource extends KitsuResource> {
  instanceId: AuditToEntityReference;
  link: (dto: TResource) => JSX.Element;
}

/** A link from a revision to a referenced resource. */
function ReferenceLink<TResource extends KitsuResource>({
  link,
  instanceId: { cdoId, typeName }
}: ReferenceLinkProps<TResource>) {
  const q = useQuery<TResource>({
    path: `${typeName}/${cdoId}`
  });

  return withResponse(q, res => link(res.data as TResource));
}
