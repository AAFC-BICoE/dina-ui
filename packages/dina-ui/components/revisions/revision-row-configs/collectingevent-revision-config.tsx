import { DateView, KeyValueTable } from "common-ui";
import { DataEntryViewer } from "common-ui/lib/formik-connected/data-entry/DataEntryViewer";
import Link from "next/link";
import {
  CollectingEvent,
  CollectionMethod
} from "../../../types/collection-api/";
import { Metadata, Person } from "../../../types/objectstore-api";
import { ManagedAttributesViewer } from "../../managed-attributes/ManagedAttributesViewer";
import { ReferenceLink } from "../ReferenceLink";
import { RevisionRowConfig } from "../revision-row-config";

export const COLLECTING_EVENT_REVISION_ROW_CONFIG: RevisionRowConfig<CollectingEvent> =
  {
    name: ({ id }) => (
      <Link href={`/collection/collecting-event/view?id=${id}`}>{id}</Link>
    ),
    customValueCells: {
      // Link to the collector:
      collectors: ({
        row: {
          original: { value: relation }
        }
      }) => {
        return relation?.map((rel, index) => (
          <div key={index}>
            <ReferenceLink<Person>
              baseApiPath="agent-api"
              type="person"
              reference={rel}
              name={({ displayName }) => displayName}
              href="/person/view?id="
            />
          </div>
        ));
      },
      collectionMethod: ({
        row: {
          original: { value }
        }
      }) => (
        <ReferenceLink<CollectionMethod>
          baseApiPath="collection-api"
          type="collection-method"
          reference={value}
          name={({ name }) => name}
          href="/collection/collection-method/view?id="
        />
      ),
      attachment: ({
        row: {
          original: { value }
        }
      }) => (
        <div>
          {value?.map(
            (relation, index) =>
              relation && (
                <div key={index}>
                  <ReferenceLink<Metadata>
                    type="metadata"
                    baseApiPath="objectstore-api"
                    reference={relation}
                    name={({ originalFilename, id }) => originalFilename || id}
                    href="/object-store/object/view?id="
                  />
                </div>
              )
          )}
        </div>
      ),
      geoReferenceAssertions: ({
        row: {
          original: { value: assertions }
        }
      }) =>
        assertions?.map((assertion, index) => (
          <div className="pb-2" key={index}>
            <strong>{index + 1}:</strong>
            <KeyValueTable
              data={assertion}
              customValueCells={{
                georeferencedBy: ({ getValue }) =>
                  getValue()?.map((id) => (
                    <div key={id}>
                      <ReferenceLink<Person>
                        baseApiPath="agent-api"
                        type="person"
                        reference={{ id }}
                        name={(person) => person.displayName}
                        href="/person/view?id="
                      />
                    </div>
                  )) ?? null,
                createdOn: ({
                  row: {
                    original: { value }
                  }
                }) => <DateView date={value} />
              }}
            />
          </div>
        )) ?? null,
      managedAttributes: ({
        row: {
          original: { value }
        }
      }) => (
        <ManagedAttributesViewer
          values={value}
          managedAttributeApiPath="collection-api/managed-attribute"
        />
      ),
      geographicPlaceNameSourceDetail: ({
        row: {
          original: { value }
        }
      }) => (
        <KeyValueTable
          data={value}
          customValueCells={{
            stateProvince: ({ getValue }) => (
              <KeyValueTable data={getValue()} />
            ),
            country: ({ getValue }) => <KeyValueTable data={getValue()} />
          }}
        />
      ),
      extensionValues: ({
        row: {
          original: { value }
        }
      }) => (
        <DataEntryViewer
          extensionValues={value}
          legend={<></>}
          name={"extensionValues"}
          blockOptionsEndpoint={`collection-api/extension`}
          blockOptionsFilter={{
            "extension.fields.dinaComponent": "COLLECTING_EVENT"
          }}
        />
      )
    }
  };
