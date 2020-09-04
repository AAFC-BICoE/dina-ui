import Link from "next/link";
import { Metadata, Person } from "../../../types/objectstore-api";
import { MetadataManagedAttributes } from "../../metadata/MetadataDetails";
import { ReferenceLink } from "../ReferenceLink";
import { RevisionRowConfig } from "../revision-row-config";

export const METADATA_REVISION_ROW_CONFIG: RevisionRowConfig<Metadata> = {
  name: ({ id, originalFilename }) => (
    <Link href={`/object-store/object/view?id=${id}`}>
      <a>{originalFilename}</a>
    </Link>
  ),
  customValueCells: {
    // Link to the original metadata:
    acDerivedFrom: ({ original: { value: instanceId } }) => {
      return (
        <ReferenceLink<Metadata>
          baseApiPath="objectstore-api"
          instanceId={instanceId}
          link={({ id, originalFilename }) => (
            <Link href={`/object-store/object/view?id=${id}`}>
              <a>{originalFilename}</a>
            </Link>
          )}
        />
      );
    },
    // Link to the Metadata creator:
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
    // Link to the doc creator:
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
    // Show the entire value of the metadata map in a key-value table:
    managedAttributeMap: ({ original: { value } }) => (
      <MetadataManagedAttributes managedAttributeMap={value} />
    )
  }
};
