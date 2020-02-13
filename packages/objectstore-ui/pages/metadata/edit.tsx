import {
  ApiClientContext,
  BulkDataEditor,
  decodeResourceCell,
  encodeResourceCell,
  LoadingSpinner,
  ResourceSelectField,
  RowChange,
  SaveArgs,
  useResourceSelectCells
} from "common-ui";
import { Form, Formik } from "formik";
import { PersistedResource } from "kitsu";
import { noop } from "lodash";
import { useRouter } from "next/router";
import { useContext } from "react";
import { Head, Nav } from "../../components";
import {
  ObjectStoreMessage,
  useObjectStoreIntl
} from "../../intl/objectstore-intl";
import {
  Agent,
  ManagedAttribute,
  ManagedAttributeMap,
  Metadata
} from "../../types/objectstore-api";

/** Editable row data */
export interface BulkMetadataEditRow {
  acTags: string;
  acMetadataCreator: string;
  metadata: PersistedResource<Metadata>;
}

interface FormControls {
  editableManagedAttributes: ManagedAttribute[];
}

export default function EditMetadatasPage() {
  const router = useRouter();
  const { bulkGet, save } = useContext(ApiClientContext);
  const { formatMessage } = useObjectStoreIntl();
  const resourceSelectCell = useResourceSelectCells();

  const DEFAULT_COLUMNS = [
    {
      data: "metadata.originalFilename",
      readOnly: true,
      title: formatMessage("field_originalFilename")
    },
    {
      data: "metadata.dcType",
      source: [
        "Image",
        "Moving Image",
        "Sound",
        "Text",
        "Dataset",
        "Undetermined"
      ],
      title: formatMessage("metadataObjectTypeLabel"),
      type: "dropdown"
    },
    {
      data: "acTags",
      title: formatMessage("metadataBulkEditTagsLabel")
    },
    // TODO handle datetime cells:
    // {
    //   data: "metadata.acDigitizationDate",
    //   title: formatMessage("metadataFirstDigitalVersionCreatedDateLabel")
    // },
    resourceSelectCell<Agent>(
      {
        filter: input => ({ rsql: `displayName==*${input}*` }),
        label: agent => agent.displayName,
        model: "agent"
      },
      {
        data: "acMetadataCreator",
        title: formatMessage("metadataAgentLabel")
      }
    )
  ];

  const idsQuery = String(router.query.ids);
  const ids = idsQuery.split(",");

  if (!idsQuery) {
    return <LoadingSpinner loading={true} />;
  }

  async function loadData() {
    const metadatas = await bulkGet<Metadata>(
      ids.map(
        id => `/metadata/${id}?include=acMetadataCreator,managedAttributeMap`
      )
    );

    const newTableData = metadatas.map<BulkMetadataEditRow>(metadata => ({
      acMetadataCreator: encodeResourceCell(metadata.acMetadataCreator, {
        label: metadata.acMetadataCreator?.displayName
      }),
      acTags: metadata.acTags?.join(", ") ?? "",
      metadata
    }));

    return newTableData;
  }

  async function onSubmit(changes: Array<RowChange<BulkMetadataEditRow>>) {
    const editedMetadatas = changes.map<SaveArgs<Metadata>>(row => {
      const {
        changes: { acMetadataCreator, acTags, metadata },
        original: {
          metadata: { id, type }
        }
      } = row;

      const metadataEdit = {
        id,
        type,
        ...metadata
      } as Metadata;

      delete metadataEdit.managedAttributeMap;

      if (acMetadataCreator !== undefined) {
        metadataEdit.acMetadataCreator = decodeResourceCell(
          acMetadataCreator
        ) as Agent;
      }

      if (acTags !== undefined) {
        metadataEdit.acTags = acTags.split(",").map(t => t.trim());
      }

      return {
        resource: metadataEdit,
        type: "metadata"
      };
    });

    const editedManagedAttributeMaps = changes.map<
      SaveArgs<ManagedAttributeMap>
    >(row => {
      const managedAttributeMap = row.changes.metadata?.managedAttributeMap;
      const metadata = {
        id: row.original.metadata.id,
        type: row.original.metadata.type
      };

      return {
        resource: {
          ...managedAttributeMap,
          metadata,
          type: "managed-attribute-map"
        } as ManagedAttributeMap,
        type: "managed-attribute-map"
      };
    });

    editedManagedAttributeMaps.forEach(saveArg => delete saveArg.resource.id);

    await save([...editedMetadatas, ...editedManagedAttributeMaps]);

    await router.push("/object/list");
  }

  return (
    <div className="container-fluid">
      <Head title={formatMessage("metadataBulkEditTitle")} />
      <Nav />
      <h2>
        <ObjectStoreMessage id="metadataBulkEditTitle" />
      </h2>
      <div className="form-group">
        <Formik<FormControls>
          initialValues={{
            editableManagedAttributes: []
          }}
          onSubmit={noop}
        >
          {controlsForm => {
            const columns = [
              ...DEFAULT_COLUMNS,
              ...controlsForm.values.editableManagedAttributes.map(attr => ({
                data: `metadata.managedAttributeMap.values.${attr.id}.value`,
                title: attr.name
              }))
            ];

            return (
              <Form>
                <ResourceSelectField<ManagedAttribute>
                  className="col-2"
                  filter={val => ({ name: val })}
                  name="editableManagedAttributes"
                  isMulti={true}
                  model="managed-attribute"
                  optionLabel={attr => attr.name}
                />
                <BulkDataEditor
                  columns={columns}
                  loadData={loadData}
                  onSubmit={onSubmit}
                />
              </Form>
            );
          }}
        </Formik>
      </div>
    </div>
  );
}
