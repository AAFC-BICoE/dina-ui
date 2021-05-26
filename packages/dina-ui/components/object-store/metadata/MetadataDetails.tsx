import {
  DateView,
  FieldHeader,
  useApiClient,
  useCollapser,
  useQuery
} from "common-ui";
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
  const { apiClient } = useApiClient();

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
        }
      ],
      onSuccess: async ({ data: metadata }) => {
        const objectUploadResp = await apiClient.get<ObjectUpload>(
          "objectstore-api/object-upload",
          {
            filter: { fileIdentifier: `${metadata.fileIdentifier}` }
          }
        );
        metadata.objectUpload = objectUploadResp?.data?.[0];
      }
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

  return (
    <div>
      <MetadataAttributeGroup
        metadata={metadata}
        fields={[
          { name: "group", value: <GroupLabel groupName={metadata.group} /> },
          {
            name: "createdDate",
            value: <DateView date={metadata.createdDate} />
          },
          {
            name: "xmpMetadataDate",
            value: <DateView date={metadata.xmpMetadataDate} />
          },
          "acMetadataCreator.displayName",
          "acSubType"
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
