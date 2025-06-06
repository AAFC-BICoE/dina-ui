import { DateView } from "common-ui";
import Link from "next/link";
import { Metadata, Person } from "../../../types/objectstore-api";
import { ManagedAttributesViewer } from "../../managed-attributes/ManagedAttributesViewer";
import { ReferenceLink } from "../ReferenceLink";
import { RevisionRowConfig } from "../revision-row-config";

export const METADATA_REVISION_ROW_CONFIG: RevisionRowConfig<Metadata> = {
  name: ({ id, originalFilename }) => (
    <Link href={`/object-store/object/view?id=${id}`}>{originalFilename}</Link>
  ),
  customValueCells: {
    // Date Fields:
    createdOn: ({
      row: {
        original: { value }
      }
    }) => <DateView date={value} />,
    xmpMetadataDate: ({
      row: {
        original: { value }
      }
    }) => <DateView date={value} />,
    acDigitizationDate: ({
      row: {
        original: { value }
      }
    }) => <DateView date={value} />,
    // Link to the Metadata creator:
    acMetadataCreator: ({
      row: {
        original: { value: relation }
      }
    }) => {
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
    dcCreator: ({
      row: {
        original: { value: relation }
      }
    }) => {
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
    managedAttributes: ({
      row: {
        original: { value }
      }
    }) => (
      <ManagedAttributesViewer
        values={value}
        managedAttributeApiPath="objectstore-api/managed-attribute"
      />
    )
  }
};
