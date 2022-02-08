import { DateView, FieldHeader, useCollapser, useQuery } from "common-ui";
import { PersistedResource } from "kitsu";
import { get } from "lodash";
import { ReactNode } from "react";
import ReactTable from "react-table";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { Metadata } from "../../../types/objectstore-api";
import { ObjectUpload } from "../../../types/objectstore-api/resources/ObjectUpload";
import { GroupLabel } from "../../group-select/GroupFieldView";
import { ManagedAttributesViewer } from "../managed-attributes/ManagedAttributesViewer";

export interface MetadataDetailsProps {
  metadata: PersistedResource<Metadata>;
}

export function useMetadataQuery(id?: string) {
  const query = useQuery<Metadata & { objectUpload: ObjectUpload }>(
    {
      include: "managedAttributeMap,acMetadataCreator,dcCreator,derivatives",
      path: `objectstore-api/metadata/${id}`
    },
    {
      joinSpecs: [
        {
          apiBaseUrl: "/agent-api",
          idField: "acMetadataCreator",
          joinField: "acMetadataCreator",
          path: metadata => `person/${metadata.acMetadataCreator.id}`
        },
        {
          apiBaseUrl: "/agent-api",
          idField: "dcCreator",
          joinField: "dcCreator",
          path: metadata => `person/${metadata.dcCreator.id}`
        },
        {
          apiBaseUrl: "/objectstore-api",
          idField: "fileIdentifier",
          joinField: "objectUpload",
          path: metadata => `object-upload/${metadata.fileIdentifier}`
        }
      ]
    }
  );

  return query;
}

/**
 * Shows the attribute details of a Metadata. Does not include the image or thumbnail.
 * Tha ManagedAttributeMap must b included with the passed Metadata.
 */
export function MetadataDetails({ metadata }: MetadataDetailsProps) {
  const { formatMessage } = useDinaIntl();
  const isExternalResource = !!metadata.resourceExternalURL;
  return (
    <div>
      {isExternalResource ? (
        <>
          <MetadataAttributeGroup
            metadata={metadata}
            fields={[
              {
                name: "group",
                value: <GroupLabel groupName={metadata.group} />
              },
              "dcType",
              "dcFormat",
              "acCaption",
              "acSubtype",
              "resourceExternalURI"
            ]}
            title={formatMessage("metadataMediaDetailsLabel")}
          />
        </>
      ) : (
        <>
          <MetadataAttributeGroup
            metadata={metadata}
            fields={[
              {
                name: "group",
                value: <GroupLabel groupName={metadata.group} />
              },
              {
                name: "createdDate",
                value: <DateView date={metadata.createdDate} />
              },
              {
                name: "xmpMetadataDate",
                value: <DateView date={metadata.xmpMetadataDate} />
              },
              "acMetadataCreator.displayName",
              "acSubtype"
            ]}
            title={formatMessage("metadataUploadDetailsLabel")}
          />
          <CollapsableSection
            collapserId="managed-attributes"
            title={formatMessage("metadataManagedAttributesLabel")}
          >
            <ManagedAttributesViewer
              values={metadata.managedAttributeValues}
              managedAttributeApiPath={id =>
                `objectstore-api/managed-attribute/${id}`
              }
            />
          </CollapsableSection>
          <MetadataAttributeGroup
            metadata={metadata}
            fields={[
              "originalFilename",
              {
                name: "acDigitizationDate",
                value: <DateView date={metadata.acDigitizationDate} />
              },
              "fileExtension",
              "dcCreator.displayName",
              "dcType",
              "dcFormat",
              "acCaption",
              "orientation"
            ]}
            title={formatMessage("metadataMediaDetailsLabel")}
          />
          <MetadataAttributeGroup
            metadata={metadata}
            fields={["dcRights", "xmpRightsWebStatement"]}
            title={formatMessage("metadataRightsDetailsLabel")}
          />
          <MetadataAttributeGroup
            metadata={metadata}
            fields={["fileIdentifier", "acHashFunction", "acHashValue"]}
            title={formatMessage("metadataFileStorageDetailsLabel")}
          />
        </>
      )}
    </div>
  );
}

interface MetadataAttributeGroupProps {
  metadata: Metadata;
  fields: (string | { name: string; value: ReactNode })[];
  title: string;
}

function MetadataAttributeGroup({
  metadata,
  fields,
  title
}: MetadataAttributeGroupProps) {
  const data = fields.map(field => {
    if (typeof field === "string") {
      return { name: field, value: get(metadata, field) };
    }
    return field;
  });

  return (
    <CollapsableSection collapserId={title} title={title}>
      <ReactTable
        className="-striped"
        columns={[
          {
            Cell: ({ original: { name } }) => (
              <strong>
                <FieldHeader name={name} />
              </strong>
            ),
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
    </CollapsableSection>
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
    <div className="mb-3">
      <h4>
        {title}
        <Collapser />
      </h4>
      {!collapsed && children}
    </div>
  );
}
