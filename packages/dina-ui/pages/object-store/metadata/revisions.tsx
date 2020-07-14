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
import { MetadataManagedAttributes } from "../../../components/metadata/MetadataDetails";
import { Head, Nav } from "../../../components";
import {
  AuditSnapshot,
  AuditToEntityReference,
  Metadata,
  Person
} from "../../../types/objectstore-api";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";

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

export default function RevisionListPage() {
  const { formatMessage } = useDinaIntl();

  const router = useRouter();
  const { id } = router.query;

  const metadataQuery = useQuery<Metadata>({
    path: `objectstore-api/metadata/${id}`
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
          <Link href={`/object-store/object/view?id=${id}`}>
            <a>
              <DinaMessage id="metadataDetailsPageLink" />
            </a>
          </Link>
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
              // joinSpecs: [
              //   {
              //     apiBaseUrl: "/agent-api",
              //     idField: "acMetadataCreator",
              //     joinField: "acMetadataCreator",
              //     path: metadata => `person/${metadata.acMetadataCreator}`
              //   },
              //   {
              //     apiBaseUrl: "/agent-api",
              //     idField: "dcCreator",
              //     joinField: "dcCreator",
              //     path: metadata => `person/${metadata.dcCreator}`
              //   }
              // ],
              path: "objectstore-api/audit-snapshot",
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
          Header: <DinaMessage id="attributeLabel" />,
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
          Header: <DinaMessage id="valueLabel" />,
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
        <DinaMessage id="changedProperties" />
      </h4>
      <KeyValueTable
        data={changed}
        customValueCells={{
          // Link to the original metadata:
          acDerivedFrom: ({ original: { value: instanceId } }) => {
            return (
              <ReferenceLink<Metadata>
                baseApiPath="objectstore-api"
                instanceId={instanceId}
                link={({ id, originalFilename }) => (
                  <Link href={`/object/view?id=${id}`}>
                    <a>{originalFilename}</a>
                  </Link>
                )}
              />
            );
          },
          acMetadataCreator: ({ original: { value: cdoId } }) => {
            return (
              cdoId && (
                <ReferenceLink<Person>
                  baseApiPath="agent-api"
                  instanceId={{ typeName: "person", cdoId }}
                  link={({ displayName }) => <span>{displayName}</span>}
                />
              )
            );
          },
          dcCreator: ({ original: { value: cdoId } }) => {
            return (
              cdoId && (
                <ReferenceLink<Person>
                  baseApiPath="agent-api"
                  instanceId={{ typeName: "person", cdoId }}
                  link={({ displayName }) => <span>{displayName}</span>}
                />
              )
            );
          },
          managedAttributeMap: ({ original: { value } }) => (
            <MetadataManagedAttributes managedAttributeMap={value} />
          )
        }}
      />
    </div>
  );
};

interface ReferenceLinkProps<TResource extends KitsuResource> {
  baseApiPath: string;
  instanceId: AuditToEntityReference;
  link: (dto: TResource) => JSX.Element;
}

/** A link from a revision to a referenced resource. */
function ReferenceLink<TResource extends KitsuResource>({
  baseApiPath,
  link,
  instanceId: { cdoId, typeName }
}: ReferenceLinkProps<TResource>) {
  const q = useQuery<TResource>({
    path: `${baseApiPath}/${typeName}/${cdoId}`
  });

  return withResponse(q, res => link(res.data as TResource));
}
