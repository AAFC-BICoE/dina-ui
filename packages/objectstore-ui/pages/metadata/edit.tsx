import {
  ApiClientContext,
  BulkDataEditor,
  decodeResourceCell,
  encodeResourceCell,
  LoadingSpinner,
  ResourceSelectField,
  SaveArgs,
  useResourceSelectCells
} from "common-ui";
import { Form, Formik } from "formik";
import { PersistedResource } from "kitsu";
import { useRouter } from "next/router";
import { useContext, useEffect, useState } from "react";
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
interface RowData {
  acTags: string;
  acMetadataCreator: string;
  metadata: PersistedResource<Metadata>;
}

interface FormControls {
  editableManagedAttributes: ManagedAttribute[];
}

export default function EditMetadatasPage() {
  const router = useRouter();
  const { apiClient, save } = useContext(ApiClientContext);
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
      source: ["Image", "Moving Image", "Sound", "Text"],
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
    // {
    //   data: "metadata.xmpMetadataDate",
    //   title: formatMessage("metadataLastMetadataModificationTimeLabel")
    // },
    resourceSelectCell<Agent>(
      {
        filter: input => ({ displayName: input }),
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

  const [tableData, setTableData] = useState<RowData[] | null>(null);

  useEffect(() => {
    (async () => {
      if (!router.query.ids) {
        return;
      }

      // TODO there should be a way to request many resources by ID in a single request.
      const metadataPromises = ids.map(id =>
        apiClient.get<Metadata>(`metadata/${id}`, {
          include: "acMetadataCreator,managedAttributeMap"
        })
      );

      const metadataResponses = await Promise.all(metadataPromises);

      const newTableData = metadataResponses.map<RowData>(res => ({
        acMetadataCreator: encodeResourceCell(res.data.acMetadataCreator, {
          label: res.data.acMetadataCreator?.displayName
        }),
        acTags: res.data.acTags?.join(", ") ?? "",
        metadata: res.data
      }));

      setTableData(newTableData);
    })();
  }, [idsQuery]);

  async function onSubmit() {
    try {
      const editedMetadatas = (tableData || []).map<SaveArgs<Metadata>>(
        row => ({
          resource: {
            ...row.metadata,
            acMetadataCreator: decodeResourceCell(
              row.acMetadataCreator
            ) as Agent,
            acTags: row.acTags.split(",").map(t => t.trim()),
            managedAttributeMap: null
          },
          type: "metadata"
        })
      );

      const editedManagedAttributeMaps = (tableData || []).map<
        SaveArgs<ManagedAttributeMap>
      >(row => ({
        resource: {
          ...(row.metadata.managedAttributeMap as ManagedAttributeMap),
          metadata: row.metadata
        },
        type: "managed-attribute-map"
      }));

      editedManagedAttributeMaps.forEach(saveArg => delete saveArg.resource.id);

      await save([...editedMetadatas, ...editedManagedAttributeMaps]);

      await router.push("/object/list");
    } catch (err) {
      alert(err.message);
    }
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
          onSubmit={onSubmit}
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
                {tableData ? (
                  <BulkDataEditor columns={columns} data={tableData} />
                ) : (
                  <LoadingSpinner loading={true} />
                )}
              </Form>
            );
          }}
        </Formik>
      </div>
    </div>
  );
}
