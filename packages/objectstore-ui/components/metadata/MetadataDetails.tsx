import { PersistedResource } from "kitsu";
import { toPairs } from "lodash";
import ReactTable from "react-table";
import titleCase from "title-case";
import {
  ObjectStoreMessage,
  useObjectStoreIntl
} from "../../intl/objectstore-intl";
import { Metadata } from "../../types/objectstore-api";

export interface MetadataDetailsProps {
  metadata: PersistedResource<Metadata>;
}

/**
 * Shows the attribute details of a Metadata. Does not include the image or thumbnail.
 * Tha ManagedAttributeMap must b included with the passed Metadata.
 */
export function MetadataDetails({ metadata }: MetadataDetailsProps) {
  const FIELD_GROUP_ATTRIBUTESS = [
    {
      fields: [
        "createdDate",
        "xmpMetadataDate",
        "acMetadataCreator.displayName"
      ],
      title: "Upload Metadata"
    },
    {
      fields: [
        "originalFilename",
        "acDigitizationDate",
        "fileIdentifier",
        "fileExtension",
        "dcType",
        "dcFormat",
        "acHashFunction",
        "acHashValue",
        "acCaption"
      ],
      title: "Media"
    },
    {
      fields: [
        "dcRights",
        "xmpRightsWebStatement",
        "publiclyReleasable",
        ...(metadata.publiclyReleasable ? [] : ["notPubliclyReleasableReason"])
      ],
      title: "Rights"
    }
  ];

  const { formatMessage, messages } = useObjectStoreIntl();

  const fieldGroups = FIELD_GROUP_ATTRIBUTESS.map(({ fields, title }) => ({
    data: fields.map(name => ({ name, value: metadata[name] })),
    title
  }));

  const managedAttributeValues = metadata.managedAttributeMap
    ? toPairs(metadata.managedAttributeMap.values).map(ma => ma[1])
    : [];

  return (
    <div>
      {fieldGroups.map(fieldGroup => (
        <div className="form-group">
          <h4>{fieldGroup.title}</h4>
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
            data={fieldGroup.data}
            pageSize={fieldGroup.data.length || 1}
            showPagination={false}
          />
        </div>
      ))}
      <div className="form-group">
        <h4>
          <ObjectStoreMessage id="metadataManagedAttributesLabel" />
        </h4>
        <ReactTable
          className="-striped"
          columns={[
            {
              Cell: ({ original: { name } }) => <strong>{name}</strong>,
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
      </div>
      <div className="form-group">
        <h4>
          <ObjectStoreMessage id="metadataTagsLabel" />
        </h4>
        <div className="metadata-tags">
          {metadata.acTags?.length
            ? metadata.acTags.map((tag, i) => (
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
    </div>
  );
}
