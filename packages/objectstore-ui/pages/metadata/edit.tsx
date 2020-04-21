import {
  ApiClientContext,
  BulkDataEditor,
  decodeResourceCell,
  encodeResourceCell,
  filterBy,
  LoadingSpinner,
  ResourceSelectField,
  RowChange,
  SaveArgs,
  useResourceSelectCells
} from "common-ui";
import { Form, Formik, FormikContext } from "formik";
import { PersistedResource } from "kitsu";
import { noop } from "lodash";
import { useRouter } from "next/router";
import { useContext, useState } from "react";
import { Head } from "../../components";
import {
  ObjectStoreMessage,
  useObjectStoreIntl
} from "../../intl/objectstore-intl";
import {
  Agent,
  ManagedAttribute,
  ManagedAttributeMap,
  ManagedAttributeValue,
  Metadata
} from "../../types/objectstore-api";

/** Editable row data */
export interface BulkMetadataEditRow {
  acTags: string;
  acMetadataCreator: string;
  dcCreator: string;
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
  const [
    initialEditableManagedAttributes,
    setInitialEditableManagedAttributes
  ] = useState<ManagedAttribute[]>([]);

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
      title: formatMessage("field_dcType"),
      type: "dropdown"
    },
    {
      data: "metadata.acCaption",
      title: formatMessage("field_acCaption")
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
        data: "dcCreator",
        title: formatMessage("field_dcCreator.displayName")
      }
    ),
    resourceSelectCell<Agent>(
      {
        filter: input => ({ rsql: `displayName==*${input}*` }),
        label: agent => agent.displayName,
        model: "agent"
      },
      {
        data: "acMetadataCreator",
        title: formatMessage("field_acMetadataCreator.displayName")
      }
    )
  ];

  const idsQuery = String(router.query.ids);
  const ids = idsQuery.split(",");

  if (!idsQuery) {
    return <LoadingSpinner loading={true} />;
  }

  /**
   * Initializes the editable managed attributes based on what attributes are set on the metadatas.
   */
  async function initEditableManagedAttributes(metadatas: Metadata[]) {
    // Loop through the metadatas and find which managed attributes are set:
    const managedAttributeIdMap: Record<string, true> = {};
    for (const metadata of metadatas) {
      const keys = Object.keys(metadata.managedAttributeMap?.values ?? {});
      for (const key of keys) {
        managedAttributeIdMap[key] = true;
      }
    }
    const managedAttributeIds = Object.keys(managedAttributeIdMap);

    // Fetch the managed attributes from the back-end:
    const newInitialEditableManagedAttributes = await bulkGet<ManagedAttribute>(
      managedAttributeIds.map(id => `/managed-attribute/${id}`)
    );

    // Set the attributes in component state; These are used to re-initialize the Formik controls:
    setInitialEditableManagedAttributes(newInitialEditableManagedAttributes);
  }

  async function loadData() {
    const metadatas = await bulkGet<Metadata>(
      ids.map(
        id =>
          `/metadata/${id}?include=acMetadataCreator,dcCreator,managedAttributeMap`
      )
    );

    await initEditableManagedAttributes(metadatas);

    const newTableData = metadatas.map<BulkMetadataEditRow>(metadata => ({
      acMetadataCreator: encodeResourceCell(metadata.acMetadataCreator, {
        label: metadata.acMetadataCreator?.displayName
      }),
      acTags: metadata.acTags?.join(", ") ?? "",
      dcCreator: encodeResourceCell(metadata.dcCreator, {
        label: metadata.dcCreator?.displayName
      }),
      metadata
    }));

    return newTableData;
  }

  async function onSubmit(changes: Array<RowChange<BulkMetadataEditRow>>) {
    const editedMetadatas = changes.map<SaveArgs<Metadata>>(row => {
      const {
        changes: { acMetadataCreator, acTags, dcCreator, metadata },
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

      if (dcCreator !== undefined) {
        metadataEdit.dcCreator = decodeResourceCell(dcCreator) as Agent;
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
      <h2>
        <ObjectStoreMessage id="metadataBulkEditTitle" />
      </h2>
      <div className="form-group">
        <Formik<FormControls>
          enableReinitialize={true}
          initialValues={{
            editableManagedAttributes: initialEditableManagedAttributes
          }}
          onSubmit={noop}
        >
          {controlsForm => {
            const columns = [
              ...DEFAULT_COLUMNS,
              ...managedAttributeColumns(
                controlsForm.values.editableManagedAttributes
              )
            ];

            return (
              <Form>
                <ResourceSelectField<ManagedAttribute>
                  className="col-2 editable-managed-attributes-select"
                  filter={filterBy(["name"])}
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

export function managedAttributeColumns(
  editableManagedAttributes: ManagedAttribute[]
) {
  return editableManagedAttributes.map(attr => ({
    data: `metadata.managedAttributeMap.values.${attr.id}.value`,
    title: attr.name,
    ...(attr.acceptedValues?.length
      ? {
          source: attr.acceptedValues,
          type: "dropdown"
        }
      : {})
  }));
}
