import { useCollapser } from "common-ui";
import { PersistedResource } from "kitsu";
import { get, toPairs } from "lodash";
import Link from "next/link";
import { ReactNode } from "react";
import ReactTable from "react-table";
import titleCase from "title-case";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import { ManagedAttributeValue, Metadata } from "../../types/objectstore-api";

export interface MetadataDetailsProps {
  metadata: PersistedResource<Metadata>;
}

/**
 * Shows the attribute details of a Metadata. Does not include the image or thumbnail.
 * Tha ManagedAttributeMap must b included with the passed Metadata.
 */
export function MetadataDetails({ metadata }: MetadataDetailsProps) {
  const { formatMessage } = useDinaIntl();

  const managedAttributeValues = metadata.managedAttributeMap
    ? toPairs(metadata.managedAttributeMap.values).map(ma => ma[1])
    : [];

  return (
    <div>
      <MetadataAttributeGroup
        metadata={metadata}
        fields={[
          "createdDate",
          "xmpMetadataDate",
          "acMetadataCreator.displayName",
          {
            name: "acDerivedFrom",
            value: metadata.acDerivedFrom ? (
              <Link
                href={`/object-store/object/view?id=${metadata.acDerivedFrom.id}`}
              >
                <a>{metadata.acDerivedFrom.originalFilename}</a>
              </Link>
            ) : null
          },
          "acSubType"
        ]}
        title={formatMessage("metadataUploadDetailsLabel")}
      />
      <MetadataManagedAttributes
        managedAttributeValues={managedAttributeValues}
      />
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
  fields: Array<string | { name: string; value: ReactNode }>;
  title: string;
}

function MetadataAttributeGroup({
  metadata,
  fields,
  title
}: MetadataAttributeGroupProps) {
  const { formatMessage, messages } = useDinaIntl();

  const { Collapser, collapsed } = useCollapser(`metadata-details-${title}`);

  const data = fields.map(field => {
    if (typeof field === "string") {
      return { name: field, value: get(metadata, field) };
    }
    return field;
  });

  return (
    <div className="form-group">
      <h4>
        <Collapser />
        {title}
      </h4>
      {!collapsed && (
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
              Header: <DinaMessage id="attributeLabel" />,
              accessor: "name"
            },
            {
              // The cell can render either JSX or a primitive (string/number etc.).
              Cell: ({ original: { value } }) =>
                value?.props ? <>{value}</> : String(value ?? ""),
              Header: <DinaMessage id="managedAttributeValueLabel" />,
              accessor: "value"
            }
          ]}
          data={data}
          pageSize={data.length || 1}
          showPagination={false}
        />
      )}
    </div>
  );
}

interface MetadataManagedAttributesProps {
  managedAttributeValues: ManagedAttributeValue[];
}

function MetadataManagedAttributes({
  managedAttributeValues
}: MetadataManagedAttributesProps) {
  const { Collapser, collapsed } = useCollapser(
    "metadata-details-managed-attributes"
  );

  return (
    <div className="form-group">
      <h4>
        <Collapser />
        <DinaMessage id="metadataManagedAttributesLabel" />
      </h4>
      {!collapsed && (
        <ReactTable
          className="-striped"
          columns={[
            {
              Cell: ({ original: { name } }) => <strong>{name}</strong>,
              Header: <DinaMessage id="attributeLabel" />,
              accessor: "name"
            },
            {
              Header: <DinaMessage id="managedAttributeValueLabel" />,
              accessor: "value"
            }
          ]}
          data={managedAttributeValues}
          pageSize={managedAttributeValues.length || 1}
          showPagination={false}
        />
      )}
    </div>
  );
}

interface MetadataTagsProps {
  tags?: string[];
}

function MetadataTags({ tags }: MetadataTagsProps) {
  return (
    <div className="form-group">
      <h4>
        <DinaMessage id="metadataTagsLabel" />
      </h4>
      <div className="metadata-tags">
        {tags?.length
          ? tags.map((tag, i) => (
              <span
                key={i}
                style={{
                  background: "yellow",
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
