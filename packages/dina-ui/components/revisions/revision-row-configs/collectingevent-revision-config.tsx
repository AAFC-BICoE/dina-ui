import { DateView, KeyValueTable } from "common-ui";
import Link from "next/link";
import {
  CollectionMethod,
  CollectingEvent
} from "../../../types/collection-api/";
import { Metadata, Person } from "../../../types/objectstore-api";
import { ManagedAttributesViewer } from "../../managed-attributes/ManagedAttributesViewer";
import { ReferenceLink } from "../ReferenceLink";
import { RevisionRowConfig } from "../revision-row-config";
import { DataEntryViewer } from "common-ui/lib/formik-connected/data-entry/DataEntryViewer";

export const COLLECTING_EVENT_REVISION_ROW_CONFIG: RevisionRowConfig<CollectingEvent> =
  {
    name: ({ id }) => (
      <Link href={`/collection/collecting-event/view?id=${id}`}>
        <a>{id}</a>
      </Link>
    ),
    customValueCells: {
      // Link to the collector:
      collectors: ({ original: { value: relation } }) => {
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
      collectionMethod: ({ original: { value } }) => (
        <ReferenceLink<CollectionMethod>
          baseApiPath="collection-api"
          type="collection-method"
          reference={value}
          name={({ name }) => name}
          href="/collection/collection-method/view?id="
        />
      ),
      attachment: ({ original: { value } }) => (
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
      geoReferenceAssertions: ({ original: { value: assertions } }) =>
        assertions?.map((assertion, index) => (
          <div className="pb-2" key={index}>
            <strong>{index + 1}:</strong>
            <KeyValueTable
              data={assertion}
              customValueCells={{
                georeferencedBy: ({ value: ids }) =>
                  ids?.map((id) => (
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
                createdOn: ({ original: { value } }) => (
                  <DateView date={value} />
                )
              }}
            />
          </div>
        )) ?? null,
      managedAttributes: ({ original: { value } }) => (
        <ManagedAttributesViewer
          values={value}
          managedAttributeApiPath="collection-api/managed-attribute"
        />
      ),
      geographicPlaceNameSourceDetail: ({ original: { value } }) => (
        <KeyValueTable
          data={value}
          customValueCells={{
            stateProvince: (sp) => <KeyValueTable data={sp.value} />,
            country: (c) => <KeyValueTable data={c.value} />
          }}
        />
      ),
      extensionValues: ({ original: { value } }) => (
        <DataEntryViewer
          extensionValues={value}
          legend={<></>}
          name={"extensionValuesForm"}
          blockOptionsEndpoint={`collection-api/extension`}
          blockOptionsFilter={{
            "extension.fields.dinaComponent": "COLLECTING_EVENT"
          }}
        />
      )
    }
  };
