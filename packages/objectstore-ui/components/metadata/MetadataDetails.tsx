import { useCollapser, useQuery } from "common-ui";
import { PersistedResource } from "kitsu";
import { get, toPairs } from "lodash";
import { ReactNode } from "react";
import ReactTable from "react-table";
import titleCase from "title-case";
import {
  ObjectStoreMessage,
  useObjectStoreIntl
} from "../../intl/objectstore-intl";
import {
  ManagedAttribute,
  ManagedAttributeMap,
  Metadata
} from "../../types/objectstore-api";

export interface MetadataDetailsProps {
  metadata: PersistedResource<Metadata>;
}

/**
 * Shows the attribute details of a Metadata. Does not include the image or thumbnail.
 * Tha ManagedAttributeMap must b included with the passed Metadata.
 */
export function MetadataDetails({ metadata }: MetadataDetailsProps) {
  const { formatMessage } = useObjectStoreIntl();

  return (
    <div>
      <MetadataAttributeGroup
        metadata={metadata}
        fields={[
          "createdDate",
          "xmpMetadataDate",
          "acMetadataCreator.displayName"
        ]}
        title={formatMessage("metadataUploadDetailsLabel")}
      />
      <CollapsableSection
        collapserId="managed-attributes"
        title={formatMessage("metadataManagedAttributesLabel")}
      >
        <MetadataManagedAttributes
          managedAttributeMap={metadata.managedAttributeMap}
        />
      </CollapsableSection>
      <MetadataAttributeGroup
        metadata={metadata}
        fields={[
          "originalFilename",
          "acDigitizationDate",
          "fileExtension",
          "dcCreator.displayName",
          "dcType",
          "dcFormat",
          "acCaption"
        ]}
        title={formatMessage("metadataMediaDetailsLabel")}
      />
      <MetadataAttributeGroup
        metadata={metadata}
        fields={[
          "dcRights",
          "xmpRightsWebStatement",
          "publiclyReleasable",
          ...(metadata.publiclyReleasable
            ? []
            : ["notPubliclyReleasableReason"])
        ]}
        title={formatMessage("metadataRightsDetailsLabel")}
      />
      <MetadataAttributeGroup
        metadata={metadata}
        fields={["fileIdentifier", "acHashFunction", "acHashValue"]}
        title={formatMessage("metadataFileStorageDetailsLabel")}
      />
      <MetadataTags tags={metadata.acTags} />
    </div>
  );
}

interface MetadataAttributeGroupProps {
  metadata: Metadata;
  fields: string[];
  title: string;
}

function MetadataAttributeGroup({
  metadata,
  fields,
  title
}: MetadataAttributeGroupProps) {
  const { formatMessage, messages } = useObjectStoreIntl();

  const data = fields.map(name => ({ name, value: get(metadata, name) }));

  return (
    <CollapsableSection collapserId={title} title={title}>
      <ReactTable
        className="-striped"
        columns={[
          {
            Cell: ({ original: { name } }) => {
              const messageKey = `field_${name}`;
              const value = messages[messageKey]
                ? formatMessage(messageKey as any)
                : titleCase(name);

              return <strong>{value}</strong>;
            },
            Header: <ObjectStoreMessage id="attributeLabel" />,
            accessor: "name"
          },
          {
            Cell: ({ original: { value } }) => String(value ?? ""),
            Header: <ObjectStoreMessage id="managedAttributeValueLabel" />,
            accessor: "value"
          }
        ]}
        data={data}
        pageSize={data.length || 1}
        showPagination={false}
      />
    </CollapsableSection>
  );
}

interface MetadataManagedAttributesProps {
  managedAttributeMap?: ManagedAttributeMap | null;
}

export function MetadataManagedAttributes({
  managedAttributeMap
}: MetadataManagedAttributesProps) {
  const managedAttributeValues = managedAttributeMap
    ? toPairs(managedAttributeMap.values).map(([id, mav]) => ({ id, ...mav }))
    : [];

  return (
    <ReactTable
      className="-striped"
      columns={[
        {
          Cell: ({ original: { id, name } }) => (
            <strong>{name ?? <ManagedAttributeName id={id} />}</strong>
          ),
          Header: <ObjectStoreMessage id="attributeLabel" />,
          accessor: "name"
        },
        {
          Header: <ObjectStoreMessage id="managedAttributeValueLabel" />,
          accessor: "value"
        }
      ]}
      data={managedAttributeValues}
      pageSize={managedAttributeValues.length || 1}
      showPagination={false}
    />
  );
}

interface MetadataTagsProps {
  tags?: string[];
}

function MetadataTags({ tags }: MetadataTagsProps) {
  return (
    <div className="form-group">
      <h4>
        <ObjectStoreMessage id="metadataTagsLabel" />
      </h4>
      <div className="metadata-tags">
        {tags?.length
          ? tags.map((tag, i) => (
              <span
                key={i}
                style={{
                  background: "#AEB404",
                  borderRadius: "25px",
                  margin: "0.5rem",
                  padding: "0.5rem"
                }}
              >
                {tag}
              </span>
            ))
          : "None"}
      </div>
    </div>
  );
}

interface CollapsableSectionProps {
  children: ReactNode;
  collapserId: string;
  title: ReactNode;
}

/** Wrapper for the collapsible sections of the details UI. */
function CollapsableSection({
  children,
  collapserId,
  title
}: CollapsableSectionProps) {
  const { Collapser, collapsed } = useCollapser(
    `metadata-details-${collapserId}`
  );

  return (
    <div className="form-group">
      <h4>
        {title}
        <Collapser />
      </h4>
      {!collapsed && children}
    </div>
  );
}

/** Render the name of a ManagedAttribute. */
export function ManagedAttributeName({ id }) {
  const { response } = useQuery<ManagedAttribute>({
    path: `managed-attribute/${id}`
  });

  if (response) {
    const ma = response.data;
    return <>{ma.name}</>;
  }

  return null;
}
