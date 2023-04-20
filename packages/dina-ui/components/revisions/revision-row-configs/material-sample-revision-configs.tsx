import { KeyValueTable } from "common-ui";
import Link from "next/link";
import { DinaUser } from "../../../types/user-api/resources/DinaUser";
import { DinaMessage } from "../../../intl/dina-ui-intl";
import {
  CollectingEvent,
  Collection,
  MaterialSample,
  StorageUnit
} from "../../../types/collection-api";
import { Project } from "../../../types/collection-api/resources/Project";
import { Metadata, Person } from "../../../types/objectstore-api";
import { ManagedAttributesViewer } from "../../managed-attributes/ManagedAttributesViewer";
import { ReferenceLink } from "../ReferenceLink";
import { RevisionRowConfig } from "../revision-row-config";
import { Protocol } from "packages/dina-ui/types/collection-api/resources/Protocol";
import { DataEntryViewer } from "common-ui/lib/formik-connected/data-entry/DataEntryViewer";

export const MATERIAL_SAMPLE_REVISION_ROW_CONFIG: RevisionRowConfig<MaterialSample> =
  {
    name: (ms) => (
      <Link href={`/collection/material-sample/view?id=${ms.id}`}>
        <a>{ms.materialSampleName}</a>
      </Link>
    ),
    customValueCells: {
      // Show the entire value of the metadata map in a key-value table:
      managedAttributes: ({ original: { value } }) => (
        <ManagedAttributesViewer
          values={value}
          managedAttributeApiPath="collection-api/managed-attribute"
        />
      ),

      // Try to render object / array fields visually instead of the default JSON:
      attachment: ({ original: { value } }) => (
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
      preparationProtocol: ({ original: { value } }) => (
        <ReferenceLink<Protocol>
          baseApiPath="collection-api"
          type="protocol"
          reference={value}
          name={(protocol) => protocol.name}
          href="/collection/protocol/view?id="
        />
      ),
      collection: ({ original: { value } }) => (
        <ReferenceLink<Collection>
          baseApiPath="collection-api"
          type="collection"
          reference={value}
          name={({ name, code, id }) => name || code || id}
          href="/collection/collection/view?id="
        />
      ),
      projects: ({ original: { value } }) => (
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
      materialSampleType: ({ original: { value } }) => value,
      preparedBy: ({ original: { value: relation } }) =>
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
      collectingEvent: ({ original: { value } }) => (
        <ReferenceLink<CollectingEvent>
          baseApiPath="collection-api"
          type="collecting-event"
          reference={value}
          name={() => <DinaMessage id="viewDetails" />}
          href="/collection/collecting-event/view?id="
        />
      ),
      storageUnit: ({ original: { value } }) => (
        <ReferenceLink<StorageUnit>
          baseApiPath="collection-api"
          type="storage-unit"
          reference={value}
          name={(it) => it.name}
          href="/collection/storage-unit/view?id="
        />
      ),
      associations: ({ original: { value } }) =>
        value?.map((assoc, index) => (
          <div className="pb-2" key={index}>
            <strong>{index + 1}:</strong>
            <KeyValueTable
              data={assoc}
              customValueCells={{
                associatedSample: ({ value: id }) => (
                  <ReferenceLink<MaterialSample>
                    baseApiPath="collection-api"
                    type="material-sample"
                    reference={{ id }}
                    name={(sample) => sample.materialSampleName ?? sample.id}
                    href="/collection/material-sample/view?id="
                  />
                )
              }}
            />
          </div>
        )),
      determination: ({ original: { value } }) => determinationRevision(value),
      scheduledActions: ({ original: { value } }) =>
        value?.map((action, index) => (
          <div className="pb-2" key={index}>
            <strong>{index + 1}:</strong>
            <KeyValueTable
              data={action}
              customValueCells={{
                assignedTo: ({ original: { value: user } }) =>
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
      hostOrganism: ({ original: { value } }) => <KeyValueTable data={value} />,
      organism: ({ original: { value: orgs } }) =>
        orgs?.map((org, index) => (
          <KeyValueTable
            key={index}
            data={org}
            customValueCells={{
              detertmination: ({ original: { value: dets } }) =>
                determinationRevision(dets)
            }}
          />
        )),
      extensionValues: ({ original: { value } }) => (
        <DataEntryViewer
          extensionValues={value}
          legend={<></>}
          name={"extensionValuesForm"}
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
          scientificNameDetails: ({ value: details }) => (
            <KeyValueTable data={details} />
          ),
          managedAttributes: ({ value: data }) => <KeyValueTable data={data} />,
          determiner: ({ value: ids }) =>
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
            )) ?? null
        }}
      />
    </div>
  ));
}
