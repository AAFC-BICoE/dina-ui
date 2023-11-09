import { KeyValueTable } from "common-ui";
import { DataEntryViewer } from "common-ui/lib/formik-connected/data-entry/DataEntryViewer";
import Link from "next/link";
import { Protocol } from "packages/dina-ui/types/collection-api/resources/Protocol";
import { DinaMessage } from "../../../intl/dina-ui-intl";
import {
  CollectingEvent,
  Collection,
  MaterialSample,
  StorageUnit
} from "../../../types/collection-api";
import { Project } from "../../../types/collection-api/resources/Project";
import { Metadata, Person } from "../../../types/objectstore-api";
import { DinaUser } from "../../../types/user-api/resources/DinaUser";
import { ManagedAttributesViewer } from "../../managed-attributes/ManagedAttributesViewer";
import { ReferenceLink } from "../ReferenceLink";
import { RevisionRowConfig } from "../revision-row-config";

export const MATERIAL_SAMPLE_REVISION_ROW_CONFIG: RevisionRowConfig<MaterialSample> =
  {
    name: (ms) => (
      <Link href={`/collection/material-sample/view?id=${ms.id}`}>
        <a>{ms.materialSampleName}</a>
      </Link>
    ),
    customValueCells: {
      // Show the entire value of the metadata map in a key-value table:
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

      // Try to render object / array fields visually instead of the default JSON:
      attachment: ({
        row: {
          original: { value }
        }
      }) => (
        <div>
          {value?.map(
            (relation) =>
              relation && (
                <div>
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
      preparationProtocol: ({
        row: {
          original: { value }
        }
      }) => (
        <ReferenceLink<Protocol>
          baseApiPath="collection-api"
          type="protocol"
          reference={value}
          name={(protocol) => protocol.name}
          href="/collection/protocol/view?id="
        />
      ),
      collection: ({
        row: {
          original: { value }
        }
      }) => (
        <ReferenceLink<Collection>
          baseApiPath="collection-api"
          type="collection"
          reference={value}
          name={({ name, code, id }) => name || code || id}
          href="/collection/collection/view?id="
        />
      ),
      projects: ({
        row: {
          original: { value }
        }
      }) => (
        <div>
          {value?.map(
            (project) =>
              project && (
                <div>
                  <ReferenceLink<Project>
                    baseApiPath="collection-api"
                    type="project"
                    reference={project}
                    name={(it) => it.name}
                    href="/collection/project/view?id="
                  />
                </div>
              )
          )}
        </div>
      ),
      materialSampleType: ({
        row: {
          original: { value }
        }
      }) => value,
      preparedBy: ({
        row: {
          original: { value: relation }
        }
      }) =>
        relation.map((rel, index) => (
          <div key={index}>
            <ReferenceLink<Person>
              baseApiPath="agent-api"
              type="person"
              reference={rel}
              name={({ displayName }) => displayName}
              href="/person/view?id="
            />
          </div>
        )),
      collectingEvent: ({
        row: {
          original: { value }
        }
      }) => (
        <ReferenceLink<CollectingEvent>
          baseApiPath="collection-api"
          type="collecting-event"
          reference={value}
          name={() => <DinaMessage id="viewDetails" />}
          href="/collection/collecting-event/view?id="
        />
      ),
      storageUnit: ({
        row: {
          original: { value }
        }
      }) => (
        <ReferenceLink<StorageUnit>
          baseApiPath="collection-api"
          type="storage-unit"
          reference={value}
          name={(it) => it.name}
          href="/collection/storage-unit/view?id="
        />
      ),
      associations: ({
        row: {
          original: { value }
        }
      }) =>
        value?.map((assoc, index) => (
          <div className="pb-2" key={index}>
            <strong>{index + 1}:</strong>
            <KeyValueTable
              data={assoc}
              customValueCells={{
                associatedSample: ({ getValue }) => (
                  <ReferenceLink<MaterialSample>
                    baseApiPath="collection-api"
                    type="material-sample"
                    reference={{ id: getValue() }}
                    name={(sample) => sample.materialSampleName ?? sample.id}
                    href="/collection/material-sample/view?id="
                  />
                )
              }}
            />
          </div>
        )),
      determination: ({
        row: {
          original: { value }
        }
      }) => determinationRevision(value),
      scheduledActions: ({
        row: {
          original: { value }
        }
      }) =>
        value?.map((action, index) => (
          <div className="pb-2" key={index}>
            <strong>{index + 1}:</strong>
            <KeyValueTable
              data={action}
              customValueCells={{
                assignedTo: ({
                  row: {
                    original: { value: user }
                  }
                }) =>
                  user && (
                    <ReferenceLink<DinaUser>
                      baseApiPath="user-api"
                      type="user"
                      reference={user}
                      name={(it) => it.username}
                      href="/dina-user/view?id="
                    />
                  )
              }}
            />
          </div>
        )),
      hostOrganism: ({
        row: {
          original: { value }
        }
      }) => <KeyValueTable data={value} />,
      organism: ({
        row: {
          original: { value: orgs }
        }
      }) =>
        orgs?.map((org, index) => (
          <KeyValueTable
            key={index}
            data={org}
            customValueCells={{
              detertmination: ({
                row: {
                  original: { value: dets }
                }
              }) => determinationRevision(dets)
            }}
          />
        )),
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
            "extension.fields.dinaComponent": "MATERIAL_SAMPLE"
          }}
        />
      ),
      // Don't render this one because it isn't an editable field:
      materialSampleChildren: () => <></>
    }
  };

/** Renders the determination revision value. */
export function determinationRevision(value) {
  return value?.map((det, index) => (
    <div className="pb-2" key={index}>
      <strong>{index + 1}:</strong>
      <KeyValueTable
        data={det}
        customValueCells={{
          scientificNameDetails: ({ getValue }) => (
            <KeyValueTable data={getValue()} />
          ),
          managedAttributes: ({ getValue }) => (
            <KeyValueTable data={getValue()} />
          ),
          determiner: ({ getValue }) =>
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
            )) ?? null
        }}
      />
    </div>
  ));
}
