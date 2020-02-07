import { PersistedResource } from "kitsu";
import { isObject, toPairs } from "lodash";
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
  const { formatMessage, messages } = useObjectStoreIntl();

  const builtInAttributeValues = toPairs(metadata)
    .map(([name, value]) => ({ name, value }))
    .filter(p => !isObject(p.value));

  const managedAttributeValues = metadata.managedAttributeMap
    ? toPairs(metadata.managedAttributeMap.values).map(ma => ma[1])
    : [];

  return (
    <div>
      <div className="form-group">
        <h4>
          <ObjectStoreMessage id="metadataBuiltInAttributesLabel" />
        </h4>
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
              Header: <ObjectStoreMessage id="managedAttributeValueLabel" />,
              accessor: "value"
            }
          ]}
          data={builtInAttributeValues}
          pageSize={builtInAttributeValues.length || 1}
          showPagination={false}
        />
      </div>
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
