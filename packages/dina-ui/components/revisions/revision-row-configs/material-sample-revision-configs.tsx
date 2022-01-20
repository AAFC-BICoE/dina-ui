import { DateView, KeyValueTable } from "common-ui";
import Link from "next/link";
import { DinaUser } from "packages/dina-ui/types/user-api/resources/DinaUser";
import { DinaMessage } from "../../../intl/dina-ui-intl";
import {
  AcquisitionEvent,
  CollectingEvent,
  Collection,
  MaterialSample,
  MaterialSampleType,
  StorageUnit
} from "../../../types/collection-api";
import { Project } from "../../../types/collection-api/resources/Project";
import { Metadata, Person } from "../../../types/objectstore-api";
import { ManagedAttributesViewer } from "../../object-store/managed-attributes/ManagedAttributesViewer";
import { ReferenceLink } from "../ReferenceLink";
import { RevisionRowConfig } from "../revision-row-config";

export const MATERIAL_SAMPLE_REVISION_ROW_CONFIG: RevisionRowConfig<MaterialSample> =
  {
    name: ms => (
      <Link href={`/collection/collecting-event/view?id=${ms.id}`}>
        <a>{ms.materialSampleName}</a>
      </Link>
    ),
    customValueCells: {
      // Show the entire value of the metadata map in a key-value table:
      managedAttributes: ({ original: { value } }) => (
        <ManagedAttributesViewer
          managedAttributeApiPath={key =>
            `collection-api/managed-attribute/${key}`
          }
          values={value}
        />
      ),

      // Try to render object / array fields visually instead of the default JSON:
      attachment: ({ original: { value } }) => (
        <div>
          {value?.map(
            relation =>
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
      preparationAttachment: ({ original: { value } }) => (
        <div>
          {value?.map(
            relation =>
              relation && (
                <div>
                  <ReferenceLink<Metadata>
                    baseApiPath="objectstore-api"
                    type="metadata"
                    reference={relation}
                    name={({ originalFilename, id }) => originalFilename || id}
                    href="/object-store/object/view?id="
                  />
                </div>
              )
          )}
        </div>
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
            project =>
              project && (
                <div>
                  <ReferenceLink<Project>
                    baseApiPath="collection-api"
                    type="project"
                    reference={project}
                    name={it => it.name}
                    href="/collection/project/view?id="
                  />
                </div>
              )
          )}
        </div>
      ),
      materialSampleType: ({ original: { value } }) => (
        <ReferenceLink<MaterialSampleType>
          baseApiPath="collection-api"
          type="material-sample-type"
          reference={value}
          name={({ name }) => name}
          href="/collection/material-sample-type/view?id="
        />
      ),
      preparedBy: ({ original: { value } }) => (
        <ReferenceLink<Person>
          baseApiPath="agent-api"
          type="person"
          reference={value}
          name={person => person.displayName}
          href="/person/view?id="
        />
      ),
      collectingEvent: ({ original: { value } }) => (
        <ReferenceLink<CollectingEvent>
          baseApiPath="collection-api"
          type="collecting-event"
          reference={value}
          name={() => <DinaMessage id="viewDetails" />}
          href="/collection/collecting-event/view?id="
        />
      ),
      acquisitionEvent: ({ original: { value } }) => (
        <ReferenceLink<AcquisitionEvent>
          baseApiPath="collection-api"
          type="acquisition-event"
          reference={value}
          name={() => <DinaMessage id="viewDetails" />}
          href="/collection/acquisition-event/view?id="
        />
      ),
      storageUnit: ({ original: { value } }) => (
        <ReferenceLink<StorageUnit>
          baseApiPath="collection-api"
          type="storage-unit"
          reference={value}
          name={it => it.name}
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
                    name={sample => sample.materialSampleName ?? sample.id}
                    href="/collection/material-sample/view?id="
                  />
                )
              }}
            />
          </div>
        )),
      determination: ({ original: { value } }) =>
        value?.map((det, index) => (
          <div className="pb-2" key={index}>
            <strong>{index + 1}:</strong>
            <KeyValueTable
              data={det}
              customValueCells={{
                scientificNameDetails: ({ value: details }) => (
                  <KeyValueTable data={details} />
                ),
                determiner: ({ value: ids }) =>
                  ids?.map(id => (
                    <div key={id}>
                      <ReferenceLink<Person>
                        baseApiPath="agent-api"
                        type="person"
                        reference={{ id }}
                        name={person => person.displayName}
                        href="/person/view?id="
                      />
                    </div>
                  )) ?? null
              }}
            />
          </div>
        )),
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
                      name={it => it.username}
                      href="/dina-user/view?id="
                    />
                  )
              }}
            />
          </div>
        )),
      hostOrganism: ({ original: { value } }) => <KeyValueTable data={value} />,
      // Don't render this one because it isn't an editable field:
      materialSampleChildren: () => <></>
    }
  };
