import { DateView } from "common-ui";
import Link from "next/link";
import { Metadata, Person } from "../../../types/objectstore-api";
import { ManagedAttributesViewer } from "../../managed-attributes/ManagedAttributesViewer";
import { ReferenceLink } from "../ReferenceLink";
import { RevisionRowConfig } from "../revision-row-config";

export const METADATA_REVISION_ROW_CONFIG: RevisionRowConfig<Metadata> = {
  name: ({ id, originalFilename }) => (
    <Link href={`/object-store/object/view?id=${id}`}>
      <a>{originalFilename}</a>
    </Link>
  ),
  customValueCells: {
    // Date Fields:
    createdDate: ({ original: { value } }) => <DateView date={value} />,
    xmpMetadataDate: ({ original: { value } }) => <DateView date={value} />,
    acDigitizationDate: ({ original: { value } }) => <DateView date={value} />,
    // Link to the Metadata creator:
    acMetadataCreator: ({ original: { value: relation } }) => {
      return (
        relation && (
          <ReferenceLink<Person>
            baseApiPath="agent-api"
            type="person"
            reference={relation}
            name={(person) => person.displayName}
            href="/person/view?id="
          />
        )
      );
    },
    // Link to the doc creator:
    dcCreator: ({ original: { value: relation } }) => {
      return (
        relation && (
          <ReferenceLink<Person>
            baseApiPath="agent-api"
            type="person"
            reference={relation}
            name={(person) => person.displayName}
            href="/person/view?id="
          />
        )
      );
    },
    // Show the entire value of the metadata map in a key-value table:
    managedAttributes: ({ original: { value } }) => (
      <ManagedAttributesViewer
        values={value}
        managedAttributeApiPath="objectstore-api/managed-attribute"
      />
    )
  }
};
